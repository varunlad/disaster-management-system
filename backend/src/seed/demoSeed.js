require('dotenv').config();
const mongoose = require('mongoose');
const DisasterReport = require('../models/DisasterReport');

const seedDemo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await DisasterReport.deleteMany({ source: 'USER' });
        
        const demos = [
            { title: "Heavy Flooding in Downtown", description: "Water levels rising fast.", type: "Flood", severity: "CRITICAL", latitude: 19.076, longitude: 72.877, status: "APPROVED", source: "USER" },
            { title: "Forest Fire approaching highway", description: "Smoke causing zero visibility.", type: "Fire", severity: "HIGH", latitude: 19.2, longitude: 72.9, status: "PENDING", source: "USER" }
        ];

        await DisasterReport.insertMany(demos);
        console.log("Demo data seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
seedDemo();
