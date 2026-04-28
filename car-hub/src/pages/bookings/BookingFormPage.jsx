import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBookings } from '../../context/BookingContext';
import { useCars } from '../../context/CarContext';
import { useAuth } from '../../context/AuthContext';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookingFormPage() {
    const { user } = useAuth();
    const { addBooking, getBookedSlots } = useBookings();
    const { cars, getCarById } = useCars();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const vehicleIdParam = params.get('vehicleId');
    const typeParam = params.get('type') || 'Test Drive';

    const [form, setForm] = useState({
        customerName: user?.name || '',
        customerNIC: '',
        customerPhone: user?.phone || '',
        customerEmail: user?.email || '',
        customerAddress: user?.city || '',
        vehicleId: vehicleIdParam || '',
        vehicleModel: '',
        vehicleType: '',
        bookingType: typeParam,
        date: '',
        timeSlot: '',
        altDate: '',
        notes: '',
    });

    const [errors, setErrors] = useState({});
    const [done, setDone] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Load vehicle if coming from vehicle detail page
    useEffect(() => {
        if (vehicleIdParam) {
            const c = getCarById(vehicleIdParam);
            if (c) {
                setForm(p => ({
                    ...p,
                    vehicleId: c.id,
                    vehicleModel: `${c.brand} ${c.model}`,
                    vehicleType: c.type,
                }));
            }
        }
    }, [vehicleIdParam, getCarById]);

    // Update booked slots when vehicle or date changes
    useEffect(() => {
        if (form.vehicleId && form.date) {
            setBookedSlots(getBookedSlots(form.vehicleId, form.date));
        } else {
            setBookedSlots([]);
        }
    }, [form.vehicleId, form.date, getBookedSlots]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));

        if (name === 'date') {
            setErrors(prev => ({ ...prev, altDate: '' }));
        }
    }

    function handleVehicleSelect(vehicleId) {
        const c = getCarById(vehicleId);
        if (c) {
            setForm(p => ({
                ...p,
                vehicleId: c.id,
                vehicleModel: `${c.brand} ${c.model}`,
                vehicleType: c.type,
            }));
        }
    }

    function selectTimeSlot(slot) {
        if (bookedSlots.includes(slot)) return;
        setForm(p => ({ ...p, timeSlot: slot }));
        setErrors(prev => ({ ...prev, timeSlot: '' }));
    }

    function validateNIC(nic) {
        const trimmed = nic.trim();
        if (!trimmed) return false;
        if (/^\d{12}$/.test(trimmed)) return true;
        if (/^\d{9}[Vv]$/.test(trimmed)) return true;
        if (/^\d{9}$/.test(trimmed)) return true;
        return false;
    }

    function validate() {
        const e = {};

        if (!form.customerName.trim()) e.customerName = 'Full name is required';
        if (!form.customerNIC.trim()) {
            e.customerNIC = 'NIC number is required';
        } else if (!validateNIC(form.customerNIC)) {
            e.customerNIC = 'Invalid NIC format (Use 12 digits or 9 digits + V)';
        }

        if (!form.customerPhone.startsWith('+94')) {
            e.customerPhone = 'Phone number must start with +94';
        }
        if (!form.customerEmail.includes('@')) {
            e.customerEmail = 'Valid email address is required';
        }
        if (!form.customerAddress.trim()) {
            e.customerAddress = 'Home address is required';
        }

        if (!form.vehicleId) e.vehicleId = 'Please select a vehicle';
        if (!form.date) {
            e.date = 'Preferred date is required';
        } else if (new Date(form.date) <= new Date()) {
            e.date = 'Preferred date must be in the future';
        }
        if (!form.timeSlot) e.timeSlot = 'Please select a time slot';

        if (form.altDate) {
            if (new Date(form.altDate) <= new Date(form.date)) {
                e.altDate = 'Alternative date must be after the preferred date';
            }
        }

        return e;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        const result = await addBooking({ ...form, customerId: user.id });
        setSubmitting(false);

        if (result.error) {
            setErrors({ server: result.error });
            return;
        }

        setDone({
            id: result.bookingId,
            ...form,
            customerId: user.id,
            status: 'Pending',
        });
    }

    // Success Screen
    if (done) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
                <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎉</div>
                <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>Booking Confirmed!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Your booking has been submitted and is pending approval.
                </p>

                <div className="card" style={{ maxWidth: '420px', margin: '0 auto 32px', textAlign: 'left' }}>
                    <div style={{ display: 'grid', gap: '14px' }}>
                        {[
                            ['Booking ID', done.id],
                            ['Vehicle', done.vehicleModel],
                            ['Type', done.bookingType],
                            ['Date', done.date],
                            ['Time', done.timeSlot],
                            ['Status', 'Pending']
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{k}</span>
                                <span style={{ fontWeight: '600', fontSize: '13px' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate(`/bookings/${done.id}`)}>
                        View Booking
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>
                        My Bookings
                    </button>
                </div>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const preferredDateSelected = !!form.date;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
                <div>
                    <div className="page-title">Book a Vehicle</div>
                    <div className="page-subtitle">Submit a Test Drive or Reservation request</div>
                </div>
            </div>

            {errors.server && <div className="alert alert-error" style={{ maxWidth: '700px' }}>{errors.server}</div>}

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">

                {/* ==================== CUSTOMER INFORMATION ==================== */}
                <div className="card p-8">
                    <h3 className="section-title mb-6">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group md:col-span-2">
                            <label className="form-label">Full Name *</label>
                            <input 
                                name="customerName" 
                                className={`form-input ${errors.customerName ? 'input-error' : ''}`}
                                value={form.customerName} 
                                onChange={handleChange} 
                            />
                            {errors.customerName && <div className="form-error">{errors.customerName}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">NIC NO. *</label>
                            <input 
                                name="customerNIC" 
                                className={`form-input ${errors.customerNIC ? 'input-error' : ''}`}
                                value={form.customerNIC} 
                                onChange={handleChange} 
                                placeholder="123456789012 or 123456789V" 
                            />
                            {errors.customerNIC && <div className="form-error">{errors.customerNIC}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contact Number (+94) *</label>
                            <input 
                                name="customerPhone" 
                                className={`form-input ${errors.customerPhone ? 'input-error' : ''}`}
                                value={form.customerPhone} 
                                onChange={handleChange} 
                                placeholder="+94XXXXXXXXX" 
                            />
                            {errors.customerPhone && <div className="form-error">{errors.customerPhone}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input 
                                name="customerEmail" 
                                type="email" 
                                className={`form-input ${errors.customerEmail ? 'input-error' : ''}`}
                                value={form.customerEmail} 
                                onChange={handleChange} 
                            />
                            {errors.customerEmail && <div className="form-error">{errors.customerEmail}</div>}
                        </div>

                        <div className="form-group md:col-span-2">
                            <label className="form-label">Home Address *</label>
                            <input 
                                name="customerAddress" 
                                className={`form-input ${errors.customerAddress ? 'input-error' : ''}`}
                                value={form.customerAddress} 
                                onChange={handleChange} 
                            />
                            {errors.customerAddress && <div className="form-error">{errors.customerAddress}</div>}
                        </div>
                    </div>
                </div>

                {/* ==================== VEHICLE INFORMATION ==================== */}
                <div className="card p-8">
                    <h3 className="section-title mb-6">Vehicle Information</h3>
                    <div className="form-group">
                        <label className="form-label">Select Vehicle *</label>
                        <select 
                            name="vehicleId" 
                            className={`form-select ${errors.vehicleId ? 'input-error' : ''}`}
                            value={form.vehicleId} 
                            onChange={(e) => { handleChange(e); handleVehicleSelect(e.target.value); }}
                        >
                            <option value="">— Select Vehicle —</option>
                            {cars.filter(c => c.status === 'available' && c.quantity > 0).map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.id} — {c.brand} {c.model} {c.year}
                                </option>
                            ))}
                        </select>
                        {errors.vehicleId && <div className="form-error">{errors.vehicleId}</div>}
                    </div>

                    {form.vehicleId && (
                        <div className="alert alert-info mt-4">
                            Selected: <strong>{form.vehicleModel}</strong> | Type: {form.vehicleType}
                        </div>
                    )}
                </div>

                {/* ==================== BOOKING DETAILS ==================== */}
                <div className="card p-8">
                    <h3 className="section-title mb-6">Booking Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label className="form-label">Booking Type *</label>
                            <select name="bookingType" className="form-select" value={form.bookingType} onChange={handleChange}>
                                <option>Test Drive</option>
                                <option>Reservation</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Preferred Date *</label>
                            <input 
                                name="date" 
                                type="date" 
                                className={`form-input ${errors.date ? 'input-error' : ''}`}
                                value={form.date} 
                                onChange={handleChange} 
                                min={today} 
                            />
                            {errors.date && <div className="form-error">{errors.date}</div>}
                        </div>
                    </div>

                    {/* TIME SLOT - FIXED */}
                    <div className="form-group mt-8">
                        <label className="form-label">
                            Preferred Time Slot *
                            {form.date && ` — ${new Date(form.date).toLocaleDateString('en-LK', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                        </label>

                        <div className="flex flex-wrap gap-3 mt-4">
                            {TIME_SLOTS.map(slot => {
                                const isTaken = bookedSlots.includes(slot);
                                const isSelected = form.timeSlot === slot;

                                return (
                                    <button
                                        key={slot}
                                        type="button"
                                        disabled={isTaken}
                                        onClick={() => selectTimeSlot(slot)}
                                        className={`px-7 py-3.5 rounded-2xl text-sm font-semibold border transition-all min-w-[85px]
                                            ${isTaken 
                                                ? 'opacity-50 line-through cursor-not-allowed bg-gray-100 border-gray-300' 
                                                : isSelected 
                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-lg scale-105' 
                                                    : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                );
                            })}
                        </div>

                        {errors.timeSlot && <div className="form-error mt-3">{errors.timeSlot}</div>}

                        {form.timeSlot && (
                            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 font-medium">
                                Selected Time: <strong>{form.timeSlot}</strong>
                            </div>
                        )}
                    </div>

                    {/* Alternative Date */}
                    <div className="form-group mt-6">
                        <label className="form-label">Alternative Date (Optional)</label>
                        <input 
                            name="altDate" 
                            type="date" 
                            className={`form-input ${errors.altDate ? 'input-error' : ''}`}
                            value={form.altDate} 
                            onChange={handleChange} 
                            min={form.date || today}
                            disabled={!preferredDateSelected}
                        />
                        {errors.altDate && <div className="form-error">{errors.altDate}</div>}
                    </div>

                    <div className="form-group mt-6">
                        <label className="form-label">Special Notes / Requests</label>
                        <textarea 
                            name="notes" 
                            className="form-textarea" 
                            placeholder="Any special requests..." 
                            value={form.notes} 
                            onChange={handleChange} 
                            rows={4} 
                        />
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6">
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg flex-1" 
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Booking Request'}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-secondary btn-lg" 
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}