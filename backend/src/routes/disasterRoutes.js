const express = require('express');
const router = express.Router();
const { getPublicDisasters, createReport, getReportImage, getMyReports } = require('../controllers/disasterController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getPublicDisasters);
// IMPORTANT: /my-reports must come before /:id/image to prevent route collisions
router.get('/my-reports', protect, getMyReports); 
router.get('/:id/image', getReportImage);
router.post('/', protect, upload.single('image'), createReport);

module.exports = router;
