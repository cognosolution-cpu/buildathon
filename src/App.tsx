import React, { useEffect } from 'react';
import { VibeCartProvider, useVibeCart } from './state/store';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { VoiceAssistantShell } from './components/VoiceBar';
import { ActionChips } from './components/ActionChips';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CompareScreen } from './screens/CompareScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const ScreenRouter: React.FC = () => {
  const { route, focusedProductId } = useVibeCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route, focusedProductId]);

  switch (route) {
    case 'results':
      return <ResultsScreen />;
    case 'product':
      return <ProductDetailScreen />;
    case 'compare':
      return <CompareScreen />;
    case 'cart':
      return <CartScreen />;
    case 'checkout':
      return <CheckoutScreen />;
    case 'orders':
      return <OrdersScreen />;
    case 'profile':
      return <ProfileScreen />;
    default:
      return <HomeScreen />;
  }
};

export default function App() {
  return (
    <VibeCartProvider>
      <div className="vc-canvas-bg" aria-hidden="true" />
      <div className="min-h-screen w-full flex flex-col overflow-x-clip">
        <OfflineIndicator />
        <Header />
        <main className="flex-1 min-w-0 w-full max-w-[1280px] mx-auto px-3.5 md:px-8 pt-4 md:pt-6 pb-28 md:pb-16">
          <ScreenRouter />
        </main>
        <ActionChips />
        <VoiceAssistantShell />
        <MobileBottomNav />
      </div>
    </VibeCartProvider>
  );
}
