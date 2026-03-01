const Job = require('../models/Job');
const Worker= require('../models/Worker')
const mongoose = require('mongoose');
const sendPush = require("../utils/sendPush");
const Employer = require('../models/Employer')
exports.createJob = async (req, res) => {
  try {
    const { title, description, category, amount, duration, location, workersNeeded } = req.body;
   console.log(req.body)
    const job = await Job.create({
      employer: req.user._id,
      title,
      description,
      category,
      amount,
      duration,
      location,
      workersNeeded
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const { category, minPay, maxPay, lat, lng, radius, sort, search } = req.query;

    let query = { status: "open" };

    // ✅ Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // ✅ Pay filter
    if (minPay || maxPay) {
      query.amount = {};
      if (minPay) query.amount.$gte = Number(minPay);
      if (maxPay) query.amount.$lte = Number(maxPay);
    }

    // ✅ Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } }
      ];
    }

    // ✅ Nearby filter (Geo)
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: (Number(radius) || 10) * 1000,
        },
      };
    }

    // ✅ Sorting
    let sortObj = { createdAt: -1 }; // default: most recent

    if (sort === "pay_high") sortObj = { amount: -1 };
    if (sort === "pay_low") sortObj = { amount: 1 };
    if (sort === "duration_short") sortObj = { "duration.value": 1 };

    const jobs = await Job.find(query)
      .populate("employer", "name rating")
      .sort(sortObj);

    res.json(jobs);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name phone rating')
      .populate('applications.worker', 'name rating skills');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.applyToJob = async (req, res) => {
  console.log("apply job calling");

  try {
    const job = await Job.findById(req.params.id)
      .populate("employer");

    if (!job)
      return res.status(404).json({ message: 'Job not found' });

    const worker = await Worker.findById(req.user._id);
    if (!worker)
      return res.status(404).json({ message: 'Worker not found' });

    const alreadyApplied = job.applications.find(
      a => a.worker.toString() === req.user._id.toString()
    );

    if (alreadyApplied)
      return res.status(400).json({ message: 'Already applied' });

    job.applications.push({ worker: req.user._id });
    await job.save();

    worker.jobs.push({
      job: job._id,
      status: 'pending'
    });
    await worker.save();

    // 🔥 SEND PUSH
    if (job.employer && job.employer.fcmToken) {
      await sendPush(
        job.employer.fcmToken,
        "New Job Application",
        `${worker.name} applied for your job`,
        { jobId: job._id.toString() }
      );
    }

    res.json({ message: 'Applied successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleApplication = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { applicationId, action } = req.body; // accepted | rejected
    const job = await Job.findById(req.params.id).session(session);

    if (!job)
      return res.status(404).json({ message: 'Job not found' });

    if (job.employer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const application = job.applications.id(applicationId);

    if (!application)
      return res.status(404).json({ message: 'Application not found' });

    // 🔥 If ACCEPTED
    if (action === 'accepted') {

      job.status = 'in_progress';
      job.assignedWorker = application.worker;

      // Update all applications
      for (let app of job.applications) {
        if (app._id.toString() === applicationId) {
          app.status = 'accepted';

          // ✅ Update Accepted Worker
          await Worker.updateOne(
            { _id: app.worker, "jobs.job": job._id },
            { $set: { "jobs.$.status": "accepted" } },
            { session }
          );

        } else {
          app.status = 'rejected';

          // ❌ Reject other workers
          await Worker.updateOne(
            { _id: app.worker, "jobs.job": job._id },
            { $set: { "jobs.$.status": "rejected" } },
            { session }
          );
        }
      }

    } else if (action === 'rejected') {

      application.status = 'rejected';

      await Worker.updateOne(
        { _id: application.worker, "jobs.job": job._id },
        { $set: { "jobs.$.status": "rejected" } },
        { session }
      );
    }

    await job.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: `Application ${action} successfully` });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    console.log("jobs calling");

    const jobs = await Job.find({ employer: req.user._id })
      .populate("assignedWorker", "name phone rating")
      .populate("applications.worker", "name phone rating") // 🔥 THIS LINE IS MISSING
      .sort({ createdAt: -1 });
      // 🔥 FOR TESTING: Send push to same employer
    const employer = await Employer.findById(req.user._id);

    if (employer && employer.fcmToken) {
      await sendPush(
        employer.fcmToken,
        "Test Notification 🚀",
        "This is a test push from getMyJobs route",
        { test: "true" }
      );

      console.log("Test push sent to employer");
    }
    res.json(jobs);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const jobs = await Job.find({ 'applications.worker': req.user._id })
      .populate('employer', 'name rating');
    const result = jobs.map(job => {
      const myApp = job.applications.find(a => a.worker.toString() === req.user._id.toString());
      return { job: { _id: job._id, title: job.title, pay: job.pay, category: job.category, status: job.status, employer: job.employer }, applicationStatus: myApp.status };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    job.status = 'completed';
    await job.save();
    res.json({ message: 'Job marked as completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
