const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile,completeProfile,profileStatus,sendOtp,verifyOtp,profileStatusWorker,completeProfileWorker} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { protectEmployer } = require('../middleware/protectEmployer')
const { protectWorker }= require('../middleware/protectWorker')
const upload = require("../middleware/upload");


router.post('/signup', signup);
router.post('/login', login);
router.get("/profile-status", protectEmployer, profileStatus);
router.get("/profile-status-worker", protectWorker, profileStatusWorker);
router.post("/send-otp",sendOtp);
router.post("/verify-otp",verifyOtp);

router.put(
  "/employer/complete-profile",
  protectEmployer,
  upload.single("photo"),
  completeProfile
);

router.put(
  "/worker/complete-profile",
  protectWorker,
  upload.single("photo"),
  completeProfileWorker
);



module.exports = router;
