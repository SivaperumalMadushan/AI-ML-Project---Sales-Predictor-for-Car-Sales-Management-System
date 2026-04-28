import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCars } from '../../context/CarContext';
import { useAuth } from '../../context/AuthContext';

function formatLKR(p) { 
    return p ? 'LKR ' + Number(p).toLocaleString('en-LK') : 'N/A'; 
}

function StockBadge({ quantity, status }) {
    if (status === 'sold') return <span className="badge badge-red">Sold</span>;
    if (quantity === 0) return <span className="badge badge-red">Out of Stock</span>;
    if (quantity < 2) return <span className="badge badge-yellow">Low Stock ({quantity})</span>;
    return <span className="badge badge-green">In Stock ({quantity})</span>;
}

const TYPES = ['All', 'Sedan', 'SUV', 'Hatchback', 'Hybrid', 'Electric', 'Luxury'];

export default function InventoryPage() {
    const { cars } = useCars();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [view, setView] = useState('grid');

    const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

    // Filter logic
    const filtered = cars.filter(c => {
        if (!isStaffOrAdmin && (c.status === 'sold' || c.quantity === 0)) return false;

        const q = search.toLowerCase();
        const matchSearch = !search || 
            c.brand?.toLowerCase().includes(q) || 
            c.model?.toLowerCase().includes(q);

        const matchType = filterType === 'All' || c.type === filterType;

        return matchSearch && matchType;
    });

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div className="page-title">Car Inventory - Colombo</div>
                    <div className="page-subtitle">{filtered.length} vehicles found</div>
                </div>
                {isStaffOrAdmin && <button className="btn btn-primary" onClick={() => navigate('/inventory/add')}>+ Add Car</button>}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <input 
                    className="form-input search-input" 
                    placeholder="Search by brand or model..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
                
                <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>

                <div className="tabs" style={{ marginBottom: 0 }}>
                    <button className={`tab-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>Grid</button>
                    <button className={`tab-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
                </div>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon" style={{ fontSize: '40px', opacity: 0.3 }}>—</div>
                    <div className="empty-title">No cars found</div>
                    <div className="empty-desc">Try adjusting your search or filters</div>
                </div>
            )}

            {/* Grid View */}
            {view === 'grid' && filtered.length > 0 && (
                <div className="cars-grid">
                    {filtered.map(car => (
                        <div key={car.id} className="car-card">
                            <div className="car-card-img" onClick={() => navigate(`/inventory/${car.id}`)} style={{ cursor: 'pointer' }}>
                                <img src={car.image} alt={`${car.brand} ${car.model}`} onError={e => { e.target.style.display = 'none'; }} />
                                <div className="car-card-type">{car.type}</div>
                            </div>
                            <div className="car-card-body">
                                <div>
                                    <div className="car-card-brand">{car.brand}</div>
                                    <div className="car-card-model">{car.model} {car.year}</div>
                                </div>
                                <div className="car-card-price">{formatLKR(car.price)}</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <StockBadge quantity={car.quantity} status={car.status} />
                                </div>

                                {isStaffOrAdmin && (
                                    <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '8px' }}>
                                        Landed: {formatLKR(car.landedCost)}
                                    </div>
                                )}

                                <button 
                                    className="btn btn-primary btn-sm" 
                                    style={{ width: '100%', justifyContent: 'center' }} 
                                    onClick={() => navigate(`/inventory/${car.id}`)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {view === 'list' && filtered.length > 0 && (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Brand & Model</th>
                                <th>Year</th>
                                <th>Type</th>
                                <th>Fuel Type</th>
                                <th>Engine Capacity</th>
                                <th>Price (LKR)</th>
                                <th>Stock</th>
                                {isStaffOrAdmin && <th>Landed Cost</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(car => (
                                <tr key={car.id}>
                                    <td><code style={{ fontSize: '12px' }}>{car.id}</code></td>
                                    <td><strong>{car.brand}</strong> {car.model}</td>
                                    <td>{car.year}</td>
                                    <td><span className="badge badge-gray">{car.type}</span></td>
                                    <td>{car.fuelType}</td>
                                    <td>{car.engineCapacity ? `${car.engineCapacity} ${car.fuelType === 'Electric' || car.fuelType === 'e-SMART' ? 'kW' : 'CC'}` : '-'}</td>
                                    <td style={{ color: 'var(--accent-red)', fontWeight: '700' }}>{formatLKR(car.price)}</td>
                                    <td><StockBadge quantity={car.quantity} status={car.status} /></td>
                                    {isStaffOrAdmin && (
                                        <td style={{ color: '#16a34a' }}>{formatLKR(car.landedCost)}</td>
                                    )}
                                    <td>
                                        <button className="btn btn-sm btn-primary" onClick={() => navigate(`/inventory/${car.id}`)}>
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