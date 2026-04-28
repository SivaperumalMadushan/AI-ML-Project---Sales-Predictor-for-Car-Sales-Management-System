import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSales } from '../../context/SalesContext';
import './sales.css';

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Hybrid', 'Electric', 'Pickup', 'Van', 'Convertible', 'Coupe'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];
const BRANDS = ['Toyota', 'Honda', 'Suzuki', 'Nissan', 'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Hyundai', 'Perodua', 'Ford', 'Kia', 'Mazda', 'Audi', 'Volkswagen', 'Subaru'];
const STATUSES = ['Booking', 'Completed'];

const empty = {
    saleId: '',
    vehicleId: '', model: '', brand: '', year: new Date().getFullYear(), vehicleType: '',
    fuelType: '', buyingPrice: '', sellingPrice: '', discount: '0',
    saleDate: new Date().toISOString().slice(0, 10), status: 'Completed',
};

export default function SalesFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { getSaleById, addSale, updateSale, calcProfit } = useSales();
    const navigate = useNavigate();

    const [form, setForm] = useState(empty);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const suggestedId = `SV-${new Date().getFullYear()}-00001`;

    useEffect(() => {
        if (isEdit) {
            const sale = getSaleById(id);
            if (sale) setForm({ ...sale });
            else navigate('/sales');
        } else {
            setForm(prev => ({ ...prev, saleId: suggestedId }));
        }
    }, [id, isEdit, getSaleById, navigate]);

    const liveProfit = calcProfit(form.buyingPrice, form.sellingPrice, form.discount);

    function set(field, val) {
        setForm(f => ({ ...f, [field]: val }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    }

    function validate() {
        const e = {};
        if (!form.saleId?.trim()) e.saleId = 'Sale ID is required';
        else if (!/^SV-\d{4}-\d{5}$/.test(form.saleId.trim())) {
            e.saleId = 'Sale ID must be in format: SV-YYYY-12345 (e.g. SV-2026-12345)';
        }

        if (!form.vehicleId.trim()) e.vehicleId = 'Vehicle ID is required';
        if (!form.model.trim()) e.model = 'Model is required';
        if (!form.brand) e.brand = 'Brand is required';
        if (!form.year || form.year < 1990 || form.year > 2026) e.year = 'Year must be between 1990 and 2026';
        if (!form.vehicleType) e.vehicleType = 'Vehicle type is required';
        if (!form.fuelType) e.fuelType = 'Fuel type is required';

        const buying = Number(form.buyingPrice);
        const selling = Number(form.sellingPrice);

        if (!form.buyingPrice || buying <= 1000000) e.buyingPrice = 'Buying price must be higher than 1,000,000 Rs.';
        if (!form.sellingPrice || selling <= 0) e.sellingPrice = 'Enter valid selling price';
        else if (selling <= buying) e.sellingPrice = 'Selling price must be higher than buying price';

        if (Number(form.discount) < 0) e.discount = 'Discount cannot be negative';

        if (!form.saleDate) e.saleDate = 'Sale date is required';
        else if (new Date(form.saleDate) > new Date()) e.saleDate = 'Sale date cannot be in the future';

        if (!form.status) e.status = 'Status is required';
        return e;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        setSuccessMessage('');

        try {
            const data = {
                ...form,
                buyingPrice: Number(form.buyingPrice),
                sellingPrice: Number(form.sellingPrice),
                discount: Number(form.discount) || 0,
                year: Number(form.year),
            };

            if (isEdit) {
                await updateSale(id, data);
                setSuccessMessage('✅ Sale record updated successfully!');
                setTimeout(() => navigate(`/sales/${id}`), 1200);
            } else {
                const newFirestoreId = await addSale(data);
                setSuccessMessage('✅ New sale record created successfully! Redirecting...');
                setTimeout(() => navigate(`/sales/${newFirestoreId}`), 1800);
            }
        } catch (err) {
            console.error(err);
            setSuccessMessage('❌ Failed to save record. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    const fieldErr = k => errors[k] ? <span style={{ color: '#e94560', fontSize: '11px' }}>{errors[k]}</span> : null;

    const inputStyle = {
        backgroundColor: '#fff0f5',
        color: '#333333',
        border: '1px solid #ff99a8',
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '15px',
        width: '100%'
    };

    const selectStyle = { ...inputStyle, height: '42px' };

    return (
        <div className="page-container">
            <div className="sales-header">
                <div>
                    <div className="sales-title">{isEdit ? 'Edit Sale Record' : 'New Sale Record'}</div>
                    <div className="sales-subtitle">{isEdit ? `Editing ${id}` : 'Create a new sales entry'}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/sales')}>← Back to Sales</button>
            </div>

            {successMessage && (
                <div style={{
                    backgroundColor: successMessage.includes('✅') ? '#2ed573' : '#e94560',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontWeight: '600',
                    textAlign: 'center'
                }}>
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="sales-form-card">

                    <div className="sales-form-section-title">Vehicle Information</div>
                    <div className="sales-form-grid">
                        <div className="sales-form-group">
                            <label>Sale ID * (SV-YYYY-12345)</label>
                            <input placeholder="e.g. SV-2026-12345" value={form.saleId || ''} onChange={e => set('saleId', e.target.value)} style={inputStyle} readOnly={isEdit} />
                            {fieldErr('saleId')}
                        </div>
                        <div className="sales-form-group">
                            <label>Vehicle ID / Ref *</label>
                            <input placeholder="e.g. VH-1001" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} style={inputStyle} />
                            {fieldErr('vehicleId')}
                        </div>
                        <div className="sales-form-group">
                            <label>Model *</label>
                            <input placeholder="e.g. Prius" value={form.model} onChange={e => set('model', e.target.value)} style={inputStyle} />
                            {fieldErr('model')}
                        </div>
                        <div className="sales-form-group">
                            <label>Brand *</label>
                            <select value={form.brand} onChange={e => set('brand', e.target.value)} style={selectStyle}>
                                <option value="">Select Brand</option>
                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            {fieldErr('brand')}
                        </div>
                        <div className="sales-form-group">
                            <label>Year of Manufacture *</label>
                            <input type="number" min="1990" max="2026" value={form.year} onChange={e => set('year', e.target.value)} style={inputStyle} />
                            {fieldErr('year')}
                        </div>
                        <div className="sales-form-group">
                            <label>Vehicle Type *</label>
                            <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} style={selectStyle}>
                                <option value="">Select Type</option>
                                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {fieldErr('vehicleType')}
                        </div>
                        <div className="sales-form-group">
                            <label>Fuel Type *</label>
                            <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)} style={selectStyle}>
                                <option value="">Select Fuel</option>
                                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            {fieldErr('fuelType')}
                        </div>
                        <div className="sales-form-group">
                            <label>Sale Status *</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {fieldErr('status')}
                        </div>
                    </div>

                    <div className="sales-form-section-title">Financial Information</div>
                    <div className="sales-form-grid three">
                        <div className="sales-form-group">
                            <label>Buying Price (Rs.) *</label>
                            <input type="number" min="1000001" placeholder="e.g. 2500000" value={form.buyingPrice} onChange={e => set('buyingPrice', e.target.value)} style={inputStyle} />
                            {fieldErr('buyingPrice')}
                        </div>
                        <div className="sales-form-group">
                            <label>Selling Price (Rs.) *</label>
                            <input type="number" min="1000001" placeholder="e.g. 3000000" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} style={inputStyle} />
                            {fieldErr('sellingPrice')}
                        </div>
                        <div className="sales-form-group">
                            <label>Discount Applied (Rs.)</label>
                            <input type="number" min="0" placeholder="0" value={form.discount} onChange={e => set('discount', e.target.value)} style={inputStyle} />
                            {fieldErr('discount')}
                        </div>
                    </div>

                    <div className="profit-preview">
                        <div>
                            <div className="profit-preview-label">Calculated Profit</div>
                            <div className="profit-preview-value" style={{ color: liveProfit >= 0 ? '#2ed573' : '#e94560' }}>
                                Rs. {Number(liveProfit).toLocaleString('en-LK')}
                            </div>
                        </div>
                    </div>

                    <div className="sales-form-section-title">Date Information</div>
                    <div className="sales-form-grid">
                        <div className="sales-form-group">
                            <label>Sale Date *</label>
                            <input type="date" value={form.saleDate} onChange={e => set('saleDate', e.target.value)} style={inputStyle} max={new Date().toISOString().slice(0, 10)} />
                            {fieldErr('saleDate')}
                        </div>
                        <div className="sales-form-group">
                            <label>Created Date</label>
                            <input value={isEdit && form.createdAt ? new Date(form.createdAt).toLocaleString('en-LK') : 'Auto-generated on save'} readOnly style={inputStyle} />
                        </div>
                        <div className="sales-form-group">
                            <label>Last Updated</label>
                            <input value={isEdit && form.updatedAt ? new Date(form.updatedAt).toLocaleString('en-LK') : 'Auto-updated on save'} readOnly style={inputStyle} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? 'Update Sale' : 'Create Sale'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(isEdit ? `/sales/${id}` : '/sales')}>
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}