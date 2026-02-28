const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, applyToJob, handleApplication, getMyJobs, getMyApplications, completeJob } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { protectEmployer } = require('../middleware/protectEmployer')
const { protectWorker }= require('../middleware/protectWorker')


router.post('/', protectEmployer, createJob);
router.get('/', protectWorker, getJobs);
router.get('/my-jobs', protectEmployer, getMyJobs);
router.get('/my-applications', protect, getMyApplications);
router.get('/:id', protect, getJobById);
router.post('/:id/apply', protectWorker, applyToJob);
router.put('/:id/application', protectEmployer, handleApplication);
router.put('/:id/complete', protect, completeJob);

module.exports = router;
