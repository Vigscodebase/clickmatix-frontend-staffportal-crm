import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { Search, Filter, Users, ChevronRight, Loader2, UserPlus, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Clients() {
    const { user, hasPermission } = useAuth();
    const [clients, setClients] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardView, setDashboardView] = useState('team'); // 'team' or 'mine'
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [serviceTypes, setServiceTypes] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        domain: '',
        am_id: '',
        mm_id: '',
        dm_id: '',
        services: []
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();
        fetchStaff();
    }, [dashboardView]);

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

    const fetchClients = async () => {
        try {
            const res = await axios.get(`/api/clients?view=${dashboardView}`);
            setClients(res.data.clients);
        } catch (err) {
            console.error("Failed to fetch clients", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/staff');
            setStaff(res.data.users);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        }
    };

    const handleAddService = () => {
        setFormData({
            ...formData,
            services: [...formData.services, { type: 'SEO', fee: 0, spend: 0, tl_id: '', revenue_type: 'Recurring', revenue_month: '' }]
        });
    };

    const handleRemoveService = (index) => {
        const newServices = [...formData.services];
        newServices.splice(index, 1);
        setFormData({ ...formData, services: newServices });
    };

    const handleServiceChange = (index, field, value) => {
        const newServices = [...formData.services];
        newServices[index][field] = value;
        setFormData({ ...formData, services: newServices });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/clients', formData);
            setModalOpen(false);
            setFormData({ name: '', email: '', phone: '', domain: '', am_id: '', mm_id: '', dm_id: '', services: [] });
            fetchClients();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create client');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.domain && c.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const canAdd = hasPermission('can_add');

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Client Accounts</h1>
                    <p className="text-gray-500 mt-1">Full list of clients and managed services.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Team/Mine Toggle for AM Head and Admins */}
                    {(user?.role === 'am_head' || user?.role === 'account_manager' || user?.role === 'marketing_manager' || user?.role === 'dev_manager') && (
                        <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                            <button
                                onClick={() => setDashboardView('team')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardView === 'team' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Team View
                            </button>
                            <button
                                onClick={() => setDashboardView('mine')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardView === 'mine' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                My Accounts
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 w-64"
                        />
                    </div>
                    {canAdd && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-200"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add Client
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Client Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Account Manager</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Services</th>
                                    {hasPermission('view_revenue') && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Revenue (Recurring/One-off)</th>}
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Finance Approval</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                                        onClick={() => navigate(`/clients/${client.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-xs">{client.name}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">{client.domain}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-700">{client.am_name || 'Unassigned'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(client.services || []).map((svc, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-bold uppercase tracking-tighter border border-gray-200/50">
                                                        {svc.type}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        {hasPermission('view_revenue') && (
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-blue-600 text-sm tracking-tight">Recurring: {formatCurrency(client.recurring_revenue || 0)}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">One-off: {formatCurrency(client.one_off_revenue || 0)}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${client.agreement_status === 'Signed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    Agreement: {client.agreement_status || 'Pending'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${client.invoice_status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    Invoice: {client.invoice_status || 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {client.status === 'Pending' ? (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-rose-100 text-rose-700 border-rose-200`}>
                                                    {client.status}
                                                </span>)
                                                :
                                                (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-100 text-green-700 border-green-200`}>
                                                        {client.status}
                                                    </span>
                                                )
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-all" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && filteredClients.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No clients match your search criteria.</p>
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            {
                modalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900">Add New Client Account</h2>
                                <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                            Basic Information
                                        </h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Client Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Official Website (Domain)</label>
                                            <input
                                                type="text"
                                                value={formData.domain}
                                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                placeholder="e.g. clickmatix.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                    placeholder="contact@client.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone</label>
                                                <input
                                                    type="text"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                    placeholder="Phone Number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                            Account Management
                                        </h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Account Manager (AM)</label>
                                            <select
                                                disabled={user?.role === 'sales'}
                                                value={formData.am_id}
                                                onChange={(e) => setFormData({ ...formData, am_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-50"
                                            >
                                                <option value="">Select Manager</option>
                                                {staff.filter(s => s.role === 'am_head' || s.role === 'account_manager' || s.department === 'Sales').map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Marketing Manager (MM)</label>
                                            <select
                                                disabled={user?.role === 'sales'}
                                                value={formData.mm_id}
                                                onChange={(e) => setFormData({ ...formData, mm_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-50"
                                            >
                                                <option value="">Select Manager</option>
                                                {staff.filter(s => s.department === 'Marketing' || s.role === 'marketing_manager').map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Dev Manager (DM)</label>
                                            <select
                                                disabled={user?.role === 'sales'}
                                                value={formData.dm_id}
                                                onChange={(e) => setFormData({ ...formData, dm_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-50"
                                            >
                                                <option value="">Select Manager</option>
                                                {staff.filter(s => s.department === 'Development' || s.role === 'dev_manager').map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                            Project Services
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleAddService}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Service
                                        </button>
                                    </div>

                                    {formData.services.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            <p className="text-sm text-gray-500 font-medium">No services added to this account yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.services.map((svc, index) => {
                                                // 1. Check which conditional fields should be visible for THIS row
                                                const showAdSpend = svc.type === 'G-ADS' || svc.type === 'META';

                                                // Check if Rev Type is "Recurring" to show the Date field
                                                const showDate = svc.revenue_type === 'Recurring';

                                                // 2. Calculate the exact number of columns needed (Base 5 + conditionals)
                                                let colCount = 5;
                                                if (showAdSpend) colCount++;
                                                if (showDate) colCount++;

                                                // 3. Map to the exact Tailwind class
                                                const gridColsClass = colCount === 5 ? 'grid-cols-5' : colCount === 6 ? 'grid-cols-6' : 'grid-cols-7';

                                                return (
                                                    <div key={index} className={`grid ${gridColsClass} gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 items-end transition-all duration-300`}>

                                                        {/* 1. Service Type */}
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Type</label>
                                                            <select
                                                                value={svc.type}
                                                                onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                required
                                                            >
                                                                <option value="" disabled>Select Service</option>
                                                                {serviceTypes.map((st) => (
                                                                    <option key={st.id} value={st.name}>
                                                                        {st.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* 2. Monthly Fee */}
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Fee</label>
                                                            <input
                                                                type="number"
                                                                value={svc.fee}
                                                                onChange={(e) => handleServiceChange(index, 'fee', e.target.value)}
                                                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 outline-none"
                                                                placeholder="0.00"
                                                            />
                                                        </div>

                                                        {/* 3. Ad Spend (Conditional) */}
                                                        {showAdSpend && (
                                                            <div className="col-span-1 animate-in fade-in zoom-in duration-200">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ad Spend</label>
                                                                <input
                                                                    type="number"
                                                                    value={svc.spend}
                                                                    onChange={(e) => handleServiceChange(index, 'spend', e.target.value)}
                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 outline-none"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* 4. Rev Type */}
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rev Type</label>
                                                            <select
                                                                value={svc.revenue_type}
                                                                onChange={(e) => handleServiceChange(index, 'revenue_type', e.target.value)}
                                                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 outline-none"
                                                            >
                                                                <option value="Recurring">Recurring</option>
                                                                <option value="One-off">One-off</option>
                                                            </select>
                                                        </div>

                                                        {/* 5. Date (Conditional - Only for Recurring) */}
                                                        {showDate && (
                                                            <div className="col-span-1 animate-in fade-in zoom-in duration-200">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={svc.revenue_month}
                                                                    onChange={(e) => handleServiceChange(index, 'revenue_month', e.target.value)}
                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 outline-none"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* 6. Team Lead */}
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Team Lead</label>
                                                            <select
                                                                disabled={user?.role === 'sales' || user?.role === 'finance' || user?.role === 'seo_specialist' || user?.role === 'ads_specialist' || user?.role === 'staff'}
                                                                value={svc.tl_id}
                                                                onChange={(e) => handleServiceChange(index, 'tl_id', e.target.value)}
                                                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 outline-none disabled:bg-gray-50"
                                                            >
                                                                <option value="">Select TL</option>
                                                                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
                                                            </select>
                                                        </div>

                                                        {/* 7. Delete Button */}
                                                        <div className="col-span-1 flex justify-end pb-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveService(index)}
                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                                    >
                                        Create Account & Services
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}