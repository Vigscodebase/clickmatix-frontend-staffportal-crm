import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../lib/axios';
import { UserPlus, Edit2, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', role: 'staff', department: 'Operations', password: '',
        can_add: 0, can_edit: 0, can_delete: 0, permissions: []
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
            setError('Failed to load users. Are you an admin?');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department || 'Operations',
                password: '',
                can_add: user.can_add || 0,
                can_edit: user.can_edit || 0,
                can_delete: user.can_delete || 0,
                permissions: user.permissions ? JSON.parse(user.permissions) : []
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                role: currentUser?.role === 'am_head' ? 'account_manager' : 'staff',
                department: currentUser?.role === 'am_head' ? 'Sales' : 'Operations',
                password: '',
                can_add: 0, can_edit: 0, can_delete: 0, permissions: []
            });
        }
        setModalOpen(true);
        setError('');
    };

    const togglePermission = (perm) => {
        const newPerms = formData.permissions.includes(perm)
            ? formData.permissions.filter(p => p !== perm)
            : [...formData.permissions, perm];
        setFormData({ ...formData, permissions: newPerms });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const payload = {
            ...formData,
            permissions: JSON.stringify(formData.permissions)
        };
        try {
            if (editingUser) {
                await axios.put(`/api/users/${editingUser.id}`, payload);
            } else {
                await axios.post('/api/users', payload);
            }
            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save user');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const { user: currentUser } = useAuth();

    const roles = [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'sales', label: 'Sales Executive' },
        { value: 'finance', label: 'Finance Team' },
        { value: 'am_head', label: 'Account Manager Head' },
        { value: 'account_manager', label: 'Account Manager' },
        { value: 'marketing_manager', label: 'Marketing Manager' },
        { value: 'dev_manager', label: 'Dev Manager' },
        { value: 'seo_specialist', label: 'SEO TL/Specialist' },
        { value: 'ads_specialist', label: 'Ads TL/Specialist' },
        { value: 'staff', label: 'Staff' }
    ].filter(r => {
        if (currentUser?.role === 'am_head') {
            return r.value === 'account_manager';
        }
        return true;
    });

    const departments = ['Management', 'Finance', 'Sales', 'Marketing', 'Development', 'Operations', 'SEO', 'Paid Ads'];

    const availablePermissions = [
        { id: 'view_revenue', label: 'View Revenue' },
        { id: 'manage_staff', label: 'Manage Staff' },
        { id: 'approve_finance', label: 'Approve Finance' },
        { id: 'assign_managers', label: 'Assign Managers' },
        { id: 'view_all_clients', label: 'View All Clients' },
        { id: 'edit_system_settings', label: 'System Settings' }
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Roles and Permissions.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-200"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Staff
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Dept</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Permissions</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.filter(u => {
                            if (currentUser?.role === 'am_head') {
                                return u.role === 'account_manager';
                            }
                            return true;
                        }).map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{u.name}</p>
                                            <p className="text-[11px] text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{u.role.replace('_', ' ')}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{u.department}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.can_add === 1 && <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase rounded border border-green-100">Add</span>}
                                        {u.can_edit === 1 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded border border-blue-100">Edit</span>}
                                        {u.can_delete === 1 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-black uppercase rounded border border-rose-100">Del</span>}
                                        {u.permissions && JSON.parse(u.permissions).map(p => (
                                            <span key={p} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-black uppercase rounded border border-gray-200">
                                                {p.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleOpenModal(u)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {editingUser ? 'Update Staff Member' : 'Provision New Staff'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                    <input
                                        type="email" required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700"
                                    >
                                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700"
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password {editingUser && '(leave blank to keep current)'}</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingUser ? 'Enter new password if changing' : 'Enter password'}
                                        required={!editingUser}
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Advanced Access Control</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <input type="checkbox" checked={formData.can_add === 1} onChange={(e) => setFormData({ ...formData, can_add: e.target.checked ? 1 : 0 })} className="w-5 h-5 rounded-lg text-blue-600" />
                                            <span className="text-xs font-bold text-gray-700 uppercase">Add Clients</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <input type="checkbox" checked={formData.can_edit === 1} onChange={(e) => setFormData({ ...formData, can_edit: e.target.checked ? 1 : 0 })} className="w-5 h-5 rounded-lg text-blue-600" />
                                            <span className="text-xs font-bold text-gray-700 uppercase">Edit Clients</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <input type="checkbox" checked={formData.can_delete === 1} onChange={(e) => setFormData({ ...formData, can_delete: e.target.checked ? 1 : 0 })} className="w-5 h-5 rounded-lg text-rose-600" />
                                            <span className="text-xs font-bold text-gray-700 uppercase">Delete Clients</span>
                                        </div>

                                        {availablePermissions.map(perm => (
                                            <div key={perm.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 hover:border-blue-300 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="w-5 h-5 rounded-lg text-indigo-600"
                                                />
                                                <span className="text-xs font-bold text-gray-700 uppercase">{perm.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {editingUser ? 'Synchronize Details' : 'Initialize Access'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
