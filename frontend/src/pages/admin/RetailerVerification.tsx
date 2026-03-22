import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { 
    Shield, 
    CheckCircle, 
    XCircle, 
    Building2, 
    FileText, 
    MapPin, 
    Phone, 
    Clock,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RetailerVerification: React.FC = () => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const data = await api.retailerProfile.getAdminProfiles();
            setProfiles(data);
        } catch (error) {
            console.error('Failed to fetch retailer profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string) => {
        if (!confirm('Are you sure you want to verify this retailer? They will be able to place bulk orders with discounts.')) return;
        setProcessingId(id);
        try {
            await api.retailerProfile.verify(id, 'Verified by admin');
            await fetchProfiles();
        } catch (error) {
            alert('Verification failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const notes = prompt('Enter reason for rejection:');
        if (notes === null) return;
        setProcessingId(id);
        try {
            await api.retailerProfile.reject(id, notes || 'Rejected by admin');
            await fetchProfiles();
        } catch (error) {
            alert('Rejection failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading applications...</div>;

    const pendingProfiles = profiles.filter(p => p.verificationStatus === 'pending');
    const resolvedProfiles = profiles.filter(p => p.verificationStatus !== 'pending');

    return (
        <div className="max-w-6xl mx-auto p-6 pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate('/admin/dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        Retailer Verifications
                    </h1>
                    <p className="text-gray-500 font-medium">Review and manage business partnership requests</p>
                </div>
            </div>

            {/* Pending Applications Section */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Pending Requests ({pendingProfiles.length})
                </h2>

                {pendingProfiles.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-bold">All caught up! No pending applications.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingProfiles.map(profile => (
                            <div key={profile.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-gray-900">{profile.businessName}</h3>
                                                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{profile.businessType}</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                            Pending Review
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4 flex-1">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">License Number</p>
                                                <p className="text-sm font-bold text-gray-700">{profile.licenseNumber}</p>
                                            </div>
                                        </div>
                                        {profile.gstNumber && (
                                            <div className="flex items-start gap-3">
                                                <Shield className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GST Number</p>
                                                    <p className="text-sm font-bold text-gray-700">{profile.gstNumber}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                                                <p className="text-sm font-bold text-gray-700">{profile.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                                                <p className="text-sm font-medium text-gray-600 leading-snug">{profile.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 flex gap-3">
                                    <button
                                        onClick={() => handleReject(profile.id)}
                                        disabled={!!processingId}
                                        className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(profile.id)}
                                        disabled={!!processingId}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-colors disabled:opacity-50 shadow-lg shadow-green-100"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resolved History Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <HistoryIcon />
                    Resolution History
                </h2>
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Business</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Notes</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {resolvedProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold italic">No history yet</td>
                                </tr>
                            ) : (
                                resolvedProfiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{profile.businessName}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">{profile.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase">{profile.businessType}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {profile.verificationStatus === 'verified' ? (
                                                <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ring-1 ring-green-100">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verified
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ring-1 ring-red-100">
                                                    <XCircle className="w-3 h-3" />
                                                    Rejected
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-500 max-w-xs truncate" title={profile.adminNotes}>{profile.adminNotes || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-gray-400">{new Date(profile.createdAt).toLocaleDateString()}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HistoryIcon = () => (
    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
