const cron = require('node-cron');
const { fetchUSGSData } = require('./usgsAgent');
const initCronJobs = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled hourly disaster data sync...');
        await fetchUSGSData();
    });
};
module.exports = { initCronJobs };
