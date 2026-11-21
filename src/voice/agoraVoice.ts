import AgoraRTC, {
  type IAgoraRTCClient,
  type IMicrophoneAudioTrack,
  type IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';
import type { LangCode, VoiceGender } from '../types';

AgoraRTC.setLogLevel(3); // Errors only in console

const publicAgoraAppId = (import.meta.env.VITE_AGORA_APP_ID ?? '').trim();
export const isAgoraConfigured = Boolean(publicAgoraAppId);

export interface AgoraSessionCallbacks {
  onConnecting?: () => void;
  onConnected?: (info: { agentId: string; voiceDisplayName: string; channelName: string }) => void;
  onUserInterimTranscript?: (text: string) => void;
  onUserFinalTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string, isFinal: boolean) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (message: string) => void;
  onDisconnected?: () => void;
}

interface ChunkAccumulator {
  total: number;
  parts: Map<number, string>;
}

interface AgoraStreamPayload {
  object?: string;
  text?: string;
  message?: string;
  error?: string;
  module?: string;
  code?: number | string;
  final?: boolean;
  is_final?: boolean;
  turn_status?: number;
  turn_id?: string | number;
  message_id?: string;
}

export class AgoraVoiceSession {
  private client: IAgoraRTCClient | null = null;
  private micTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTrack: IRemoteAudioTrack | null = null;
  private agentId: string | null = null;
  private channelName: string | null = null;
  private muted = false;
  private active = false;
  private starting = false;
  private aborted = false;
  private chunkMap = new Map<string, ChunkAccumulator>();
  private processedTurnKeys = new Set<string>();
  private recentFinalTexts = new Map<string, number>();
  private latestPendingUserTurn: { key: string; text: string } | null = null;

  isActive(): boolean {
    return this.active;
  }

  isConnecting(): boolean {
    return this.starting;
  }

  isMuted(): boolean {
    return this.muted;
  }

  async setMuted(nextMuted: boolean): Promise<void> {
    this.muted = nextMuted;
    if (this.micTrack) {
      await this.micTrack.setMuted(nextMuted);
    }
  }

  async start(
    params: {
      lang: LangCode;
      voiceGender: VoiceGender;
      context: {
        screen: string;
        cartCount: number;
      };
    },
    callbacks: AgoraSessionCallbacks
  ): Promise<boolean> {
    if (this.starting) {
      return false;
    }
    if (this.active) {
      await this.stop();
    }

    this.starting = true;
    this.aborted = false;
    callbacks.onConnecting?.();

    try {
      // 1. Fetch fresh RTC token from server
      const tokenRes = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const tokenData = (await tokenRes.json()) as {
        appId?: string;
        channelName?: string;
        uid?: number;
        token?: string;
        error?: string;
      };
      if (!tokenRes.ok || !tokenData.appId || !tokenData.channelName || !tokenData.token) {
        throw new Error(tokenData.error ?? 'Failed to fetch Agora RTC token.');
      }
      if (this.aborted) {
        await this.cleanupLocal();
        return false;
      }

      this.channelName = tokenData.channelName;

      // 2. Join Agora RTC channel & publish microphone
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      this.client = client;
      this.chunkMap.clear();
      this.processedTurnKeys.clear();
      this.recentFinalTexts.clear();
      this.latestPendingUserTurn = null;

      client.on('user-published', async (user, mediaType) => {
        if (mediaType !== 'audio') return;
        await client.subscribe(user, mediaType);
        if (user.audioTrack) {
          this.remoteAudioTrack = user.audioTrack;
          user.audioTrack.play();
          callbacks.onSpeakingChange?.(true);
        }
      });

      client.on('user-unpublished', (_user, mediaType) => {
        if (mediaType === 'audio') {
          callbacks.onSpeakingChange?.(false);
        }
      });

      client.on('stream-message', (_uid, rawData: Uint8Array) => {
        this.handleStreamMessage(rawData, callbacks);
      });

      await client.join(
        tokenData.appId,
        tokenData.channelName,
        tokenData.token,
        tokenData.uid ?? null
      );
      if (this.aborted) {
        await this.cleanupLocal();
        return false;
      }

      const micTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
        AGC: true,
      });
      this.micTrack = micTrack;
      this.muted = false;
      if (this.aborted) {
        await this.cleanupLocal();
        return false;
      }
      await client.publish([micTrack]);

