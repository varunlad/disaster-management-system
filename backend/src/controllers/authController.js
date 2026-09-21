const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

// STRICT REGEX Validators
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/; // STRICTLY exactly 10 digits

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // 1. Backend Data Validations
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Name must be at least 3 characters long.' });
        }
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long for security.' });
        }
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
        }

        // 2. Prevent Duplicates
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // 3. Create User
        const user = await User.create({ 
            name: name.trim(), 
            email: email.toLowerCase(), 
            password, 
            phone 
        });

        res.status(201).json({ 
            success: true, 
            data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }
        });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && (await user.matchPassword(password))) {
            res.json({ 
                success: true, 
                data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) }
            });
        } else { 
            res.status(401).json({ success: false, message: 'Incorrect email or password.' }); 
        }
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};
