import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { products, getProductByPriceId } from '../stripe-config';
import ProductCard from '../components/ProductCard';
import { LogOut, User, CreditCard, Loader, ArrowRightLeft, ShoppingCart, Wallet, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
  };

  const getSubscriptionPlanName = () => {
    if (!subscription?.price_id) return null;
    const product = getProductByPriceId(subscription.price_id);
    return product?.name || 'Unknown Plan';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-300">
                <User className="mr-2" size={20} />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                <LogOut className="mr-2" size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Access Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickAccessCard
              to="/bridge"
              icon={<ArrowRightLeft size={32} />}
              title="Cross-Chain Bridge"
              description="Transfer assets across blockchain networks"
              color="blue"
            />
            <QuickAccessCard
              to="/pos"
              icon={<ShoppingCart size={32} />}
              title="POS DAPP"
              description="Process payments and view sales analytics"
              color="green"
            />
            <QuickAccessCard
              to="/wallet"
              icon={<Wallet size={32} />}
              title="Digital Wallet"
              description="Manage your portfolio and send/receive crypto"
              color="purple"
            />
          </div>
        </div>

        {/* Subscription Status */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <CreditCard className="mr-2" size={24} />
            Subscription Status
          </h2>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            {subscriptionLoading ? (
              <div className="flex items-center text-gray-300">
                <Loader className="mr-2 animate-spin" size={20} />
                Loading subscription status...
              </div>
            ) : subscription?.subscription_status === 'active' ? (
              <div className="text-green-400">
                <p className="font-semibold">Active Subscription</p>
                <p className="text-sm text-gray-300 mt-1">
                  Plan: {getSubscriptionPlanName()}
                </p>
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-300">
                    Next billing: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-gray-300">
                <p className="font-semibold">No Active Subscription</p>
                <p className="text-sm text-gray-400 mt-1">
                  Choose a plan below to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.priceId} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAccessCard = ({ to, icon, title, description, color }) => {
  const colorClasses = {
    blue: 'from-blue-900 to-blue-800 border-blue-700 hover:border-blue-500',
    green: 'from-green-900 to-green-800 border-green-700 hover:border-green-500',
    purple: 'from-purple-900 to-purple-800 border-purple-700 hover:border-purple-500',
  };

  return (
    <Link
      to={to}
      className={`bg-gradient-to-br ${colorClasses[color]} border-2 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white bg-opacity-10 rounded-lg group-hover:bg-opacity-20 transition-all">
          {icon}
        </div>
        <ArrowRight className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </Link>
  );
};

export default Dashboard;