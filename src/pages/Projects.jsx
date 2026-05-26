import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { LayoutDashboard, Search, Briefcase, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
    const { user, hasPermission } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardView, setDashboardView] = useState('team');
    const [activeFilter, setActiveFilter] = useState('All');
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [newServiceName, setNewServiceName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allowedRoles = [
        'super_admin', 'admin', 'sales', 'finance',
        'am_head', 'account_manager', 'marketing_manager', 'dev_manager'
    ];
    const canAddService = user && allowedRoles.includes(user.role);
    const canEdit = hasPermission('can_edit');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.get('/api/service-types');
            setServices(response.data);
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        if (!newServiceName.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/service-types', { name: newServiceName });
            setServices([...services, response.data]);
            setNewServiceName('');
            setIsServiceModalOpen(false);
        } catch (error) {
            console.error("Error adding service:", error);
            alert(error.response?.data?.error || "Failed to add service.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [dashboardView]);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`/api/projects?view=${dashboardView}`);
            setProjects(res.data.projects);
        } catch (err) {
            console.error("Failed to fetch projects", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'All' || p.type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status, color) => {
        if (color) {
            if (color === 'Green') return 'bg-green-50 text-green-700 border-green-200';
            if (color === 'Yellow') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            if (color === 'Red') return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        const s = (status || 'Active').toLowerCase();
        if (s === 'active') return 'bg-green-50 text-green-700 border-green-200';
        if (s === 'pause' || s === 'review required') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        if (s === 'hold' || s === 'pending') return 'bg-rose-50 text-rose-700 border-rose-200';
        return 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const handleStatusUpdate = async (e, projectId, updates) => {
        if (e && e.stopPropagation) e.stopPropagation();

        let finalUpdates = { ...updates };

        if (finalUpdates.status && !finalUpdates.status_color) {
            if (finalUpdates.status === 'Active') finalUpdates.status_color = 'Green';
            if (finalUpdates.status === 'Pause' || finalUpdates.status === 'Review Required') finalUpdates.status_color = 'Yellow';
            if (finalUpdates.status === 'Hold' || finalUpdates.status === 'Pending') finalUpdates.status_color = 'Red';
        }
        else if (finalUpdates.status_color && !finalUpdates.status) {
            const currentProject = projects.find(p => p.id === projectId);
            const currentStatus = currentProject?.status || 'Active';

            if (finalUpdates.status_color === 'Green') finalUpdates.status = 'Active';
            if (finalUpdates.status_color === 'Yellow') {
                finalUpdates.status = currentStatus === 'Review Required' ? 'Review Required' : 'Pause';
            }
            if (finalUpdates.status_color === 'Red') {
                finalUpdates.status = currentStatus === 'Pending' ? 'Pending' : 'Hold';
            }
        }

        try {
            await axios.patch(`/api/services/${projectId}/status`, finalUpdates);
            setProjects(projects.map(p => p.id === projectId ? { ...p, ...finalUpdates } : p));
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status on the server. Please try again.");
        }
    };

    return (
        <>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Project Analysis</h1>
                    <p className="text-gray-500 mt-1">Detailed breakdown of active services for your department.</p>
                </div>
                <div className="flex items-center gap-4">
                    {(user?.role === 'am_head' || user?.role === 'account_manager' || user?.role === 'marketing_manager' || user?.role === 'dev_manager' || user?.role === 'seo_specialist' || user?.role === 'ads_specialist') && (
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
                            placeholder="Search client or service..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['All', ...services.map(s => s.name)].map((filterName) => (
                    <button
                        key={filterName}
                        onClick={() => setActiveFilter(filterName)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeFilter === filterName
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                            : 'bg-white text-gray-400 border border-gray-100 hover:border-blue-200'
                            }`}
                    >
                        {filterName}
                    </button>
                ))}
                {canAddService && (
                    <button
                        onClick={() => setIsServiceModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-blue-600 hover:bg-blue-700 text-white shadow duration-150"
                    >
                        + Add service
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 flex justify-center col-span-full">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/clients/${project.client_id}`)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg leading-none">{project.client_name}</h3>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded border border-blue-100 uppercase tracking-widest leading-none">
                                            {project.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">{project.client_domain}</p>
                                </div>
                            </div>

                            <div className="hidden lg:flex items-center gap-8">
                                <div className="text-center min-w-[120px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Manager</p>
                                    <p className="font-bold text-gray-900 text-sm">{project.am_name || 'N/A'}</p>
                                </div>
                                <div className="text-center min-w-[120px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Team Lead</p>
                                    <p className="font-bold text-gray-900 text-sm">{project.tl_name || 'Unassigned'}</p>
                                </div>

                                {canEdit && (
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Health</p>
                                        <div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}>
                                            {['Green', 'Yellow', 'Red'].map(color => {
                                                const currentStatusColor = project.status_color || (
                                                    (project.status === 'Active') ? 'Green' :
                                                        (project.status === 'Pause' || project.status === 'Review Required') ? 'Yellow' :
                                                            (project.status === 'Hold' || project.status === 'Pending') ? 'Red' : 'Green'
                                                );
                                                const isActive = currentStatusColor === color;

                                                return (
                                                    <button
                                                        key={color}
                                                        onClick={(e) => handleStatusUpdate(e, project.id, { status_color: color })}
                                                        className={`w-3 h-3 rounded-full border transition-all ${isActive
                                                            ? (color === 'Green' ? 'bg-green-500 border-green-600 scale-125 shadow-sm' : color === 'Yellow' ? 'bg-yellow-400 border-yellow-500 scale-125 shadow-sm' : 'bg-rose-500 border-rose-600 scale-125 shadow-sm')
                                                            : 'bg-gray-100 border-gray-200 opacity-30 hover:opacity-60'
                                                            }`}
                                                        title={color}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="text-center flex flex-col items-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <select
                                        value={project.status || 'Active'}
                                        disabled={!canEdit}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleStatusUpdate(e, project.id, { status: e.target.value })}
                                        /* FIX: Added [text-align-last:center] and reduced padding to fix spacing */
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border focus:outline-none appearance-none text-center [text-align-last:center] ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'} ${getStatusColor(project.status, project.status_color)}`}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Pause">Pause</option>
                                        <option value="Hold">Hold</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Review Required">Review Required</option>
                                    </select>
                                </div>
                                <div className="text-center min-w-[100px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Fee</p>
                                    <p className="font-black text-gray-900 italic">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.monthly_fee || 0)}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))
                )}

                {!loading && filteredProjects.length === 0 && (
                    <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <LayoutDashboard className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
                        <p className="text-gray-500 text-sm">No services match your current filters or department.</p>
                    </div>
                )}
            </div>

            {/* Add Service Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Service</h2>

                        <form onSubmit={handleAddService}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Name
                                </label>
                                <input
                                    type="text"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    placeholder="e.g., SEO, G-ADS, META"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsServiceModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition duration-150"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-150 disabled:opacity-50"
                                    disabled={isSubmitting || !newServiceName.trim()}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}