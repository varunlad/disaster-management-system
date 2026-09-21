const DisasterReport = require('../models/DisasterReport');
const User = require('../models/User');
const { fetchUSGSData } = require('../services/disasterData/usgsAgent');
const { fetchNASAFloodData } = require('../services/disasterData/nasaFloodAgent');

exports.getUserReports = async (req, res) => {
    try {
        // ADDED 'phone' to the populate method so Admin can see the user's contact info
        const reports = await DisasterReport.find({ source: 'USER' }).populate('reportedBy', 'name email phone').sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getUSGSReports = async (req, res) => {
    try {
        const reports = await DisasterReport.find({ source: 'USGS' }).sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getNASAReports = async (req, res) => {
    try {
        const reports = await DisasterReport.find({ source: 'NASA EONET' }).sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.syncUSGS = async (req, res) => {
    try {
        await fetchUSGSData();
        res.json({ success: true, message: 'USGS Earthquakes synchronized successfully' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.syncNASA = async (req, res) => {
    try {
        await fetchNASAFloodData();
        res.json({ success: true, message: 'NASA Floods synchronized successfully' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { status, adminMessage } = req.body;
        if ((status === 'APPROVED' || status === 'REJECTED') && (!adminMessage || adminMessage.trim() === '')) {
            return res.status(400).json({ success: false, message: 'An admin message is required to approve or reject a report.' });
        }
        const updateData = { status };
        if (adminMessage) updateData.adminMessage = adminMessage;
        const report = await DisasterReport.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, data: report });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalReports = await DisasterReport.countDocuments({ source: 'USER' });
        res.json({ success: true, data: { totalUsers, totalReports } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
