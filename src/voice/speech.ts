import type { LangCode } from '../types';

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
  typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export function speakReply(text: string, lang: LangCode): void {
  if (!isTtsSupported() || !text) return;
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
    // Ignore synthesis errors in headless or muted environments
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

  rec.onstart = () => cb.onStart?.();
  rec.onend = () => cb.onEnd?.();
  rec.onerror = (ev) => cb.onError?.(ev.error ?? 'speech-error');
  rec.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const text = res[0]?.transcript ?? '';
      if (res.isFinal) {
        cb.onFinal?.(text.trim());
      } else {
        interim += text;
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
