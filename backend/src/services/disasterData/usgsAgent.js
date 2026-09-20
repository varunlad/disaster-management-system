const axios = require('axios');
const DisasterReport = require('../../models/DisasterReport');

const fetchUSGSData = async () => {
    try {
        console.log("Starting USGS Earthquake Data Sync...");
        const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
        
        let addedCount = 0;
        let ignoredCount = 0;
        
        for (const feature of response.data.features) {
            const mag = feature.properties.mag;
            const longitude = feature.geometry.coordinates[0];
            const latitude = feature.geometry.coordinates[1];
            
            // STRICT INDIA BOUNDING BOX
            // Lat: 6.7 to 35.5 (South to North)
            // Lng: 68.1 to 97.4 (West to East)
            const isInsideIndia = latitude >= 6.7 && latitude <= 35.5 && longitude >= 68.1 && longitude <= 97.4;

            if (mag > 4.5) {
                if (isInsideIndia) {
                    const externalId = `USGS-${feature.id}`;
                    const exists = await DisasterReport.findOne({ externalId });
                    
                    if (!exists) {
                        let severity = mag >= 7.0 ? 'CRITICAL' : mag >= 6.0 ? 'HIGH' : mag >= 5.0 ? 'MEDIUM' : 'LOW';
                        await DisasterReport.create({
                            title: `M ${mag} Earthquake - ${feature.properties.place}`,
                            description: `Automated report from USGS. Magnitude: ${mag}`,
                            type: 'Earthquake', severity, status: 'APPROVED',
                            latitude, longitude,
                            locationName: feature.properties.place, source: 'USGS', externalId
                        });
                        addedCount++;
                    }
                } else {
                    ignoredCount++;
                }
            }
        }
        console.log(`USGS Sync Complete! Added ${addedCount} new earthquakes in India. Ignored ${ignoredCount} earthquakes outside India.`);
    } catch (error) { console.error("Error fetching USGS data:", error.message); }
};
module.exports = { fetchUSGSData };
