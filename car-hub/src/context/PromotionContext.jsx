// ============================================================
// PromotionContext.jsx
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const PromotionContext = createContext(null);

const PROMO_COLLECTION = 'promotions';

export function PromotionProvider({ children }) {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, PROMO_COLLECTION), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPromotions(data);
            setLoading(false);
        }, (err) => {
            console.error('Promotions snapshot error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    async function addPromotion(data) {
        try {
            const ref = await addDoc(collection(db, PROMO_COLLECTION), {
                ...data,
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return ref.id;
        } catch (e) {
            console.error('addPromotion error:', e);
            throw e;
        }
    }

    async function updatePromotion(id, data) {
        try {
            await updateDoc(doc(db, PROMO_COLLECTION, id), {
                ...data,
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error('updatePromotion error:', e);
            throw e;
        }
    }

    async function deletePromotion(id) {
        try {
            await deleteDoc(doc(db, PROMO_COLLECTION, id));
        } catch (e) {
            console.error('deletePromotion error:', e);
            throw e;
        }
    }

    function getPromotionById(id) {
        return promotions.find(p => p.id === id);
    }

    function getActivePromotions() {
        const today = new Date().toISOString().split('T')[0];
        return promotions.filter(p => p.active && p.endDate >= today);
    }

    return (
        <PromotionContext.Provider value={{
            promotions,
            loading,
            addPromotion,
            updatePromotion,
            deletePromotion,
            getPromotionById,
            getActivePromotions,
        }}>
            {children}
        </PromotionContext.Provider>
    );
}

export function usePromotions() { return useContext(PromotionContext); }