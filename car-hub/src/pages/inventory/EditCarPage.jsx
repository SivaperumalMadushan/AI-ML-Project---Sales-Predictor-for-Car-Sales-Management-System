import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCars } from '../../context/CarContext';

const TYPES = ['Sedan', 'SUV', 'Hatchback', 'Hybrid', 'Electric', 'Luxury', 'Convertible', 'Van'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'e-SMART'];
const AGE_CATEGORIES = [
  { value: 'new', label: 'New / ≤ 3 years' },
  { value: 'old', label: '> 3 years (Higher Excise Penalty)' }
];

const CURRENT_YEAR = new Date().getFullYear();

export default function EditCarPage() {
    const { id } = useParams();
    const { getCarById, updateCar } = useCars();
    const navigate = useNavigate();

    const existingCar = getCarById(id);

    const [form, setForm] = useState({});
    const [taxes, setTaxes] = useState({
        cid: 0, surcharge: 0, excise: 0, luxuryTax: 0,
        sscl: 0, pal: 0, vatBase: 0, vatAmount: 0,
        totalLandedCost: 0, suggestedSellingIncl: 0
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load existing car data
    useEffect(() => {
        if (existingCar) {
            setForm({
                brand: existingCar.brand || '',
                model: existingCar.model || '',
                year: existingCar.year || CURRENT_YEAR,
                type: existingCar.type || 'Sedan',
                cifValue: existingCar.cifValue || '',
                fuelType: existingCar.fuelType || 'Petrol',
                engineCapacity: existingCar.engineCapacity || '',
                ageCategory: existingCar.ageCategory || 'new',
                price: existingCar.price || '',
                quantity: existingCar.quantity || 1,
                description: existingCar.description || '',
                image: existingCar.image || '',
            });
        } else {
            navigate('/inventory');
        }
    }, [existingCar, navigate]);

    // Real-time Tax Calculation + Auto-fill Selling Price (10% margin)
    useEffect(() => {
        calculateTaxesAndAutoFillSellingPrice();
    }, [form.cifValue, form.fuelType, form.engineCapacity, form.ageCategory, form.year]);

    function calculateTaxesAndAutoFillSellingPrice() {
        const cif = parseFloat(form.cifValue) || 0;
        if (cif <= 0) {
            setTaxes({ cid: 0, surcharge: 0, excise: 0, luxuryTax: 0, sscl: 0, pal: 0, vatBase: 0, vatAmount: 0, totalLandedCost: 0, suggestedSellingIncl: 0 });
            return;
        }

        const cid = cif * 0.20;
        const surcharge = cid * 0.50;

        let excise = 0;
        const capacity = parseFloat(form.engineCapacity) || 0;
        const isOld = form.ageCategory === 'old';

        if (capacity > 0) {
            if (form.fuelType === 'Electric' || form.fuelType === 'e-SMART') {
                excise = capacity * 500;
            } else if (form.fuelType.includes('Hybrid')) {
                excise = capacity * 1200 * (isOld ? 1.5 : 1);
            } else {
                excise = capacity * 1800 * (isOld ? 1.8 : 1);
            }
        }

        let threshold = 5000000;
        let luxuryRate = 1.0;
        if (form.fuelType === 'Electric' || form.fuelType === 'e-SMART') {
            threshold = 6000000;
            luxuryRate = 0.60;
        } else if (form.fuelType.includes('Hybrid')) {
            threshold = 5500000;
            luxuryRate = 0.80;
        } else if (form.fuelType === 'Diesel') {
            luxuryRate = 1.20;
        }
        const luxuryTax = Math.max(0, (cif - threshold)) * luxuryRate;

        const sscl = (cif + cid + surcharge) * 0.025;
        const pal = cif * 0.07;

        const vatBase = (cif * 1.10) + cid + surcharge + excise + luxuryTax + pal;
        const vatAmount = vatBase * 0.18;

        const totalLandedCost = cif + cid + surcharge + excise + luxuryTax + sscl + pal + vatAmount;
        const suggestedSellingIncl = totalLandedCost * 1.10;

        setTaxes({
            cid: Math.round(cid),
            surcharge: Math.round(surcharge),
            excise: Math.round(excise),
            luxuryTax: Math.round(luxuryTax),
            sscl: Math.round(sscl),
            pal: Math.round(pal),
            vatBase: Math.round(vatBase),
            vatAmount: Math.round(vatAmount),
            totalLandedCost: Math.round(totalLandedCost),
            suggestedSellingIncl: Math.round(suggestedSellingIncl)
        });

        // Auto-update selling price with 10% profit
        setForm(prev => ({
            ...prev,
            price: Math.round(suggestedSellingIncl).toString()
        }));
    }

    function validate() {
        const e = {};
        if (!form.brand?.trim()) e.brand = 'Brand is required';
        if (!form.model?.trim()) e.model = 'Model is required';
        if (!form.year || form.year < 1990 || form.year > CURRENT_YEAR) 
            e.year = `Year must be ${CURRENT_YEAR} or earlier`;

        if (!form.cifValue || isNaN(form.cifValue) || Number(form.cifValue) <= 1000000) 
            e.cifValue = 'CIF Value must be higher than LKR 1,000,000';

        if (!form.engineCapacity || isNaN(form.engineCapacity) || Number(form.engineCapacity) <= 0) 
            e.engineCapacity = 'Engine capacity is required';

        if (!form.price || isNaN(form.price) || Number(form.price) <= 0) 
            e.price = 'Selling price is required';

        if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) 
            e.quantity = 'Enter valid quantity';

        if (!form.description?.trim()) e.description = 'Description is required';

        return e;
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
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
            await updateCar(id, {
                ...form,
                cifValue: Number(form.cifValue),
                engineCapacity: Number(form.engineCapacity),
                year: Number(form.year),
                quantity: Number(form.quantity),
                price: Number(form.price),
                landedCost: taxes.totalLandedCost,
                importTaxes: taxes,
            });

            setSaved(true);
            setTimeout(() => navigate(`/inventory/${id}`), 1200);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update vehicle. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (!existingCar) return null;

    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/inventory/${id}`)}>← Back</button>
                <div>
                    <div className="page-title">Edit Vehicle</div>
                    <div className="page-subtitle">Updating {existingCar.brand} {existingCar.model} — ID: {id}</div>
                </div>
            </div>

            {saved && <div className="alert alert-success">✅ Vehicle updated successfully! Redirecting...</div>}

            <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
                {/* Vehicle Information */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 className="section-title">Vehicle Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Brand *</label>
                            <input name="brand" className={`form-input ${errors.brand ? 'input-error' : ''}`} value={form.brand || ''} onChange={handleChange} />
                            {errors.brand && <div className="form-error">⚠ {errors.brand}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model *</label>
                            <input name="model" className={`form-input ${errors.model ? 'input-error' : ''}`} value={form.model || ''} onChange={handleChange} />
                            {errors.model && <div className="form-error">⚠ {errors.model}</div>}
                        </div>
                    </div>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label">Year *</label>
                            <input name="year" type="number" className={`form-input ${errors.year ? 'input-error' : ''}`} value={form.year || ''} onChange={handleChange} min="1990" max={CURRENT_YEAR} />
                            {errors.year && <div className="form-error">⚠ {errors.year}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Type *</label>
                            <select name="type" className="form-select" value={form.type || ''} onChange={handleChange}>
                                {TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Import Tax Calculation */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 className="section-title">Import Tax & Landed Cost (Sri Lanka 2026)</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">CIF Value (LKR) *</label>
                            <input name="cifValue" type="number" className={`form-input ${errors.cifValue ? 'input-error' : ''}`} value={form.cifValue || ''} onChange={handleChange} min="1000001" />
                            {errors.cifValue && <div className="form-error">⚠ {errors.cifValue}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fuel / Propulsion Type *</label>
                            <select name="fuelType" className="form-select" value={form.fuelType || ''} onChange={handleChange}>
                                {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Engine Capacity (CC or kW) *</label>
                            <input name="engineCapacity" type="number" className={`form-input ${errors.engineCapacity ? 'input-error' : ''}`} value={form.engineCapacity || ''} onChange={handleChange} />
                            {errors.engineCapacity && <div className="form-error">⚠ {errors.engineCapacity}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Age Category</label>
                            <select name="ageCategory" className="form-select" value={form.ageCategory || ''} onChange={handleChange}>
                                {AGE_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Component</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Amount (LKR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>CIF Value</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{Number(form.cifValue || 0).toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Customs Import Duty (20%)</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.cid.toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Surcharge (50%)</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.surcharge.toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Excise Duty</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.excise.toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Luxury Tax</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.luxuryTax.toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>SSCL (2.5%)</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.sscl.toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>PAL (~7%)</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.pal.toLocaleString('en-LK')}</td></tr>
                                <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>VAT @ 18%</td><td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.vatAmount.toLocaleString('en-LK')}</td></tr>
                                <tr style={{ fontWeight: 'bold', background: '#e8f5e8' }}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>Total Landed Cost</td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{taxes.totalLandedCost.toLocaleString('en-LK')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 className="section-title">Pricing & Inventory</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Selling Price (Inclusive of VAT) *</label>
                            <input 
                                name="price" 
                                type="number" 
                                className={`form-input ${errors.price ? 'input-error' : ''}`} 
                                value={form.price || ''} 
                                onChange={handleChange}
                            />
                            {errors.price && <div className="form-error">⚠ {errors.price}</div>}
                            <div className="form-hint">
                                Auto-calculated: Landed Cost + 10% Profit Margin
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Quantity *</label>
                            <input name="quantity" type="number" className={`form-input ${errors.quantity ? 'input-error' : ''}`} value={form.quantity ?? ''} onChange={handleChange} min="0" />
                            {errors.quantity && <div className="form-error">⚠ {errors.quantity}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description *</label>
                        <textarea name="description" className={`form-textarea ${errors.description ? 'input-error' : ''}`} value={form.description || ''} onChange={handleChange} rows={4} />
                        {errors.description && <div className="form-error">⚠ {errors.description}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Image URL (optional)</label>
                        <input name="image" className="form-input" value={form.image || ''} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select name="status" className="form-select" value={form.status || 'available'} onChange={handleChange}>
                            <option value="available">Available</option>
                            <option value="sold">Sold / Unavailable</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving Changes...' : ' Save Changes'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(`/inventory/${id}`)}>Cancel</button>
                </div>
            </form>
        </div>
    );
}