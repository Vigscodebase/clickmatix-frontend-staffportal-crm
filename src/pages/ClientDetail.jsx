import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import {
    ArrowLeft, Mail, Phone, Globe, ChevronDown, ChevronUp, User,
    AlertCircle, Search, TrendingUp, Facebook, AtSign, MessageSquare,
    Edit2, Trash2, Plus, X, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VERSION = "V2_DEBUG";

export default function ClientDetail() {
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [expandedService, setExpandedService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [serviceTypes, setServiceTypes] = useState([]);

    // Modals
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);

    const [editingClient, setEditingClient] = useState({
        name: '', email: '', phone: '', domain: '',
        account_manager_id: '', marketing_manager_id: '', dev_manager_id: '', am_head_id: '', status: 'Active',
        agreement_status: 'Pending', invoice_status: 'Pending', recurring_day: 1,
        onboarding_date: '', onboarding_pdf_url: ''
    });

    const [editingService, setEditingService] = useState({
        id: null, type: 'SEO', monthly_fee: 0, ad_spend: 0, tl_id: '', status: 'Active'
    });

    useEffect(() => {
        fetchClientData();
        fetchStaff();
    }, [id]);

    useEffect(() => {
        const fetchServiceTypes = async () => {
            try {
                const response = await axios.get('/api/service-types');
                setServiceTypes(response.data);
            } catch (error) {
                console.error("Error fetching service types:", error);
            }
        };
        fetchServiceTypes();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setError('The request is taking too long. The server might be unreachable or the database might be locked.');
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [loading]);

    const fetchClientData = async () => {
        try {
            const res = await axios.get(`/api/clients/${id}`);
            if (!res.data.client) {
                setError('Client not found');
                return;
            }
            setClient(res.data.client);
            setServices(res.data.services || []);
            setEditingClient({
                name: res.data.client.name || '',
                email: res.data.client.email || '',
                phone: res.data.client.phone || '',
                domain: res.data.client.domain || '',
                account_manager_id: res.data.client.account_manager_id || '',
                marketing_manager_id: res.data.client.marketing_manager_id || '',
                dev_manager_id: res.data.client.dev_manager_id || '',
                am_head_id: res.data.client.am_head_id || '',
                status: res.data.client.status || 'Active',
                agreement_status: res.data.client.agreement_status || 'Pending',
                invoice_status: res.data.client.invoice_status || 'Pending',
                recurring_day: res.data.client.recurring_day || 1,
                onboarding_date: res.data.client.onboarding_date || '',
                onboarding_pdf_url: res.data.client.onboarding_pdf_url || ''
            });
        } catch (err) {
            console.error('Failed to fetch client', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch client data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/staff');
            setStaff(res.data.users || []);
        } catch (err) {
            console.error('Failed to fetch staff', err);
        }
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/clients/${id}`, editingClient);
            setClientModalOpen(false);
            fetchClientData();
        } catch (err) {
            setError('Failed to update client info');
        }
    };

    const handleUpdateFinanceStatus = async (field, value) => {
        try {
            await axios.patch(`/api/clients/${id}/finance`, { [field]: value });
            fetchClientData();
        } catch (err) {
            alert('Failed to update finance status');
        }
    };

    const handleAssignStaff = async (payload) => {
        try {
            await axios.patch(`/api/clients/${id}/assign`, payload);
            fetchClientData();
            alert('Staff assigned successfully');
        } catch (err) {
            alert('Failed to assign staff');
        }
    };

    const handleCompleteOnboarding = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`/api/clients/${id}/onboarding`, {
                onboarding_date: editingClient.onboarding_date,
                onboarding_pdf_url: editingClient.onboarding_pdf_url
            });
            fetchClientData();
            alert('Onboarding documentation saved');
        } catch (err) {
            alert('Failed to save onboarding documentation');
        }
    };

    const handleUpdateService = async (svcId, updates) => {
        try {
            await axios.put(`/api/services/${svcId}`, updates);
            fetchClientData();
        } catch (err) {
            console.error('Failed to update service', err);
        }
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        try {
            if (editingService.id) {
                await axios.put(`/api/services/${editingService.id}`, editingService);
            } else {
                await axios.post('/api/services', { ...editingService, client_id: id });
            }
            setServiceModalOpen(false);
            fetchClientData();
        } catch (err) {
            setError('Failed to save service');
        }
    };

    const handleDeleteService = async (svcId) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await axios.delete(`/api/services/${svcId}`);
            fetchClientData();
        } catch (err) {
            alert('Failed to delete service');
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm('Are you absolutely sure? This will delete the client and all their services.')) return;
        try {
            await axios.delete(`/api/clients/${id}`);
            navigate('/clients');
        } catch (err) {
            alert('Failed to delete client');
        }
    };

    const canEdit = hasPermission('can_edit');
    const canDelete = hasPermission('can_delete');
    const canApproveFinance = hasPermission('approve_finance');
    const canAssignManagers = hasPermission('assign_managers');
    const canViewRevenue = hasPermission('view_revenue');

    const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const isAMHead = user?.role === 'am_head';
    const isMM = user?.role === 'marketing_manager';
    const isDM = user?.role === 'dev_manager';
    const isSales = user?.role === 'sales';

    const canEditAM = isSuperAdmin || isAMHead;
    const canEditMM = isSuperAdmin || isMM;
    const canEditDM = isSuperAdmin || isDM;
    const canEditTL = isSuperAdmin || isMM || isDM;
    const canEditBasicInfo = isSuperAdmin;

    const getTrafficLightColor = (status) => {
        if (!status) return 'bg-gray-300';
        const s = status.toLowerCase();
        if (s.includes('green')) return 'bg-green-500';
        if (s.includes('yellow')) return 'bg-yellow-500';
        if (s.includes('red')) return 'bg-red-500';
        return 'bg-gray-300';
    };

    const getServiceIcon = (type) => {
        const iconProps = { className: "w-6 h-6" };
        switch (type) {
            case 'SEO': return <Search {...iconProps} />;
            case 'G-ADS': return <TrendingUp {...iconProps} />;
            case 'META': return <Facebook {...iconProps} />;
            case 'EMAIL': return <AtSign {...iconProps} />;
            case 'SMM': return <MessageSquare {...iconProps} />;
            default: return <AlertCircle {...iconProps} />;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-xs text-gray-400">Loading Client Data ({VERSION})</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-8">
                <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button onClick={() => { setError(''); setLoading(true); fetchClientData(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex-1 p-8">
                <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Client not found</p>
                    <button onClick={() => navigate('/clients')} className="mt-4 text-blue-600 hover:underline">
                        Back to Clients
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Clients
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                            {client?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 uppercase">{client?.name || 'Unknown Client'}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                {client.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {client.email}
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {client.phone}
                                    </div>
                                )}
                                {client.domain && (
                                    <div className="flex items-center gap-1">
                                        <Globe className="w-4 h-4" />
                                        {client.domain}
                                    </div>
                                )}
                                {client.am_head_name && (
                                    <div className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md text-purple-700 font-bold text-[10px] border border-purple-100">
                                        AM HEAD: {client.am_head_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {canEdit && (
                            <button
                                onClick={() => setClientModalOpen(true)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Client"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDeleteClient}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Client"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                            {client.status || 'Active'}
                        </span>
                    </div>
                </div>

                <div className="mt-8 mb-4">
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2"></div>
                        <div className="relative flex justify-between">
                            {[
                                { label: 'Sales Handover', done: true },
                                { label: 'Finance Review', done: client.agreement_status === 'Signed' && client.invoice_status === 'Paid' },
                                { label: 'Head Assignment', done: client.account_manager_id && (client.marketing_manager_id || client.dev_manager_id) },
                                { label: 'Onboarding', done: !!client.onboarding_date },
                                { label: 'Execution', done: services.length > 0 && services.every(s => s.tl_id) }
                            ].map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step.done ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${step.done ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Agreement Status</p>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${client.agreement_status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {client.agreement_status || 'Pending'}
                                    </span>
                                    {canApproveFinance && (
                                        <select
                                            className="text-xs border rounded p-1"
                                            value={client.agreement_status || 'Pending'}
                                            onChange={(e) => handleUpdateFinanceStatus('agreement_status', e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Signed">Signed</option>
                                            <option value="Review Required">Review Required</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Payment/Invoice Status</p>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${client.invoice_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {client.invoice_status || 'Pending'}
                                    </span>
                                    {canApproveFinance && (
                                        <select
                                            className="text-xs border rounded p-1"
                                            value={client.invoice_status || 'Pending'}
                                            onChange={(e) => handleUpdateFinanceStatus('invoice_status', e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Review Required">Review Required</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                        {client.agreement_status !== 'Signed' || client.invoice_status !== 'Paid' ? (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-tight">Pending Finance Verification</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-tight">Fully Operational</span>
                            </div>
                        )}
                    </div>

                    {canApproveFinance && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Marketing Manager</label>
                                <select
                                    className="w-full text-xs border rounded p-1.5 bg-white"
                                    value={client.marketing_manager_id || ''}
                                    onChange={(e) => handleUpdateFinanceStatus('marketing_manager_id', e.target.value)}
                                >
                                    <option value="">Assign MM</option>
                                    {staff.filter(s => s.department === 'Marketing' || s.role === 'marketing_manager').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Dev Manager</label>
                                <select
                                    className="w-full text-xs border rounded p-1.5 bg-white"
                                    value={client.dev_manager_id || ''}
                                    onChange={(e) => handleUpdateFinanceStatus('dev_manager_id', e.target.value)}
                                >
                                    <option value="">Assign DM</option>
                                    {staff.filter(s => s.department === 'Development' || s.role === 'dev_manager').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">AM Head</label>
                                <select
                                    className="w-full text-xs border rounded p-1.5 bg-white"
                                    value={client.am_head_id || ''}
                                    onChange={(e) => handleUpdateFinanceStatus('am_head_id', e.target.value)}
                                >
                                    <option value="">Assign AM Head</option>
                                    {staff.filter(s => s.role === 'am_head').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3 mt-2 border-t pt-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Recurring Invoice Day (Monthly)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number" min="1" max="31"
                                        className="w-20 text-xs border rounded p-1.5 bg-white"
                                        value={client.recurring_day || 1}
                                        onChange={(e) => handleUpdateFinanceStatus('recurring_day', Number(e.target.value))}
                                    />
                                    <p className="text-[10px] text-gray-500 italic">Invoices will be generated and notifications sent on this day of every month.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(isSuperAdmin || isAMHead || isMM || isDM) && (client.agreement_status === 'Signed' && client.invoice_status === 'Paid') && (
                        <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4">Departmental Assignments</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(isSuperAdmin || isAMHead) && (
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold text-blue-700 uppercase">Account Manager Assignment</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="flex-1 text-xs border rounded p-1.5 bg-white"
                                                value={client.account_manager_id || ''}
                                                onChange={(e) => handleAssignStaff({ account_manager_id: e.target.value })}
                                            >
                                                <option value="">Select Account Manager</option>
                                                {staff.filter(s => s.role === 'account_manager' || s.department === 'Sales').map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {(isSuperAdmin || isMM || isDM) && (
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold text-blue-700 uppercase">Service Team Leads Assignment</label>
                                        <div className="space-y-2">
                                            {services.map(svc => (
                                                <div key={svc.id} className="flex items-center justify-between gap-4 bg-white p-2 rounded border border-blue-50">
                                                    <span className="text-[10px] font-bold text-gray-600 w-20">{svc.type}</span>
                                                    <select
                                                        className="flex-1 text-xs border rounded p-1 bg-white"
                                                        value={svc.tl_id || ''}
                                                        onChange={(e) => handleAssignStaff({ tl_id: e.target.value, service_type: svc.type })}
                                                    >
                                                        <option value="">Assign TL</option>
                                                        {staff.filter(s => s.role === 'staff' || s.role === 'team_lead').map(s => (
                                                            <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(isSuperAdmin || user?.id === client.account_manager_id) && (client.account_manager_id) && (
                        <div className="mt-6 p-4 bg-green-50/50 rounded-xl border border-green-100">
                            <h3 className="text-xs font-black text-green-900 uppercase tracking-widest mb-4">Onboarding Documentation</h3>
                            <form onSubmit={handleCompleteOnboarding} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-green-700 uppercase">Onboarding Date</label>
                                    <input
                                        type="date"
                                        className="w-full text-xs border rounded p-1.5 bg-white"
                                        value={editingClient.onboarding_date}
                                        onChange={(e) => setEditingClient({ ...editingClient, onboarding_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-green-700 uppercase">Onboarding Discussion (PDF Link)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter PDF URL or click simulate upload"
                                            className="flex-1 text-xs border rounded p-1.5 bg-white"
                                            value={editingClient.onboarding_pdf_url}
                                            onChange={(e) => setEditingClient({ ...editingClient, onboarding_pdf_url: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setEditingClient({ ...editingClient, onboarding_pdf_url: `https://storage.agency.com/docs/onboarding-${id}.pdf` })}
                                            className="px-3 py-1 bg-green-600 text-white text-[10px] rounded font-bold uppercase"
                                        >
                                            Simulate Upload
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white text-xs rounded-lg font-bold uppercase shadow-sm hover:bg-green-700 transition-colors">
                                        Save Onboarding Info
                                    </button>
                                </div>
                            </form>
                            {client.onboarding_pdf_url && (
                                <div className="mt-4 p-2 bg-white rounded border border-green-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-[10px] text-gray-600 font-medium">Onboarding document attached:</span>
                                        <a href={client.onboarding_pdf_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline">View PDF</a>
                                    </div>
                                    <span className="text-[10px] text-gray-400">Date: {client.onboarding_date}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                    {canEdit && (
                        <button
                            onClick={() => {
                                setEditingService({ id: null, type: 'SEO', monthly_fee: 0, ad_spend: 0, tl_id: '', status: 'Active', revenue_type: 'Recurring', revenue_month: '' });
                                setServiceModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Service
                        </button>
                    )}
                </div>

                {services.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                        No services assigned to this client yet.
                    </div>
                ) : (
                    services.map((service) => (
                        <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        {getServiceIcon(service.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{service.type}</h3>
                                        <p className="text-sm text-gray-600">
                                            Monthly Fee: <span className="font-medium">${service.monthly_fee?.toFixed(2) || '0.00'}</span>
                                            {service.ad_spend > 0 && (
                                                <span className="ml-4">Ad Spend: <span className="font-medium">${service.ad_spend?.toFixed(2)}</span></span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 mr-4">
                                            <span className="text-xs text-gray-500">Status:</span>
                                            <div className={`w-3 h-3 rounded-full ${getTrafficLightColor(service.status)}`} title={service.status}></div>
                                        </div>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingService({ ...service });
                                                    setServiceModalOpen(true);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteService(service.id);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {expandedService === service.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </div>
                            </div>

                            {expandedService === service.id && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Team Lead</p>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <select
                                                    disabled={isSales}
                                                    value={service.tl_id || ''}
                                                    onChange={(e) => handleUpdateService(service.id, { tl_id: e.target.value })}
                                                    className="w-full text-xs border rounded p-1.5 bg-white disabled:bg-gray-50"
                                                >
                                                    <option value="">Select TL</option>
                                                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Service Status</p>
                                            <span className="text-sm font-medium text-gray-900">{service.status || 'Active'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {clientModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Edit Client Information</h2>
                            <button onClick={() => setClientModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateClient} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Client Name</label>
                                    <input
                                        type="text" required
                                        value={editingClient.name}
                                        onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Domain</label>
                                    <input
                                        type="text"
                                        value={editingClient.domain}
                                        onChange={(e) => setEditingClient({ ...editingClient, domain: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={editingClient.email}
                                        onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone</label>
                                    <input
                                        type="text"
                                        value={editingClient.phone}
                                        onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Account Manager</label>
                                    <select
                                        disabled={!canEditAM || isSales}
                                        value={editingClient.account_manager_id}
                                        onChange={(e) => setEditingClient({ ...editingClient, account_manager_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none disabled:bg-gray-50"
                                    >
                                        <option value="">Select Manager</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Marketing Manager</label>
                                    <select
                                        disabled={!canEditMM || isSales}
                                        value={editingClient.marketing_manager_id}
                                        onChange={(e) => setEditingClient({ ...editingClient, marketing_manager_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none disabled:bg-gray-50"
                                    >
                                        <option value="">Select Manager</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Dev Manager</label>
                                    <select
                                        disabled={!canEditDM || isSales}
                                        value={editingClient.dev_manager_id}
                                        onChange={(e) => setEditingClient({ ...editingClient, dev_manager_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none disabled:bg-gray-50"
                                    >
                                        <option value="">Select Manager</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">AM Head</label>
                                    <select
                                        disabled={!isSuperAdmin || isSales}
                                        value={editingClient.am_head_id}
                                        onChange={(e) => setEditingClient({ ...editingClient, am_head_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none disabled:bg-gray-50"
                                    >
                                        <option value="">Select AM Head</option>
                                        {staff.filter(s => s.role === 'am_head').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setClientModalOpen(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {serviceModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingService.id ? 'Edit Service' : 'Add New Service'}
                            </h2>
                            <button onClick={() => setServiceModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveService} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Service Type</label>
                                {/* <select
                                    value={editingService.type}
                                    onChange={(e) => setEditingService({ ...editingService, type: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                    disabled={!isSuperAdmin && (isMM || isDM) && editingService.id}
                                >
                                    {(isSuperAdmin || isMM) && (
                                        <>
                                            <option value="SEO">SEO</option>
                                            <option value="G-ADS">G-ADS</option>
                                            <option value="META">META</option>
                                            <option value="EMAIL">EMAIL</option>
                                            <option value="SMM">SMM</option>
                                        </>
                                    )}
                                    {(isSuperAdmin || isDM) && <option value="Development">Development</option>}
                                </select> */}

                                <select
                                    name="type"
                                    value={editingService.type || ''} // Adjust variable name based on your state
                                    onChange={(e) => setEditingService({ ...editingService, type: e.target.value })} // Adjust to match your onChange handler
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="" disabled>Select Service Type</option>
                                    {serviceTypes.map((st) => (
                                        <option key={st.id} value={st.name}>
                                            {st.name}
                                        </option>
                                    ))}
                                </select>

                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Monthly Fee</label>
                                    <input
                                        type="number"
                                        value={editingService.monthly_fee}
                                        onChange={(e) => setEditingService({ ...editingService, monthly_fee: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Ad Spend</label>
                                    <input
                                        type="number"
                                        value={editingService.ad_spend}
                                        onChange={(e) => setEditingService({ ...editingService, ad_spend: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Team Lead</label>
                                <select
                                    disabled={!canEditTL || isSales}
                                    value={editingService.tl_id}
                                    onChange={(e) => setEditingService({ ...editingService, tl_id: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none disabled:bg-gray-50"
                                >
                                    <option value="">Select TL</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Project Status</label>
                                <select
                                    value={editingService.status}
                                    onChange={(e) => setEditingService({ ...editingService, status: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pause">Pause</option>
                                    <option value="Hold">Hold</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Revenue Type</label>
                                    <select
                                        value={editingService.revenue_type || 'Recurring'}
                                        onChange={(e) => setEditingService({ ...editingService, revenue_type: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                    >
                                        <option value="Recurring">Recurring</option>
                                        <option value="One-off">One-off</option>
                                    </select>
                                </div>
                                {editingService.revenue_type === 'One-off' && (
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Revenue Month</label>
                                        <input
                                            type="month"
                                            value={editingService.revenue_month || ''}
                                            onChange={(e) => setEditingService({ ...editingService, revenue_month: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setServiceModalOpen(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl">Save Service</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
