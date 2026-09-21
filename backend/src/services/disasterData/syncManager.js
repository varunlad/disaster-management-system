const cron = require('node-cron');
const { fetchUSGSData } = require('./usgsAgent');
const { fetchNASAFloodData } = require('./nasaFloodAgent');

const initCronJobs = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled hourly disaster data sync...');
        await fetchUSGSData();
        await fetchNASAFloodData();
    });
};
module.exports = { initCronJobs };
