import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const PROJECT_FILES = {
  'package.json': `{
  "name": "london-blockchain-bridge",
  "version": "1.0.0",
  "description": "London Blockchain Bridge",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "ethers": "^5.7.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "stellar-sdk": "^10.4.1",
    "lucide-react": "^0.284.0",
    "process": "^0.11.10",
    "stream-browserify": "^3.0.0",
    "browserify-zlib": "^0.2.0",
    "util": "^0.12.5",
    "web3": "^1.9.0",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.27",
    "@types/react-dom": "^18.0.10",
    "@vitejs/plugin-react": "^3.1.0",
    "autoprefixer": "^10.4.13",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.4",
    "vite": "^4.1.0"
  }
}`,
  '.env': `PORT=3000
STELLAR_SECRET_KEY=SAXZ4JHIPHCUWNPRK2NDFD2CLQ7ACRSJLXUHLJ3WN7XUSEQEIUM3F6CT
BRIDGE_STELLAR_ADDRESS=GBTUXCJ3OCFUSQFWJ5UOZNCYB2ONOSFX5UXZLEZ6W2BMFGY3IIUTIP7K
STELLAR_ISSUER=GDSXZYSQ54VNS27TNZOYXV4JLBCO7GPEZSB7SBXKN5R546ERJP6Q7243
EVM_PRIVATE_KEY=51769fdbc128d8ec6cabc1b6d5429886e5c3e5a472134c4e0e0e8ee5b1804d41
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/315adbef8f93494b9f147c8e0c9d3fc4
BASE_RPC_URL=https://base-goerli.infura.io/v3/315adbef8f93494b9f147c8e0c9d3fc4
OPTIMISM_RPC_URL=https://optimism-goerli.infura.io/v3/315adbef8f93494b9f147c8e0c9d3fc4
ETHEREUM_OMNIBASIS_ROUTER=https://ipfs.infura.io:5001
BASE_OMNIBASIS_ROUTER=https://ipfs.infura.io:5001
OPTIMISM_OMNIBASIS_ROUTER=https://ipfs.infura.io:5001
ETHEREUM_USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48
BASE_USDC_ADDRESS=0x83C5bA3c7380b97d18f0d278e9df9C001C5FB291​
OPTIMISM_USDC_ADDRESS=0x7F5c764cBc14f9669B88837ca1490cCa17c31607
OMNIBASIS_API_KEY=2S13RUnb7H1KRmazyM3VkuPrKCnEGgbmdnyaa1nhzwuy`,
  'README.md': `# London Blockchain Bridge

A cross-chain bridge and POS DAPP for seamless cryptocurrency transactions.

## Features

- Cross-chain token bridging
- POS system for crypto payments
- Digital wallet integration
- Multi-chain support (Ethereum, Base, Optimism)

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create a .env file with your configuration (see .env.example)

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

- \`/src\`
  - \`/components\` - Reusable React components
  - \`/context\` - React context providers
  - \`/pages\` - Main application pages
  - \`/services\` - Business logic and API services
  - \`/utils\` - Utility functions
  - \`/routes\` - Express routes
  - \`/controllers\` - Request handlers

## License

MIT`
};

const SOURCE_FILES = {
  'src/App.jsx': `import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Bridge from './pages/Bridge'
import PosSales from './pages/PosSales'
import Wallet from './pages/Wallet'

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/pos" element={<PosSales />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
        </div>
      </div>
    </AppProvider>
  )
}

export default App`,
  'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)`,
  'src/index.css': `@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

body {
  @apply bg-gray-900 text-white;
}`
};

export const downloadProjectZip = async () => {
  try {
    const zip = new JSZip();

    // Add configuration and static files
    Object.entries(PROJECT_FILES).forEach(([path, content]) => {
      zip.file(path, content);
    });

    // Add source files
    Object.entries(SOURCE_FILES).forEach(([path, content]) => {
      zip.file(path, content);
    });

    // Add all components
    const components = {
      'src/components/Navbar.jsx': document.querySelector('[data-file="src/components/Navbar.jsx"]')?.textContent || '',
      'src/components/DownloadButton.jsx': document.querySelector('[data-file="src/components/DownloadButton.jsx"]')?.textContent || '',
      'src/context/AppContext.jsx': document.querySelector('[data-file="src/context/AppContext.jsx"]')?.textContent || '',
      'src/pages/Home.jsx': document.querySelector('[data-file="src/pages/Home.jsx"]')?.textContent || '',
      'src/pages/Bridge.jsx': document.querySelector('[data-file="src/pages/Bridge.jsx"]')?.textContent || '',
      'src/pages/PosSales.jsx': document.querySelector('[data-file="src/pages/PosSales.jsx"]')?.textContent || '',
      'src/pages/Wallet.jsx': document.querySelector('[data-file="src/pages/Wallet.jsx"]')?.textContent || '',
      'src/services/bridgeService.js': document.querySelector('[data-file="src/services/bridgeService.js"]')?.textContent || '',
      'src/routes/bridgeRoutes.js': document.querySelector('[data-file="src/routes/bridgeRoutes.js"]')?.textContent || '',
      'src/controllers/bridgeController.js': document.querySelector('[data-file="src/controllers/bridgeController.js"]')?.textContent || ''
    };

    Object.entries(components).forEach(([path, content]) => {
      if (content) {
        zip.file(path, content);
      }
    });

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'london-blockchain-bridge.zip');
  } catch (error) {
    console.error('Failed to create zip file:', error.message);
    throw new Error(`Download failed: ${error.message}`);
  }
};