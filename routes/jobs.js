const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, applyToJob, handleApplication,submitRating ,submitComment ,cancelAssignedWorker,decreaseMoney,increaseMoney, getMyJobs, getMyApplications, completeJob,deleteJob,updateJob,getWorkerJobs,verfityotp } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { protectEmployer } = require('../middleware/protectEmployer')
const { protectWorker }= require('../middleware/protectWorker')


router.post('/', protectEmployer, createJob);
router.get('/my-jobs', protectEmployer, getMyJobs);
router.get('/:id', protectEmployer, getJobById);
router.put('/:id/application', protectEmployer, handleApplication);
router.put('/:id/cancel-worker', protectEmployer, cancelAssignedWorker);
router.delete("/:id", protectEmployer, deleteJob);
router.put("/:jobId/verify-otp",protectEmployer,verfityotp)
router.put("/:id", protectEmployer, updateJob);
router.put("/:jobId/complete",protectEmployer,completeJob)
router.post("/:jobId/review",protectEmployer,submitRating )
router.post("/:jobId/comment",protectEmployer,submitComment )
router.put("/:jobId/decrease-offer",protectEmployer,decreaseMoney)



router.get('/', protectWorker, getJobs);
router.post('/:id/apply', protectWorker, applyToJob);
router.put('/:id/complete', protect, completeJob);
router.get('/worker/my-jobs', protectWorker, getWorkerJobs);
router.get('/worker/:id', protectWorker, getJobById);
router.put("/:jobId/increase-offer",protectWorker,increaseMoney)

module.exports = router;
