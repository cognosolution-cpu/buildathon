import React, { useEffect, useState } from 'react';
import { Check, Cloud, Globe, Layers, LogOut, Mail, MapPin, Plus, Shield, Star, Trash2, User, Volume2 } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { LANGUAGES } from '../nlu/i18n';
import { useVibeCart } from '../state/store';
import { resolveMurfVoice } from '../voice/murfVoices';
import { speakReply } from '../voice/speech';
import { PWAInstallButton } from '../components/PWAInstallButton';

export const ProfileScreen: React.FC = () => {
  const {
    lang,
    setLang,
    voiceGender,
    setVoiceGender,
    simpleView,
    setSimpleView,
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    setCheckoutDraft,
    navigate,
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

  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [addrName, setAddrName] = useState(profile?.fullName ?? '');
  const [addrPhone, setAddrPhone] = useState(profile?.phone ?? '');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrDefault, setAddrDefault] = useState(true);
  const [addrError, setAddrError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    setFullNameInput(profile?.fullName ?? '');
    setPhoneInput(profile?.phone ?? '');
    setAddrName((prev) => prev || profile?.fullName || '');
    setAddrPhone((prev) => prev || profile?.phone || '');
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

  const handleSaveAddressForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError('');
    const digitsPhone = addrPhone.replace(/\D/g, '');
    const digitsPin = addrPincode.replace(/\D/g, '');
    if (addrName.trim().length < 2) {
      setAddrError('Enter recipient full name.');
      return;
    }
    if (!/^\d{10}$/.test(digitsPhone)) {
      setAddrError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (addrLine1.trim().length < 5) {
      setAddrError('Enter flat/house number and street address.');
      return;
    }
    if (addrCity.trim().length < 2 || addrState.trim().length < 2) {
      setAddrError('Enter both city and state.');
      return;
    }
    if (!/^\d{6}$/.test(digitsPin)) {
      setAddrError('Enter a valid 6-digit PIN code.');
      return;
    }

    setSavingAddress(true);
    await saveAddress({
      name: addrName.trim(),
      phone: digitsPhone,
      line1: addrLine1.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      pincode: digitsPin,
      isDefault: addrDefault,
    });
    setSavingAddress(false);
    setAddrLine1('');
    setAddrCity('');
    setAddrState('');
    setAddrPincode('');
    setAddrFormOpen(false);
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

        {/* Murf Falcon Voice Selector */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">
              Murf Falcon Voice: <span className="text-[#FFA040]">{activeVoice.displayName}</span>
            </p>
            <p className="text-xs text-[#9A9A9A]">
              Choose female, male, or Piyush cloned voice (Falcon 2.1) for Agora Voice AI & spoken replies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['female', 'male', 'cloned'] as const).map((g) => {
              const spec = resolveMurfVoice(lang, g);
              const selected = voiceGender === g;
              const btnLabel =
                g === 'cloned' ? 'Piyush (Cloned)' : `${g} (${spec.voiceId})`;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setVoiceGender(g);
                    pushChip({ type: 'info', text: `Voice set to ${spec.displayName}` });
                  }}
                  aria-pressed={selected}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-medium capitalize cursor-pointer ${
                    selected
                      ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#F5F5F5]'
                      : 'border-white/10 bg-[#0B0B0B] text-[#9A9A9A] hover:text-white'
                  }`}
                >
                  {btnLabel}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                speakReply(
                  `Namaste! I am ${voiceGender === 'cloned' ? 'Piyush' : activeVoice.voiceId}, your VoicoCart voice assistant.`,
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
      <section className="rounded-[20px] vc-glass p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#FFA040] shrink-0 mt-0.5" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold text-[#F5F5F5]">
                Simple View (2D Studio Photos)
              </h2>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  simpleView ? 'bg-[#2EE59D]/15 text-[#2EE59D]' : 'bg-white/10 text-[#9A9A9A]'
                }`}
              >
                {simpleView ? 'ON · 2D Photos' : 'OFF · 3D View'}
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Replaces interactive Three.js 3D viewports with fast 2D product studio photos across catalog & product pages.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => navigate('product')}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-[#FFA040] hover:border-[#FF6A00] cursor-pointer whitespace-nowrap"
          >
            Preview View
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={simpleView}
            aria-label="Toggle Simple View (2D Studio Photos)"
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
        </div>
      </section>

      {/* Install Mobile App (PWA) */}
      <PWAInstallButton variant="card" />

      {/* Saved Addresses */}
      <section className="rounded-[20px] vc-glass p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#FF6A00]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
                Saved Delivery Addresses
              </h2>
              <p className="text-xs text-[#9A9A9A]">
                {authMode === 'authenticated'
                  ? 'Synced to your account · Say “Save my delivery address...” anytime.'
                  : 'Saved on this device · Sign in above to sync across devices.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddrFormOpen((v) => !v);
              setAddrError('');
            }}
            className="h-10 px-3.5 rounded-xl bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{addrFormOpen ? 'Cancel' : 'Add Address'}</span>
          </button>
        </div>

        {addrFormOpen && (
          <form
            onSubmit={handleSaveAddressForm}
            className="rounded-[16px] bg-[#0B0B0B] border border-[#FF6A00]/35 p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="addr-name" className="block text-xs text-[#9A9A9A] mb-1">
                  Full Name
                </label>
                <input
                  id="addr-name"
                  type="text"
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-white/10 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label htmlFor="addr-phone" className="block text-xs text-[#9A9A9A] mb-1">
                  10-Digit Mobile
                </label>
                <input
                  id="addr-phone"
                  type="tel"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-white/10 text-sm font-mono-num text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="addr-line1" className="block text-xs text-[#9A9A9A] mb-1">
                Street / House / Flat Address
              </label>
              <input
                id="addr-line1"
                type="text"
                value={addrLine1}
                onChange={(e) => setAddrLine1(e.target.value)}
                placeholder="42 MG Road, Indiranagar"
                className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-white/10 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="addr-city" className="block text-xs text-[#9A9A9A] mb-1">
                  City
                </label>
                <input
                  id="addr-city"
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-white/10 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label htmlFor="addr-state" className="block text-xs text-[#9A9A9A] mb-1">
                  State
                </label>
                <input
                  id="addr-state"
                  type="text"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  placeholder="Karnataka"
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-white/10 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label htmlFor="addr-pin" className="block text-xs text-[#9A9A9A] mb-1">
                  PIN Code
                </label>
                <input
                  id="addr-pin"
                  type="text"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  placeholder="560038"
                  className="w-full h-11 px-3 rounded-xl bg-[#141414] border border-white/10 text-sm font-mono-num text-[#F5F5F5] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-[#9A9A9A] cursor-pointer">
              <input
                type="checkbox"
                checked={addrDefault}
                onChange={(e) => setAddrDefault(e.target.checked)}
                className="accent-[#FF6A00]"
              />
              <span>Set as default checkout delivery address</span>
            </label>

            {addrError && <p className="text-xs text-[#FF4D5E]">{addrError}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAddress}
                className="h-11 px-5 rounded-[14px] bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{savingAddress ? 'Saving...' : 'Save Address'}</span>
              </button>
            </div>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="rounded-[14px] bg-[#0B0B0B] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#9A9A9A]">
              No saved delivery addresses yet. Tap “Add Address” above or say “Save my delivery address...” to the AI assistant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`rounded-[14px] bg-[#0B0B0B] border p-4 space-y-2 text-sm ${
                  addr.isDefault ? 'border-[#FF6A00]/60' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#F5F5F5]">{addr.name}</p>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FF6A00]/15 text-[10px] font-semibold text-[#FFA040] inline-flex items-center gap-1 shrink-0">
                      <Star className="w-3 h-3 fill-[#FFA040]" />
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9A9A9A]">{addr.line1}</p>
                <p className="text-xs text-[#9A9A9A]">
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="text-xs font-mono-num text-[#FFA040]">{addr.phone}</p>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutDraft({
                        name: addr.name,
                        phone: addr.phone,
                        line1: addr.line1,
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                      });
                      pushChip({ type: 'success', text: `Applied ${addr.city} address` });
                      navigate('checkout');
                    }}
                    className="h-8 px-2.5 rounded-lg bg-white/10 text-[11px] font-medium text-[#F5F5F5] hover:bg-white/15 cursor-pointer"
                  >
                    Use at Checkout
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(addr.id)}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#9A9A9A] hover:text-white cursor-pointer"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    aria-label={`Delete address in ${addr.city}`}
                    className="ml-auto h-8 w-8 rounded-lg bg-white/5 border border-white/10 text-[#9A9A9A] hover:text-[#FF4D5E] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
            When a live voice session is started, audio streams over encrypted Agora RTC channels to the Agora Conversational AI Engine and Murf Falcon 2 speech synthesis. VoicoCart executes shopping actions in real time without storing raw microphone recordings.
          </p>
        </div>
      </section>
    </div>
  );
};
