import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lockerAPI, reservationAPI } from '../services/api';
import { FaLock, FaUnlock, FaKey, FaClock, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [lockers, setLockers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [reserveUntil, setReserveUntil] = useState('');
  const [newReservation, setNewReservation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  if (isAdmin) {
    return <Navigate to="/admin" />;
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lockersRes, reservationsRes] = await Promise.all([
        lockerAPI.getAvailable(),
        reservationAPI.getActive(),
      ]);
      setLockers(lockersRes.data);
      setReservations(reservationsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedLocker || !reserveUntil) {
      setError('Please select a locker and set a reservation time');
      return;
    }

    try {
      const response = await reservationAPI.create({
        locker: selectedLocker.id,
        reserved_until: reserveUntil,
      });
      setNewReservation(response.data);
      setSuccess(`✓ Locker reserved successfully! Your PIN: ${response.data.access_pin}`);
      setShowReserveModal(false);
      setSelectedLocker(null);
      setReserveUntil('');
      setTimeout(() => {
        fetchData();
        setSuccess('');
        setNewReservation(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.locker?.[0] || 'Failed to reserve locker');
    }
  };

  const handleReleaseReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to release this reservation?')) {
      return;
    }

    try {
      await reservationAPI.release(reservationId);
      setSuccess('✓ Reservation released successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to release reservation');
      console.error('Error:', err);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your locker reservations</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 font-bold">×</button>
        </div>
      )}

      {newReservation && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">Your Reservation Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="text-gray-600">Locker</p>
              <p className="font-bold">{newReservation.locker_details?.locker_number}</p>
            </div>
            <div>
              <p className="text-gray-600">Access PIN</p>
              <p className="font-mono font-bold text-lg">{newReservation.access_pin}</p>
            </div>
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-bold">{newReservation.locker_details?.location}</p>
            </div>
            <div>
              <p className="text-gray-600">Reserved Until</p>
              <p className="font-bold">{format(new Date(newReservation.reserved_until), 'PPP p')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Lockers Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <FaUnlock className="text-green-600 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">Available Lockers</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {lockers.length}
            </span>
          </div>

          {lockers.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-lg">No available lockers at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lockers.map((locker) => (
                <div key={locker.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {locker.locker_number}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span>{locker.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaLock className="text-gray-400" />
                          <span className="capitalize text-green-600 font-medium">
                            {locker.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLocker(locker);
                        setShowReserveModal(true);
                        setError('');
                      }}
                      className="btn-primary ml-4 whitespace-nowrap"
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Reservations Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <FaClock className="text-blue-600 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">My Reservations</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {reservations.length}
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-lg">No active reservations</p>
              <p className="text-gray-400 text-sm mt-2">Reserve a locker to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {reservation.locker_details?.locker_number}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span>{reservation.locker_details?.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaKey className="text-gray-400" />
                          <span className="font-mono font-bold text-gray-900">
                            PIN: {reservation.access_pin}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaClock className="text-gray-400" />
                          <span>
                            Until {format(new Date(reservation.reserved_until), 'PPP p')}
                          </span>
                        </div>
                      </div>
                      <div className="inline-block">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            reservation.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {reservation.is_active ? 'Active' : 'Released'}
                        </span>
                      </div>
                    </div>
                    {reservation.is_active && (
                      <button
                        onClick={() => handleReleaseReservation(reservation.id)}
                        className="btn-danger ml-4 whitespace-nowrap flex items-center space-x-1"
                      >
                        <FaTrash />
                        <span>Release</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reserve Modal */}
      {showReserveModal && selectedLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Reserve Locker {selectedLocker.locker_number}
            </h3>

            <form onSubmit={handleReserve} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location: <span className="font-bold">{selectedLocker.location}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reserve Until *
                </label>
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  value={reserveUntil}
                  onChange={(e) => setReserveUntil(e.target.value)}
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select when the reservation should end (minimum 5 minutes from now)
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Confirm Reservation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReserveModal(false);
                    setSelectedLocker(null);
                    setReserveUntil('');
                    setError('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;