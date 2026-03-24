import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, name, age) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                age,
                role: 'Usuario',
                createdAt: new Date().toISOString()
            });
        } catch (firestoreError) {
            console.warn('No se pudo guardar en Firestore:', firestoreError.message);
        }
        return userCredential;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const getCurrentUserData = async () => {
        if (!auth.currentUser?.uid) {
            return null;
        }

        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        return userSnap.data();
    };

    const updateUserProfile = async ({ name, age }) => {
        if (!auth.currentUser) {
            throw new Error('No hay un usuario autenticado.');
        }

        await updateProfile(auth.currentUser, { displayName: name });

        const userRef = doc(db, 'users', auth.currentUser.uid);
        const payload = {
            name,
            age,
            email: auth.currentUser.email,
            updatedAt: new Date().toISOString()
        };

        await setDoc(userRef, payload, { merge: true });

        return payload;
    };

    const changeUserPassword = async ({ currentPassword, newPassword }) => {
        if (!auth.currentUser || !auth.currentUser.email) {
            throw new Error('No hay un usuario autenticado.');
        }

        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);

        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
            updatedAt: new Date().toISOString()
        }, { merge: true });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        getCurrentUserData,
        updateUserProfile,
        changeUserPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
