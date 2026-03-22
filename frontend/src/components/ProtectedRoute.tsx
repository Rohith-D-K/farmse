import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'farmer' | 'buyer' | 'admin' | 'retailer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on user role
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }

        if (user.role === 'farmer') {
            return <Navigate to="/farmer/dashboard" replace />;
        }

        if (user.role === 'retailer') {
            return <Navigate to="/retailer/dashboard" replace />;
        }

        return <Navigate to="/marketplace" replace />;
    }

    return <>{children}</>;
};
