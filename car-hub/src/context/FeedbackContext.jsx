// ============================================================
// FeedbackContext.jsx
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    arrayUnion,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const FeedbackContext = createContext(null);

const FEEDBACK_COLLECTION = 'feedback';

export function FeedbackProvider({ children }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, FEEDBACK_COLLECTION), (snap) => {
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });
            setFeedbacks(data);
            setLoading(false);
        }, (err) => {
            console.error('Feedback snapshot error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    async function addFeedback(data) {
        try {
            const fqNumber = `FQ-${String(feedbacks.length + 1001).padStart(4, '0')}`;

            const feedbackData = {
                type: data.type,
                subject: data.subject,
                description: data.description,
                rating: data.rating || null,
                priority: data.priority || 'Medium',
                customerId: data.customerId,
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                vehicleId: data.vehicleId || '',
                salesVoucherId: data.salesVoucherId || '',
                status: 'Pending',
                assignedStaff: '',
                responses: [],
                auditLog: [{ 
                    action: 'Created', 
                    by: data.customerName || 'Customer', 
                    at: new Date().toISOString() 
                }],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const ref = await addDoc(collection(db, FEEDBACK_COLLECTION), feedbackData);
            const newId = ref.id;

            // === OPTIMISTIC UPDATE - FIX FOR "TICKET NOT FOUND" ===
            const optimisticFeedback = {
                id: newId,
                ...feedbackData,
                createdAt: { seconds: Date.now() / 1000 }, // temporary for sorting
            };

            setFeedbacks(prev => [optimisticFeedback, ...prev]);

            return newId;
        } catch (e) {
            console.error('addFeedback error:', e);
            throw e;
        }
    }

    async function updateFeedback(id, data, logEntry = null) {
        try {
            const updateData = { 
                ...data, 
                updatedAt: serverTimestamp() 
            };
            
            if (logEntry) {
                updateData.auditLog = arrayUnion({ 
                    ...logEntry, 
                    at: new Date().toISOString() 
                });
            }

            await updateDoc(doc(db, FEEDBACK_COLLECTION, id), updateData);
        } catch (e) {
            console.error('updateFeedback error:', e);
            throw e;
        }
    }

    async function addResponse(id, responseText, staffName, role) {
        try {
            const response = { 
                by: staffName, 
                role, 
                text: responseText, 
                createdAt: new Date().toISOString() 
            };
            
            await updateDoc(doc(db, FEEDBACK_COLLECTION, id), {
                responses: arrayUnion(response),
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error('addResponse error:', e);
            throw e;
        }
    }

    async function deleteFeedback(id) {
        try {
            await deleteDoc(doc(db, FEEDBACK_COLLECTION, id));
            // Optional: remove from local state immediately
            setFeedbacks(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            console.error('deleteFeedback error:', e);
            throw e;
        }
    }

    function getFeedbackById(id) {
        return feedbacks.find(f => f.id === id);
    }

    function getFeedbacksByUser(userId) {
        return feedbacks.filter(f => f.customerId === userId);
    }

    return (
        <FeedbackContext.Provider value={{
            feedbacks,
            loading,
            addFeedback,
            updateFeedback,
            addResponse,
            deleteFeedback,
            getFeedbackById,
            getFeedbacksByUser,
        }}>
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    return useContext(FeedbackContext);
}