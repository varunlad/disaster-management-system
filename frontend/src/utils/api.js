import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
    // SAFE PARSE
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser && storedUser !== "undefined") {
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed.token) {
                req.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch (e) {
            console.error("Invalid token format in localStorage");
        }
    }
    return req;
});

export default API;
