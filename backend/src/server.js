require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initCronJobs } = require('./services/disasterData/syncManager');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        initCronJobs(); // Start background sync tasks
    });
}).catch(err => console.error("Database connection failed.", err));
