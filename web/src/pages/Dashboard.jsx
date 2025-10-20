import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lockerAPI, reservationAPI } from '../services/api';
import { FaLock, FaUnlock, FaKey, FaClock, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import PinDisplay from '../components/PinDisplay';

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
      setSuccess(`✓ Locker reserved successfully!`);
      setShowReserveModal(false);
      setSelectedLocker(null);
      setReserveUntil('');
      setTimeout(() => {
        fetchData();
        setSuccess('');
        setNewReservation(null);
      }, 5000);
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
        <div className="mb-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-blue-900 mb-4 text-xl flex items-center">
            <FaKey className="mr-2" />
            Your Reservation Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Locker Number</p>
              <p className="font-bold text-lg text-gray-900">{newReservation.locker_details?.locker_number}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Access PIN</p>
              <PinDisplay pin={newReservation.access_pin} />
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Location</p>
              <p className="font-bold text-gray-900">{newReservation.locker_details?.location}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Reserved Until</p>
              <p className="font-bold text-gray-900">{format(new Date(newReservation.reserved_until), 'PPP p')}</p>
            </div>
          </div>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm flex items-center">
              <FaKey className="mr-2" />
              <strong>Important:</strong> Save your PIN! You'll need it to unlock the locker.
            </p>
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
              <FaLock className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No available lockers at the moment</p>
              <p className="text-gray-400 text-sm mt-2">Check back later</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lockers.map((locker) => (
                <div key={locker.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {locker.locker_number}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{locker.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaLock className="text-gray-400 flex-shrink-0" />
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
                      className="btn-primary whitespace-nowrap w-full sm:w-auto"
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
              <FaClock className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active reservations</p>
              <p className="text-gray-400 text-sm mt-2">Reserve a locker to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {reservation.locker_details?.locker_number}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{reservation.locker_details?.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaKey className="text-gray-400 flex-shrink-0" />
                            <div className="flex items-center gap-2 overflow-x-auto">
                              <span className="text-xs whitespace-nowrap">PIN:</span>
                              <PinDisplay pin={reservation.access_pin} />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaClock className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs truncate">
                              Until {format(new Date(reservation.reserved_until), 'PPP p')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t">
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
                      {reservation.is_active && (
                        <button
                          onClick={() => handleReleaseReservation(reservation.id)}
                          className="btn-danger text-xs px-2 py-1 flex items-center space-x-1 whitespace-nowrap w-full sm:w-auto justify-center"
                        >
                          <FaTrash size={12} />
                          <span>Release</span>
                        </button>
                      )}
                    </div>
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
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