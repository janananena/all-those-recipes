import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const apiBaseUrl = `/api`;

type AuthContextType = {
    user: string | null;
    token: string | null;
    roles: string[];
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    roles: [],
    login: async () => {},
    logout: () => {},
    changePassword: async () => {},
    loading: true
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            axios.get(`${apiBaseUrl}/me`)
                .then(res => {
                    setUser(res.data.username);
                    setRoles(res.data.roles);
                })
                .catch(err => {
                    console.error("Token invalid or expired", err);
                    logout();
                }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        const res = await axios.post(`${apiBaseUrl}/login`, { username, password });
        const t = res.data.token;

        setToken(t);
        localStorage.setItem('token', t);
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;

        const me = await axios.get(`${apiBaseUrl}/me`, {
            headers: {
                Authorization: `Bearer ${t}`,
            },
        });
        setUser(me.data.username);
        setRoles(me.data.roles);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setRoles([]);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    const changePassword = async (oldPassword: string, newPassword: string) => {
        await axios.post(`${apiBaseUrl}/changePassword`, { oldPassword, newPassword });
    };

    return (
        <AuthContext.Provider value={{ user, token, roles, login, logout, changePassword, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
