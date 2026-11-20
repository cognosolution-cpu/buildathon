import React, { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { canPrompt, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  const handleInstallClick = async () => {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    setGuideOpen(true);
  };

  if (variant === 'header') {
    if (isInstalled || (!canPrompt && !isIOS)) return null;

    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="Install VibeCart app"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-[14px] bg-[#FF6A00]/15 border border-[#FF6A00]/45 text-xs font-semibold text-[#FFA040] hover:bg-[#FF6A00] hover:text-[#050505] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">App</span>
        </button>

        {guideOpen && <InstallGuideModal isIOS={isIOS} isAndroid={isAndroid} onClose={() => setGuideOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <section className="rounded-[20px] vc-glass p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-[#FF6A00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-[#F5F5F5]">
                Install VibeCart Mobile App
              </h2>
              {isInstalled && (
                <span className="px-2 py-0.5 rounded-md bg-[#2EE59D]/15 text-[11px] font-semibold text-[#2EE59D] inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Installed
                </span>
              )}
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5 leading-relaxed">
              {isInstalled
                ? 'Running in standalone mobile app mode with offline catalog support.'
                : 'Add VibeCart to your phone home screen for full-screen app navigation, faster launches, and offline browsing.'}
            </p>
          </div>
        </div>

        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="h-11 px-4 rounded-[14px] bg-white text-[#050505] text-xs font-semibold hover:bg-[#F5F5F5] inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{canPrompt ? 'Install Now' : 'How to Install'}</span>
          </button>
        )}
      </section>

      {guideOpen && <InstallGuideModal isIOS={isIOS} isAndroid={isAndroid} onClose={() => setGuideOpen(false)} />}
    </>
  );
};

const InstallGuideModal: React.FC<{ isIOS: boolean; isAndroid: boolean; onClose: () => void }> = ({
  isIOS,
  isAndroid,
  onClose,
}) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Install VibeCart App Guide"
    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
  >
    <div className="w-full max-w-sm rounded-[24px] bg-[#111111] border border-white/15 p-5 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-[#F5F5F5]">
          Install VibeCart on Your Phone
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close install instructions"
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#9A9A9A] hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <ol className="text-xs text-[#9A9A9A] space-y-2.5 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="font-mono-num text-[#FFA040] font-semibold">1.</span>
            <span>
              Tap the <Share className="w-3.5 h-3.5 inline text-[#F5F5F5] mx-0.5" /> <strong className="text-[#F5F5F5]">Share</strong> button in Safari.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono-num text-[#FFA040] font-semibold">2.</span>
            <span>
              Scroll down and tap <strong className="text-[#F5F5F5]">Add to Home Screen</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono-num text-[#FFA040] font-semibold">3.</span>
            <span>
              Tap <strong className="text-[#F5F5F5]">Add</strong> to launch VibeCart as a standalone app.
            </span>
          </li>
        </ol>
      ) : isAndroid ? (
        <ol className="text-xs text-[#9A9A9A] space-y-2.5 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="font-mono-num text-[#FFA040] font-semibold">1.</span>
            <span>Open Chrome&apos;s top-right <strong className="text-[#F5F5F5]">⋮</strong> menu.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono-num text-[#FFA040] font-semibold">2.</span>
            <span>Tap <strong className="text-[#F5F5F5]">Install app</strong> or <strong className="text-[#F5F5F5]">Add to Home screen</strong>.</span>
          </li>
        </ol>
      ) : (
        <p className="text-xs text-[#9A9A9A] leading-relaxed">
          In Chrome or Edge, click the <strong className="text-[#F5F5F5]">Install VibeCart</strong> icon in the browser address bar to install as a standalone app. On iPhone/Android, open in Safari or Chrome and choose <strong className="text-[#F5F5F5]">Add to Home Screen</strong>.
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full h-11 rounded-[14px] bg-white text-[#050505] text-xs font-semibold cursor-pointer"
      >
        Got it
      </button>
    </div>
  </div>
);
