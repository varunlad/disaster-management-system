const DisasterReport = require('../models/DisasterReport');

exports.getPublicDisasters = async (req, res) => {
    try {
        const disasters = await DisasterReport.find({
            $or: [{ status: 'APPROVED' }, { status: 'RESOLVED' }, { source: {$ne: 'USER' } }]
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: disasters });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// NEW: Fetch only reports submitted by the logged-in user
exports.getMyReports = async (req, res) => {
    try {
        const reports = await DisasterReport.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createReport = async (req, res) => {
    try {
        const { title, description, type, severity, latitude, longitude, locationName } = req.body;
        const reportData = { title, description, type, severity, latitude, longitude, locationName, reportedBy: req.user._id, source: 'USER' };
        if (req.file) {
            reportData.image = req.file.buffer;
            reportData.imageContentType = req.file.mimetype;
        }
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
