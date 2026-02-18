import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    location: string;
    role: 'farmer' | 'buyer';
    deliveryLocation: string | null;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (email: string, password: string, userData: Partial<User>) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const currentUser = await api.auth.getCurrentUser();
            setUser(currentUser);
        } catch {
            console.log('Not authenticated');
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, userData: Partial<User>) => {
        try {
            const newUser = await api.auth.register({
                email,
                password,
                name: userData.name!,
                phone: userData.phone!,
                location: userData.location!,
                role: userData.role!,
                deliveryLocation: userData.deliveryLocation || undefined,
            });
            setUser(newUser);
            return newUser;
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.message || 'Registration failed');
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const loggedInUser = await api.auth.login(email, password);
            setUser(loggedInUser);
            return loggedInUser;
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Login failed');
        }
    };

    const logout = async () => {
        try {
            await api.auth.logout();
        } catch (error: any) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
