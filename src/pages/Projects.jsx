import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { LayoutDashboard, Search, Briefcase, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardView, setDashboardView] = useState('team'); // 'team' or 'mine'
    const [activeFilter, setActiveFilter] = useState('All');
    const navigate = useNavigate();

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

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'pause': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'hold': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const handleStatusUpdate = async (e, projectId, updates) => {
        e.stopPropagation();
        try {
            await axios.patch(`/api/services/${projectId}/status`, updates);
            setProjects(projects.map(p => p.id === projectId ? { ...p, ...updates } : p));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const serviceTypes = ['All', 'SEO', 'G-ADS', 'META', 'EMAIL', 'SMM', 'Development'];

    return (
        <>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Project Analysis</h1>
                    <p className="text-gray-500 mt-1">Detailed breakdown of active services for your department.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Team/Mine Toggle for AM Head and Admins */}
                    {(user?.role === 'am_head' || user?.role === 'super_admin' || user?.role === 'admin') && (
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
                    {serviceTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveFilter(type)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeFilter === type
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                : 'bg-white text-gray-400 border border-gray-100 hover:border-blue-200'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
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
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Health</p>
                                        <div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}>
                                            {['Green', 'Orange', 'Red'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleStatusUpdate({ stopPropagation: () => { } }, project.id, { status_color: color })}
                                                    className={`w-3 h-3 rounded-full border transition-all ${project.status_color === color
                                                        ? (color === 'Green' ? 'bg-green-500 border-green-600 scale-125 shadow-sm' : color === 'Orange' ? 'bg-amber-400 border-amber-500 scale-125 shadow-sm' : 'bg-rose-500 border-rose-600 scale-125 shadow-sm')
                                                        : 'bg-gray-100 border-gray-200 opacity-30 hover:opacity-60'
                                                        }`}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                        <select
                                            value={project.status || 'Active'}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleStatusUpdate(e, project.id, { status: e.target.value })}
                                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border focus:outline-none appearance-none cursor-pointer ${getStatusColor(project.status)}`}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Pause">Pause</option>
                                            <option value="Hold">Hold</option>
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
        </>
    );
}
