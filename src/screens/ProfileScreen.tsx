import React, { useState } from 'react';
import { Cloud, Globe, Layers, LogOut, Mail, MapPin, Shield } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { LANGUAGES } from '../nlu/i18n';
import { useVibeCart } from '../state/store';

export const ProfileScreen: React.FC = () => {
  const {
    lang,
    setLang,
    simpleView,
    setSimpleView,
    addresses,
    pushChip,
    authMode,
    authEmail,
    signInWithMagicLink,
    signOutSupabase,
  } = useVibeCart();
  const [emailInput, setEmailInput] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingLink(true);
    const res = await signInWithMagicLink(emailInput);
    setSendingLink(false);
    setAuthMessage(res.message);
    if (res.ok) setEmailInput('');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F5]">
          Preferences & Voice Settings
        </h1>
        <p className="text-sm text-[#9A9A9A] mt-1">
          Configure spoken assistant language, 3D rendering mode, and saved delivery addresses.
        </p>
      </div>

      {/* Account & Cloud Sync */}
      <section className="rounded-[20px] vc-glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-[#2EE59D]" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F5F5F5]">
                Account & Order Sync
              </h2>
              <p className="text-xs text-[#9A9A9A]">
                {authMode === 'authenticated' && authEmail
                  ? `Signed in as ${authEmail} · Orders & cart synced across devices`
                  : authMode === 'anonymous'
                    ? 'Active Guest Cloud Session · Cart & live order tracking synced to Supabase'
                    : 'Local Preview Session · Persisted in browser storage'}
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
          <form onSubmit={handleMagicLink} className="flex flex-col sm:flex-row gap-2.5 pt-1">
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
                placeholder="you@example.com — sync orders across devices"
                className="w-full h-11 pl-10 pr-4 rounded-[14px] bg-[#0B0B0B] border border-white/10 text-sm text-[#F5F5F5] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
            <button
              type="submit"
              disabled={sendingLink}
              className="h-11 px-5 rounded-[14px] bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {sendingLink ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
        {authMessage && <p className="text-xs text-[#FFA040]">{authMessage}</p>}
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
      </section>

      {/* Privacy Notice */}
      <section className="rounded-[20px] vc-glass p-6 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#2EE59D] shrink-0 mt-0.5" />
        <div className="text-xs text-[#9A9A9A] leading-relaxed">
          <p className="text-sm font-semibold text-[#F5F5F5] mb-1">Voice Privacy Note</p>
          <p>
            When microphone capture is active, your browser’s Web Speech service converts speech to text locally or via browser speech services. VibeCart parses shopping commands directly in the app and never records or stores raw audio files.
          </p>
        </div>
      </section>
    </div>
  );
};
