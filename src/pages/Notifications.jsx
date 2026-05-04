import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { Bell, Check, Clock, Info, AlertTriangle, Loader2 } from 'lucide-react';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data.notifications);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'approval': return <Check className="w-5 h-5 text-green-600" />;
            case 'onboarding': return <Info className="w-5 h-5 text-blue-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
            default: return <Bell className="w-5 h-5 text-indigo-600" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">Stay updated with the latest activity in Clickmatix.</p>
                </div>
            </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                                    <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No new notifications.</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.is_read && markAsRead(n.id)}
                                        className={`group bg-white rounded-2xl p-6 border transition-all cursor-pointer flex items-start gap-4 ${n.is_read ? 'border-gray-100 opacity-75' : 'border-blue-100 bg-blue-50/20 shadow-sm shadow-blue-100/50 hover:border-blue-200'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`font-bold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.message}</p>
                                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                <Clock className="w-3 h-3" />
                                                {new Date(n.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
        </div>
    );
}
