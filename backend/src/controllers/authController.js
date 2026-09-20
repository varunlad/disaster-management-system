const User = require('../models/User');
const jwt = require('jsonwebtoken');

// FIX: Added a fallback secret in case process.env.JWT_SECRET is missing from .env
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'fallback_emergency_secret_key_123';
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });
        const user = await User.create({ name, email, password, phone });
        res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }});
    } catch (error) { 
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: error.message }); 
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }});
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) { 
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: 'Server error during login. Please try again.' }); 
    }
};
