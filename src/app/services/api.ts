import axios from 'axios';


const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});


// Adjuntar token si existe
api.interceptors.request.use((config) => {
const token = localStorage.getItem('access_token');
if (token) {
config.headers = config.headers || {};
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});


// Manejo básico de 401 -> logout
api.interceptors.response.use(
(res) => res,
(error) => {
if (error?.response?.status === 401) {
localStorage.removeItem('access_token');
localStorage.removeItem('user');
if (location.pathname !== '/login') {
location.href = '/login';
}
}
return Promise.reject(error);
}
);


export default api;