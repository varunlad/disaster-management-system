const DisasterReport = require('../models/DisasterReport');
const axios = require('axios');

exports.getPublicDisasters = async (req, res) => {
    try {
        const disasters = await DisasterReport.find({ $or: [{ status: 'APPROVED' }, { status: 'RESOLVED' }, { source: {$ne: 'USER' } }] }).sort({ createdAt: -1 });
        res.json({ success: true, data: disasters });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMyReports = async (req, res) => {
    try {
        const reports = await DisasterReport.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createReport = async (req, res) => {
    try {
        const { title, description, type, severity, latitude, longitude, locationName, landmark } = req.body;
        const reportData = { title, description, type, severity, latitude, longitude, locationName, landmark, reportedBy: req.user._id, source: 'USER' };
        if (req.file) { reportData.image = req.file.buffer; reportData.imageContentType = req.file.mimetype; }
        const report = await DisasterReport.create(reportData);
        res.status(201).json({ success: true, data: report });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getReportImage = async (req, res) => {
    try {
        const report = await DisasterReport.findById(req.params.id);
        if (!report || !report.image) return res.status(404).send('No image found');
        res.set('Content-Type', report.imageContentType);
        res.send(report.image);
    } catch (error) { res.status(500).send('Server Error'); }
};

exports.getDisasterNews = async (req, res) => {
    try {
        // Fetch up to 100 events from the last 7 days from NASA
        const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7&limit=100';
        const response = await axios.get(url);
        
        // Extract richer data from the geometry arrays
        const formattedNews = response.data.events.map(event => {
            const latestGeo = event.geometry && event.geometry.length > 0 ? event.geometry[event.geometry.length - 1] : {};
            return {
                id: event.id,
                title: event.title,
                description: event.description || 'Continuous monitoring event.',
                date: latestGeo.date || new Date().toISOString(),
                // Extract magnitude (e.g. wind speed in Knots) if available
                magnitude: latestGeo.magnitudeValue ? `${latestGeo.magnitudeValue} ${latestGeo.magnitudeUnit}` : null,
                coordinates: latestGeo.coordinates || [],
                source: event.sources && event.sources.length > 0 ? event.sources[0].url : 'https://eonet.gsfc.nasa.gov/',
                categories: event.categories ? event.categories.map(c => c.title).join(', ') : 'Natural Event'
            };
        });

        res.json({ success: true, data: formattedNews });
    } catch (error) { 
        console.error("NASA EONET API Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch disaster news from NASA' }); 
    }
};
