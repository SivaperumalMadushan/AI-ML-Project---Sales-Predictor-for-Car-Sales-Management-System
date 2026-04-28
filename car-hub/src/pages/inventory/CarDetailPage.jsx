import { useNavigate, useParams } from 'react-router-dom';
import { useCars } from '../../context/CarContext';
import { useAuth } from '../../context/AuthContext';

function formatLKR(p) { 
    return p ? 'LKR ' + Number(p).toLocaleString('en-LK') : 'N/A'; 
}

export default function CarDetailPage() {
    const { id } = useParams();
    const { getCarById, deleteCar, updateCar } = useCars();
    const { user } = useAuth();
    const navigate = useNavigate();

    const car = getCarById(id);

    if (!car) return (
        <div className="page-container">
            <div className="empty-state">
                <div className="empty-icon">🚗</div>
                <div className="empty-title">Car not found</div>
                <button className="btn btn-primary" onClick={() => navigate('/inventory')}>Back to Inventory</button>
            </div>
        </div>
    );

    const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
    const isCustomer = user?.role === 'customer' || !user;
    const isAvail = car.status === 'available' && car.quantity > 0;

    function handleDelete() {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            deleteCar(id);
            navigate('/inventory');
        }
    }

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory')}>← Back</button>
                <div>
                    <div className="page-title">{car.brand} {car.model} {car.year}</div>
                    <div className="page-subtitle">Vehicle ID: {car.id} • Colombo</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', maxWidth: '1100px' }}>
                {/* Left Side - Image & Price */}
                <div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
                        <div style={{ height: '320px', background: 'var(--bg-secondary)', position: 'relative' }}>
                            {car.image ? (
                                <img 
                                    src={car.image} 
                                    alt={`${car.brand} ${car.model}`} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { e.target.style.display = 'none'; }} 
                                />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', opacity: 0.2 }}>
                                    🚗
                                </div>
                            )}
                            <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                                <span className="badge badge-gray">{car.type}</span>
                            </div>
                            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                                {isAvail ? <span className="badge badge-green">✓ Available</span> : <span className="badge badge-red">Unavailable</span>}
                            </div>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-red)', marginBottom: '8px' }}>
                                {formatLKR(car.price)}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{car.description}</p>
                        </div>
                    </div>

                    {/* Customer Action Buttons */}
                    {isCustomer && isAvail && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/bookings/new?vehicleId=${car.id}&type=Test+Drive`)}>
                                Book Test Drive
                            </button>
                            <button className="btn btn-blue btn-lg" onClick={() => navigate(`/bookings/new?vehicleId=${car.id}&type=Reservation`)}>
                                Reserve Vehicle
                            </button>
                        </div>
                    )}

                    {/* Staff/Admin Actions */}
                    {isStaffOrAdmin && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                            <button className="btn btn-blue" onClick={() => navigate(`/inventory/edit/${car.id}`)}>Edit Vehicle</button>
                            {car.status !== 'sold' && (
                                <button className="btn btn-secondary" onClick={() => updateCar(id, { status: 'sold', quantity: 0 })}>
                                    Mark as Sold
                                </button>
                            )}
                            <button className="btn btn-danger" onClick={handleDelete}>Delete Vehicle</button>
                        </div>
                    )}
                </div>

                {/* Right Side: Specifications */}
                <div>
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 className="section-title">Specifications</h3>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {[
                                { label: 'Brand', value: car.brand },
                                { label: 'Model', value: car.model },
                                { label: 'Year', value: car.year },
                                { label: 'Vehicle Type', value: car.type },
                                { label: 'Fuel Type', value: car.fuelType },
                                { label: 'Engine Capacity', value: car.engineCapacity ? `${car.engineCapacity} ${car.fuelType === 'Electric' || car.fuelType === 'e-SMART' ? 'kW' : 'CC'}` : 'N/A' },
                                { label: 'Stock Quantity', value: car.quantity },
                                { label: 'Status', value: car.status === 'available' ? 'Available' : 'Sold' },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Staff Only: Cost & Tax Information */}
                    {isStaffOrAdmin && (
                        <div className="card" style={{ marginBottom: '20px', borderColor: '#ffc107' }}>
                            <h3 className="section-title" style={{ color: '#d97706' }}>Internal Cost Information</h3>
                            <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>CIF Value</span>
                                    <strong>{formatLKR(car.cifValue)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Landed Cost</span>
                                    <strong style={{ color: '#16a34a' }}>{formatLKR(car.landedCost)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Selling Price (Incl. VAT)</span>
                                    <strong>{formatLKR(car.price)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '700' }}>
                                    <span>Expected Profit (10%)</span>
                                    <span>{formatLKR((car.price || 0) - (car.landedCost || 0))}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Dealership for Customers */}
                    {isCustomer && (
                        <div className="card" style={{ background: 'var(--accent-red-dim)', borderColor: 'rgba(233,69,96,0.3)' }}>
                            <h4 style={{ marginBottom: '8px', fontSize: '15px' }}>Contact Dealership</h4>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                <div>Colombo Branch</div>
                                <div>+94 11 234 5678</div>
                                <div>info@carhub.lk</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}