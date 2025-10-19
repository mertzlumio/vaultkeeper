import { useState, useEffect } from 'react';
import { lockerAPI, reservationAPI } from '../services/api';
import { FaEdit, FaTrash, FaPlus, FaUsers } from 'react-icons/fa';

const AdminDashboard = () => {
  const [lockers, setLockers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocker, setEditingLocker] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    locker_number: '',
    location: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lockersRes, reservationsRes] = await Promise.all([
        lockerAPI.getAll(),
        reservationAPI.getAll(),
      ]);
      setLockers(lockersRes.data);
      setReservations(reservationsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocker = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await lockerAPI.create(formData);
      setFormData({ locker_number: '', location: '' });
      setShowCreateModal(false);
      setSuccess('✓ Locker created successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.locker_number?.[0] || 'Error creating locker');
    }
  };

  const handleEditLocker = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await lockerAPI.update(editingLocker.id, formData);
      setFormData({ locker_number: '', location: '' });
      setShowEditModal(false);
      setEditingLocker(null);
      setSuccess('✓ Locker updated successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.locker_number?.[0] || 'Error updating locker');
    }
  };

  const openEditModal = (locker) => {
    setEditingLocker(locker);
    setFormData({
      locker_number: locker.locker_number,
      location: locker.location,
    });
    setShowEditModal(true);
    setError('');
  };

  const handleDeleteLocker = async (id) => {
    if (window.confirm('Deactivate this locker? It cannot be reserved after this.')) {
      try {
        await lockerAPI.delete(id);
        setSuccess('✓ Locker deactivated');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Error deactivating locker');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage lockers and view all reservations</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="font-bold">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-gray-600">Total Lockers</p>
          <p className="text-4xl font-bold text-blue-600">{lockers.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-600">Active Reservations</p>
          <p className="text-4xl font-bold text-green-600">
            {reservations.filter(r => r.is_active).length}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-gray-600">Available Lockers</p>
          <p className="text-4xl font-bold text-purple-600">
            {lockers.filter(l => l.status === 'available').length}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Lockers Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">All Lockers</h2>
            <button
              onClick={() => {
                setFormData({ locker_number: '', location: '' });
                setShowCreateModal(true);
                setError('');
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <FaPlus />
              <span>New Locker</span>
            </button>
          </div>

          <div className="space-y-3">
            {lockers.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                No lockers created yet
              </div>
            ) : (
              lockers.map((locker) => (
                <div key={locker.id} className="card flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{locker.locker_number}</h3>
                    <p className="text-gray-600 text-sm">{locker.location}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        locker.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : locker.status === 'reserved'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {locker.status}
                    </span>
                    <button
                      onClick={() => openEditModal(locker)}
                      className="btn-secondary text-sm px-3"
                      title="Edit Locker"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteLocker(locker.id)}
                      className="btn-danger text-sm px-3"
                      title="Deactivate Locker"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Locker Status Distribution</p>
                  <p className="font-bold mt-2">
                    Available: <span className="text-green-600">{lockers.filter(l => l.status === 'available').length}</span>
                  </p>
                  <p className="font-bold">
                    Reserved: <span className="text-yellow-600">{lockers.filter(l => l.status === 'reserved').length}</span>
                  </p>
                  <p className="font-bold">
                    Inactive: <span className="text-red-600">{lockers.filter(l => l.status === 'inactive').length}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3 mb-3">
                <FaUsers className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-gray-600 text-sm">Total Reservations</p>
                  <p className="text-2xl font-bold">{reservations.length}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Active: <span className="font-bold text-green-600">
                  {reservations.filter(r => r.is_active).length}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Table - FIXED HEADING */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Reservations</h2>
        <div className="overflow-x-auto card">
          {reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations yet
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Locker</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reserved Until</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">PIN</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium">{res.user}</td>
                    <td className="px-6 py-3 text-sm">{res.locker_details?.locker_number}</td>
                    <td className="px-6 py-3 text-sm">{res.locker_details?.location}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          res.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {res.is_active ? 'Active' : 'Released'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {new Date(res.reserved_until).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono font-bold">
                      {res.access_pin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Create New Locker</h3>
            <form onSubmit={handleCreateLocker} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locker Number *
                </label>
                <input
                  type="text"
                  value={formData.locker_number}
                  onChange={(e) =>
                    setFormData({ ...formData, locker_number: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., A1, B2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Building A, Floor 2"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ locker_number: '', location: '' });
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

      {/* Edit Modal */}
      {showEditModal && editingLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Edit Locker</h3>
            <form onSubmit={handleEditLocker} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locker Number *
                </label>
                <input
                  type="text"
                  value={formData.locker_number}
                  onChange={(e) =>
                    setFormData({ ...formData, locker_number: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., A1, B2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Building A, Floor 2"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLocker(null);
                    setFormData({ locker_number: '', location: '' });
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

export default AdminDashboard;