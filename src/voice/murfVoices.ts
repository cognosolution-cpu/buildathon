import type { LangCode, VoiceGender } from '../types.js';

export interface MurfVoiceSpec {
  voiceId: string;
  displayName: string;
  locale: string;
  asrLanguage: string;
  gender: VoiceGender;
  model?: 'FALCON' | 'falcon-2.1';
  channelType?: 'MONO' | 'STEREO';
}

export const PIYUSH_CLONED_VOICE_ID = 'cln_0179511856605450I_0179524244970937N';

const makeClonedSpec = (asrLanguage: string, locale = 'en-US'): MurfVoiceSpec => ({
  voiceId: PIYUSH_CLONED_VOICE_ID,
  displayName: 'Piyush (Cloned Male · Falcon 2.1)',
  locale,
  asrLanguage,
  gender: 'cloned',
  model: 'falcon-2.1',
  channelType: 'MONO',
});

const MURF_INDIA_VOICE_MAP: Record<LangCode, Record<VoiceGender, MurfVoiceSpec>> = {
  'en-IN': {
    female: {
      voiceId: 'Anisha',
      displayName: 'Anisha (Indian English)',
      locale: 'en-IN',
      asrLanguage: 'en-IN',
      gender: 'female',
      model: 'FALCON',
    },
    male: {
      voiceId: 'Abhinav',
      displayName: 'Abhinav (Indian English)',
      locale: 'en-IN',
      asrLanguage: 'en-IN',
      gender: 'male',
      model: 'FALCON',
    },
    cloned: makeClonedSpec('en-IN', 'en-US'),
  },
  'hi-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Hindi & Hinglish)',
      locale: 'hi-IN',
      asrLanguage: 'hi-IN',
      gender: 'female',
      model: 'FALCON',
    },
    male: {
      voiceId: 'Prathamesh',
      displayName: 'Prathamesh (Hindi)',
      locale: 'hi-IN',
      asrLanguage: 'hi-IN',
      gender: 'male',
      model: 'FALCON',
    },
    cloned: makeClonedSpec('hi-IN', 'en-US'),
  },
  'ta-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Tamil)',
      locale: 'ta-IN',
      asrLanguage: 'ta-IN',
      gender: 'female',
      model: 'FALCON',
    },
    male: {
      voiceId: 'Karthikeyan',
      displayName: 'Karthikeyan (Tamil)',
      locale: 'ta-IN',
      asrLanguage: 'ta-IN',
      gender: 'male',
      model: 'FALCON',
    },
    cloned: makeClonedSpec('ta-IN', 'en-US'),
  },
  'te-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Telugu)',
      locale: 'te-IN',
      asrLanguage: 'te-IN',
      gender: 'female',
      model: 'FALCON',
    },
    male: {
      voiceId: 'Samar',
      displayName: 'Samar (Telugu)',
      locale: 'te-IN',
      asrLanguage: 'te-IN',
      gender: 'male',
      model: 'FALCON',
    },
    cloned: makeClonedSpec('te-IN', 'en-US'),
  },
  'kn-IN': {
    female: {
      voiceId: 'Pooja',
      displayName: 'Pooja (Kannada)',
      locale: 'kn-IN',
      asrLanguage: 'kn-IN',
      gender: 'female',
      model: 'FALCON',
    },
    male: {
      voiceId: 'Harman',
      displayName: 'Harman (Kannada)',
      locale: 'kn-IN',
      asrLanguage: 'kn-IN',
      gender: 'male',
      model: 'FALCON',
    },
    cloned: makeClonedSpec('kn-IN', 'en-US'),
  },
};

export function resolveMurfVoice(lang: LangCode = 'en-IN', gender: VoiceGender = 'female'): MurfVoiceSpec {
  const byLang = MURF_INDIA_VOICE_MAP[lang] ?? MURF_INDIA_VOICE_MAP['en-IN'];
  return byLang[gender] ?? byLang.female;
}
