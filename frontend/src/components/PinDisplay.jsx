import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PinDisplay = ({ pin, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!pin) {
    return <span className={`text-gray-400 ${className}`}>N/A</span>;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="font-mono font-bold text-base">
        {isVisible ? pin : '••••••'}
      </span>
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
        title={isVisible ? 'Hide PIN' : 'Show PIN'}
        aria-label={isVisible ? 'Hide PIN' : 'Show PIN'}
      >
        {isVisible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  );
};

export default PinDisplay;