import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadProjectZip } from '../utils/downloadZip';

const DownloadButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      await downloadProjectZip();
    } catch (error) {
      setError(error.message);
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`flex items-center px-6 py-3 rounded-lg shadow-md transition-colors duration-200 ${
          isDownloading 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold`}
      >
        <Download className="mr-2" size={20} />
        {isDownloading ? 'Downloading...' : 'Download Project'}
      </button>
      {error && (
        <p className="mt-2 text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
};

export default DownloadButton;