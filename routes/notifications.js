const express = require('express');
const router = express.Router();
const { protectEmployer } = require('../middleware/protectEmployer')
const { protectWorker }= require('../middleware/protectWorker')
const Worker =require('../models/Worker');
const Employer=require('../models/Employer')
router.post("/employer/save-token",protectEmployer, async (req, res) => {
  try {
    console.log("employer cvaing svae")
    console.log(req.body)
    const employer = await Employer.findById(req.user._id);
    employer.fcmToken = req.body.token;
    await employer.save();

    console.log("Saved FCM Token:", req.body.token);

    res.json({ message: "Token saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/worker/save-token",protectWorker, async (req, res) => {
  try {
    console.log("wokrer fcm token ")
    console.log(req.body)
    const worker = await Worker.findById(req.user._id);
    worker.fcmToken = req.body.token;
    await worker.save();

    console.log("Saved FCM Token:", req.body.token);

    res.json({ message: "Token saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
