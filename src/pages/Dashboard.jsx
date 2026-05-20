import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import StatCard from '../components/StatCard';
import { DollarSign, FolderOpen, Users, AlertCircle, CheckCircle, Clock, TrendingUp, Filter, User, BarChart, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalMRR: 0, oneOffRevenue: 0, activeAccounts: 0, activeServices: 0,
        pendingInvoices: 0, paidInvoices: 0, numPendingInvoices: 0, numPaidInvoices: 0,
        lostAccounts: 0
    });
    const [serviceDistribution, setServiceDistribution] = useState([]);
    const [accountManagers, setAccountManagers] = useState([]);
    const [pendingReviewClients, setPendingReviewClients] = useState([]);
    const [pendingAssignmentClients, setPendingAssignmentClients] = useState([]);
    const [pendingOnboardingClients, setPendingOnboardingClients] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [dashboardView, setDashboardView] = useState('team'); // 'team' or 'mine'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isSales = user?.role === 'sales';
    const isFinance = user?.role === 'finance';
    const isAMHead = user?.role === 'am_head';
    const isAM = user?.role === 'account_manager';
    const isManager = user?.role === 'marketing_manager' || user?.role === 'dev_manager';
    const isTL = ['seo_specialist', 'ads_specialist', 'staff'].includes(user?.role) || user?.department?.includes('TL');
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    useEffect(() => {
        fetchData();
    }, [selectedMonth, dashboardView]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`/api/dashboard?month=${selectedMonth}&view=${dashboardView}`);
            if (res.data) {
                setStats(res.data.stats || {
                    totalMRR: 0, oneOffRevenue: 0, activeAccounts: 0, activeServices: 0,
                    pendingInvoices: 0, paidInvoices: 0, numPendingInvoices: 0, numPaidInvoices: 0,
                    lostAccounts: 0
                });
                setServiceDistribution(res.data.serviceDistribution || []);
                setAccountManagers(res.data.accountManagers || []);
                setPendingReviewClients(res.data.pendingReviewClients || []);
                setPendingAssignmentClients(res.data.pendingAssignmentClients || []);
                setPendingOnboardingClients(res.data.pendingOnboardingClients || []);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
            setError(err.response?.data?.message || err.message || "Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">
                        {dashboardView === 'team' ? 'Complete organizational metrics and performance' : 'Your personal account performance and metrics'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Team/Mine Toggle for AM Head and Admins */}
                    {(isAMHead || isManager) && (
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
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm min-w-[180px] relative hover:border-blue-300 transition-colors">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="text-sm font-bold bg-transparent outline-none text-gray-700 w-full cursor-pointer z-10"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid - Role Specific */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Basic Stat: Active Accounts (All) */}
                <StatCard
                    title={isTL ? "Assigned Accounts" : "Active Accounts"}
                    value={stats?.activeAccounts || 0}
                    subtext={isTL ? "Your Projects" : "Total Active"}
                    icon={Users}
                    color="bg-blue-600"
                />

                {/* Revenue Stats: Visible to Admins, Finance, or Permission */}
                {(isAdmin || isFinance || hasPermission('view_revenue')) && (
                    <>
                        <StatCard
                            title="Monthly Revenue"
                            value={formatCurrency((stats?.totalMRR || 0) + (stats?.oneOffRevenue || 0))}
                            subtext={`MRR + One-off (${selectedMonth})`}
                            icon={DollarSign}
                            color="bg-emerald-600"
                        />
                    </>
                )}

                {/* Invoice Stats: Hidden from Sales */}
                {(!isSales && (isAdmin || isFinance || isAMHead || isAM || hasPermission('approve_finance') || hasPermission('view_revenue'))) && (
                    <div className="bg-white p-6 rounded-2xl border border-blue-50 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Invoice Status</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-medium text-gray-600">Paid</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(stats?.paidInvoices || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium text-gray-600">Pending</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(stats?.pendingInvoices || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lost Accounts (Managerial/AM view) - Hidden from Sales */}
                {(!isSales && (isAdmin || isAMHead || isAM || isManager || hasPermission('view_all_clients'))) && (
                    <StatCard
                        title="Lost Accounts"
                        value={stats?.lostAccounts || 0}
                        subtext="Since last month"
                        icon={AlertCircle}
                        color="bg-rose-500"
                    />
                )}

                {/* TL Specific Stats: Traffic Light / Budget */}
                {isTL && (
                    <>
                        <StatCard
                            title="Active Services"
                            value={stats?.activeServices || 0}
                            subtext="Across Clients"
                            icon={FolderOpen}
                            color="bg-purple-600"
                        />
                        <div className="bg-white p-6 rounded-2xl border border-amber-50 shadow-sm">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Traffic Light Status</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 rounded-full bg-green-500 shadow-sm shadow-green-100"></div>
                                <div className="flex-1 h-2 rounded-full bg-amber-400"></div>
                                <div className="flex-1 h-2 rounded-full bg-rose-400 opacity-30"></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 font-bold text-center">GREEN ZONE (ACTIVE)</p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Service Distribution (Except Sales) */}
                {(isAdmin || isFinance) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <BarChart className="w-5 h-5 text-blue-600" />
                                Service Distribution
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Service Type</th>
                                        <th className="px-6 py-4">Quantity</th>
                                        {!isTL && <th className="px-6 py-4">Revenue</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {serviceDistribution.map((row) => (
                                        <tr key={row.type} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">{row.type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-600 uppercase font-black text-[10px]">{row.active_accounts} Accounts</span>
                                            </td>
                                            {!isTL && (
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-blue-600">{formatCurrency(row.revenue)}</span>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Account Managers / Team View */}
                {(isAdmin || isAMHead || isFinance) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Management Overview
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Manager</th>
                                        <th className="px-6 py-4">Projects</th>
                                        <th className="px-6 py-4">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {accountManagers.map((am) => (
                                        <tr key={am.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${am.name === 'Unassigned' ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {am.name === 'Unassigned' ? '?' : am.name.charAt(0)}
                                                </div>
                                                <span className={`font-bold uppercase text-[11px] ${am.name === 'Unassigned' ? 'text-gray-500' : 'text-gray-900'}`}>{am.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-600 font-medium">{am.num_accounts} Accounts</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-indigo-600">{formatCurrency(am.revenue)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Sales specific section or Finance Review */}
                {(isSales || isFinance || isAdmin) && pendingReviewClients.length > 0 && (
                    <div className={`lg:col-span-2 mt-4 rounded-2xl border overflow-hidden ${isFinance ? 'border-amber-200 bg-amber-50/10' : 'border-gray-200'}`}>
                        <div className={`p-6 border-b flex items-center justify-between ${isFinance ? 'bg-amber-100/50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                            <h2 className={`font-bold flex items-center gap-2 ${isFinance ? 'text-amber-900' : 'text-gray-900'}`}>
                                <Clock className="w-5 h-5 text-amber-600" />
                                {isFinance ? 'Action Required: Financial Review' : 'Recently Onboarded Clients'}
                            </h2>
                        </div>
                        <div className="bg-white overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-400 uppercase font-black tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4 text-center">Agreement</th>
                                        <th className="px-6 py-4 text-center">Payment</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingReviewClients.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900 uppercase">{c.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md font-bold uppercase text-[9px] ${c.agreement_status === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {c.agreement_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md font-bold uppercase text-[9px] ${c.invoice_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {c.invoice_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-indigo-600 font-bold uppercase tracking-tight">
                                                <button
                                                    onClick={() => navigate(`/clients/${c.id}`)}
                                                    className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Head Assignment Queue */}
                {(isAMHead || isManager || isAdmin) && pendingAssignmentClients.length > 0 && (
                    <div className="lg:col-span-2 mt-4 rounded-2xl border border-blue-200 bg-blue-50/10 overflow-hidden">
                        <div className="p-6 border-b border-blue-200 bg-blue-100/50 flex items-center justify-between">
                            <h2 className="font-bold text-blue-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Action Required: Assign Staff (AM/TL)
                            </h2>
                        </div>
                        <div className="bg-white overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-400 uppercase font-black tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4 text-center">Missing AM</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingAssignmentClients.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900 uppercase">{c.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                {!c.account_manager_id ? (
                                                    <span className="text-rose-600 font-bold uppercase text-[9px]">Required</span>
                                                ) : (
                                                    <span className="text-green-600 font-bold uppercase text-[9px]">Assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-indigo-600 font-bold uppercase tracking-tight">
                                                <button
                                                    onClick={() => navigate(`/clients/${c.id}`)}
                                                    className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* AM Onboarding Queue */}
                {(isAM || isAdmin) && pendingOnboardingClients.length > 0 && (
                    <div className="lg:col-span-2 mt-4 rounded-2xl border border-green-200 bg-green-50/10 overflow-hidden">
                        <div className="p-6 border-b border-green-200 bg-green-100/50 flex items-center justify-between">
                            <h2 className="font-bold text-green-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-green-600" />
                                Action Required: Pending Onboarding
                            </h2>
                        </div>
                        <div className="bg-white overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-400 uppercase font-black tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingOnboardingClients.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900 uppercase">{c.name}</td>
                                            <td className="px-6 py-4 text-center font-bold text-rose-600 uppercase text-[9px]">Needs Documentation</td>
                                            <td className="px-6 py-4 text-center text-indigo-600 font-bold uppercase tracking-tight">
                                                <button
                                                    onClick={() => navigate(`/clients/${c.id}`)}
                                                    className="px-4 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    Onboard
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}