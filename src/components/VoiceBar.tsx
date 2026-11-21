import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Send, Sparkles, Volume2, X } from 'lucide-react';
import { t } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import { isAgoraConfigured } from '../voice/agoraVoice';
import { resolveMurfVoice } from '../voice/murfVoices';
import { createSpeechRecognizer, isSttSupported } from '../voice/speech';

const QUICK_PROMPTS = [
  'Show wireless earbuds under 2000',
  'Add the second one',
  'Compare 1 and 2',
  'Show my cart',
  'Where is my order?',
];

export const VoiceAssistantShell: React.FC = () => {
  const {
    route,
    lang,
    voiceGender,
    voiceStatus,
    setVoiceStatus,
    transcript,
    setTranscript,
    assistantReply,
    voiceOverlayOpen,
    setVoiceOverlayOpen,
    agoraActive,
    agoraMuted,
    agoraVoiceName,
    startAgoraVoice,
    stopAgoraVoice,
    toggleAgoraMute,
    runVoiceCommand,
  } = useVibeCart();

  const [inputText, setInputText] = useState('');
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer>>(null);
  const sttAvailable = isSttSupported();
  const murfSpec = resolveMurfVoice(lang, voiceGender);

  // Fallback browser STT only when Agora App ID is not configured
  useEffect(() => {
    if (isAgoraConfigured) return;
    const rec = createSpeechRecognizer({
      lang,
      onStart: () => setVoiceStatus('listening'),
      onInterim: (text) => setTranscript(text),
      onFinal: (text) => {
        setInputText(text);
        runVoiceCommand(text);
      },
      onError: () => {
        setVoiceStatus('error');
        window.setTimeout(() => setVoiceStatus('idle'), 1400);
      },
      onEnd: () => {
        setVoiceStatus((cur) => (cur === 'listening' ? 'idle' : cur));
      },
    });
    recognizerRef.current = rec;
    return () => {
      rec?.stop();
    };
  }, [lang, runVoiceCommand, setTranscript, setVoiceStatus]);

  const handleMicToggle = async () => {
    setVoiceOverlayOpen(true);
    if (isAgoraConfigured) {
      if (voiceStatus === 'connecting') {
        return;
      }
      if (agoraActive) {
        await stopAgoraVoice();
      } else {
        await startAgoraVoice();
      }
      return;
    }

    if (!sttAvailable || !recognizerRef.current) return;
    if (voiceStatus === 'listening') {
      recognizerRef.current.stop();
    } else {
      recognizerRef.current.setLang(lang);
      recognizerRef.current.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputText.trim();
    if (!cmd) return;
    runVoiceCommand(cmd);
    setInputText('');
  };

  const statusText = (() => {
    if (voiceStatus === 'connecting') return 'Joining Agora RTC + Murf Falcon 2...';
    if (agoraActive) {
      if (agoraMuted) return `Muted · ${agoraVoiceName || murfSpec.displayName}`;
      if (voiceStatus === 'speaking') return `Speaking · ${agoraVoiceName || murfSpec.displayName}`;
      return `Agora Live · ${agoraVoiceName || murfSpec.displayName}`;
    }
    if (voiceStatus === 'listening') return 'Listening now...';
    if (voiceStatus === 'thinking') return 'Understanding intent...';
    if (voiceStatus === 'speaking') return `Speaking via Murf (${murfSpec.voiceId})...`;
    return isAgoraConfigured
      ? `Agora Voice + Murf (${murfSpec.voiceId}) · Tap mic to talk`
      : sttAvailable
        ? 'Tap mic to speak or type below'
        : 'Type a command below';
  })();

  return (
    <>
      {/* Floating Voice Orb trigger: sits above sticky bar on product detail, bottom nav on mobile, bottom-right on desktop */}
      <button
        type="button"
        onClick={() => setVoiceOverlayOpen(!voiceOverlayOpen)}
        data-state={voiceStatus}
        aria-label={voiceOverlayOpen ? 'Close voice assistant' : 'Open voice shopping assistant'}
        className={`vc-orb fixed z-40 right-4 md:bottom-7 md:right-7 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-[#050505] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          route === 'product' ? 'bottom-[8.75rem]' : 'bottom-20'
        }`}
      >
        {voiceOverlayOpen ? (
          <X className="w-6 h-6 text-[#050505]" />
        ) : (
          <Mic className="w-6 h-6 text-[#050505]" />
        )}
      </button>

      {/* Voice Assistant Sheet / Drawer */}
      {voiceOverlayOpen && (
        <div
          role="dialog"
          aria-label="VoicoCart Voice Assistant"
          className={`fixed z-50 inset-x-3 md:inset-x-auto md:right-7 md:bottom-28 md:w-[440px] max-h-[calc(100dvh-6.5rem)] overflow-y-auto rounded-[24px] vc-glass-blur p-4 sm:p-5 shadow-2xl ${
            route === 'product' ? 'bottom-[8.75rem]' : 'bottom-20'
          }`}
        >
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 md:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleMicToggle}
                data-state={voiceStatus}
                aria-label={
                  agoraActive || voiceStatus === 'listening'
                    ? 'Stop Agora voice session'
                    : 'Start Agora voice session'
                }
                className="vc-orb w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
              >
                {agoraActive ? (
                  <Volume2 className="w-4 h-4 text-[#050505]" />
                ) : isAgoraConfigured || sttAvailable ? (
                  <Mic className="w-4 h-4 text-[#050505]" />
                ) : (
                  <MicOff className="w-4 h-4 text-[#050505]" />
                )}
              </button>
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold text-[#F5F5F5] truncate">
                  VoicoCart Voice AI
                </h2>
                <p className="text-xs text-[#9A9A9A] truncate">{statusText}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {agoraActive && (
                <>
                  <button
                    type="button"
                    onClick={toggleAgoraMute}
                    aria-label={agoraMuted ? 'Unmute microphone' : 'Mute microphone'}
                    className={`h-9 px-2.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1 cursor-pointer ${
                      agoraMuted
                        ? 'bg-[#FF4D5E]/15 border-[#FF4D5E]/40 text-[#FF4D5E]'
                        : 'bg-white/5 border-white/10 text-[#F5F5F5]'
                    }`}
                  >
                    {agoraMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{agoraMuted ? 'Muted' : 'Mic On'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopAgoraVoice}
                    aria-label="End Agora voice call"
                    className="w-9 h-9 rounded-xl bg-[#FF4D5E]/15 border border-[#FF4D5E]/30 hover:bg-[#FF4D5E]/25 flex items-center justify-center text-[#FF4D5E] cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setVoiceOverlayOpen(false)}
                aria-label="Close voice panel"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9A9A9A] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Transcript & Spoken Reply */}
          <div className="rounded-[14px] bg-[#0B0B0B] border border-white/10 p-3.5 mb-3 space-y-2">
            <p className="font-display text-sm font-medium text-[#F5F5F5] min-h-[20px]">
              {transcript ? `“${transcript}”` : 'Tap mic for live Agora Voice or type below'}
            </p>
            {assistantReply && (
              <p className="text-xs text-[#FFA040] leading-relaxed">{assistantReply}</p>
            )}
          </div>

          {/* Text Command Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
            <label htmlFor="voice-drawer-input" className="sr-only">
              Voice or text command
            </label>
            <input
              id="voice-drawer-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(lang, 'searchPlaceholder')}
              className="flex-1 h-12 px-3.5 rounded-[14px] bg-[#111111] border border-white/10 text-sm text-[#F5F5F5] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#FF6A00]"
            />
            <button
              type="submit"
              aria-label="Send command"
              className="h-12 w-12 rounded-[14px] bg-white text-[#050505] flex items-center justify-center hover:bg-[#F5F5F5] active:scale-[0.97] transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Interactive Suggested Commands */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => runVoiceCommand(prompt)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#9A9A9A] hover:text-[#F5F5F5] hover:border-[#FF6A00]/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#FFA040]" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
