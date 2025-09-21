import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader } from 'lucide-react';

const Success = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4 text-blue-400 animate-spin" size={48} />
          <p className="text-gray-300">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
          <CheckCircle className="mx-auto mb-6 text-green-400" size={64} />
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-300 mb-6">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>

          {sessionId && (
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-400 mb-1">Transaction ID:</p>
              <p className="text-xs font-mono text-gray-300 break-all">
                {sessionId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
            
            <Link
              to="/"
              className="w-full flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;