import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    User,
    LogOut,
    ShieldCheck,
    Briefcase,
    Bell
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
    const [unreadCount, setUnreadCount] = useState(0);
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();
    const isFetching = useRef(false);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();

            // --- FIX: REAL-TIME WEBSOCKET CONNECTION ---
            const token = localStorage.getItem('token');
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Assuming your backend runs on port 5000 of the same hostname
            const wsUrl = `${protocol}//${window.location.hostname}:5000?token=${token}`;

            const ws = new WebSocket(wsUrl);

            // Listen for the push notification from the server
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.event === 'new_notification') {
                    // Instantly update badge count
                    fetchUnreadCount();
                    // Alert the Notifications page to refresh if it's currently open
                    window.dispatchEvent(new Event('notificationReceived'));
                }
            };

            // Listen for internal "Read" clicks to instantly drop the counter
            const handleNotificationRead = () => {
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            };
            window.addEventListener('notificationRead', handleNotificationRead);

            // --- THE FALLBACK LISTENER ---
            // If the server fails, Notifications.jsx fires this, and we fetch the real number again
            const handleFullRefresh = () => fetchUnreadCount();
            window.addEventListener('notificationRefresh', handleFullRefresh);

            return () => {
                ws.close();
                window.removeEventListener('notificationRead', handleNotificationRead);
                window.removeEventListener('notificationRefresh', handleFullRefresh);
            };
            // -------------------------------------------
        }
    }, [user?.id]);

    const fetchUnreadCount = async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
            const res = await axios.get('/api/notifications');
            const unread = res.data.notifications.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch unread count');
        } finally {
            isFetching.current = false;
        }
    };

    const canManageUsers = hasPermission('manage_staff');

    const blockedClientRoles = ['seo_specialist', 'ads_specialist', 'staff'];

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'Projects', icon: Briefcase, path: '/projects' },
        ...(!blockedClientRoles.includes(user?.role)
            ? [{ label: 'Clients', icon: Users, path: '/clients' }]
            : []),
        { label: 'Notifications', icon: Bell, path: '/notifications', badge: unreadCount },
        ...(canManageUsers ? [
            { label: 'User Management', icon: ShieldCheck, path: '/users' },
        ] : []),
        { label: 'Profile', icon: User, path: '/profile' },
    ];

    return (
        <div className="fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white flex flex-col shadow-xl z-50">
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-lg block leading-none">ClickMatix</span>
                        <span className="text-xs text-blue-400 font-medium tracking-wider uppercase">Staff Portal</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-900/20"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={clsx("w-5 h-5", isActive ? "text-white" : "group-hover:text-blue-400")} />
                                <span>{item.label}</span>
                            </div>
                            {item.badge > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-gray-800/40 rounded-2xl border border-gray-800">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate text-white">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            {user?.role?.replace('_', ' ') || 'Staff'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200 text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}