import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Shield, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface AdminOverview {
    users: {
        total: number;
        farmers: number;
        buyers: number;
        admins: number;
        active: number;
        deactivated: number;
    };
    products: {
        total: number;
        outOfStock: number;
    };
    orders: {
        total: number;
        pending: number;
        delivered: number;
        rejected: number;
    };
    reports: {
        total: number;
        open: number;
        resolved: number;
    };
}

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'farmer' | 'buyer' | 'admin';
    isActive: boolean;
    createdAt: string;
}

interface SupportReport {
    id: string;
    category: string;
    description: string;
    status: 'open' | 'resolved';
    reporterName: string;
    reportedUserName: string | null;
    adminNotes: string | null;
    createdAt: string;
}

export const Dashboard: React.FC = () => {
    const [overview, setOverview] = useState<AdminOverview | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [reports, setReports] = useState<SupportReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [overviewData, usersData, reportsData] = await Promise.all([
                api.admin.getOverview(),
                api.admin.getUsers(),
                api.admin.getReports(),
            ]);

            setOverview(overviewData);
            setUsers(usersData);
            setReports(reportsData);
        } catch (error) {
            console.error('Failed to load admin dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user: AdminUser) => {
        try {
            const updated = await api.admin.updateUserStatus(user.id, !user.isActive);
            setUsers(prev => prev.map(item => item.id === updated.id ? updated : item));
            setOverview(prev => prev ? {
                ...prev,
                users: {
                    ...prev.users,
                    active: updated.isActive ? prev.users.active + 1 : Math.max(0, prev.users.active - 1),
                    deactivated: updated.isActive ? Math.max(0, prev.users.deactivated - 1) : prev.users.deactivated + 1
                }
            } : prev);
        } catch (error: any) {
            alert(error.message || 'Failed to update user status');
        }
    };

    const changeUserRole = async (user: AdminUser, role: 'farmer' | 'buyer') => {
        try {
            const updated = await api.admin.updateUserRole(user.id, role);
            setUsers(prev => prev.map(item => item.id === updated.id ? updated : item));
            fetchAdminData();
        } catch (error: any) {
            alert(error.message || 'Failed to update role');
        }
    };

    const resolveReport = async (report: SupportReport) => {
        const notes = prompt('Optional resolution notes for this report:') || '';

        try {
            const updated = await api.admin.resolveReport(report.id, notes);
            setReports(prev => prev.map(item => item.id === updated.id ? { ...item, ...updated } : item));
            setOverview(prev => prev ? {
                ...prev,
                reports: {
                    ...prev.reports,
                    open: Math.max(0, prev.reports.open - 1),
                    resolved: prev.reports.resolved + 1
                }
            } : prev);
        } catch (error: any) {
            alert(error.message || 'Failed to resolve report');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!overview) {
        return <p className="text-gray-600">Unable to load admin dashboard.</p>;
    }

    const openReports = reports.filter(report => report.status === 'open');

    return (
        <div className="space-y-8 pb-20 md:pb-0">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-green-600" /> Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">Manage users, monitor reports, and keep the marketplace safe.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card-premium p-5">
                    <p className="text-xs text-gray-500">Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{overview.users.total}</p>
                    <p className="text-xs text-gray-500 mt-1">{overview.users.active} active • {overview.users.deactivated} disabled</p>
                </div>
                <div className="card-premium p-5">
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{overview.orders.total}</p>
                    <p className="text-xs text-gray-500 mt-1">{overview.orders.pending} pending</p>
                </div>
                <div className="card-premium p-5">
                    <p className="text-xs text-gray-500">Products</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{overview.products.total}</p>
                    <p className="text-xs text-gray-500 mt-1">{overview.products.outOfStock} out of stock</p>
                </div>
                <div className="card-premium p-5">
                    <p className="text-xs text-gray-500">Scam/Support Reports</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{overview.reports.total}</p>
                    <p className="text-xs text-red-600 mt-1">{overview.reports.open} open</p>
                </div>
            </div>

            <div className="card-premium p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" /> User Management
                </h2>
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.id} className="p-4 rounded-xl border border-gray-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <p className="font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.isActive ? 'Active' : 'Disabled'}
                                </span>

                                <select
                                    value={user.role}
                                    onChange={(e) => changeUserRole(user, e.target.value as 'farmer' | 'buyer')}
                                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                                >
                                    <option value="buyer">Buyer</option>
                                    <option value="farmer">Farmer</option>
                                </select>

                                <button
                                    onClick={() => toggleUserStatus(user)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                >
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card-premium p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" /> Open Help Reports
                </h2>

                {openReports.length === 0 ? (
                    <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> No open reports right now.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {openReports.map(report => (
                            <div key={report.id} className="p-4 rounded-xl border border-gray-100">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900 capitalize">{report.category.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500">By {report.reporterName}{report.reportedUserName ? ` • Against ${report.reportedUserName}` : ''}</p>
                                        <p className="text-sm text-gray-700 mt-2">{report.description}</p>
                                    </div>
                                    <button
                                        onClick={() => resolveReport(report)}
                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700"
                                    >
                                        Mark Resolved
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
