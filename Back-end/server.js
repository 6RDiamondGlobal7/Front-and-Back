require('dotenv').config();
const express = require('express');
const cors = require('cors');
const applicationRoutes = require('./routes/applicationRoutes'); // Import Routes

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Root Route (Health Check) ---
app.get('/', (req, res) => {
    res.send('Recruitment Portal Server is Running (Modular V2)');
});

// --- Use Routes ---
// This prefixes all routes in applicationRoutes with '/api'
// Example: /api/apply, /api/jobs
app.use('/api', applicationRoutes);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});