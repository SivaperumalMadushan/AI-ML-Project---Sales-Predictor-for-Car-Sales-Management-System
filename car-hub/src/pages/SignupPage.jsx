import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

const SRI_LANKAN_CITIES = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Ratnapura', 'Kurunegala', 'Kalmunai', 'Badulla', 'Matara', 'Hambantota', 'Vavuniya', 'Mannar', 'Kilinochchi', 'Mullaitivu', 'Puttalam'];

export default function SignupPage() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', surname: '', email: '', password: '', confirmPassword: '', role: 'customer', phone: '+94', gender: '', dob: '', city: '' });
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    function validate() {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'First name is required';
        if (!form.surname.trim()) e.surname = 'Surname is required';
        if (!form.email.includes('@')) e.email = 'Email must include @';
        else if (!form.email.endsWith('.com')) e.email = 'Email must end with .com';
        if (!form.password) e.password = 'Password required';
        else if (!/^[A-Z]/.test(form.password)) e.password = 'Must start with uppercase';
        else if (form.password.length < 8) e.password = 'Minimum 8 characters';
        else if (!/\d/.test(form.password)) e.password = 'Must include a number';
        else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = 'Must include a symbol';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        if (!form.phone.startsWith('+94')) e.phone = 'Must start with +94';
        else if (!/^\d{9}$/.test(form.phone.replace('+94', ''))) e.phone = '9 digits required after +94';
        if (!form.gender) e.gender = 'Please select gender';
        if (!form.dob) e.dob = 'Date of birth is required';
        else { const age = (new Date() - new Date(form.dob)) / (1000 * 60 * 60 * 24 * 365.25); if (age < 16) e.dob = 'Must be at least 16 years old'; }
        if (!form.city) e.city = 'Please select your city';
        return e;
    }

    function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: '' })); }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        const err = await signup(form);  // ← FIXED: added await
        setLoading(false);
        if (err) { setGlobalError(err); return; }
        navigate('/dashboard');
    }

    return (
        <div className="auth-page">
            <div className="auth-bg"><div className="auth-blob auth-blob-1"></div><div className="auth-blob auth-blob-2"></div></div>
            <div className="auth-container">
                <div className="auth-brand" onClick={() => navigate('/')}> <span>Car</span>Hub</div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Car Hub and explore Sri Lanka's finest vehicles</p>
                {globalError && <div className="alert alert-error"> {globalError}</div>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input name="fullName" className={`form-input ${errors.fullName ? 'input-error' : ''}`} placeholder="John" value={form.fullName} onChange={handleChange} />
                            {errors.fullName && <div className="form-error"> {errors.fullName}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Surname *</label>
                            <input name="surname" className={`form-input ${errors.surname ? 'input-error' : ''}`} placeholder="Silva" value={form.surname} onChange={handleChange} />
                            {errors.surname && <div className="form-error"> {errors.surname}</div>}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input name="email" type="email" className={`form-input ${errors.email ? 'input-error' : ''}`} placeholder="john@example.com" value={form.email} onChange={handleChange} />
                        {errors.email && <div className="form-error"> {errors.email}</div>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <div className="input-wrapper">
                            <input name="password" type={showPw ? 'text' : 'password'} className={`form-input ${errors.password ? 'input-error' : ''}`} placeholder="Min 8 chars, uppercase, number, symbol" value={form.password} onChange={handleChange} />
                            <button type="button" className="input-toggle" onClick={() => setShowPw(p => !p)}></button>
                        </div>
                        {errors.password && <div className="form-error">⚠ {errors.password}</div>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password *</label>
                        <input name="confirmPassword" type={showPw ? 'text' : 'password'} className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} />
                        {errors.confirmPassword && <div className="form-error">⚠ {errors.confirmPassword}</div>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone *</label>
                        <input name="phone" className={`form-input ${errors.phone ? 'input-error' : ''}`} placeholder="+94XXXXXXXXX" value={form.phone} onChange={handleChange} />
                        {errors.phone && <div className="form-error">⚠ {errors.phone}</div>}
                        <div className="form-hint">Format: +94 followed by 9 digits</div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Gender *</label>
                            <select name="gender" className={`form-select ${errors.gender ? 'input-error' : ''}`} value={form.gender} onChange={handleChange}>
                                <option value="">Select Gender</option>
                                <option>Male</option><option>Female</option><option>Other</option>
                            </select>
                            {errors.gender && <div className="form-error">⚠ {errors.gender}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth *</label>
                            <input name="dob" type="date" className={`form-input ${errors.dob ? 'input-error' : ''}`} value={form.dob} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
                            {errors.dob && <div className="form-error">⚠ {errors.dob}</div>}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">City *</label>
                            <select name="city" className={`form-select ${errors.city ? 'input-error' : ''}`} value={form.city} onChange={handleChange}>
                                <option value="">Select City</option>
                                {SRI_LANKAN_CITIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            {errors.city && <div className="form-error">⚠ {errors.city}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                                <option value="customer">Customer</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
                </form>
                <p className="auth-link">Already have an account? <span onClick={() => navigate('/login')}>Sign in</span></p>
                <p className="auth-link"><span onClick={() => navigate('/')}>← Back to Home</span></p>
            </div>
        </div>
    );
}