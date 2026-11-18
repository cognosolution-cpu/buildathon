import React from 'react';
import { VibeCartProvider, useVibeCart } from './state/store';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { VoiceAssistantShell } from './components/VoiceBar';
import { ActionChips } from './components/ActionChips';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CompareScreen } from './screens/CompareScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const ScreenRouter: React.FC = () => {
  const { route } = useVibeCart();

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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-6 pb-28 md:pb-16">
          <ScreenRouter />
        </main>
        <ActionChips />
        <VoiceAssistantShell />
        <MobileBottomNav />
      </div>
    </VibeCartProvider>
  );
}
