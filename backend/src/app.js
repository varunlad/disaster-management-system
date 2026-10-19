const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Hardened CORS configuration explicitly allowing your Render UI
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174',
        'https://disaster-management-system-ui.onrender.com'
    ],
    credentials: true // Ensures authentication tokens/cookies pass through successfully
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route for health checks
app.get('/', (req, res) => {
    res.status(200).send('Disaster Management API is running securely on Render.');
});

app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;