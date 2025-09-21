import React from 'react';
import { ArrowRightLeft, ShoppingCart, Wallet, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import DownloadButton from '../components/DownloadButton';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-8 text-white">Welcome to London Blockchain Bridge</h1>
        <p className="text-xl mb-12 text-gray-300">Your gateway to cross-chain transactions and digital asset management</p>
        
        {/* Auth Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/login"
            className="flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <LogIn className="mr-2" size={20} />
            Sign In
          </Link>
          <Link
            to="/signup"
            className="flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <UserPlus className="mr-2" size={20} />
            Create Account
          </Link>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
          <FeatureCard
            icon={<ArrowRightLeft size={48} />}
            title="Cross-Chain Bridge"
            description="Swap tokens across multiple blockchains seamlessly"
          />
          <FeatureCard
            icon={<ShoppingCart size={48} />}
            title="POS DAPP"
            description="Accept crypto and fiat payments for in-store purchases"
          />
          <FeatureCard
            icon={<Wallet size={48} />}
            title="Digital Wallet"
            description="Manage and transfer your digital assets with ease"
          />
        </div>
        
        <div className="flex justify-center mt-8">
          <DownloadButton />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gray-800 p-8 rounded-lg shadow-lg hover:bg-gray-700 transition duration-300 flex flex-col items-center">
    <div className="text-blue-400 mb-4">{icon}</div>
    <h2 className="text-2xl font-semibold mb-4 text-white">{title}</h2>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default Home;