const express = require('express');
const router = express.Router();
const multer = require('multer');
const applicationController = require('../controllers/applicationController');

// --- Multer Configuration (Memory Storage) ---
const upload = multer({ storage: multer.memoryStorage() });

// Define allowed file fields
const uploadFields = upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 },
    { name: 'prcId', maxCount: 1 }
]);

// --- Define Routes ---

// GET /api/test-db
router.get('/test-db', applicationController.testDb);

// GET /api/jobs
router.get('/jobs', applicationController.getJobs);

// GET /api/job-postings/dashboard
router.get('/job-postings/dashboard', applicationController.getJobPostingsDashboard);

// POST /api/job-views
router.post('/job-views', applicationController.recordJobView);

// POST /api/jobs
router.post('/jobs', applicationController.createJobPosting);

// PUT /api/jobs/:id
router.put('/jobs/:id', applicationController.updateJobPosting);

// PATCH /api/jobs/:id/status
router.patch('/jobs/:id/status', applicationController.updateJobStatus);

// DELETE /api/jobs/:id
router.delete('/jobs/:id', applicationController.deleteJobPosting);

// GET /api/applicants
router.get('/applicants', applicationController.getApplicants);

// GET /api/reports
router.get('/reports', applicationController.getReports);

// PUT /api/applicants/:id/status (NEW ROUTE ADDED HERE)
// This listens for status updates (Approve/Reject) from the HR Dashboard
router.put('/applicants/:id/status', applicationController.updateApplicantStatus);

// POST /api/applicant-status
// Applicant check-status login + real-time status fetch
router.post('/applicant-status', applicationController.getApplicantStatus);

// POST /api/apply (Uses Multer middleware + Controller logic)
router.post('/apply', uploadFields, applicationController.submitApplication);

// POST /api/login
router.post('/login', upload.none(), applicationController.loginEmployee);

module.exports = router;
