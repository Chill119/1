import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { products, getProductByPriceId } from '../stripe-config';
import ProductCard from '../components/ProductCard';
import { LogOut, User, CreditCard, Loader } from 'lucide-react';

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

export default Dashboard;