const express = require('express');
const router = express.Router();
const { getPublicDisasters, createReport, getReportImage, getMyReports, getDisasterNews } = require('../controllers/disasterController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route to fetch map data
router.get('/', getPublicDisasters);

// FIX: /news must be registered BEFORE /:id/image so it doesn't get mistaken for an ID!
router.get('/news', getDisasterNews); 

// Protected route to fetch only the logged-in user's reports
router.get('/my-reports', protect, getMyReports); 

// Public route to render images from DB buffers
router.get('/:id/image', getReportImage);

// Protected route to create a report (Requires token)
router.post('/', protect, upload.single('image'), createReport);

module.exports = router;
