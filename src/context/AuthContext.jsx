import { createContext, useState, useEffect, useContext } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Parse permissions if stringified
            if (typeof parsedUser.permissions === 'string') {
                try {
                    parsedUser.permissions = JSON.parse(parsedUser.permissions);
                } catch (e) {
                    parsedUser.permissions = [];
                }
            }
            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const hasPermission = (perm) => {
        if (!user) return false;
        const role = user.role;
        const isPrivileged = ['super_admin', 'admin'].includes(role);
        const isClientPrivileged = ['sales', 'finance', 'am_head', 'account_manager', 'marketing_manager', 'dev_manager'].includes(role);

        //default privileged access for certain permissions
        if (isPrivileged) {
            if (['assign_managers', 'view_all_clients', 'manage_staff', 'can_add', 'can_edit'].includes(perm)) {
                return true;
            }
        }

        //Client privileged access for certain permissions
        if (isClientPrivileged) {
            if (['assign_managers', 'view_all_clients', 'can_add', 'can_edit'].includes(perm)) {
                return true;
            }
        }


        // Handle standard flags
        if (perm === 'can_add') return user.can_add === 1;
        if (perm === 'can_edit') return user.can_edit === 1;
        if (perm === 'can_delete') return user.can_delete === 1;

        // Handle granular permissions
        return user.permissions && user.permissions.includes(perm);
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/login', { email, password });
            const { token, user: loggedInUser } = res.data;

            // Parse permissions for the session
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