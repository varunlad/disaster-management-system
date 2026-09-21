const axios = require('axios');
const DisasterReport = require('../../models/DisasterReport');

const fetchNASAFloodData = async () => {
    try {
        console.log("Starting Global NASA Flood Data Sync...");
        const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/categories/floods?status=open&limit=50');
        let addedCount = 0;
        
        for (const event of response.data.events) {
            const latestGeo = event.geometry[event.geometry.length - 1];
            const externalId = `NASA-${event.id}`;
            const exists = await DisasterReport.findOne({ externalId });
            
            if (!exists && latestGeo && latestGeo.coordinates) {
                let longitude, latitude;
                
                // NASA sometimes returns Points, sometimes Polygons for large floods
                if (latestGeo.type === 'Point') {
                    longitude = latestGeo.coordinates[0];
                    latitude = latestGeo.coordinates[1];
                } else if (latestGeo.type === 'Polygon') {
                    longitude = latestGeo.coordinates[0][0][0];
                    latitude = latestGeo.coordinates[0][0][1];
                } else { continue; } // Skip unsupported geometry

                await DisasterReport.create({
                    title: `Flood - ${event.title}`,
                    description: event.description || `Automated severe flood report detected via NASA Earth Observatory.`,
                    type: 'Flood', severity: 'HIGH', status: 'APPROVED',
                    latitude, longitude,
                    locationName: event.title, source: 'NASA EONET', externalId
                });
                addedCount++;
            }
        }
        console.log(`NASA Flood Sync Complete! Added ${addedCount} new ongoing global floods.`);
    } catch (error) { console.error("Error fetching NASA Flood data:", error.message); }
};
module.exports = { fetchNASAFloodData };
