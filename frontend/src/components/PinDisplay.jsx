import { useState } from 'react';
import { FaEye, FaEyeSlash, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PinDisplay = ({ pin, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!pin) {
    return <span className={`text-gray-400 ${className}`}>N/A</span>;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      
      // Show toast notification
      toast.success('PIN copied to clipboard!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy PIN', {
        position: "top-right",
        autoClose: 2000,
      });
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pin;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('PIN copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback copy failed:', e);
        toast.error('Failed to copy PIN');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="font-mono font-bold text-base">
        {isVisible ? pin : '••••••'}
      </span>
      
      {/* Toggle Visibility Button */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors p-1"
        title={isVisible ? 'Hide PIN' : 'Show PIN'}
        aria-label={isVisible ? 'Hide PIN' : 'Show PIN'}
      >
        {isVisible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>

      {/* Copy to Clipboard Button */}
      <button
        type="button"
        onClick={copyToClipboard}
        className={`focus:outline-none transition-all p-1 ${
          copied 
            ? 'text-green-600' 
            : 'text-gray-500 hover:text-blue-600'
        }`}
        title={copied ? 'Copied!' : 'Copy PIN'}
        aria-label={copied ? 'Copied!' : 'Copy PIN'}
      >
        {copied ? <FaCheck size={16} /> : <FaCopy size={16} />}
      </button>
    </div>
  );
};

export default PinDisplay;


