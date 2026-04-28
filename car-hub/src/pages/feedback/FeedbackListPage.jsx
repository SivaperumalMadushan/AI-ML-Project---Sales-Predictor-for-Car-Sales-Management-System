import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../../context/FeedbackContext';
import { useAuth } from '../../context/AuthContext';

function FStatusBadge({ s }) {
    const m = { 
        Pending: 'badge-yellow', 
        Assigned: 'badge-blue', 
        'In Progress': 'badge-orange', 
        Resolved: 'badge-green', 
        Closed: 'badge-gray' 
    };
    return <span className={`badge ${m[s] || 'badge-gray'}`}>{s}</span>;
}

function TypeBadge({ t }) {
    const m = { Inquiry: 'badge-blue', Feedback: 'badge-green', Complaint: 'badge-red' };
    return <span className={`badge ${m[t] || 'badge-gray'}`}>{t}</span>;
}

export default function FeedbackListPage() {
    const { user } = useAuth();
    const { feedbacks } = useFeedback();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');

    const isStaff = user.role === 'admin' || user.role === 'staff';
    
    // Show only user's own feedbacks for customers
    const list = isStaff 
        ? feedbacks 
        : feedbacks.filter(f => f.customerId === user.id);

    const filtered = list.filter(f => {
        const q = search.toLowerCase();
        const matchSearch = !search || 
            f.id?.toLowerCase().includes(q) ||
            f.subject?.toLowerCase().includes(q) ||
            f.customerName?.toLowerCase().includes(q) ||
            f.vehicleId?.toLowerCase().includes(q) ||
            f.salesVoucherId?.toLowerCase().includes(q);

        const matchStatus = filterStatus === 'All' || f.status === filterStatus;
        const matchType = filterType === 'All' || f.type === filterType;

        return matchSearch && matchStatus && matchType;
    }).sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
    });

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div className="page-title">Feedback & Inquiries</div>
                    <div className="page-subtitle">
                        {filtered.length} {isStaff ? 'total submissions' : 'of my submissions'}
                    </div>
                </div>

                {/* Show New Submission button ONLY for customers (not staff) */}
                {!isStaff && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/feedback/new')}
                    >
                        + New Submission
                    </button>
                )}
            </div>

            <div className="filter-bar">
                <input
                    className="form-input search-input"
                    placeholder="Search by ID, subject, customer, vehicle ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    {['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="All">All Types</option>
                    <option>Inquiry</option>
                    <option>Feedback</option>
                    <option>Complaint</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-title">No submissions found</div>
                    {!isStaff && (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigate('/feedback/new')}
                        >
                            + New Submission
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                {isStaff && <th>Customer</th>}
                                <th>Subject</th>
                                <th>Type</th>
                                <th>Status</th>
                                {isStaff && <th>Vehicle ID</th>}
                                {isStaff && <th>Sales Voucher</th>}
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(f => (
                                <tr key={f.id}>
                                    <td><code style={{ color: 'var(--accent-blue)' }}>{f.id}</code></td>
                                    {isStaff && <td>{f.customerName}</td>}
                                    <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {f.subject}
                                    </td>
                                    <td><TypeBadge t={f.type} /></td>
                                    <td><FStatusBadge s={f.status} /></td>
                                    {isStaff && <td style={{ fontFamily: 'monospace' }}>{f.vehicleId || '—'}</td>}
                                    {isStaff && <td style={{ fontFamily: 'monospace' }}>{f.salesVoucherId || '—'}</td>}
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {new Date(f.createdAt?.seconds * 1000 || f.createdAt).toLocaleDateString('en-LK')}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-sm btn-secondary" 
                                            onClick={() => navigate(`/feedback/${f.id}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}