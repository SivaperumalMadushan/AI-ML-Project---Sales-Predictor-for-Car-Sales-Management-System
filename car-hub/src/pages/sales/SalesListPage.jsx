import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '../../context/SalesContext';
import { useAuth } from '../../context/AuthContext';
import './sales.css';

const fmt = n => `Rs. ${Number(n).toLocaleString('en-LK')}`;

export default function SalesListPage() {
    const { sales, deleteSale } = useSales();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const brands = [...new Set(sales.map(s => s.brand))].sort();
    const types = [...new Set(sales.map(s => s.vehicleType))].sort();

    const filtered = useMemo(() => {
        return sales.filter(s => {
            const q = search.toLowerCase();
            if (q && !s.model.toLowerCase().includes(q) && !s.brand.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q) && !s.vehicleId.toLowerCase().includes(q)) return false;
            if (filterType && s.vehicleType !== filterType) return false;
            if (filterStatus && s.status !== filterStatus) return false;
            if (filterBrand && s.brand !== filterBrand) return false;
            if (dateFrom && s.saleDate < dateFrom) return false;
            if (dateTo && s.saleDate > dateTo) return false;
            return true;
        });
    }, [sales, search, filterType, filterStatus, filterBrand, dateFrom, dateTo]);

    const totalRevenue = filtered.reduce((s, r) => s + Number(r.sellingPrice), 0);
    const totalProfit = filtered.reduce((s, r) => s + Number(r.profit), 0);
    const totalSold = filtered.filter(r => r.status === 'Completed').length;

    function handleDelete(id) {
        deleteSale(id);
        setConfirmDelete(null);
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="sales-header">
                <div>
                    <div className="sales-title">Sales Records</div>
                    <div className="sales-subtitle">{filtered.length} records found</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/sales/new')}>
                        + New Sale
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
                        View Reports
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="sales-stats-row">
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}></div>
                    <div>
                        <div className="sales-stat-value">{filtered.length}</div>
                        <div className="sales-stat-label">Total Records</div>
                    </div>
                </div>
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}></div>
                    <div>
                        <div className="sales-stat-value">{totalSold}</div>
                        <div className="sales-stat-label">Vehicles Sold</div>
                    </div>
                </div>
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(251,191,36,0.12)' }}></div>
                    <div>
                        <div className="sales-stat-value" style={{ fontSize: '14px' }}>{fmt(totalRevenue)}</div>
                        <div className="sales-stat-label">Total Revenue</div>
                    </div>
                </div>
                <div className="sales-stat-card">
                    <div className="sales-stat-icon" style={{ background: 'rgba(52,211,153,0.12)' }}></div>
                    <div>
                        <div className="sales-stat-value" style={{ fontSize: '14px', color: '#2ed573' }}>{fmt(totalProfit)}</div>
                        <div className="sales-stat-label">Total Profit</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="sales-filter-bar">
                <div className="sales-filter-group" style={{ flex: 2 }}>
                    <label>Search</label>
                    <input placeholder="Search by ID, model, brand…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="sales-filter-group">
                    <label>Brand</label>
                    <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                        <option value="">All Brands</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div className="sales-filter-group">
                    <label>Vehicle Type</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">All Types</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="sales-filter-group">
                    <label>Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option>Completed</option>
                        <option>Booking</option>
                    </select>
                </div>
                <div className="sales-filter-group">
                    <label>From Date</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="sales-filter-group">
                    <label>To Date</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterBrand(''); setFilterType(''); setFilterStatus(''); setDateFrom(''); setDateTo(''); }}>
                    Clear
                </button>
            </div>

            {/* Table */}
            <div className="sales-table-wrap">
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>Sale ID</th>
                            <th>Vehicle</th>
                            <th>Brand</th>
                            <th>Year</th>
                            <th>Type</th>
                            <th>Fuel</th>
                            <th>Selling Price</th>
                            <th>Profit</th>
                            <th>Sale Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No records found
                                </td>
                            </tr>
                        ) : filtered.map(s => (
                            <tr key={s.id}>
                                <td><span className="sale-id">{s.id}</span></td>
                                <td style={{ fontWeight: 600 }}>{s.model}</td>
                                <td>{s.brand}</td>
                                <td>{s.year}</td>
                                <td>{s.vehicleType}</td>
                                <td>{s.fuelType}</td>
                                <td>{fmt(s.sellingPrice)}</td>
                                <td><span className="profit-cell">{fmt(s.profit)}</span></td>
                                <td>{new Date(s.saleDate).toLocaleDateString('en-LK')}</td>
                                <td>
                                    <span className={`status-badge ${s.status === 'Completed' ? 'status-completed' : 'status-booking'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions" style={{ justifyContent: 'center' }}>
                                        <button className="action-icon-btn action-view" title="View" onClick={() => navigate(`/sales/${s.id}`)}>View</button>
                                        <button className="action-icon-btn action-edit" title="Edit" onClick={() => navigate(`/sales/edit/${s.id}`)}>Edit</button>
                                        <button className="action-icon-btn action-delete" title="Delete" onClick={() => setConfirmDelete(s)}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--accent-red)', opacity: 0.6 }}>!</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Sale Record?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--accent-red)' }}>{confirmDelete.id}</strong> ({confirmDelete.brand} {confirmDelete.model})? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
