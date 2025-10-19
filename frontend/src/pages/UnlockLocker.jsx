import { useState } from 'react';
import { lockerAPI } from '../services/api';
import { FaKey, FaLock } from 'react-icons/fa';

const UnlockLocker = () => {
  const [lockerNumber, setLockerNumber] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const response = await lockerAPI.unlock({
        locker_number: lockerNumber,
        access_pin: accessPin,
      });
      setSuccess(response.data.message);
      setLockerNumber('');
      setAccessPin('');
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
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              ✓ {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="locker_number" className="block text-sm font-medium text-gray-700">
                Locker Number
              </label>
              <input
                id="locker_number"
                type="text"
                required
                value={lockerNumber}
                onChange={(e) => setLockerNumber(e.target.value)}
                className="input-field mt-1"
                placeholder="e.g., A1"
              />
            </div>

            <div>
              <label htmlFor="access_pin" className="block text-sm font-medium text-gray-700">
                Access PIN
              </label>
              <input
                id="access_pin"
                type="text"
                required
                maxLength="6"
                value={accessPin}
                onChange={(e) => setAccessPin(e.target.value.replace(/\D/g, ''))}
                className="input-field mt-1"
                placeholder="6-digit PIN"
              />
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
      </div>
    </div>
  );
};

export default UnlockLocker;