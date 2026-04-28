import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

import { useCars } from '../../context/CarContext';
import { useBookings } from '../../context/BookingContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useAuth } from '../../context/AuthContext';

const COLORS = [
    '#e94560',
    '#4f8ef7',
    '#2ed573',
    '#ffd32a',
    '#a55eea',
    '#ff6b35',
];

export default function AnalyticsPage() {
    const { cars } = useCars();
    const { bookings } = useBookings();
    const { feedbacks } = useFeedback();
    const { users } = useAuth();

    const [modelMetrics, setModelMetrics] = useState(null);
    const [metricsError, setMetricsError] = useState('');

    useEffect(() => {
        fetch('http://127.0.0.1:8000/metrics')
            .then((response) => response.json())
            .then((data) => {
                if (data.success && data.metrics) {
                    setModelMetrics(data.metrics);
                } else {
                    setMetricsError(
                        'Model metrics not found. Please train the model first.'
                    );
                }
            })
            .catch((error) => {
                console.error('Failed to load model metrics:', error);
                setMetricsError('Failed to connect to ML backend.');
            });
    }, []);

    const bookingStatus = [
        {
            name: 'Pending',
            value: bookings.filter((b) => b.status === 'Pending').length,
        },
        {
            name: 'Approved',
            value: bookings.filter((b) => b.status === 'Approved').length,
        },
        {
            name: 'Completed',
            value: bookings.filter((b) => b.status === 'Completed').length,
        },
        {
            name: 'Cancelled',
            value: bookings.filter((b) => b.status === 'Cancelled').length,
        },
        {
            name: 'Rescheduled',
            value: bookings.filter((b) => b.status === 'Rescheduled').length,
        },
    ];

    const carTypes = Object.entries(
        cars.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const fbTypes = [
        {
            name: 'Inquiry',
            value: feedbacks.filter((f) => f.type === 'Inquiry').length,
        },
        {
            name: 'Feedback',
            value: feedbacks.filter((f) => f.type === 'Feedback').length,
        },
        {
            name: 'Complaint',
            value: feedbacks.filter((f) => f.type === 'Complaint').length,
        },
    ];

    const fbStatus = [
        'Pending',
        'Assigned',
        'In Progress',
        'Resolved',
        'Closed',
    ].map((s) => ({
        name: s,
        value: feedbacks.filter((f) => f.status === s).length,
    }));

    const branchBookings = Object.entries(
        bookings.reduce((acc, b) => {
            acc[b.branch] = (acc[b.branch] || 0) + 1;
            return acc;
        }, {})
    )
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const ratings = [1, 2, 3, 4, 5].map((n) => ({
        name: '⭐'.repeat(n),
        value: feedbacks.filter((f) => f.rating === n).length,
    }));

    const avgRating = (() => {
        const rated = feedbacks.filter((f) => f.rating);

        if (!rated.length) return 0;

        return (
            rated.reduce((sum, f) => sum + f.rating, 0) / rated.length
        ).toFixed(1);
    })();

    const statCards = [
        {
            label: 'Total Cars',
            value: cars.length,
            icon: '🚗',
            color: '#e94560',
        },
        {
            label: 'Available Stock',
            value: cars
                .filter((c) => c.status === 'available' && c.quantity > 0)
                .reduce((s, c) => s + c.quantity, 0),
            icon: '✅',
            color: '#2ed573',
        },
        {
            label: 'Total Bookings',
            value: bookings.length,
            icon: '📅',
            color: '#4f8ef7',
        },
        {
            label: 'Completed Bookings',
            value: bookings.filter((b) => b.status === 'Completed').length,
            icon: '🏁',
            color: '#2ed573',
        },
        {
            label: 'Total Inquiries',
            value: feedbacks.length,
            icon: '💬',
            color: '#a55eea',
        },
        {
            label: 'Avg Rating',
            value: avgRating + ' ⭐',
            icon: '⭐',
            color: '#ffd32a',
        },
        {
            label: 'Total Users',
            value: users.length,
            icon: '👥',
            color: '#ff6b35',
        },
        {
            label: 'Customers',
            value: users.filter((u) => u.role === 'customer').length,
            icon: '👤',
            color: '#4f8ef7',
        },
    ];

    return (
        <div className="page-container">
            <div className="page-title">Analytics Dashboard</div>
            <div className="page-subtitle">
                System-wide performance overview
            </div>

            {/* Main Stats */}
            <div className="stat-grid" style={{ marginBottom: '32px' }}>
                {statCards.map((s) => (
                    <div key={s.label} className="stat-card">
                        <div
                            className="stat-icon"
                            style={{
                                background: `${s.color}22`,
                                fontSize: '24px',
                            }}
                        >
                            {s.icon}
                        </div>

                        <div className="stat-info">
                            <div
                                className="stat-value"
                                style={{
                                    color: s.color,
                                    fontSize: '24px',
                                }}
                            >
                                {s.value}
                            </div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Model Performance Metrics */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <h3 className="section-title">🤖 AI Model Performance</h3>

                {modelMetrics ? (
                    <div
                        className="stat-grid"
                        style={{ marginTop: '16px' }}
                    >
                        <div className="stat-card">
                            <div
                                className="stat-icon"
                                style={{
                                    background: '#2ed57322',
                                    fontSize: '24px',
                                }}
                            >
                                🎯
                            </div>
                            <div className="stat-info">
                                <div
                                    className="stat-value"
                                    style={{
                                        color: '#2ed573',
                                        fontSize: '24px',
                                    }}
                                >
                                    {modelMetrics.forecast_accuracy}%
                                </div>
                                <div className="stat-label">
                                    Forecast Accuracy
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div
                                className="stat-icon"
                                style={{
                                    background: '#4f8ef722',
                                    fontSize: '24px',
                                }}
                            >
                                📌
                            </div>
                            <div className="stat-info">
                                <div
                                    className="stat-value"
                                    style={{
                                        color: '#4f8ef7',
                                        fontSize: '24px',
                                    }}
                                >
                                    {modelMetrics.prediction_precision}%
                                </div>
                                <div className="stat-label">
                                    Prediction Precision
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div
                                className="stat-icon"
                                style={{
                                    background: '#a55eea22',
                                    fontSize: '24px',
                                }}
                            >
                                📈
                            </div>
                            <div className="stat-info">
                                <div
                                    className="stat-value"
                                    style={{
                                        color: '#a55eea',
                                        fontSize: '24px',
                                    }}
                                >
                                    {modelMetrics.r2}
                                </div>
                                <div className="stat-label">R² Score</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div
                                className="stat-icon"
                                style={{
                                    background: '#ffd32a22',
                                    fontSize: '24px',
                                }}
                            >
                                📉
                            </div>
                            <div className="stat-info">
                                <div
                                    className="stat-value"
                                    style={{
                                        color: '#ffd32a',
                                        fontSize: '24px',
                                    }}
                                >
                                    {modelMetrics.mae}
                                </div>
                                <div className="stat-label">MAE Units</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div
                                className="stat-icon"
                                style={{
                                    background: '#ff6b3522',
                                    fontSize: '24px',
                                }}
                            >
                                📊
                            </div>
                            <div className="stat-info">
                                <div
                                    className="stat-value"
                                    style={{
                                        color: '#ff6b35',
                                        fontSize: '24px',
                                    }}
                                >
                                    {modelMetrics.rmse}
                                </div>
                                <div className="stat-label">RMSE Units</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            marginTop: '16px',
                            color: 'var(--text-muted)',
                            fontSize: '14px',
                        }}
                    >
                        {metricsError || 'Loading model metrics...'}
                    </div>
                )}
            </div>

            {/* Charts Row 1 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    marginBottom: '24px',
                }}
            >
                <div className="card">
                    <h3 className="section-title">
                        Booking Status Distribution
                    </h3>

                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={bookingStatus}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, value }) =>
                                    value > 0 ? `${name}: ${value}` : ''
                                }
                            >
                                {bookingStatus.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={COLORS[i % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 className="section-title">Car Types in Inventory</h3>

                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={carTypes}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#e94560"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    marginBottom: '24px',
                }}
            >
                <div className="card">
                    <h3 className="section-title">
                        Feedback Type Breakdown
                    </h3>

                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={fbTypes}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#a55eea"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 className="section-title">
                        Feedback Status Pipeline
                    </h3>

                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={fbStatus}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#8888aa', fontSize: 11 }}
                            />
                            <YAxis
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#4f8ef7"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 3 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    marginBottom: '24px',
                }}
            >
                <div className="card">
                    <h3 className="section-title">Bookings by Branch</h3>

                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={branchBookings} layout="vertical">
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                type="number"
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                                width={90}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#2ed573"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 className="section-title">Rating Distribution ⭐</h3>

                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={ratings}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fill: '#8888aa', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#ffd32a"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* User Role Summary */}
            <div className="card">
                <h3 className="section-title">User Role Summary</h3>

                <div
                    className="table-wrapper"
                    style={{ marginTop: '16px' }}
                >
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Count</th>
                                <th>% of Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            {['admin', 'staff', 'customer'].map((role) => {
                                const count = users.filter(
                                    (u) => u.role === role
                                ).length;

                                const pct = users.length
                                    ? ((count / users.length) * 100).toFixed(1)
                                    : 0;

                                return (
                                    <tr key={role}>
                                        <td style={{ fontWeight: '700' }}>
                                            {role === 'admin'
                                                ? 'Admin'
                                                : role === 'staff'
                                                ? 'Staff'
                                                : 'Customer'}
                                        </td>

                                        <td>{count}</td>

                                        <td>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        height: '6px',
                                                        background:
                                                            'var(--bg-hover)',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${pct}%`,
                                                            height: '100%',
                                                            background:
                                                                'var(--accent-red)',
                                                            borderRadius: '3px',
                                                        }}
                                                    ></div>
                                                </div>

                                                <span
                                                    style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-muted)',
                                                        minWidth: '36px',
                                                    }}
                                                >
                                                    {pct}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
