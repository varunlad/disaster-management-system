const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
