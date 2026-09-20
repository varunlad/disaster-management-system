require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const exists = await User.findOne({ email });
        
        if (exists) {
            console.log("Admin user already exists!");
        } else {
            await User.create({
                name: process.env.ADMIN_NAME || 'System Admin',
                email: email,
                password: process.env.ADMIN_PASSWORD || 'Admin@123',
                role: 'ADMIN'
            });
            console.log("Admin user created successfully!");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};
seedAdmin();
