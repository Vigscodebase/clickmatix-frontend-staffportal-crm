import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import UserManagement from './pages/UserManagement';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';

const ProtectedLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-4 md:p-8 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};

const PermissionRoute = ({ permission }) => {
    const { user, hasPermission, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (!hasPermission(permission)) {
        return <Navigate to="/" replace />; // or show 403 page
    }

    return <Outlet />;
};

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<ProtectedLayout />}>

                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />

                    {/* ✅ Protected by permission */}
                    <Route element={<PermissionRoute permission="manage_staff" />}>
                        <Route path="/users" element={<UserManagement />} />
                    </Route>

                    <Route element={<PermissionRoute permission="view_all_clients" />}>
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/clients/:id" element={<ClientDetail />} />
                    </Route>

                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
