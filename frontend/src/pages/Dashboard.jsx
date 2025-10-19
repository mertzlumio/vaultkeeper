import { useState, useEffect } from 'react';
import { lockerAPI, reservationAPI } from '../services/api';
import { FaLock, FaUnlock, FaKey, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { format } from 'date-fns';

const Dashboard = () => {
  const [lockers, setLockers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [reserveUntil, setReserveUntil] = useState('');
  const [newReservation, setNewReservation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lockersRes, reservationsRes] = await Promise.all([
        lockerAPI.getAvailable(),
        reservationAPI.getActive(),
      ]);
      setLockers(lockersRes.data);
      setReservations(reservationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    try {
      const response = await reservationAPI.create({
        locker: selectedLocker.id,
        reserved_until: reserveUntil,
      });
      setNewReservation(response.data);
      setShowReser