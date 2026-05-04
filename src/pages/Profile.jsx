import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { User, Mail, Briefcase, MapPin, Camera, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        location: 'WFO',
        avatar_url: '',
        password: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/profile');
            if (res.data?.user) {
                setUser(res.data.user);
                setFormData({
                    name: res.data.user.name,
                    location: res.data.user.location || 'WFO',
                    avatar_url: res.data.user.avatar_url || '',
                    password: ''
                });
            } else {
                setMessage('Error: User not found');
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
            setMessage('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await axios.put('/api/profile', formData);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
            fetchProfile();
        } catch (err) {
            console.error('Failed to update profile', err);
            setMessage('Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                <p className="text-gray-500 mt-1">Manage your personal information and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-center p-8">
                                <div className="relative inline-block mb-4">
                                    <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold border-4 border-white shadow-lg overflow-hidden">
                                        {formData.avatar_url ? (
                                            <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            user?.name?.charAt(0)
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = prompt('Enter image URL for avatar:', formData.avatar_url);
                                            if (url !== null) setFormData({ ...formData, avatar_url: url });
                                        }}
                                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">
                                    {user?.role?.replace('_', ' ')}
                                </p>
                                <div className="mt-6 space-y-3 text-left">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                        <span>{user?.department}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.location === 'WFH' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                            {formData.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Information</h3>
                                {message && (
                                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                        <CheckCircle className="w-5 h-5" />
                                        {message}
                                    </div>
                                )}
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (Read Only)</label>
                                            <input
                                                type="email"
                                                disabled
                                                value={user?.email || ''}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password (leave blank to keep)</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Location</label>
                                            <div className="flex gap-2">
                                                {['WFO', 'WFH'].map((loc) => (
                                                    <button
                                                        key={loc}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, location: loc })}
                                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${formData.location === loc ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                                    >
                                                        {loc}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 font-bold disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
            </>
        );
    }
