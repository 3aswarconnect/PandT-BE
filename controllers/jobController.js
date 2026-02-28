const Job = require('../models/Job');

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
    const { category, minPay, maxPay, lat, lng, radius, sort } = req.query;
    let query = { status: 'open' };

    if (category) query.category = category;
    if (minPay || maxPay) {
      query.pay = {};
      if (minPay) query.pay.$gte = Number(minPay);
      if (maxPay) query.pay.$lte = Number(maxPay);
    }
    if (lat && lng) {
      query['location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: (Number(radius) || 10) * 1000
        }
      };
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'pay_high') sortObj = { pay: -1 };
    if (sort === 'pay_low') sortObj = { pay: 1 };

    const jobs = await Job.find(query).populate('employer', 'name rating').sort(sortObj);
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
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const alreadyApplied = job.applications.find(a => a.worker.toString() === req.user._id.toString());
    if (alreadyApplied) return res.status(400).json({ message: 'Already applied' });

    job.applications.push({ worker: req.user._id });
    await job.save();
    res.json({ message: 'Applied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleApplication = async (req, res) => {
  try {
    const { applicationId, action } = req.body; // action: 'accepted' or 'rejected'
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const app = job.applications.id(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    app.status = action;
    if (action === 'accepted') {
      job.assignedWorker = app.worker;
      job.status = 'in_progress';
      // Reject all other applications
      job.applications.forEach(a => {
        if (a._id.toString() !== applicationId) a.status = 'rejected';
      });
    }
    await job.save();
    res.json({ message: `Application ${action}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .populate('assignedWorker', 'name phone rating')
      .sort({ createdAt: -1 });
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
