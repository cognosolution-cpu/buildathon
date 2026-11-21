import type { LangCode, VoiceGender } from '../types';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: Event & { error?: string }) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const isSttSupported = (): boolean => getSpeechRecognitionCtor() !== null;

export const isTtsSupported = (): boolean =>
  typeof window !== 'undefined' && ('Audio' in window || 'speechSynthesis' in window);

let cachedVoices: SpeechSynthesisVoice[] = [];
let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let activeAbort: AbortController | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export function stopSpeaking(): void {
  activeAbort?.abort();
  activeAbort = null;
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.src = '';
    } catch {
      // Ignore cleanup errors
    }
    activeAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

function speakBrowserFallback(text: string, lang: LangCode): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.02;
    const match =
      cachedVoices.find((v) => v.lang === lang) ??
      cachedVoices.find((v) => v.lang.startsWith(lang.split('-')[0])) ??
      cachedVoices.find((v) => v.lang.startsWith('en'));
    if (match) utterance.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore synthesis errors in muted environments
  }
}

/**
 * Speaks assistant replies using Murf AI Falcon 2 Indian voices via /api/tts/murf,
 * falling back to Web Speech API only if the network/API is unavailable.
 */
export async function speakReply(
  text: string,
  lang: LangCode,
  voiceGender: VoiceGender = 'female'
): Promise<void> {
  if (typeof window === 'undefined' || !text.trim()) return;
  stopSpeaking();

  const controller = new AbortController();
  activeAbort = controller;

  try {
    const res = await fetch('/api/tts/murf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, voiceGender }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Murf TTS HTTP ${res.status}`);
    }

    const blob = await res.blob();
    if (controller.signal.aborted || blob.size === 0) return;

    const url = URL.createObjectURL(blob);
    activeAudioUrl = url;
    const audio = new Audio(url);
    activeAudio = audio;
    audio.onended = () => {
      if (activeAudioUrl === url) {
        URL.revokeObjectURL(url);
        activeAudioUrl = null;
      }
      if (activeAudio === audio) activeAudio = null;
    };
    await audio.play();
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return;
    speakBrowserFallback(text, lang);
  }
}

export interface RecognizerCallbacks {
  lang: LangCode;
  onStart?: () => void;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (code: string) => void;
  onEnd?: () => void;
}

export function createSpeechRecognizer(cb: RecognizerCallbacks) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = cb.lang;
  rec.interimResults = true;
  rec.continuous = false;

  let lastFinalNormalized = '';
  let lastFinalAt = 0;

  rec.onstart = () => cb.onStart?.();
  rec.onend = () => cb.onEnd?.();
  rec.onerror = (ev) => cb.onError?.(ev.error ?? 'speech-error');
  rec.onresult = (ev) => {
    let interim = '';
    const finalParts: string[] = [];
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const text = (res[0]?.transcript ?? '').trim();
      if (!text) continue;
      if (res.isFinal) {
        finalParts.push(text);
      } else {
        interim += (interim ? ' ' : '') + text;
      }
    }
    if (finalParts.length > 0) {
      const finalText = finalParts.join(' ').trim();
      const normalized = finalText.toLowerCase().replace(/\s+/g, ' ');
      const now = Date.now();
      if (normalized && !(normalized === lastFinalNormalized && now - lastFinalAt < 1500)) {
        lastFinalNormalized = normalized;
        lastFinalAt = now;
        cb.onFinal?.(finalText);
      }
    }
    if (interim) cb.onInterim?.(interim);
  };

  return {
    start: () => {
      try {
        rec.start();
      } catch {
        // Already started
      }
    },
    stop: () => {
      try {
        rec.stop();
      } catch {
        // Ignore stop errors
      }
    },
    setLang: (lang: LangCode) => {
      rec.lang = lang;
    },
  };
}
