import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
        setLoading(true);
        const err = await login(form.email, form.password);
        setLoading(false);
        if (err) { setError(err); return; }
        navigate('/dashboard');
    }

    return (
        <div className="login-split">
            {/* Left Panel */}
            <div className="login-panel-left">
                <div className="login-panel-overlay" />
                <div className="login-panel-content">
                    <div className="login-brand-mark" onClick={() => navigate('/')}>
                        <div className="login-brand-icon">CH</div>
                        <span className="login-brand-name">Car<strong>Hub</strong></span>
                    </div>
                    <div className="login-panel-tagline">
                        <h2>Sri Lanka's Premier<br />Car Sales Platform</h2>
                        <p>Manage inventory, bookings, and customer inquiries — all in one place.</p>
                    </div>
                    <div className="login-panel-stats">
                        <div className="lp-stat"><div className="lp-stat-val">2,400+</div><div className="lp-stat-label">Vehicles Listed</div></div>
                        <div className="lp-stat"><div className="lp-stat-val">1,800+</div><div className="lp-stat-label">Happy Customers</div></div>
                        <div className="lp-stat"><div className="lp-stat-val">8+</div><div className="lp-stat-label">Branches</div></div>
                    </div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="login-panel-right">
                <div className="login-form-wrap">
                    <button className="login-back-btn" onClick={() => navigate('/')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M5 12l7-7M5 12l7 7" /></svg>
                        Back to Home
                    </button>

                    <div className="login-form-header">
                        <h1 className="login-form-title">Sign in</h1>
                        <p className="login-form-sub">Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <div className="login-error-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form" noValidate>
                        <div className="lf-group">
                            <label className="lf-label">Email Address</label>
                            <div className="lf-input-wrap">
                                <svg className="lf-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                <input
                                    name="email"
                                    type="email"
                                    className="lf-input"
                                    placeholder="yourname@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="lf-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="lf-label">Password</label>
                            </div>
                            <div className="lf-input-wrap">
                                <svg className="lf-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                <input
                                    name="password"
                                    type={showPw ? 'text' : 'password'}
                                    className="lf-input lf-input-pw"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                <button type="button" className="lf-eye" onClick={() => setShowPw(p => !p)} aria-label="Toggle password">
                                    {showPw ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="lf-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="lf-spinner" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p className="lf-bottom">
                        Don't have an account?{' '}
                        <span onClick={() => navigate('/signup')}>Create one</span>
                    </p>
                </div>
            </div>
        </div>
    );
}