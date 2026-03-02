const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile,completeProfile,profileStatus} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { protectEmployer } = require('../middleware/protectEmployer')
const { protectWorker }= require('../middleware/protectWorker')
router.post('/signup', signup);
router.post('/login', login);
router.put("/complete-profile", protectEmployer, completeProfile);
router.get("/profile-status", protectEmployer, profileStatus);
module.exports = router;
