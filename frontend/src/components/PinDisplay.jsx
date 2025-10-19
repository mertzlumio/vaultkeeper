import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PinDisplay = ({ pin }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      <span className="font-mono font-bold">
        {isVisible ? pin : '******'}
      </span>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-500 hover:text-gray-700"
        title={isVisible ? 'Hide PIN' : 'Show PIN'}
      >
        {isVisible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

export default PinDisplay;
