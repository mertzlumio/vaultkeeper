import { useState } from 'react';
import { lockerAPI } from '../services/api';
import { FaKey, FaLock, FaCheck } from 'react-icons/fa';
import PinDisplay from '../components/PinDisplay';

const UnlockLocker = () => {
  const [lockerNumber, setLockerNumber] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [unlockedData, setUnlockedData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setUnlockedData(null);
    setLoading(true);

    try {
      const response = await lockerAPI.unlock({
        locker_number: lockerNumber,
        access_pin: accessPin,
      });
      setSuccess(response.data.message);
      setUnlockedData(response.data);
      setLockerNumber('');
      setAccessPin('');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
        setUnlockedData(null);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unlock locker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <FaKey className="text-primary-600 text-6xl" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Unlock Your Locker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your locker number and PIN to access
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && unlockedData && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FaCheck className="text-green-600 text-2xl mr-2" />
                <h3 className="font-bold text-green-900">✓ {success}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600 text-xs mb-1">Locker Number</p>
                  <p className="font-bold text-gray-900">{unlockedData.locker?.locker_number}</p>
                </div>
                {unlockedData.reservation && (
                  <>
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-600 text-xs mb-1">Reserved By</p>
                      <p className="font-bold text-gray-900">{unlockedData.reservation.user}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-600 text-xs mb-1">Valid Until</p>
                      <p className="font-bold text-gray-900">
                        {new Date(unlockedData.reservation.reserved_until).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="locker_number" className="block text-sm font-medium text-gray-700 mb-1">
                Locker Number
              </label>
              <input
                id="locker_number"
                type="text"
                required
                value={lockerNumber}
                onChange={(e) => setLockerNumber(e.target.value.toUpperCase())}
                className="input-field"
                placeholder="e.g., A1, B2"
              />
            </div>

            <div>
              <label htmlFor="access_pin" className="block text-sm font-medium text-gray-700 mb-1">
                Access PIN
              </label>
              <input
                id="access_pin"
                type="text"
                required
                maxLength="6"
                value={accessPin}
                onChange={(e) => setAccessPin(e.target.value.replace(/\D/g, ''))}
                className="input-field font-mono text-lg tracking-widest"
                placeholder="••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your 6-digit PIN
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FaLock />
            <span>{loading ? 'Unlocking...' : 'Unlock Locker'}</span>
          </button>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure you enter the correct locker number</li>
            <li>• Your PIN is case-sensitive and must be 6 digits</li>
            <li>• Check your reservation details in the Dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnlockLocker;