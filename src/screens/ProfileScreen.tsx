import React, { useEffect, useState } from 'react';
import { Check, Cloud, Globe, Layers, LogOut, Mail, MapPin, Shield, User, Volume2 } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { LANGUAGES } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import { resolveMurfVoice } from '../voice/murfVoices';
import { speakReply } from '../voice/speech';

export const ProfileScreen: React.FC = () => {
  const {
    lang,
    setLang,
    voiceGender,
    setVoiceGender,
    simpleView,
    setSimpleView,
    addresses,
    pushChip,
    authMode,
    authEmail,
    profile,
    updateProfile,
    signInWithGoogle,
    signInWithMagicLink,
    signOutSupabase,
  } = useVibeCart();
  const activeVoice = resolveMurfVoice(lang, voiceGender);
  const [emailInput, setEmailInput] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  const [fullNameInput, setFullNameInput] = useState(profile?.fullName ?? '');
  const [phoneInput, setPhoneInput] = useState(profile?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    setFullNameInput(profile?.fullName ?? '');
    setPhoneInput(profile?.phone ?? '');
  }, [profile]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingLink(true);
    const res = await signInWithMagicLink(emailInput);
    setSendingLink(false);
    setAuthMessage(res.message);
    if (res.ok) setEmailInput('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfile({ fullName: fullNameInput, phone: phoneInput });
    setSavingProfile(false);
    setProfileMessage(res.message);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
          Profile, Sign In & Settings
        </h1>
        <p className="text-sm text-[#9A9A9A] mt-1">
          Sign in to view your personal information, sync orders and addresses, or customize voice settings.
        </p>
      </div>

      {/* Account & Cloud Sync */}
      <section className="rounded-[20px] vc-glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {authMode === 'authenticated' && profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || 'Account avatar'}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-[#2EE59D]" />
              </div>
            )}
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
                {authMode === 'authenticated'
                  ? profile?.fullName || authEmail || 'Signed-in Account'
                  : 'Account & Order Sync'}
              </h2>
              <p className="text-xs text-[#9A9A9A]">
                {authMode === 'authenticated' && (profile?.email || authEmail)
                  ? `Signed in as ${profile?.email || authEmail} · Orders & profile synced`
                  : authMode === 'anonymous'
                    ? 'Active Guest Cloud Session · Sign in to save personal details'
                    : 'Not signed in yet · Sign in with Google or email link below'}
              </p>
            </div>
          </div>
          {authMode === 'authenticated' && (
            <button
              type="button"
              onClick={signOutSupabase}
              className="h-9 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-[#9A9A9A] hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          )}
        </div>

        {isSupabaseConfigured && authMode !== 'authenticated' && (
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={async () => {
                const res = await signInWithGoogle();
                setAuthMessage(res.message);
              }}
              className="w-full sm:w-auto h-11 px-5 rounded-[14px] bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] inline-flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <form onSubmit={handleMagicLink} className="flex flex-col sm:flex-row gap-2.5">
              <label htmlFor="profile-email" className="sr-only">
                Email address for magic link sign-in
              </label>
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Or sign in via email magic link"
                  className="w-full h-11 pl-10 pr-4 rounded-[14px] bg-[#0B0B0B] border border-white/10 text-sm text-[#F5F5F5] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <button
                type="submit"
                disabled={sendingLink}
                className="h-11 px-5 rounded-[14px] bg-white/10 border border-white/15 text-xs font-semibold text-[#F5F5F5] hover:bg-white/15 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {sendingLink ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </div>
        )}
        {authMessage && <p className="text-xs text-[#FFA040]">{authMessage}</p>}
      </section>

      {/* Personal Information */}
      <section className="rounded-[20px] vc-glass p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <User className="w-5 h-5 text-[#FF6A00]" />
          <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
            Personal Information
          </h2>
        </div>

        {authMode === 'authenticated' ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="personal-name" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                  Full Name
                </label>
                <input
                  id="personal-name"
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-11 px-3.5 rounded-[14px] bg-[#0B0B0B] border border-white/10 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label htmlFor="personal-phone" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                  Mobile Number
                </label>
                <input
                  id="personal-phone"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-11 px-3.5 rounded-[14px] bg-[#0B0B0B] border border-white/10 text-sm text-[#F5F5F5] font-mono-num focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="personal-email" className="block text-xs font-medium text-[#9A9A9A] mb-1.5">
                Email Address (Verified Account)
              </label>
              <input
                id="personal-email"
                type="email"
                readOnly
                value={profile?.email || authEmail || ''}
                className="w-full h-11 px-3.5 rounded-[14px] bg-[#0B0B0B]/70 border border-white/10 text-sm text-[#9A9A9A] cursor-not-allowed"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="h-11 px-5 rounded-[14px] bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Personal Info'}</span>
              </button>
              {profileMessage && (
                <span className="text-xs text-[#2EE59D]">{profileMessage}</span>
              )}
            </div>
          </form>
        ) : (
          <p className="text-xs text-[#9A9A9A]">
            Sign in with Google or an email magic link above to view and update your personal details.
          </p>
        )}
      </section>

      {/* Language Switcher */}
      <section className="rounded-[20px] vc-glass p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-[#FF6A00]" />
          <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
            Assistant & Storefront Language
          </h2>
        </div>
        <p className="text-xs text-[#9A9A9A]">
          Controls speech recognition locale, text-to-speech voice, and storefront labels. You can also say “हिन्दी में बोलो” or “Speak in English”.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LANGUAGES.map((item) => {
            const active = lang === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLang(item.code);
                  pushChip({ type: 'info', text: `Language set to ${item.nativeLabel}` });
                }}
                aria-pressed={active}
                className={`h-12 px-4 rounded-[14px] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  active
                    ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                    : 'border-white/10 bg-[#0B0B0B] text-[#9A9A9A] hover:text-white'
                }`}
              >
                <span className="text-sm font-medium">{item.nativeLabel}</span>
                <span className="text-[11px] font-mono-num opacity-75">{item.code}</span>
              </button>
            );
          })}
        </div>

        {/* Murf Falcon 2 Indian Voice Selector */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">
              Murf Falcon 2 Voice: <span className="text-[#FFA040]">{activeVoice.displayName}</span>
            </p>
            <p className="text-xs text-[#9A9A9A]">
              Choose female or male Indian voice for Agora Voice AI & spoken replies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['female', 'male'] as const).map((g) => {
              const spec = resolveMurfVoice(lang, g);
              const selected = voiceGender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setVoiceGender(g);
                    pushChip({ type: 'info', text: `Voice set to ${spec.voiceId}` });
                  }}
                  aria-pressed={selected}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-medium capitalize cursor-pointer ${
                    selected
                      ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                      : 'border-white/10 bg-[#0B0B0B] text-[#9A9A9A] hover:text-white'
                  }`}
                >
                  {g} ({spec.voiceId})
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                speakReply(
                  `Namaste! I am ${activeVoice.voiceId}, your VibeCart voice assistant.`,
                  lang,
                  voiceGender
                )
              }
              aria-label="Test Murf voice"
              className="h-10 px-3.5 rounded-xl bg-white text-[#050505] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#F5F5F5] cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3D & Accessibility Toggle */}
      <section className="rounded-[20px] vc-glass p-6 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#FFA040] shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-base font-semibold text-[#F5F5F5]">
              Simple View (2D Studio Photos)
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Replaces interactive Three.js 3D viewports with lightweight static product studio photos.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={simpleView}
          onClick={() => setSimpleView(!simpleView)}
          className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
            simpleView ? 'bg-[#2EE59D]' : 'bg-white/15'
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-[#050505] transition-transform ${
              simpleView ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </section>

      {/* Saved Addresses */}
      <section className="rounded-[20px] vc-glass p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#FF6A00]" />
          <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
            Saved Delivery Addresses
          </h2>
        </div>
        {addresses.length === 0 ? (
          <p className="text-xs text-[#9A9A9A]">
            No saved delivery addresses yet. Enter your shipping address during checkout to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-[14px] bg-[#0B0B0B] border border-white/10 p-4 space-y-1 text-sm"
              >
                <p className="font-semibold text-[#F5F5F5]">{addr.name}</p>
                <p className="text-xs text-[#9A9A9A]">{addr.line1}</p>
                <p className="text-xs text-[#9A9A9A]">
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="text-xs font-mono-num text-[#FFA040] pt-1">{addr.phone}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Privacy Notice */}
      <section className="rounded-[20px] vc-glass p-6 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#2EE59D] shrink-0 mt-0.5" />
        <div className="text-xs text-[#9A9A9A] leading-relaxed">
          <p className="text-sm font-semibold text-[#F5F5F5] mb-1">Voice Privacy Note</p>
          <p>
            When a live voice session is started, audio streams over encrypted Agora RTC channels to the Agora Conversational AI Engine and Murf Falcon 2 speech synthesis. VibeCart executes shopping actions in real time without storing raw microphone recordings.
          </p>
        </div>
      </section>
    </div>
  );
};
