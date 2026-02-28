const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, applyToJob, handleApplication, getMyJobs, getMyApplications, completeJob } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { protectEmployer } = require('../middleware/protectEmployer')


router.post('/', protectEmployer, createJob);
router.get('/', protect, getJobs);
router.get('/my-jobs', protect, getMyJobs);
router.get('/my-applications', protect, getMyApplications);
router.get('/:id', protect, getJobById);
router.post('/:id/apply', protect, applyToJob);
router.put('/:id/application', protect, handleApplication);
router.put('/:id/complete', protect, completeJob);

module.exports = router;
