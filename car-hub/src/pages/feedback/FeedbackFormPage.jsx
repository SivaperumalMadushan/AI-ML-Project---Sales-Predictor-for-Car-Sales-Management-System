import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../../context/FeedbackContext';
import { useAuth } from '../../context/AuthContext';

export default function FeedbackFormPage() {
    const { user } = useAuth();
    const { addFeedback } = useFeedback();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        type: 'Inquiry',
        subject: '',
        description: '',
        rating: 0,
        priority: 'Medium',
        customerName: '',
        vehicleId: '',
        salesVoucherId: ''
    });

    const [errors, setErrors] = useState({});
    const [done, setDone] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.name) {
            setForm(prev => ({ ...prev, customerName: user.name }));
        }
    }, [user]);

    // Validation Functions
    const validateVehicleId = (id) => {
        const trimmed = id.trim();
        return trimmed.length >= 5 && /^[A-Za-z0-9]+$/.test(trimmed);
    };

    const validateSalesVoucherId = (id) => {
        const trimmed = id.trim();
        return /^SV-\d{4}-\d{5}$/.test(trimmed);
    };

    function validate() {
        const e = {};

        if (!form.subject.trim()) e.subject = 'Subject is required';
        if (!form.description.trim()) {
            e.description = 'Description is required';
        } else if (form.description.length < 20) {
            e.description = 'Description must be at least 20 characters';
        }

        if (!form.customerName.trim()) e.customerName = 'Customer name is required';

        if (!form.vehicleId.trim()) {
            e.vehicleId = 'Vehicle ID / Chassis No. is required';
        } else if (!validateVehicleId(form.vehicleId)) {
            e.vehicleId = 'Vehicle ID must be alphanumeric and at least 5 characters';
        }

        if (!form.salesVoucherId.trim()) {
            e.salesVoucherId = 'Sales Voucher ID is required';
        } else if (!validateSalesVoucherId(form.salesVoucherId)) {
            e.salesVoucherId = 'Invalid Sales Voucher format. Use SV-YYYY-XXXXX (e.g., SV-2026-04567)';
        }

        return e;
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);

        const feedbackData = {
            ...form,
            customerId: user.id,
            customerEmail: user.email,
            rating: form.type === 'Feedback' ? form.rating : null,
        };

        try {
            const ticketId = await addFeedback(feedbackData);
            setDone(ticketId);
        } catch (err) {
            console.error('Submit error:', err);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    // Success Screen
    if (done) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
                <div style={{ fontSize: '72px', marginBottom: '20px' }}>✅</div>
                <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Submission Received!</h1>
                <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
                    Your {form.type.toLowerCase()} has been submitted successfully.<br />
                    Ticket ID: <strong>{done}</strong>
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate(`/feedback/${done}`)}
                    >
                        View Ticket
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/feedback')}>
                        All Submissions
                    </button>
                </div>
            </div>
        );
    }

    // Form Screen
    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/feedback')}>← Back</button>
                <div>
                    <div className="page-title">New Submission</div>
                    <div className="page-subtitle">Submit an inquiry, feedback, or complaint</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '720px' }}>
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 className="section-title">Customer & Vehicle Information</h3>

                    <div className="form-group">
                        <label className="form-label">Customer Name *</label>
                        <input 
                            name="customerName" 
                            className={`form-input ${errors.customerName ? 'input-error' : ''}`} 
                            value={form.customerName} 
                            onChange={handleChange} 
                        />
                        {errors.customerName && <div className="form-error">{errors.customerName}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Vehicle ID / Chassis No. *</label>
                        <input 
                            name="vehicleId" 
                            className={`form-input ${errors.vehicleId ? 'input-error' : ''}`} 
                            placeholder="e.g. ABC123456 or MH04AB1234" 
                            value={form.vehicleId} 
                            onChange={handleChange} 
                        />
                        {errors.vehicleId && <div className="form-error">{errors.vehicleId}</div>}
                        <div className="form-hint">Alphanumeric, minimum 5 characters</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sales Voucher ID *</label>
                        <input 
                            name="salesVoucherId" 
                            className={`form-input ${errors.salesVoucherId ? 'input-error' : ''}`} 
                            placeholder="e.g. SV-2026-04567" 
                            value={form.salesVoucherId} 
                            onChange={handleChange} 
                        />
                        {errors.salesVoucherId && <div className="form-error">{errors.salesVoucherId}</div>}
                        <div className="form-hint">Format: SV-YYYY-XXXXX (Example: SV-2026-04567)</div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 className="section-title">Submission Details</h3>

                    <div className="form-group">
                        <label className="form-label">Type *</label>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {['Inquiry', 'Feedback', 'Complaint'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, type: t }))}
                                    className={`btn ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.type === 'Feedback' && (
                        <div className="form-group">
                            <label className="form-label">Rating *</label>
                            <div style={{ fontSize: '32px', cursor: 'pointer' }}>
                                {[1,2,3,4,5].map(n => (
                                    <span 
                                        key={n} 
                                        onClick={() => setForm(p => ({ ...p, rating: n }))} 
                                        style={{ 
                                            color: n <= form.rating ? '#eab308' : '#d1d5db', 
                                            marginRight: '6px' 
                                        }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <input 
                            name="subject" 
                            className={`form-input ${errors.subject ? 'input-error' : ''}`} 
                            placeholder="Brief subject..." 
                            value={form.subject} 
                            onChange={handleChange} 
                        />
                        {errors.subject && <div className="form-error">{errors.subject}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description * ({form.description.length}/2000)</label>
                        <textarea 
                            name="description" 
                            className={`form-textarea ${errors.description ? 'input-error' : ''}`} 
                            placeholder="Detailed description..." 
                            value={form.description} 
                            onChange={handleChange} 
                            rows={7} 
                            maxLength={2000}
                        />
                        {errors.description && <div className="form-error">{errors.description}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select 
                            name="priority" 
                            className="form-select" 
                            value={form.priority} 
                            onChange={handleChange}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg" 
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : `Submit ${form.type}`}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-secondary btn-lg" 
                        onClick={() => navigate('/feedback')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}