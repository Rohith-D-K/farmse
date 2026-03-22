import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
    Shield,
    Users,
    TrendingUp,
    ShoppingBag,
    Globe,
    BarChart3
} from 'lucide-react';

interface AdminStats {
    totalUsers: number;
    totalFarmers: number;
    totalBuyers: number;
    totalOrders: number;
    totalHarvests: number;
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
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [reports, setReports] = useState<SupportReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'reports'>('stats');
    const navigate = useNavigate();

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [statsData, usersData, reportsData] = await Promise.all([
                api.admin.getStats(),
                api.admin.getUsers(),
                api.admin.getReports(),
            ]);

            setStats(statsData);
            setUsers(usersData);
            setReports(reportsData);
        } catch (error) {
            console.error('Failed to load admin dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleDeactivateUser = async (user: AdminUser) => {
        if (!confirm(`Are you sure you want to deactivate ${user.name}?`)) return;
        try {
            await api.admin.deactivateUser(user.id);
            fetchAdminData();
        } catch (error: any) {
            alert(error.message || 'Failed to deactivate user');
        }
    };

    const handleActivateUser = async (user: AdminUser) => {
        if (!confirm(`Are you sure you want to reactivate ${user.name}?`)) return;
        try {
            await api.admin.activateUser(user.id);
            fetchAdminData();
        } catch (error: any) {
            alert(error.message || 'Failed to activate user');
        }
    };

    const resolveReport = async (report: SupportReport) => {
        const notes = prompt('Resolution notes for this report:') || '';
        try {
            await api.admin.resolveReport(report.id, notes);
            fetchAdminData();
        } catch (error: any) {
            alert(error.message || 'Failed to resolve report');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32 p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white">
                            <Shield className="w-8 h-8" />
                        </div>
                        Platform Control Center
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Global administration and platform management.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                    {(['stats', 'users', 'reports'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'stats' && stats && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <Users className="w-6 h-6 text-indigo-600 mb-4" />
                            <p className="text-2xl font-black text-gray-900">{stats.totalUsers}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Users Total</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <Globe className="w-6 h-6 text-green-600 mb-4" />
                            <p className="text-2xl font-black text-gray-900">{stats.totalFarmers}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Farmers</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <ShoppingBag className="w-6 h-6 text-orange-600 mb-4" />
                            <p className="text-2xl font-black text-gray-900">{stats.totalOrders}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Orders</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <TrendingUp className="w-6 h-6 text-purple-600 mb-4" />
                            <p className="text-2xl font-black text-gray-900">{stats.totalHarvests}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Harvests</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm bg-indigo-50/50">
                            <BarChart3 className="w-6 h-6 text-indigo-700 mb-4" />
                            <p className="text-2xl font-black text-indigo-900">100%</p>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase">Uptime</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-black text-gray-900 mb-6 flex justify-between items-center">
                                Recent Activity
                                <span className="text-[10px] font-black py-1 px-3 bg-red-100 text-red-600 rounded-full">REAL-TIME</span>
                            </h3>
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map(idx => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${idx % 2 === 0 ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">
                                                {idx % 2 === 0 ? 'New Farmer Registration' : 'New Order Placed'}
                                            </p>
                                            <p className="text-xs text-gray-500">2 minutes ago • Platform-wide event</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {activeTab === 'users' && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-2xl font-black text-gray-900">User Management</h2>
                        <div className="flex gap-2">
                             <span className="text-[10px] font-black py-1 px-3 bg-white border border-gray-200 rounded-full">TOTAL: {users.length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">
                                    <th className="px-8 py-4">User</th>
                                    <th className="px-8 py-4">Role</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-900">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                u.role === 'admin' ? 'bg-red-100 text-red-600' :
                                                u.role === 'farmer' ? 'bg-green-100 text-green-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                             <span className={`w-2 h-2 inline-block rounded-full mr-2 ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                             <span className="text-xs font-bold text-gray-600">{u.isActive ? 'Active' : 'Deactivated'}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex gap-4 justify-end">
                                                {u.isActive && u.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeactivateUser(u)}
                                                        className="text-[10px] font-black text-orange-600 uppercase hover:underline"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                {!u.isActive && (
                                                    <button
                                                        onClick={() => handleActivateUser(u)}
                                                        className="text-[10px] font-black text-green-600 uppercase hover:underline"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900">Complaints & Reports</h2>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-purple-200 transition-colors" onClick={() => navigate('/admin/retailer-verification')}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Retailer Verification</p>
                                <p className="text-xs text-gray-500">Manage business partnership requests</p>
                            </div>
                        </div>
                    </div>
                    {reports.length === 0 ? (
                        <div className="py-24 text-center">
                            <p className="text-gray-400 font-bold">No reports filed.</p>
                        </div>
                    ) : (
                        <div className="space-y-0 divide-y divide-gray-50">
                            {reports.map(report => (
                                <div key={report.id} className="p-8 transition-colors hover:bg-gray-50/50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">{report.category}</p>
                                            <h4 className="text-lg font-bold text-gray-900 leading-tight">{report.description}</h4>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                            report.status === 'open' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex gap-4 text-xs font-bold text-gray-400">
                                            <p><span className="text-gray-300">REPORTER:</span> {report.reporterName}</p>
                                            {report.reportedUserName && <p><span className="text-gray-300">REPORTED:</span> {report.reportedUserName}</p>}
                                        </div>
                                        {report.status === 'open' && (
                                            <button
                                                onClick={() => resolveReport(report)}
                                                className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Resolve Report
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
