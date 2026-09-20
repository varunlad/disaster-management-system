const DisasterReport = require('../models/DisasterReport');
const User = require('../models/User');
const { fetchUSGSData } = require('../services/disasterData/usgsAgent');

exports.getAllReports = async (req, res) => {
    try {
        const reports = await DisasterReport.find().populate('reportedBy', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { status, adminMessage } = req.body;
        
        // ENFORCE: Mandatory message if Approving or Rejecting
        if ((status === 'APPROVED' || status === 'REJECTED') && (!adminMessage || adminMessage.trim() === '')) {
            return res.status(400).json({ success: false, message: 'An admin message is required to approve or reject a report.' });
        }

        const updateData = { status };
        if (adminMessage) {
            updateData.adminMessage = adminMessage;
        }

        const report = await DisasterReport.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, data: report });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.syncExternalData = async (req, res) => {
    try {
        await fetchUSGSData();
        res.json({ success: true, message: 'External data synchronized successfully' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalReports = await DisasterReport.countDocuments();
        const statusStats = await DisasterReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        res.json({ success: true, data: { totalUsers, totalReports, statusStats } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
