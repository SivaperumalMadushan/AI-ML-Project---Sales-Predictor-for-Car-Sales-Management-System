import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const BookingContext = createContext(null);
const BOOKING_COLLECTION = 'bookings';

export function BookingProvider({ children }) {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setBookings([]);
            setLoading(false);
            return;
        }

        const q = (user.role === 'admin' || user.role === 'staff')
            ? collection(db, BOOKING_COLLECTION)
            : query(collection(db, BOOKING_COLLECTION), where('customerId', '==', user.id));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs
                .map(d => ({ 
                    id: d.id, 
                    ...d.data(),
                    createdAt: d.data().createdAt instanceof Timestamp 
                        ? d.data().createdAt.toDate() 
                        : d.data().createdAt 
                }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setBookings(data);
            setLoading(false);
        }, (err) => {
            console.error('Bookings snapshot error:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [user?.id, user?.role]);

    // Optimistic update helper
    const addBookingToLocal = (newBooking) => {
        setBookings(prev => [newBooking, ...prev]);
    };

    async function isSlotTaken(vehicleId, date, timeSlot, excludeId = null) {
        return bookings.some(b =>
            b.vehicleId === vehicleId &&
            b.date === date &&
            b.timeSlot === timeSlot &&
            b.status !== 'Cancelled' &&
            b.id !== excludeId
        );
    }

    async function addBooking(data) {
        const taken = await isSlotTaken(data.vehicleId, data.date, data.timeSlot);
        if (taken) {
            return { error: 'This time slot is already booked for the selected vehicle.' };
        }

        try {
            const bookingNumber = `BK-${String(bookings.length + 1001).padStart(4, '0')}`;

            const bookingData = {
                ...data,
                bookingNumber,
                status: 'Pending',
                assignedStaff: '',
                createdAt: serverTimestamp(),
            };

            const ref = await addDoc(collection(db, BOOKING_COLLECTION), bookingData);

            // Optimistic update for instant visibility
            const optimisticBooking = {
                id: ref.id,
                ...bookingData,
                createdAt: new Date(), // for immediate display
            };

            addBookingToLocal(optimisticBooking);

            return { bookingId: ref.id, booking: optimisticBooking };
        } catch (e) {
            console.error('addBooking error:', e);
            return { error: e.message };
        }
    }

    async function updateBooking(id, data) {
        try {
            await updateDoc(doc(db, BOOKING_COLLECTION, id), {
                ...data,
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error('updateBooking error:', e);
            throw e;
        }
    }

    async function deleteBooking(id) {
        try {
            await deleteDoc(doc(db, BOOKING_COLLECTION, id));
        } catch (e) {
            console.error('deleteBooking error:', e);
            throw e;
        }
    }

    async function reschedule(id, date, timeSlot) {
        const booking = bookings.find(b => b.id === id);
        if (!booking) return 'Booking not found.';
        
        const taken = await isSlotTaken(booking.vehicleId, date, timeSlot, id);
        if (taken) return 'This time slot is already booked.';

        await updateBooking(id, { date, timeSlot, status: 'Rescheduled' });
        return null;
    }

    function getBookingById(id) { 
        return bookings.find(b => b.id === id); 
    }

    function getBookingsByUser(userId) { 
        return bookings.filter(b => b.customerId === userId); 
    }

    function getBookedSlots(vehicleId, date) {
        return bookings
            .filter(b => b.vehicleId === vehicleId && b.date === date && b.status !== 'Cancelled')
            .map(b => b.timeSlot);
    }

    return (
        <BookingContext.Provider value={{
            bookings,
            loading,
            addBooking,
            updateBooking,
            deleteBooking,
            reschedule,
            getBookingById,
            getBookingsByUser,
            getBookedSlots,
            isSlotTaken
        }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookings() { 
    return useContext(BookingContext); 
}