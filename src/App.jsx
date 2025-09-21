import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { createConfig, WagmiConfig, configureChains } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { walletConnectProvider } from '@web3modal/wagmi';
import { AppProvider } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Bridge from './pages/Bridge';
import PosSales from './pages/PosSales';
import Wallet from './pages/Wallet';
import SorobanDapp from './pages/SorobanDapp';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Dashboard from './pages/Dashboard';
import Success from './pages/Success';
import ProtectedRoute from './components/ProtectedRoute';

const projectId = 'c80b8495b4aed5c469117b607c8c4dcb';

const { chains, publicClient } = configureChains(
  [mainnet, sepolia],
  [walletConnectProvider({ projectId })]
);

const metadata = {
  name: 'London Blockchain Bridge',
  description: 'Cross-chain bridge and POS DAPP',
  url: 'https://london-blockchain-bridge.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const config = createConfig({
  autoConnect: true,
  publicClient,
  chains
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  metadata
});

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle authentication redirects from Supabase
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data?.session && location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    };

    // Check for auth tokens in URL hash (from email confirmations, etc.)
    if (location.hash && location.hash.includes('access_token')) {
      handleAuthRedirect();
    }
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {user && <Navbar />}
      <div className={user ? "container mx-auto px-4 py-8" : ""}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={!user ? <SignupForm /> : <Navigate to="/dashboard" replace />} />
          <Route path="/success" element={<Success />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/bridge" element={
            <ProtectedRoute>
              <Bridge />
            </ProtectedRoute>
          } />
          <Route path="/pos" element={
            <ProtectedRoute>
              <PosSales />
            </ProtectedRoute>
          } />
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/soroban" element={
            <ProtectedRoute>
              <SorobanDapp />
            </ProtectedRoute>
          } />
          
          {/* Home route - redirect based on auth status */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <Home />
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <Navigate to={user ? "/dashboard" : "/"} replace />
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <WagmiConfig config={config}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </WagmiConfig>
  );
}

export default App;