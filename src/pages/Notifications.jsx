import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { Bell, Check, Clock, Info, AlertTriangle, Loader2 } from 'lucide-react';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();

        // --- FIX: Instantly refresh list when WebSocket fires 'notificationReceived' ---
        const handleNewNotification = () => fetchNotifications();
        window.addEventListener('notificationReceived', handleNewNotification);

        return () => {
            window.removeEventListener('notificationReceived', handleNewNotification);
        };
        // -----------------------------------------------------------------------------
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
        // 1. OPTIMISTIC UPDATE: Instantly turn it grey!
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));

        // 2. Dispatch instant decrement to Sidebar
        window.dispatchEvent(new Event('notificationRead'));

        try {
            // 3. Complete the API call quietly in the background
            await axios.patch(`/api/notifications/${id}/read`);
        } catch (err) {
            console.error('Failed to mark as read', err);

            // 4. FALLBACK: Revert the local list back to unread
            fetchNotifications();

            // 5. Tell the Sidebar its math is wrong and it needs to fetch the real number!
            window.dispatchEvent(new Event('notificationRefresh'));
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'approval': return <Check className="w-5 h-5 text-green-600" />;
            case 'onboarding': return <Info className="w-5 h-5 text-blue-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
            case 'assignment': return <Bell className="w-5 h-5 text-purple-600" />;
            case 'payment': return <Info className="w-5 h-5 text-emerald-600" />;
            default: return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">You have no notifications.</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${!n.is_read ? 'cursor-pointer border-blue-100 bg-white shadow-sm shadow-blue-100/50 hover:border-blue-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`font-bold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.message}</p>
                                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 shadow-sm shadow-blue-300"></span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <Clock className="w-3 h-3" />
                                        {new Date(n.updated_at).toLocaleString()}
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