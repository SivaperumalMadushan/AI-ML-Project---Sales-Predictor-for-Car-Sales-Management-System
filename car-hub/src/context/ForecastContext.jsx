// ============================================================
// ForecastContext.jsx — Updated for AI Sales Predictor
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const ForecastContext = createContext(null);

export function ForecastProvider({ children }) {
    const [latestForecast, setLatestForecast] = useState(null);
    const [allForecasts, setAllForecasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [triggerLoading, setTriggerLoading] = useState(false);

    // Real-time Firestore forecasts (existing functionality)
    useEffect(() => {
        const q = query(
            collection(db, 'forecasts'),
            orderBy('generatedAt', 'desc'),
            limit(5)
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                generatedAt: d.data().generatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            setAllForecasts(data);
            setLatestForecast(data[0] || null);
            setLoading(false);
        }, (err) => {
            console.error('Forecasts snapshot error:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // Call Local FastAPI Backend for fresh AI prediction
    const getFreshPrediction = async (months_ahead = 3) => {
        setTriggerLoading(true);
        setError(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ months_ahead }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ AI Prediction received:", data);
            setTriggerLoading(false);
            return data;

        } catch (err) {
            console.error('Prediction API Error:', err);
            setError(err.message);
            setTriggerLoading(false);
            return null;
        }
    };

    return (
        <ForecastContext.Provider value={{
            latestForecast,
            allForecasts,
            loading,
            error,
            triggerLoading,
            getFreshPrediction,        // ← This is used in SalesReportsPage
        }}>
            {children}
        </ForecastContext.Provider>
    );
}

export const useForecasts = () => useContext(ForecastContext);