import { useNavigate } from 'react-router-dom';
import { usePromotions } from '../../context/PromotionContext';
import { useAuth } from '../../context/AuthContext';

export default function PromotionsPage() {
    const { promotions, deletePromotion, updatePromotion } = usePromotions();
    const { user } = useAuth();
    const navigate = useNavigate();
    const canEdit = user.role === 'admin' || user.role === 'staff';

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div className="page-title">Promotions Management</div>
                    <div className="page-subtitle">Special offers and discount campaigns • Colombo</div>
                </div>
                {canEdit && (
                    <button className="btn btn-primary" onClick={() => navigate('/promotions/add')}>
                        + Create New Promotion
                    </button>
                )}
            </div>

            {promotions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon" style={{ fontSize: '60px' }}>🎉</div>
                    <div className="empty-title">No promotions yet</div>
                    <div className="empty-desc">Create your first promotional offer</div>
                    {canEdit && (
                        <button className="btn btn-primary" onClick={() => navigate('/promotions/add')}>
                            Create First Promotion
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
                    gap: '28px' 
                }}>
                    {promotions.map(p => {
                        const isActive = p.active && new Date(p.endDate) >= new Date();
                        return (
                            <div 
                                key={p.id} 
                                className="card" 
                                style={{ 
                                    overflow: 'hidden', 
                                    borderTop: `4px solid ${isActive ? 'var(--accent-red)' : 'var(--border)'}`
                                }}
                            >
                                {/* Promotion Poster */}
                                {p.imageUrl && (
                                    <div style={{ height: '200px', overflow: 'hidden', background: '#f8f9fa' }}>
                                        <img 
                                            src={p.imageUrl} 
                                            alt={p.title}
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease'
                                            }}
                                            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                                            onMouseOut={e => e.target.style.transform = 'scale(1)'}
                                        />
                                    </div>
                                )}

                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ 
                                                fontSize: '38px', 
                                                fontWeight: '900', 
                                                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                                                lineHeight: '1'
                                            }}>
                                                {p.discount}% OFF
                                            </div>
                                        </div>
                                        <span className={`badge ${isActive ? 'badge-green' : 'badge-gray'}`}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{p.title}</h3>
                                    
                                    <p style={{ 
                                        color: 'var(--text-secondary)', 
                                        fontSize: '14px', 
                                        lineHeight: '1.6',
                                        marginBottom: '20px',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '3',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {p.description}
                                    </p>

                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.7' }}>
                                        <div><strong>Period:</strong> {new Date(p.startDate).toLocaleDateString('en-LK')} — {new Date(p.endDate).toLocaleDateString('en-LK')}</div>
                                        {p.applicableModels?.length > 0 && (
                                            <div><strong>Models:</strong> {p.applicableModels.join(', ')}</div>
                                        )}
                                        <div>Created by {p.createdBy}</div>
                                    </div>

                                    {canEdit && (
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <button 
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => updatePromotion(p.id, { active: !p.active })}
                                            >
                                                {p.active ? '⏸ Deactivate' : '▶ Activate'}
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-blue"
                                                onClick={() => navigate(`/promotions/edit/${p.id}`)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this promotion?')) {
                                                        deletePromotion(p.id);
                                                    }
                                                }}
                                            >
                                                 Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}