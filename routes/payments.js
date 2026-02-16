const express = require('express');
const router = express.Router();
const { makePayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/pay', protect, makePayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
