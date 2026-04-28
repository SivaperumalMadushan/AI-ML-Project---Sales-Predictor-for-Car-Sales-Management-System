// ============================================================
// CarContext.jsx – Final Updated Version for 2026 Tax System
// ============================================================
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

const CarContext = createContext(null);

const CARS_COLLECTION = 'cars';

export function CarProvider({ children }) {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener from Firebase
    useEffect(() => {
        const unsub = onSnapshot(collection(db, CARS_COLLECTION), (snap) => {
            const data = snap.docs
                .map(d => ({ 
                    id: d.id, 
                    ...d.data() 
                }))
                .sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });
            setCars(data);
            setLoading(false);
        }, (err) => {
            console.error('Cars snapshot error:', err);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // ====================== ADD CAR ======================
    async function addCar(data) {
        try {
            const carPayload = {
                brand: (data.brand || '').trim(),
                model: (data.model || '').trim(),
                year: Number(data.year),
                type: data.type || 'Sedan',
                
                // Import Tax Fields
                cifValue: Number(data.cifValue) || 0,
                fuelType: data.fuelType || 'Petrol',
                engineCapacity: Number(data.engineCapacity) || 0,
                ageCategory: data.ageCategory || 'new',
                
                // Pricing
                price: Number(data.price) || 0,                    // Selling Price (Inclusive of VAT)
                quantity: Number(data.quantity) || 1,
                landedCost: Number(data.landedCost) || 0,          // Total Cost after all taxes
                
                // Status & Metadata
                status: data.status || 'available',
                description: (data.description || '').trim(),
                image: data.image || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                // Full Tax Breakdown (Important for audit & reporting)
                importTaxes: {
                    cid: Number(data.importTaxes?.cid) || 0,
                    surcharge: Number(data.importTaxes?.surcharge) || 0,
                    excise: Number(data.importTaxes?.excise) || 0,
                    luxuryTax: Number(data.importTaxes?.luxuryTax) || 0,
                    sscl: Number(data.importTaxes?.sscl) || 0,
                    pal: Number(data.importTaxes?.pal) || 0,
                    vatBase: Number(data.importTaxes?.vatBase) || 0,
                    vatAmount: Number(data.importTaxes?.vatAmount) || 0,
                    totalLandedCost: Number(data.importTaxes?.totalLandedCost) || 0,
                }
            };

            const docRef = await addDoc(collection(db, CARS_COLLECTION), carPayload);
            return docRef.id;
        } catch (e) {
            console.error('addCar error:', e);
            throw e;
        }
    }

    // ====================== UPDATE CAR ======================
    async function updateCar(id, data) {
        try {
            const updatePayload = {
                brand: (data.brand || '').trim(),
                model: (data.model || '').trim(),
                year: Number(data.year),
                type: data.type || 'Sedan',
                
                cifValue: Number(data.cifValue) || 0,
                fuelType: data.fuelType || 'Petrol',
                engineCapacity: Number(data.engineCapacity) || 0,
                ageCategory: data.ageCategory || 'new',
                
                price: Number(data.price) || 0,
                quantity: Number(data.quantity) || 0,
                landedCost: Number(data.landedCost) || 0,
                
                status: data.status || 'available',
                description: (data.description || '').trim(),
                image: data.image || '',
                updatedAt: serverTimestamp(),

                importTaxes: {
                    cid: Number(data.importTaxes?.cid) || 0,
                    surcharge: Number(data.importTaxes?.surcharge) || 0,
                    excise: Number(data.importTaxes?.excise) || 0,
                    luxuryTax: Number(data.importTaxes?.luxuryTax) || 0,
                    sscl: Number(data.importTaxes?.sscl) || 0,
                    pal: Number(data.importTaxes?.pal) || 0,
                    vatBase: Number(data.importTaxes?.vatBase) || 0,
                    vatAmount: Number(data.importTaxes?.vatAmount) || 0,
                    totalLandedCost: Number(data.importTaxes?.totalLandedCost) || 0,
                }
            };

            await updateDoc(doc(db, CARS_COLLECTION, id), updatePayload);
        } catch (e) {
            console.error('updateCar error:', e);
            throw e;
        }
    }

    // ====================== OTHER FUNCTIONS ======================
    async function deleteCar(id) {
        try {
            await deleteDoc(doc(db, CARS_COLLECTION, id));
        } catch (e) {
            console.error('deleteCar error:', e);
            throw e;
        }
    }

    function getCarById(id) {
        return cars.find(c => c.id === id);
    }

    function getAvailableCars() {
        return cars.filter(car => 
            car.status === 'available' && 
            (car.quantity || 0) > 0
        );
    }

    // Helper to calculate profit (useful in list/detail pages)
    function getProfit(car) {
        if (!car) return 0;
        return (car.price || 0) - (car.landedCost || 0);
    }

    return (
        <CarContext.Provider value={{
            cars,
            loading,
            addCar,
            updateCar,
            deleteCar,
            getCarById,
            getAvailableCars,
            getProfit,
        }}>
            {children}
        </CarContext.Provider>
    );
}

export function useCars() { 
    return useContext(CarContext); 
}