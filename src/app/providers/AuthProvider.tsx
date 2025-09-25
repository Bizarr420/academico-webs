import { createContext, useEffect, useMemo, useState } from 'react';
import { AuthResponse, User } from '@/app/types';
import api from '@/app/services/api';


interface AuthContextProps {
user: User | null;
isAuthenticated: boolean;
login: (username: string, password: string) => Promise<void>;
logout: () => void;
}


export const AuthContext = createContext<AuthContextProps>({
user: null,
isAuthenticated: false,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
login: async (_u: string, _p: string) => {},
logout: () => {},
});


export default function AuthProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<User | null>(null);


useEffect(() => {
const saved = localStorage.getItem('user');
if (saved) setUser(JSON.parse(saved));
}, []);


const login = async (username: string, password: string) => {
const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
setUser(data.user);
};


const logout = () => {
localStorage.removeItem('access_token');
localStorage.removeItem('user');
setUser(null);
};


const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}