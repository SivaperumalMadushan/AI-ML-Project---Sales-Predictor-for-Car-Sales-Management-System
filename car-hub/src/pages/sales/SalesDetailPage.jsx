import { useParams, useNavigate } from 'react-router-dom';
import { useSales } from '../../context/SalesContext';
import './sales.css';

const fmt = n => `Rs. ${Number(n).toLocaleString('en-LK')}`;

export default function SalesDetailPage() {
    const { id } = useParams();
    const { getSaleById } = useSales();
    const navigate = useNavigate();
    const sale = getSaleById(id);

    if (!sale) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#e94560' }}>Sale Not Found</div>
                    <p>The record <strong>{id}</strong> does not exist.</p>
                    <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/sales')}>
                        ← Back to Sales
                    </button>
                </div>
            </div>
        );
    }

    const margin = sale.sellingPrice ? ((sale.profit / sale.sellingPrice) * 100).toFixed(1) : '0';

    return (
        <div className="page-container">
            <div className="sales-header">
                <div>
                    <div className="sales-title">📄 Sale Record — <span style={{ color: 'var(--accent-red)' }}>{sale.saleId || sale.id}</span></div>
                    <div className="sales-subtitle">Viewing full details of this sales entry</div>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/sales')}>← Back to Sales</button>
            </div>

            <div className="detail-card">
                {/* Status banner */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: sale.status === 'Completed' ? 'rgba(46,213,115,0.08)' : 'rgba(79,142,247,0.08)',
                    border: `1px solid ${sale.status === 'Completed' ? 'rgba(46,213,115,0.25)' : 'rgba(79,142,247,0.25)'}`,
                    borderRadius: '12px', padding: '14px 18px', marginBottom: '20px'
                }}>
                    <span style={{ fontSize: '24px' }}>{sale.status === 'Completed' ? '✅' : '📅'}</span>
                    <div>
                        <div style={{ fontWeight: '700' }}>{sale.status}</div>
                        <div style={{ fontSize: '13px' }}>
                            Sale Date: {new Date(sale.saleDate).toLocaleDateString('en-LK')}
                        </div>
                    </div>
                </div>

                <div className="detail-section-title">Vehicle Information</div>
                <div className="detail-grid">
                    <div className="detail-field">
                        <span className="detail-field-label">Sale ID</span>
                        <span className="detail-field-value red">{sale.saleId || sale.id}</span>
                    </div>
                    <div className="detail-field">
                        <span className="detail-field-label">Vehicle ID / Ref</span>
                        <span className="detail-field-value">{sale.vehicleId}</span>
                    </div>
                    {/* ... other fields same as before ... */}
                </div>

                {/* Keep the rest of your detail page as it was */}
                {/* Financial, Date sections, Actions buttons etc. */}
            </div>
        </div>
    );
}