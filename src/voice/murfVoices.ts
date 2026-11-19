import type { LangCode, VoiceGender } from '../types.js';

export interface MurfVoiceSpec {
  voiceId: string;
  displayName: string;
  locale: string;
  asrLanguage: string;
  gender: VoiceGender;
}

const MURF_INDIA_VOICE_MAP: Record<LangCode, Record<VoiceGender, MurfVoiceSpec>> = {
  'en-IN': {
    female: {
      voiceId: 'Anisha',
      displayName: 'Anisha (Indian English)',
      locale: 'en-IN',
      asrLanguage: 'en-IN',
      gender: 'female',
    },
    male: {
      voiceId: 'Abhinav',
      displayName: 'Abhinav (Indian English)',
      locale: 'en-IN',
      asrLanguage: 'en-IN',
      gender: 'male',
    },
  },
  'hi-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Hindi & Hinglish)',
      locale: 'hi-IN',
      asrLanguage: 'hi-IN',
      gender: 'female',
    },
    male: {
      voiceId: 'Prathamesh',
      displayName: 'Prathamesh (Hindi)',
      locale: 'hi-IN',
      asrLanguage: 'hi-IN',
      gender: 'male',
    },
  },
  'ta-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Tamil)',
      locale: 'ta-IN',
      asrLanguage: 'ta-IN',
      gender: 'female',
    },
    male: {
      voiceId: 'Karthikeyan',
      displayName: 'Karthikeyan (Tamil)',
      locale: 'ta-IN',
      asrLanguage: 'ta-IN',
      gender: 'male',
    },
  },
  'te-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Telugu)',
      locale: 'te-IN',
      asrLanguage: 'te-IN',
      gender: 'female',
    },
    male: {
      voiceId: 'Samar',
      displayName: 'Samar (Telugu)',
      locale: 'te-IN',
      asrLanguage: 'te-IN',
      gender: 'male',
    },
  },
  'kn-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Kannada)',
      locale: 'kn-IN',
      asrLanguage: 'kn-IN',
      gender: 'female',
    },
    male: {
      voiceId: 'Harman',
      displayName: 'Harman (Kannada)',
      locale: 'kn-IN',
      asrLanguage: 'kn-IN',
      gender: 'male',
    },
  },
};

export function resolveMurfVoice(lang: LangCode = 'en-IN', gender: VoiceGender = 'female'): MurfVoiceSpec {
  const byLang = MURF_INDIA_VOICE_MAP[lang] ?? MURF_INDIA_VOICE_MAP['en-IN'];
  return byLang[gender] ?? byLang.female;
}
