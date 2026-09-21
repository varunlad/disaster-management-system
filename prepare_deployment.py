import os

def create_file(file_path, content):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f"Prepared for Production: {file_path}")

files = {
# 1. FRONTEND: Make API URL dynamic based on environment
"frontend/src/utils/api.js": r"""
import axios from 'axios';

// In production (Render), it uses VITE_API_URL. In local development, it defaults to localhost.
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Automatically attach the token to every request if the user is logged in
API.interceptors.request.use((req) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;
""",

# 2. BACKEND: Allow cross-origin requests from your future Render frontend
"backend/server.js": r"""
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS Configuration for Production
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/disasters', require('./src/routes/disasterRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
"""
}

print("Configuring dynamic URLs and CORS for Render deployment...")
for file_path, file_content in files.items():
    if os.path.exists(file_path):
        create_file(file_path, file_content)
    else:
        # Fallback if their backend entry point is named differently (like app.js or index.js)
        print(f"Note: Checked {file_path}, but it doesn't exist. Make sure your CORS is updated in your backend entry file.")

print("\nSuccess! Your code is ready for the cloud.")