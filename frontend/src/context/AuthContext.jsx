import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch fresh user data from /me (called on mount and after XP changes)
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get(`${API}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            refreshUser().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const res = await axios.post(`${API}/api/auth/login`, { username, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const register = async (username, email, password, captchaQuestion, captchaAnswer) => {
        const res = await axios.post(`${API}/api/auth/register`, {
            username,
            email,
            password,
            captchaQuestion,
            captchaAnswer
        });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Merge local updates immediately, then also sync fresh from server
    const updateUser = (updatedFields) => {
        setUser(prev => ({ ...prev, ...updatedFields }));
    };

    // Called after any XP-earning action (interview, quest, quiz)
    // Immediately applies the delta locally, then syncs with server
    const addXP = (xpDelta, newLevel) => {
        setUser(prev => {
            if (!prev) return prev;
            const newXp = (prev.xp || 0) + xpDelta;
            return { ...prev, xp: newXp, level: newLevel || prev.level };
        });
        // Background sync to ensure accuracy
        setTimeout(() => refreshUser(), 1500);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token: localStorage.getItem('token'),
            login,
            register,
            logout,
            updateUser,
            addXP,
            refreshUser,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
