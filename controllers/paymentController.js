const Job = require('../models/Job');
const User = require('../models/User');

exports.makePayment = async (req, res) => {
  try {
    const { jobId, method } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (job.status !== 'completed')
      return res.status(400).json({ message: 'Job must be completed first' });

    job.payment.status = 'paid';
    job.payment.method = method;
    job.payment.paidAt = Date.now();
    await job.save();

    // If wallet, add to worker's wallet
    if (method === 'wallet' && job.assignedWorker) {
      await User.findByIdAndUpdate(job.assignedWorker, { $inc: { wallet: job.pay } });
    }

    res.json({ message: 'Payment successful', payment: job.payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [{ employer: req.user._id }, { assignedWorker: req.user._id }],
      'payment.status': { $in: ['paid', 'released'] }
    }).select('title pay payment assignedWorker employer').populate('employer assignedWorker', 'name');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
