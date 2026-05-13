import { createContext, useState, useEffect, useContext } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                // 1. Immediately set state from LocalStorage so UI loads instantly
                let parsedUser = JSON.parse(storedUser);
                if (typeof parsedUser.permissions === 'string') {
                    try { parsedUser.permissions = JSON.parse(parsedUser.permissions); }
                    catch (e) { parsedUser.permissions = []; }
                }
                setUser(parsedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // 2. SILENT BACKGROUND SYNC: Fetch latest permissions on refresh
                try {
                    const response = await axios.get('/api/profile');
                    const freshUser = response.data.user;
                    const freshToken = response.data.token; // The new token from backend

                    // 3. Update local storage and state with the fresh data
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    localStorage.setItem('token', freshToken);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;

                    setUser(freshUser); // This triggers the re-render to hide/show buttons
                } catch (error) {
                    console.error("Failed to sync session:", error);
                    // If the backend says token is entirely invalid, log them out
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const hasPermission = (perm) => {
        if (!user) return false;
        const role = user.role;

        // 1. Super Admins and Admins always get full access
        const isPrivileged = ['super_admin', 'admin'].includes(role);
        if (isPrivileged) return true;

        // 2. Client Privileged roles automatically get to see all clients
        const isClientPrivileged = ['sales', 'finance', 'am_head', 'account_manager', 'marketing_manager', 'dev_manager'].includes(role);
        if (isClientPrivileged && perm === 'view_all_clients') {
            return true;
        }

        // 3. STRICT check for boolean permissions
        if (perm === 'can_add') return user.can_add === 1 || user.can_add === true || user.can_add === '1';
        if (perm === 'can_edit') return user.can_edit === 1 || user.can_edit === true || user.can_edit === '1';
        if (perm === 'can_delete') return user.can_delete === 1 || user.can_delete === true || user.can_delete === '1';

        // 4. Check dynamic permissions array
        if (Array.isArray(user.permissions) && user.permissions.includes(perm)) {
            return true;
        }

        return false;
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/login', { email, password });
            const { token, user: loggedInUser } = response.data;

            if (typeof loggedInUser.permissions === 'string') {
                try {
                    loggedInUser.permissions = JSON.parse(loggedInUser.permissions);
                } catch (e) {
                    loggedInUser.permissions = [];
                }
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(loggedInUser);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // Function to instantly sync profile edits across the app and local storage
    const updateUser = (updatedFields) => {
        setUser((prevUser) => {
            const newUser = { ...prevUser, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, hasPermission, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};