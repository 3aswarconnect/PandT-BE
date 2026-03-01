require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/', require('./routes/notifications'));

app.get('/', (req, res) => res.json({ message: 'Job Marketplace API Running' }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
