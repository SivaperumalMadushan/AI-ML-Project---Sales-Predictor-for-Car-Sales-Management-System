import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useSales } from '../../context/SalesContext';
import { useAuth } from '../../context/AuthContext';
import './sales.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = n => `Rs. ${Number(n || 0).toLocaleString('en-LK')}`;

const fmtShort = n =>
    Number(n || 0) >= 1000000
        ? `Rs. ${(Number(n || 0) / 1000000).toFixed(1)}M`
        : `Rs. ${(Number(n || 0) / 1000).toFixed(0)}K`;

const TOOLTIP_STYLE = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)'
};

const TICK_STYLE = {
    fill: '#8888aa',
    fontSize: 12
};

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';

export default function SalesReportsPage() {
    const { sales } = useSales();
    const { user } = useAuth();

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    const [predictionResult, setPredictionResult] = useState(null);
    const [showPredictionModal, setShowPredictionModal] = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionError, setPredictionError] = useState('');

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterFuel, setFilterFuel] = useState('');
    const [period, setPeriod] = useState('monthly');

    const brands = [...new Set(sales.map(s => s.brand).filter(Boolean))].sort();
    const types = [...new Set(sales.map(s => s.vehicleType).filter(Boolean))].sort();
    const fuels = [...new Set(sales.map(s => s.fuelType).filter(Boolean))].sort();

    const filtered = useMemo(() => {
        return sales.filter(s => {
            if (dateFrom && s.saleDate < dateFrom) return false;
            if (dateTo && s.saleDate > dateTo) return false;
            if (filterBrand && s.brand !== filterBrand) return false;
            if (filterType && s.vehicleType !== filterType) return false;
            if (filterFuel && s.fuelType !== filterFuel) return false;
            return true;
        });
    }, [sales, dateFrom, dateTo, filterBrand, filterType, filterFuel]);

    const totalRevenue = filtered.reduce((sum, row) => {
        return sum + Number(row.sellingPrice || 0);
    }, 0);

    const totalProfit = filtered.reduce((sum, row) => {
        return sum + Number(row.profit || 0);
    }, 0);

    const totalSold = filtered.filter(row => row.status === 'Completed').length;

    const avgMargin = totalRevenue
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : '0';

    const monthlySales = useMemo(() => {
        const map = {};

        filtered.forEach(sale => {
            const date = new Date(sale.saleDate);

            if (Number.isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!map[key]) {
                map[key] = {
                    month: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
                    revenue: 0,
                    profit: 0,
                    units: 0
                };
            }

            map[key].revenue += Number(sale.sellingPrice || 0);
            map[key].profit += Number(sale.profit || 0);
            map[key].units += 1;
        });

        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, value]) => value);
    }, [filtered]);

    const completed = filtered.filter(s => s.status === 'Completed').length;
    const booking = filtered.filter(s => s.status === 'Booking').length;

    const conversionRate =
        completed + booking > 0
            ? ((completed / (completed + booking)) * 100).toFixed(1)
            : '0';

    const safeNumber = (value, fallback = 0) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };

    // AI Sales Predictor Handler
    const handleAISalesPrediction = async () => {
        setIsPredicting(true);
        setPredictionError('');
        setPredictionResult(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(`${AI_API_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    months_ahead: 3
                })
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            console.log('AI Forecast Response:', data);

            if (!response.ok) {
                throw new Error(data.detail || 'AI prediction failed');
            }

            if (!data.success) {
                throw new Error(data.message || 'Prediction failed');
            }

            const predictions = (data.predictions || []).map((prediction, index) => {
                const predictedUnits = Math.round(
                    safeNumber(prediction.predicted_units, 0)
                );

                return {
                    month: prediction.month || prediction.period || `Month ${index + 1}`,
                    predicted_units: predictedUnits,
                    lower_bound:
                        prediction.lower_bound ??
                        Math.max(0, Math.round(predictedUnits * 0.85)),
                    upper_bound:
                        prediction.upper_bound ??
                        Math.round(predictedUnits * 1.15)
                };
            });

            const totalPredictedUnits = safeNumber(
                data.summary?.total_predicted_units,
                predictions.reduce((sum, item) => {
                    return sum + safeNumber(item.predicted_units, 0);
                }, 0)
            );

            const averageMonthly = safeNumber(
                data.summary?.average_monthly,
                predictions.length ? totalPredictedUnits / predictions.length : 0
            );

            let demandLevel = 'Low Demand';

            if (averageMonthly >= 40) {
                demandLevel = 'High Demand';
            } else if (averageMonthly >= 20) {
                demandLevel = 'Medium Demand';
            }

            let promotionRecommendation =
                'Continue current promotion and monitor sales performance.';

            if (averageMonthly < 20) {
                promotionRecommendation =
                    'Apply a promotion because predicted sales demand is low.';
            } else if (averageMonthly >= 40) {
                promotionRecommendation =
                    'No promotion required because predicted demand is strong.';
            }

            let stockDecision = 'Maintain current stock level.';

            if (averageMonthly >= 40) {
                stockDecision = 'Increase stock for high-demand vehicles.';
            } else if (averageMonthly < 20) {
                stockDecision =
                    'Reduce future stock purchases or promote slow-moving vehicles.';
            }

            const finalResult = {
                success: true,
                message: data.message || 'Prediction generated successfully',
                predictions,
                summary: {
                    total_predicted_units: Math.round(totalPredictedUnits),
                    average_monthly: Math.round(averageMonthly),
                    period: data.summary?.period || 'Next 3 months',
                    demand_level: demandLevel,
                    promotion_recommendation: promotionRecommendation,
                    stock_decision: stockDecision
                },
                generated_at: data.generated_at
            };

            setPredictionResult(finalResult);
            setShowPredictionModal(true);
        } catch (err) {
            console.error('AI Forecast Error:', err);

            if (err.name === 'AbortError') {
                setPredictionError(
                    'AI server timeout. Check whether FastAPI backend is running.'
                );
            } else {
                setPredictionError(
                    err.message || 'Something went wrong while predicting.'
                );
            }
        } finally {
            setIsPredicting(false);
        }
    };

    function handleExport() {
        const headers = [
            'Sale ID',
            'Vehicle ID',
            'Model',
            'Brand',
            'Year',
            'Type',
            'Fuel',
            'Buying Price',
            'Selling Price',
            'Discount',
            'Profit',
            'Margin %',
            'Sale Date',
            'Status',
            'Created',
            'Updated'
        ];

        const rows = filtered.map(s => [
            s.id,
            s.vehicleId,
            s.model,
            s.brand,
            s.year,
            s.vehicleType,
            s.fuelType,
            s.buyingPrice,
            s.sellingPrice,
            s.discount || 0,
            s.profit,
            s.sellingPrice
                ? `${((s.profit / s.sellingPrice) * 100).toFixed(1)}%`
                : '0%',
            s.saleDate,
            s.status,
            s.createdAt,
            s.updatedAt
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `carhub-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();

        URL.revokeObjectURL(url);
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="reports-header-row">
                <div>
                    <div className="sales-title">📈 Reports & Analytics</div>
                    <div className="sales-subtitle">
                        Sales performance dashboard — {filtered.length} records analysed
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="period-toggle">
                        {['daily', 'weekly', 'monthly'].map(item => (
                            <button
                                key={item}
                                className={`period-btn ${period === item ? 'active' : ''}`}
                                onClick={() => setPeriod(item)}
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button className="export-btn" onClick={handleExport}>
                        ⬇️ Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="reports-filter-bar">
                <div className="reports-filter-group">
                    <label>From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                </div>

                <div className="reports-filter-group">
                    <label>To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                </div>

                <div className="reports-filter-group">
                    <label>Brand</label>
                    <select
                        value={filterBrand}
                        onChange={e => setFilterBrand(e.target.value)}
                    >
                        <option value="">All Brands</option>
                        {brands.map(brand => (
                            <option key={brand} value={brand}>
                                {brand}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="reports-filter-group">
                    <label>Vehicle Type</label>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {types.map(type => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="reports-filter-group">
                    <label>Fuel Type</label>
                    <select
                        value={filterFuel}
                        onChange={e => setFilterFuel(e.target.value)}
                    >
                        <option value="">All Fuels</option>
                        {fuels.map(fuel => (
                            <option key={fuel} value={fuel}>
                                {fuel}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        setFilterBrand('');
                        setFilterType('');
                        setFilterFuel('');
                    }}
                >
                    Clear
                </button>
            </div>

            {/* AI Sales Predictor Button */}
            {isAdminOrStaff && (
                <div
                    style={{
                        margin: '25px 0',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                        borderRadius: '12px',
                        color: 'white',
                        textAlign: 'center'
                    }}
                >
                    <h3>🚀 AI Sales Predictor</h3>

                    <p style={{ marginBottom: '18px', opacity: 0.95 }}>
                        Predict future sales for the next 3 months using our trained
                        Machine Learning model.
                    </p>

                    <button
                        onClick={handleAISalesPrediction}
                        disabled={isPredicting}
                        style={{
                            padding: '14px 32px',
                            fontSize: '17px',
                            background: 'white',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: isPredicting ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            opacity: isPredicting ? 0.75 : 1
                        }}
                    >
                        {isPredicting
                            ? '🔄 Predicting...'
                            : '📈 Get AI Sales Forecast'}
                    </button>
                </div>
            )}

            {/* AI Error Message */}
            {predictionError && (
                <div
                    style={{
                        margin: '15px 0',
                        padding: '14px 18px',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        borderRadius: '10px',
                        fontWeight: '600'
                    }}
                >
                    ⚠️ {predictionError}
                </div>
            )}

            {/* KPI Cards */}
            <div className="sales-stats-row" style={{ marginBottom: '28px' }}>
                <div className="sales-stat-card">
                    <div
                        className="sales-stat-icon"
                        style={{ background: 'rgba(233,69,96,0.12)' }}
                    >
                        💵
                    </div>
                    <div>
                        <div className="sales-stat-value" style={{ fontSize: '15px' }}>
                            {fmtShort(totalRevenue)}
                        </div>
                        <div className="sales-stat-label">Total Sales Revenue</div>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div
                        className="sales-stat-icon"
                        style={{ background: 'rgba(79,142,247,0.12)' }}
                    >
                        🚗
                    </div>
                    <div>
                        <div className="sales-stat-value">{totalSold}</div>
                        <div className="sales-stat-label">Vehicles Sold</div>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div
                        className="sales-stat-icon"
                        style={{ background: 'rgba(46,213,115,0.12)' }}
                    >
                        📊
                    </div>
                    <div>
                        <div
                            className="sales-stat-value"
                            style={{ fontSize: '15px', color: '#2ed573' }}
                        >
                            {fmtShort(totalProfit)}
                        </div>
                        <div className="sales-stat-label">Total Profit</div>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div
                        className="sales-stat-icon"
                        style={{ background: 'rgba(255,211,42,0.12)' }}
                    >
                        🎯
                    </div>
                    <div>
                        <div
                            className="sales-stat-value"
                            style={{ color: '#ffd32a' }}
                        >
                            {avgMargin}%
                        </div>
                        <div className="sales-stat-label">Avg Profit Margin</div>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div
                        className="sales-stat-icon"
                        style={{ background: 'rgba(165,94,234,0.12)' }}
                    >
                        🔄
                    </div>
                    <div>
                        <div
                            className="sales-stat-value"
                            style={{ color: '#a55eea' }}
                        >
                            {conversionRate}%
                        </div>
                        <div className="sales-stat-label">Booking Conversion</div>
                    </div>
                </div>
            </div>

            {/* Monthly Sales Trend */}
            <div
                className="chart-section-grid"
                style={{ gridTemplateColumns: '1fr' }}
            >
                <div className="chart-card">
                    <div className="chart-title">Monthly Sales Trend</div>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlySales}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis dataKey="month" tick={TICK_STYLE} />
                            <YAxis
                                tickFormatter={value =>
                                    `${(value / 1000000).toFixed(0)}M`
                                }
                                tick={TICK_STYLE}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value, name) => [fmt(value), name]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#e94560"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                name="Profit"
                                stroke="#2ed573"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Prediction Modal */}
            {showPredictionModal && predictionResult && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '16px',
                            maxWidth: '560px',
                            width: '90%',
                            color: '#1f2937',
                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)'
                        }}
                    >
                        <h2
                            style={{
                                textAlign: 'center',
                                color: '#dc2626',
                                marginBottom: '8px'
                            }}
                        >
                            🚀 AI Sales Forecast
                        </h2>

                        <p
                            style={{
                                textAlign: 'center',
                                color: '#64748b',
                                marginBottom: '25px'
                            }}
                        >
                            {predictionResult.summary.period ||
                                'Next 3 Months Prediction'}
                        </p>

                        {predictionResult.predictions.map((prediction, index) => {
                            const predictedUnits = Math.round(
                                Number(prediction.predicted_units || 0)
                            );

                            const lowerBound =
                                prediction.lower_bound ??
                                Math.max(0, Math.round(predictedUnits * 0.85));

                            const upperBound =
                                prediction.upper_bound ??
                                Math.round(predictedUnits * 1.15);

                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '18px',
                                        marginBottom: '12px',
                                        background: '#fef2f2',
                                        borderLeft: '6px solid #dc2626',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <strong style={{ fontSize: '18px' }}>
                                        {prediction.month || `Month ${index + 1}`}
                                    </strong>
                                    <br />

                                    <span
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            color: '#dc2626'
                                        }}
                                    >
                                        {predictedUnits} units
                                    </span>

                                    <small
                                        style={{
                                            marginLeft: '12px',
                                            color: '#991b1b'
                                        }}
                                    >
                                        ({lowerBound} — {upperBound})
                                    </small>
                                </div>
                            );
                        })}

                        <div
                            style={{
                                marginTop: '20px',
                                padding: '20px',
                                background: '#fee2e2',
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}
                        >
                            <strong>Total for 3 Months:</strong>{' '}

                            <span
                                style={{
                                    fontSize: '24px',
                                    color: '#dc2626',
                                    fontWeight: 'bold'
                                }}
                            >
                                {predictionResult.summary.total_predicted_units} units
                            </span>
                        </div>

                        <div
                            style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Average Monthly:</strong>{' '}
                                {predictionResult.summary.average_monthly} units
                            </p>

                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Demand Level:</strong>{' '}
                                {predictionResult.summary.demand_level}
                            </p>

                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Promotion Recommendation:</strong>{' '}
                                {predictionResult.summary.promotion_recommendation}
                            </p>

                            <p style={{ margin: 0 }}>
                                <strong>Stock Decision:</strong>{' '}
                                {predictionResult.summary.stock_decision}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPredictionModal(false)}
                            style={{
                                marginTop: '25px',
                                width: '100%',
                                padding: '14px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Close Forecast
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}