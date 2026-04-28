import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SRI_LANKAN_CITIES = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Ratnapura', 'Kurunegala', 'Kalmunai', 'Badulla', 'Matara', 'Hambantota', 'Vavuniya', 'Mannar', 'Kilinochchi', 'Mullaitivu', 'Puttalam'];

export default function UserProfile() {
    const { user, updateProfile, deleteAccount, validatePhone } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ fullName: user.fullName || '', surname: user.surname || '', phone: user.phone || '', city: user.city || '', gender: user.gender || '' });
    const [errors, setErrors] = useState({});
    const [showDelete, setShowDelete] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleting, setDeleting] = useState(false);

    function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: '' })); }

    function handleSave() {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Required';
        if (!form.surname.trim()) e.surname = 'Required';
        const phoneErr = validatePhone(form.phone);
        if (phoneErr) e.phone = phoneErr;
        if (!form.city) e.city = 'Required';
        if (Object.keys(e).length) { setErrors(e); return; }
        updateProfile({ ...form, name: form.fullName + ' ' + form.surname });
        setEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
    }

    async function handleDelete() {
        setDeleting(true);
        setDeleteError('');
        const err = await deleteAccount();
        setDeleting(false);
        if (err) {
            setDeleteError(err);
            return;
        }
        navigate('/');
    }

    function openDeleteModal() {
        setDeleteConfirmText('');
        setDeleteError('');
        setShowDelete(true);
    }

    const roleLabels = { admin: 'Administrator', staff: 'Staff Member', customer: 'Customer' };
    const roleColors = { admin: '#f87171', staff: '#34d399', customer: '#a78bfa' };
    const roleBg = { admin: 'rgba(248,113,113,0.12)', staff: 'rgba(52,211,153,0.12)', customer: 'rgba(167,139,250,0.12)' };

    return (
        <div className="page-container">

            <div style={{ marginBottom: '32px' }}>
                <div className="page-title">My Profile</div>
                <div className="page-subtitle">View and manage your personal information</div>
            </div>

            {success && (
                <div className="alert alert-success" style={{ maxWidth: '900px', marginBottom: '24px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', maxWidth: '960px' }}>

                {/* ── Left Panel ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Avatar Card */}
                    <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                        <div style={{ position: 'relative', width: '88px', margin: '0 auto 20px' }}>
                            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: `linear-gradient(135deg, ${roleColors[user.role]}, ${roleColors[user.role]}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', fontWeight: '900', color: '#fff', border: `3px solid ${roleColors[user.role]}44` }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '16px', height: '16px', background: '#34d399', borderRadius: '50%', border: '2px solid var(--bg-card)' }} />
                        </div>

                        <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '6px', color: 'var(--text-primary)' }}>{user.name}</div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: roleBg[user.role], color: roleColors[user.role], padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {roleLabels[user.role]}
                        </div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>{user.email}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.phone}</div>

                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Member since {new Date(user.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long' })}
                        </div>
                    </div>

                    {/* Action Buttons Card */}
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {!editing && (
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                                onClick={() => setEditing(true)}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit Profile
                            </button>
                        )}
                        <button
                            onClick={openDeleteModal}
                            style={{ width: '100%', padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '600', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'var(--transition)', fontFamily: 'var(--font)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                            Delete Account
                        </button>
                    </div>

                    {/* Danger Zone Info */}
                    <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#f87171', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠ Danger Zone</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>Deleting your account is permanent. All bookings, inquiries and data will be removed and cannot be recovered.</div>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 className="section-title" style={{ margin: 0 }}>Personal Information</h3>
                        {!editing && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                Click Edit Profile to make changes
                            </span>
                        )}
                    </div>

                    {editing ? (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input name="fullName" className={`form-input ${errors.fullName ? 'input-error' : ''}`} value={form.fullName} onChange={handleChange} />
                                    {errors.fullName && <div className="form-error">⚠ {errors.fullName}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Surname *</label>
                                    <input name="surname" className={`form-input ${errors.surname ? 'input-error' : ''}`} value={form.surname} onChange={handleChange} />
                                    {errors.surname && <div className="form-error">⚠ {errors.surname}</div>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone *</label>
                                <input name="phone" className={`form-input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={handleChange} />
                                {errors.phone && <div className="form-error">⚠ {errors.phone}</div>}
                                <div className="form-hint">Format: +94 followed by 9 digits</div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <select name="city" className={`form-select ${errors.city ? 'input-error' : ''}`} value={form.city} onChange={handleChange}>
                                        <option value="">Select City</option>
                                        {SRI_LANKAN_CITIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                    {errors.city && <div className="form-error">⚠ {errors.city}</div>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button className="btn btn-primary" onClick={handleSave}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                    Save Changes
                                </button>
                                <button className="btn btn-secondary" onClick={() => { setEditing(false); setErrors({}); }}>Cancel</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'First Name', value: user.fullName },
                                { label: 'Surname', value: user.surname },
                                { label: 'Email Address', value: user.email },
                                { label: 'Phone Number', value: user.phone },
                                { label: 'Gender', value: user.gender },
                                { label: 'City', value: user.city },
                                { label: 'Date of Birth', value: user.dob ? new Date(user.dob).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                                { label: 'Account Role', value: roleLabels[user.role] },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>{label}</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value || '—'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Confirmation Modal ── */}
            {showDelete && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '440px' }}>

                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 20px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>

                        <div className="modal-title" style={{ color: '#f87171' }}>Delete Account</div>
                        <div className="modal-subtitle">This action is <strong>permanent and irreversible</strong>. All your bookings, inquiries, and personal data will be permanently deleted.</div>

                        {/* Error message */}
                        {deleteError && (
                            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: '14px', fontSize: '13px', color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                {deleteError}
                            </div>
                        )}

                        {/* Confirm input */}
                        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                To confirm, type <strong style={{ color: '#f87171' }}>DELETE</strong> in the box below:
                            </div>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type DELETE to confirm"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                style={{ borderColor: deleteConfirmText === 'DELETE' ? '#f87171' : undefined }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setShowDelete(false); setDeleteConfirmText(''); setDeleteError(''); }}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== 'DELETE' || deleting}
                                style={{ opacity: deleteConfirmText !== 'DELETE' ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {deleting ? (
                                    <>
                                        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                                        </svg>
                                        Yes, Delete My Account
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}