import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePromotions } from '../../context/PromotionContext';
import { useAuth } from '../../context/AuthContext';

export default function AddPromotionPage() {
    const { id } = useParams();
    const { addPromotion, updatePromotion, getPromotionById } = usePromotions();
    const { user } = useAuth();
    const navigate = useNavigate();

    const isEdit = !!id;
    const existing = isEdit ? getPromotionById(id) : null;

    const [form, setForm] = useState({
        title: existing?.title || '',
        description: existing?.description || '',
        discount: existing?.discount || '',
        startDate: existing?.startDate || '',
        endDate: existing?.endDate || '',
        applicableModels: existing?.applicableModels?.join(', ') || '',
        imageUrl: existing?.imageUrl || '',
        createdBy: user?.email || '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(existing?.imageUrl || '');

    const today = new Date().toISOString().split('T')[0];

    function validate() {
        const e = {};
        if (!form.title.trim()) e.title = 'Promotion title is required';
        if (!form.description.trim()) e.description = 'Description is required';
        
        const disc = Number(form.discount);
        if (!form.discount || isNaN(disc) || disc < 2 || disc > 10) {
            e.discount = 'Discount must be between 2% and 10%';
        }

        if (!form.startDate) e.startDate = 'Start date is required';
        if (!form.endDate) e.endDate = 'End date is required';
        if (form.startDate && form.endDate && form.endDate <= form.startDate) {
            e.endDate = 'End date must be after start date';
        }

        return e;
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        
        // Live preview when image URL is entered
        if (name === 'imageUrl') {
            setImagePreview(value.trim());
        }
        
        setErrors(p => ({ ...p, [name]: '' }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setLoading(true);

        try {
            const data = {
                ...form,
                discount: Number(form.discount),
                applicableModels: form.applicableModels
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
            };

            if (isEdit) {
                await updatePromotion(id, data);
            } else {
                await addPromotion(data);
            }

            alert(`✅ Promotion ${isEdit ? 'updated' : 'created'} successfully!`);
            navigate('/promotions');
        } catch (error) {
            console.error(error);
            alert("❌ Failed to save promotion. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <div style={{ maxWidth: '700px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/promotions')}>← Back</button>
                    <div>
                        <div className="page-title">{isEdit ? 'Edit Promotion' : 'Create New Promotion'}</div>
                        <div className="page-subtitle">
                            {isEdit ? `Editing ${existing?.title}` : 'Launch a new discount campaign'}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="card" style={{ padding: '40px 32px' }}>
                        {/* Title */}
                        <div className="form-group" style={{ marginBottom: '28px' }}>
                            <label className="form-label">Promotion Title *</label>
                            <input 
                                name="title" 
                                className={`form-input ${errors.title ? 'input-error' : ''}`} 
                                placeholder="e.g. New Year Mega Sale" 
                                value={form.title} 
                                onChange={handleChange} 
                            />
                            {errors.title && <div className="form-error">⚠ {errors.title}</div>}
                        </div>

                        {/* Application Model */}
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label className="form-label">Application Model</label>
                            <input 
                                name="applicableModels" 
                                className="form-input" 
                                placeholder="Toyota Prius, Honda Vezel, Suzuki Swift" 
                                value={form.applicableModels} 
                                onChange={handleChange} 
                            />
                            <div className="form-hint">Leave blank if applicable to all models</div>
                        </div>

                        {/* Discount */}
                        <div className="form-group" style={{ marginBottom: '28px' }}>
                            <label className="form-label">Discount (%) *</label>
                            <input 
                                name="discount" 
                                type="number" 
                                className={`form-input ${errors.discount ? 'input-error' : ''}`} 
                                placeholder="2 - 10" 
                                value={form.discount} 
                                onChange={handleChange} 
                                min="2" 
                                max="10" 
                                step="0.1"
                            />
                            {errors.discount && <div className="form-error">⚠ {errors.discount}</div>}
                            <div className="form-hint">Discount must be between 2% and 10%</div>
                        </div>

                        {/* Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                            <div className="form-group">
                                <label className="form-label">Start Date *</label>
                                <input 
                                    name="startDate" 
                                    type="date" 
                                    className={`form-input ${errors.startDate ? 'input-error' : ''}`} 
                                    value={form.startDate} 
                                    onChange={handleChange} 
                                    min={today}
                                />
                                {errors.startDate && <div className="form-error">⚠ {errors.startDate}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date *</label>
                                <input 
                                    name="endDate" 
                                    type="date" 
                                    className={`form-input ${errors.endDate ? 'input-error' : ''}`} 
                                    value={form.endDate} 
                                    onChange={handleChange} 
                                    min={form.startDate || today}
                                />
                                {errors.endDate && <div className="form-error">⚠ {errors.endDate}</div>}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group" style={{ marginBottom: '28px' }}>
                            <label className="form-label">Description *</label>
                            <textarea 
                                name="description" 
                                className={`form-textarea ${errors.description ? 'input-error' : ''}`} 
                                placeholder="Describe the promotion details, terms & conditions..." 
                                value={form.description} 
                                onChange={handleChange} 
                                rows={5}
                            />
                            {errors.description && <div className="form-error">⚠ {errors.description}</div>}
                        </div>

                        {/* Promotion Poster - Only URL Input */}
                        <div className="form-group">
                            <label className="form-label">Promotion Poster Image URL</label>
                            <input 
                                name="imageUrl"
                                type="text" 
                                className="form-input" 
                                placeholder="https://example.com/your-poster-image.jpg" 
                                value={form.imageUrl} 
                                onChange={handleChange}
                            />
                            <div className="form-hint">
                                Paste direct image link (Recommended size: 1200 × 600 px)
                            </div>

                            {/* Live Preview */}
                            {imagePreview && (
                                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Live Preview:</p>
                                    <img 
                                        src={imagePreview} 
                                        alt="Promotion Poster Preview" 
                                        style={{ 
                                            maxHeight: '260px', 
                                            borderRadius: '12px', 
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                                            maxWidth: '100%'
                                        }} 
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'center' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading}
                            style={{ padding: '14px 48px', fontSize: '16px' }}
                        >
                            {loading ? 'Saving Promotion...' : isEdit ? ' Save Changes' : ' Create Promotion'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => navigate('/promotions')}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}