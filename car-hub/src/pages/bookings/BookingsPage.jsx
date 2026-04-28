import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';

function StatusBadge({ s }) {
    const m = { 
        Pending: 'badge-yellow', 
        Approved: 'badge-green', 
        Completed: 'badge-blue', 
        Cancelled: 'badge-red', 
        Rescheduled: 'badge-purple' 
    };
    return <span className={`badge ${m[s] || 'badge-gray'}`}>{s}</span>;
}

export default function BookingsPage() {
    const { user } = useAuth();
    const { bookings, loading } = useBookings();
    const navigate = useNavigate();

    const isStaff = user?.role === 'admin' || user?.role === 'staff';

    // Staff View
    if (isStaff) {
        return <StaffBookingManagement bookings={bookings} navigate={navigate} />;
    }

    // Customer View - My Bookings
    const myBookings = bookings.filter(b => b.customerId === user?.id);

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');

    const filtered = myBookings
        .filter(b => {
            const q = search.toLowerCase();
            const matchSearch = !search || 
                (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) || 
                b.vehicleModel?.toLowerCase().includes(q) ||
                b.id.toLowerCase().includes(q);
            
            const matchStatus = filterStatus === 'All' || b.status === filterStatus;
            const matchType = filterType === 'All' || b.bookingType === filterType;

            return matchSearch && matchStatus && matchType;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (loading) return <div className="page-container">Loading your bookings...</div>;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <div className="page-title">My Bookings</div>
                    <div className="page-subtitle">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>
                    + New Booking
                </button>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input 
                    className="form-input" 
                    placeholder="Search by Booking ID or Vehicle..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    style={{ width: '300px' }}
                />
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                </select>
                <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Test Drive">Test Drive</option>
                    <option value="Reservation">Reservation</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="card p-12 text-center">
                    <p style={{ fontSize: '18px', color: '#666' }}>You don't have any bookings yet.</p>
                    <button className="btn btn-primary mt-6" onClick={() => navigate('/bookings/new')}>
                        Make Your First Booking
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(booking => (
                        <div key={booking.id} className="card p-6 hover:shadow-md transition-shadow">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '18px' }}>
                                        {booking.bookingNumber || booking.id}
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#444' }}>
                                        {booking.vehicleModel}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#666', marginTop: '6px' }}>
                                        {booking.date} • {booking.timeSlot}
                                    </div>
                                </div>
                                <StatusBadge s={booking.status} />
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/bookings/${booking.id}`)}
                                >
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Staff Management Component
function StaffBookingManagement({ bookings, navigate }) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const filteredBookings = bookings.filter(b => {
        const q = search.toLowerCase();
        return (!search || 
            b.id.toLowerCase().includes(q) || 
            b.customerName?.toLowerCase().includes(q) || 
            b.vehicleModel?.toLowerCase().includes(q)
        ) && (filterStatus === 'All' || b.status === filterStatus);
    });

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <div className="page-title">All Bookings</div>
                    <div className="page-subtitle">Manage all customer bookings • {bookings.length} total</div>
                </div>
            </div>

            {/* Staff Filters */}
            <div className="filter-bar" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <input className="form-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            {/* Add your full staff table here if needed */}
            {/* For now showing simple cards - replace with your original table if you prefer */}
            <div className="space-y-4">
                {filteredBookings.map(b => (
                    <div key={b.id} className="card p-6">
                        <strong>{b.bookingNumber || b.id}</strong> - {b.customerName} - {b.vehicleModel}
                        <div>{b.date} {b.timeSlot}</div>
                        <button className="btn btn-sm btn-secondary mt-3" onClick={() => navigate(`/bookings/${b.id}`)}>
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