      // 3. Invite Agora Conversational AI Agent + Murf Falcon 2 TTS into the channel
      const startRes = await fetch('/api/agora/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: tokenData.channelName,
          userUid: tokenData.uid,
          lang: params.lang,
          voiceGender: params.voiceGender,
          context: params.context,
        }),
      });
      const startData = (await startRes.json()) as {
        agentId?: string;
        displayName?: string;
        error?: string;
      };
      if (!startRes.ok || !startData.agentId) {
        throw new Error(startData.error ?? 'Failed to start Agora Conversational AI agent.');
      }

      if (this.aborted) {
        this.agentId = startData.agentId;
        await this.stop(callbacks);
        return false;
      }

      this.agentId = startData.agentId;
      this.active = true;
      callbacks.onConnected?.({
        agentId: startData.agentId,
        voiceDisplayName: startData.displayName ?? 'Murf Falcon 2',
        channelName: tokenData.channelName,
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to start Agora voice session.';
      await this.cleanupLocal();
      if (!this.aborted) {
        callbacks.onError?.(message);
      }
      return false;
    } finally {
      this.starting = false;
    }
  }

  private normalizeTranscript(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,!?।]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private emitFinalUserTurn(key: string, text: string, callbacks: AgoraSessionCallbacks): void {
    const normalized = this.normalizeTranscript(text);
    if (!normalized) return;

    if (this.processedTurnKeys.has(key)) return;

    const now = Date.now();
    const lastSameAt = this.recentFinalTexts.get(normalized);
    if (lastSameAt && now - lastSameAt < 4000) {
      this.processedTurnKeys.add(key);
      if (this.latestPendingUserTurn?.key === key) {
        this.latestPendingUserTurn = null;
      }
      return;
    }

    this.processedTurnKeys.add(key);
    this.recentFinalTexts.set(normalized, now);

    if (this.processedTurnKeys.size > 50) {
      const oldest = this.processedTurnKeys.values().next().value;
      if (oldest) this.processedTurnKeys.delete(oldest);
    }
    if (this.recentFinalTexts.size > 30) {
      for (const [k, ts] of this.recentFinalTexts) {
        if (now - ts > 10000) this.recentFinalTexts.delete(k);
      }
    }
    if (this.latestPendingUserTurn?.key === key) {
      this.latestPendingUserTurn = null;
    }
    callbacks.onUserFinalTranscript?.(text);
  }

  private handleStreamMessage(rawData: Uint8Array, callbacks: AgoraSessionCallbacks): void {
    try {
      const decoded = new TextDecoder().decode(rawData).trim();
      if (!decoded) return;

      let jsonText = decoded;
      // Agora Conversational AI often sends chunked base64: messageId|partIndex|totalParts|base64
      if (!decoded.startsWith('{') && decoded.includes('|')) {
        const segments = decoded.split('|');
        if (segments.length >= 4) {
          const [msgId, partStr, totalStr, ...rest] = segments;
          const partIdx = Number(partStr);
          const totalParts = Number(totalStr);
          const chunkPayload = rest.join('|');
          if (Number.isFinite(partIdx) && Number.isFinite(totalParts) && totalParts > 0) {
            let entry = this.chunkMap.get(msgId);
            if (!entry) {
              entry = { total: totalParts, parts: new Map() };
              this.chunkMap.set(msgId, entry);
            }
            entry.parts.set(partIdx, chunkPayload);
            if (entry.parts.size < entry.total) {
              return;
            }
            const baseIdx = entry.parts.has(0) ? 0 : 1;
            const combinedBase64 = Array.from({ length: entry.total }, (_, idx) =>
              entry!.parts.get(idx + baseIdx) ?? ''
            ).join('');
            this.chunkMap.delete(msgId);
            const binary = atob(combinedBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) {
              bytes[i] = binary.charCodeAt(i);
            }
            jsonText = new TextDecoder('utf-8').decode(bytes);
          }
        }
      }

      const payload = JSON.parse(jsonText) as AgoraStreamPayload;
      if (payload.object === 'message.error') {
        console.warn('[AgoraVoice] Agent error:', payload.module ?? 'unknown', payload.code ?? '', payload.message ?? payload.error ?? '');
        return;
      }
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) return;

      const hasTurnStatus = typeof payload.turn_status === 'number';
      const isFinal = hasTurnStatus
        ? payload.turn_status === 1
        : payload.is_final === true || payload.final === true;

      if (payload.object === 'user.transcription') {
        const hasTurnId =
          payload.turn_id !== undefined &&
          payload.turn_id !== null &&
          String(payload.turn_id).trim() !== '';
        const turnKey = hasTurnId
          ? `turn:${payload.turn_id}`
          : `text:${this.normalizeTranscript(text)}`;
        if (!isFinal) {
          this.latestPendingUserTurn = { key: turnKey, text };
          callbacks.onUserInterimTranscript?.(text);
          return;
        }
        this.emitFinalUserTurn(turnKey, text, callbacks);
      } else if (payload.object === 'assistant.transcription') {
        if (this.latestPendingUserTurn) {
          const pending = this.latestPendingUserTurn;
          this.latestPendingUserTurn = null;
          this.emitFinalUserTurn(pending.key, pending.text, callbacks);
        }
        callbacks.onAssistantTranscript?.(text, isFinal);
      }
    } catch {
      // Ignore non-JSON or partial control packets
    }
  }

  private async cleanupLocal(): Promise<void> {
    this.active = false;
    this.muted = false;
    if (this.remoteAudioTrack) {
      try {
        this.remoteAudioTrack.stop();
      } catch {
        // Ignore stop errors
      }
      this.remoteAudioTrack = null;
    }
    if (this.micTrack) {
      try {
        this.micTrack.stop();
        this.micTrack.close();
      } catch {
        // Ignore close errors
      }
      this.micTrack = null;
    }
    if (this.client) {
      try {
        this.client.removeAllListeners();
        await this.client.leave();
      } catch {
        // Ignore leave errors
      }
      this.client = null;
    }
  }

  async stop(callbacks?: AgoraSessionCallbacks): Promise<void> {
    this.aborted = true;
    if (this.starting) {
      callbacks?.onDisconnected?.();
      return;
    }

    const agentId = this.agentId;
    const channelName = this.channelName;
    this.agentId = null;
    this.channelName = null;

    await this.cleanupLocal();

    if (agentId) {
      fetch('/api/agora/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, channelName }),
      }).catch(() => undefined);
    }

    callbacks?.onDisconnected?.();
  }
}
