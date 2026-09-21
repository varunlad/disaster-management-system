const express = require('express');
const router = express.Router();
const { 
    getUserReports, getUSGSReports, getNASAReports, 
    syncUSGS, syncNASA, 
    updateReportStatus, getStats 
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// SPLIT FETCH APIS
router.get('/disasters/user', getUserReports);
router.get('/disasters/usgs', getUSGSReports);
router.get('/disasters/nasa', getNASAReports);

// SPLIT SYNC APIS
router.post('/sync/usgs', syncUSGS);
router.post('/sync/nasa', syncNASA);

// STATUS & STATS
router.put('/disasters/:id/status', updateReportStatus);
router.get('/stats', getStats);

module.exports = router;
