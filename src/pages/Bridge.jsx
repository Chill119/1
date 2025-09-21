import React, { useState } from 'react';
import { ArrowRightLeft, History } from 'lucide-react';
import BridgeForm from '../components/bridge/BridgeForm';
import BridgeHistory from '../components/bridge/BridgeHistory';

const Bridge = () => {
  const [activeTab, setActiveTab] = useState('bridge');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Cross-Chain Bridge</h1>
        <p className="text-gray-300">
          Securely transfer assets between Stellar and EVM-compatible chains
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('bridge')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center ${
              activeTab === 'bridge'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="mr-2" size={16} />
            Bridge
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <History className="mr-2" size={16} />
            History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'bridge' ? <BridgeForm /> : <BridgeHistory />}
    </div>
  );
};

export default Bridge;