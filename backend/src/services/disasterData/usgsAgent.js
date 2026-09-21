const axios = require('axios');
const DisasterReport = require('../../models/DisasterReport');

const fetchUSGSData = async () => {
    try {
        console.log("Starting Global USGS Earthquake Data Sync...");
        const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
        let addedCount = 0;
        
        for (const feature of response.data.features) {
            const mag = feature.properties.mag;
            const longitude = feature.geometry.coordinates[0];
            const latitude = feature.geometry.coordinates[1];
            
            // Removed India constraints. This now fetches GLOBAL earthquakes > 4.5 Magnitude.
            if (mag > 4.5) {
                const externalId = `USGS-${feature.id}`;
                const exists = await DisasterReport.findOne({ externalId });
                
                if (!exists) {
                    let severity = mag >= 7.0 ? 'CRITICAL' : mag >= 6.0 ? 'HIGH' : mag >= 5.0 ? 'MEDIUM' : 'LOW';
                    await DisasterReport.create({
                        title: `M ${mag} Earthquake - ${feature.properties.place}`,
                        description: `Automated report from USGS. Global Earthquake Magnitude: ${mag}`,
                        type: 'Earthquake', severity, status: 'APPROVED',
                        latitude, longitude,
                        locationName: feature.properties.place, source: 'USGS', externalId
                    });
                    addedCount++;
                }
            }
        }
        console.log(`Global USGS Sync Complete! Added ${addedCount} new earthquakes to the database.`);
    } catch (error) { console.error("Error fetching USGS data:", error.message); }
};
module.exports = { fetchUSGSData };
