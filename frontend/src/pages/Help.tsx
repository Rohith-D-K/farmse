import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { AlertTriangle, LifeBuoy } from 'lucide-react';

interface OrderOption {
    id: string;
    cropName: string;
    farmerId?: string;
}

interface HelpReport {
    id: string;
    category: string;
    description: string;
    status: 'open' | 'resolved';
    adminNotes?: string | null;
    createdAt: string;
}

export const Help: React.FC = () => {
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [reports, setReports] = useState<HelpReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        orderId: '',
        category: 'scam' as 'scam' | 'payment_issue' | 'delivery_issue' | 'other',
        description: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [orderData, reportData] = await Promise.all([
                    api.orders.getAll(),
                    api.help.getMyReports()
                ]);

                setOrders(orderData);
                setReports(reportData);
            } catch (error) {
                console.error('Failed to load help data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const selectedOrder = useMemo(
        () => orders.find(order => order.id === form.orderId),
        [orders, form.orderId]
    );

    const submitReport = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const created = await api.help.createReport({
                orderId: form.orderId || undefined,
                reportedUserId: selectedOrder?.farmerId,
                category: form.category,
                description: form.description
            });

            setReports(prev => [created, ...prev]);
            setForm({
                orderId: '',
                category: 'scam',
                description: ''
            });
        } catch (error: any) {
            alert(error.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <LifeBuoy className="w-6 h-6 text-green-600" /> Help & Report Scammers
                </h1>
                <p className="text-sm text-gray-500 mt-1">Facing a scam or suspicious behavior? Submit a report and our admin team will review it.</p>
            </div>

            <div className="card-premium p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Submit a Report</h2>

                <form onSubmit={submitReport} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Related Order (optional)</label>
                        <select
                            value={form.orderId}
                            onChange={e => setForm(prev => ({ ...prev, orderId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="">No specific order</option>
                            {orders.map(order => (
                                <option key={order.id} value={order.id}>
                                    #{order.id.slice(0, 8)} - {order.cropName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Issue Type</label>
                        <select
                            value={form.category}
                            onChange={e => setForm(prev => ({ ...prev, category: e.target.value as 'scam' | 'payment_issue' | 'delivery_issue' | 'other' }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="scam">Scam / Fraud</option>
                            <option value="payment_issue">Payment Issue</option>
                            <option value="delivery_issue">Delivery Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            required
                            minLength={10}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            placeholder="Describe what happened, including important details."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>

            <div className="card-premium p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Reports</h2>

                {reports.length === 0 ? (
                    <p className="text-sm text-gray-500">No reports submitted yet.</p>
                ) : (
                    <div className="space-y-3">
                        {reports.map(report => (
                            <div key={report.id} className="p-4 border border-gray-100 rounded-xl">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900 capitalize flex items-center gap-1">
                                            <AlertTriangle className="w-4 h-4 text-amber-600" /> {report.category.replace('_', ' ')}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                                        <p className="text-sm text-gray-700 mt-2">{report.description}</p>
                                        {report.adminNotes && (
                                            <p className="text-xs text-blue-700 mt-2">Admin note: {report.adminNotes}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${report.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                        {report.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
