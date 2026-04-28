import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

function validateEmail(email) {
  if (!email.includes('@')) return 'Email must include @';
  const parts = email.split('@');
  if (!parts[1] || !parts[1].includes('.')) return 'Email must be valid (e.g. user@domain.com)';
  return null;
}
function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/^[A-Z]/.test(pw)) return 'Password must start with an uppercase letter';
  if (!/\d/.test(pw)) return 'Password must include a number';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include a symbol';
  return null;
}
function validatePhone(phone) {
  if (!phone.startsWith('+94')) return 'Phone must start with +94';
  const digits = phone.replace('+94', '');
  if (!/^\d{9}$/.test(digits)) return 'Phone must have 9 digits after +94';
  return null;
}
function validateAge(dob) {
  if (!dob) return 'Date of birth is required';
  const age = (new Date() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25);
  if (age < 16) return 'You must be at least 16 years old';
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          setUser({ id: firebaseUser.uid, ...snap.data() });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      _fetchAllUsers();
    }
  }, [user?.role]);

  async function _fetchAllUsers() {
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  }

  // LOGIN
  async function login(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (e) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') return 'Invalid email or password';
      if (e.code === 'auth/user-not-found') return 'No account with that email';
      if (e.code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
      return e.message;
    }
  }

  // SIGNUP
  async function signup(data) {
    const emailErr = validateEmail(data.email);
    if (emailErr) return emailErr;
    const pwErr = validatePassword(data.password);
    if (pwErr) return pwErr;
    const phoneErr = validatePhone(data.phone);
    if (phoneErr) return phoneErr;
    const ageErr = validateAge(data.dob);
    if (ageErr) return ageErr;

    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await fbUpdateProfile(cred.user, { displayName: `${data.fullName} ${data.surname}` });

      const userDoc = {
        uid: cred.user.uid,
        email: data.email,
        name: `${data.fullName} ${data.surname}`,
        fullName: data.fullName,
        surname: data.surname,
        phone: data.phone,
        gender: data.gender || '',
        dob: data.dob || '',
        city: data.city || '',
        role: data.role || 'customer',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), userDoc);
      return null;
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') return 'Email already registered';
      return e.message;
    }
  }

  // LOGOUT
  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  // UPDATE PROFILE
  async function updateProfile(updatedData) {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.id);
      await updateDoc(ref, updatedData);
      setUser(prev => ({ ...prev, ...updatedData }));
      return null;
    } catch (e) {
      return e.message;
    }
  }

  // DELETE ACCOUNT
  async function deleteAccount() {
    if (!user) return 'No user logged in';
    try {
      await deleteDoc(doc(db, 'users', user.id));
      await auth.currentUser?.delete();
      setUser(null);
      return null;
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        return 'For security, please sign out and sign back in before deleting your account.';
      }
      return e.message;
    }
  }

  // ADMIN: Update user role
  async function updateUserRole(userId, role) {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      await _fetchAllUsers();
      return null;
    } catch (e) {
      return e.message;
    }
  }

  // ADMIN: Delete user
  async function deleteUser(userId) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      return null;
    } catch (e) {
      return e.message;
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main, #0f0f1a)' }}>
        <div style={{ color: '#e94560', fontSize: '18px' }}>🔥 Loading Car Hub...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, users,
      login, signup, logout, updateProfile, deleteAccount,
      validateEmail, validatePassword, validatePhone,
      updateUserRole, deleteUser,
      refreshUsers: _fetchAllUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }