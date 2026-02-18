import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopHeader } from './TopHeader';

export const AppLayout: React.FC = () => {
    const location = useLocation();
    const isAuthPage = ['/login', '/register'].includes(location.pathname);

    if (isAuthPage) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <TopHeader />

            <main className="flex-1 container mx-auto px-4 py-4 md:py-8 mb-16 md:mb-0 max-w-7xl animate-fade-in">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
};
