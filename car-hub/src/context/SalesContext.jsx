import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const SalesContext = createContext(null);
const SALES_COLLECTION = 'sales';

export function SalesProvider({ children }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, SALES_COLLECTION), (snap) => {
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setSales(data);
            setLoading(false);
        }, (err) => {
            console.error('Sales snapshot error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    function calcProfit(buying, selling, discount) {
        return (Number(selling) || 0) - (Number(buying) || 0) - (Number(discount) || 0);
    }

    async function addSale(data) {
        const profit = calcProfit(data.buyingPrice, data.sellingPrice, data.discount);
        const docRef = await addDoc(collection(db, SALES_COLLECTION), {
            ...data,
            profit,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;   // Important: Return Firestore ID
    }

    async function updateSale(id, data) {
        const profit = calcProfit(data.buyingPrice, data.sellingPrice, data.discount);
        await updateDoc(doc(db, SALES_COLLECTION, id), {
            ...data,
            profit,
            updatedAt: serverTimestamp(),
        });
    }

    async function deleteSale(id) {
        await deleteDoc(doc(db, SALES_COLLECTION, id));
    }

    function getSaleById(id) {
        return sales.find(s => s.id === id);
    }

    return (
        <SalesContext.Provider value={{ sales, loading, addSale, updateSale, deleteSale, getSaleById, calcProfit }}>
            {children}
        </SalesContext.Provider>
    );
}

export function useSales() { return useContext(SalesContext); }