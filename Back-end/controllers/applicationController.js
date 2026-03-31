const supabase = require('../config/supabaseClient');
const nodemailer = require('nodemailer'); // 1. Import Nodemailer

// ==========================================
// --- Email Transporter Configuration ---
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// --- Helper Functions ---
// ==========================================
const uploadFileToSupabase = async (fileObject) => {
    if (!fileObject) return null;
    const file = fileObject[0];
    const fileName = `${Date.now()}_${file.originalname}`;
    
    const { data, error } = await supabase.storage.from('resumes').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
};

const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toISOString().slice(0, 10);
};

const normalizeStatus = (status) => {
    const clean = String(status || '').trim().toLowerCase();
    if (clean === 'hired') return 'Hired';
    if (clean === 'rejected') return 'Rejected';
    if (clean === 'interview') return 'Interview';
    return 'Applied';
};

const percentage = (part, total) => {
    if (!total) return 0;
    return Number(((part / total) * 100).toFixed(1));
};

const toIntegerInRange = (value, min, max, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < min || parsed > max) return fallback;
    return parsed;
};

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const ROLE_ID_TO_TITLE = {
    'corp-sec': 'Corporate Secretary',
    'licensed-broker': 'Licensed Customs Broker',
    'office-manager': 'Office Manager',
    'messenger': 'Messenger / Logistics',
    'secretary': 'Secretary to the Office Manager',
    'brokerage-specialist': 'Brokerage Specialist',
    'import-export-head': 'Import & Export Head',
    'admin-staff': 'Administration Staff',
    'doc-head': 'Documentations Head'
};

const TITLE_TO_ROLE_IDS = Object.entries(ROLE_ID_TO_TITLE).reduce((acc, [roleId, title]) => {
    const key = normalizeText(title);
    if (!acc[key]) acc[key] = [];
    acc[key].push(roleId);
    return acc;
}, {});

const isJobActive = (status) => status === true || status === 'true' || status === 'Open' || status === 'Active';

const parseViewTimestamp = (eventId) => {
    const match = String(eventId || '').match(/^VIEW-(\d+)/);
    if (!match) return Number.NaN;
    return Number.parseInt(match[1], 10);
};

const applicantMatchesJob = (applicant, job) => {
    const applicantPosition = normalizeText(applicant.position_applied);
    const jobTitle = normalizeText(job.job_title);
    if (!applicantPosition || !jobTitle) return false;

    const applicantAsTitle = normalizeText(ROLE_ID_TO_TITLE[applicantPosition]);
    const possibleRoleIdsForTitle = TITLE_TO_ROLE_IDS[jobTitle] || [];

    const positionMatches = applicantPosition === jobTitle || applicantAsTitle === jobTitle || possibleRoleIdsForTitle.includes(applicantPosition);
    if (!positionMatches) return false;

    const applicantBranch = normalizeText(applicant.branch);
    const jobBranch = normalizeText(job.branch);
    if (applicantBranch && jobBranch) return applicantBranch === jobBranch;
    return true;
};

const buildJobPostingsSnapshot = async () => {
    const { data: jobs, error: jobsError } = await supabase.from('jobpostings').select('*').order('date_posted', { ascending: false });
    if (jobsError) throw jobsError;

    const { data: applicants, error: applicantsError } = await supabase.from('applicant').select('applicant_no, position_applied, branch');
    if (applicantsError) throw applicantsError;

    const { data: viewEvents, error: viewEventsError } = await supabase.from('status').select('applicant_no').like('applicant_no', 'VIEW-%');
    if (viewEventsError) throw viewEventsError;

    const jobsWithCounts = (jobs || []).map((job) => {
        const applicantCount = (applicants || []).filter((applicant) => applicantMatchesJob(applicant, job)).length;
        return { ...job, total_applicants: applicantCount };
    });

    const activeJobPosts = jobsWithCounts.filter((job) => isJobActive(job.job_status)).length;
    const totalApplications = jobsWithCounts.reduce((sum, job) => sum + (job.total_applicants || 0), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    const viewsThisMonth = (viewEvents || []).reduce((count, event) => {
        const ts = parseViewTimestamp(event.applicant_no);
        if (Number.isNaN(ts)) return count;
        if (ts >= monthStart && ts < nextMonthStart) return count + 1;
        return count;
    }, 0);

    return { summary: { activeJobPosts, totalApplications, viewsThisMonth }, jobs: jobsWithCounts };
};

const getPeriodConfig = ({ reportType, month, quarter, year }) => {
    const now = new Date();
    const safeYear = toIntegerInRange(year, 2000, 2100, now.getFullYear());
    const normalizedType = String(reportType || 'monthly').toLowerCase();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (normalizedType === 'annual') {
        return { reportType: 'annual', startDate: `${safeYear}-01-01`, endDate: `${safeYear + 1}-01-01`, label: `${safeYear} Annual Report`, filter: { year: safeYear } };
    }
    if (normalizedType === 'quarterly') {
        const safeQuarter = toIntegerInRange(quarter, 1, 4, Math.floor(now.getMonth() / 3) + 1);
        const startMonth = (safeQuarter - 1) * 3;
        const endMonth = startMonth + 3;
        return { reportType: 'quarterly', startDate: new Date(Date.UTC(safeYear, startMonth, 1)).toISOString().slice(0, 10), endDate: new Date(Date.UTC(safeYear, endMonth, 1)).toISOString().slice(0, 10), label: `Q${safeQuarter} ${safeYear} Report`, filter: { year: safeYear, quarter: safeQuarter } };
    }
    const safeMonth = toIntegerInRange(month, 1, 12, now.getMonth() + 1);
    return { reportType: 'monthly', startDate: new Date(Date.UTC(safeYear, safeMonth - 1, 1)).toISOString().slice(0, 10), endDate: new Date(Date.UTC(safeYear, safeMonth, 1)).toISOString().slice(0, 10), label: `${monthNames[safeMonth - 1]} ${safeYear} Report`, filter: { year: safeYear, month: safeMonth } };
};

const normalizeBranch = (value) => String(value || '').trim().toLowerCase();

const extractApplicantStatus = (applicantRow) => {
    let realStatus = 'Applied';
    if (applicantRow && applicantRow.applicantfacttable && applicantRow.applicantfacttable.length > 0 && applicantRow.applicantfacttable[0].status) {
        const s = applicantRow.applicantfacttable[0].status;
        if (s.interview === 1) realStatus = 'Interview';
        else if (s.hired === 1) realStatus = 'Hired';
        else if (s.rejected === 1) realStatus = 'Rejected';
    }
    return realStatus;
};

const inferAppliedAtFromApplicant = (applicantRow) => {
    if (!applicantRow) return null;
    const tsMatch = String(applicantRow.applicant_no || '').match(/^APP-(\d+)$/);
    if (tsMatch) {
        const ts = Number.parseInt(tsMatch[1], 10);
        if (!Number.isNaN(ts)) return new Date(ts).toISOString();
    }
    return null;
};

const extractInterviewScheduleFromApplicant = (applicantRow) => {
    if (!applicantRow || !Array.isArray(applicantRow.applicantfacttable) || applicantRow.applicantfacttable.length === 0) {
        return null;
    }

    const fact = applicantRow.applicantfacttable[0] || {};
    const schedule = fact.schedule || null;
    if (!schedule) return null;

    return {
        date: schedule.interview_schedule || null,
        time: schedule.interview_time || null,
        room: schedule.room_number || null,
        location: schedule.location || null,
        reminders: schedule.reminders || null
    };
};

// ==========================================
// --- API Routes / Controllers ---
// ==========================================

exports.testDb = async (req, res) => {
    try {
        const { data, error } = await supabase.from('jobpostings').select('job_id').limit(1);
        if (error) throw error;
        res.json({ status: "Success", message: "Connected!", data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getJobs = async (req, res) => {
    try { res.json((await buildJobPostingsSnapshot()).jobs); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getJobPostingsDashboard = async (req, res) => {
    try { res.json(await buildJobPostingsSnapshot()); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.recordJobView = async (req, res) => {
    const { roleId, branch } = req.body || {};
    if (!roleId) return res.status(400).json({ error: 'roleId required' });
    try {
        const eventId = `VIEW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { error } = await supabase.from('status').insert([{ applicant_no: eventId, applicant_name: `JOB_VIEW|role=${roleId}|branch=${branch || ''}`, applied: 0, interview: 0, hired: 0, rejected: 0 }]);
        if (error) throw error;
        res.status(201).json({ message: 'View recorded' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createJobPosting = async (req, res) => {
    const { job_title, department, contract_type, branch } = req.body || {};
    try {
        const { data, error } = await supabase.from('jobpostings').insert([{ job_title, department, contract_type, branch, date_posted: new Date().toISOString().slice(0, 10), job_status: true, total_applicants: 0 }]).select().single();
        if (error) throw error;
        res.status(201).json({ message: 'Created successfully', job: data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateJobPosting = async (req, res) => {
    try {
        const { data, error } = await supabase.from('jobpostings').update(req.body).eq('job_id', req.params.id).select().single();
        if (error) throw error;
        res.json({ message: 'Updated successfully', job: data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const { data, error } = await supabase.from('jobpostings').update({ job_status: Boolean(req.body.job_status) }).eq('job_id', req.params.id).select().single();
        if (error) throw error;
        res.json({ message: 'Status updated', job: data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteJobPosting = async (req, res) => {
    try {
        const { error } = await supabase.from('jobpostings').delete().eq('job_id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ==========================================
// 2. Submit Application WITH AUTOMATED EMAIL
// ==========================================
exports.submitApplication = async (req, res) => {
    const files = req.files || {};
    const {
        firstName, lastName, middleInitial, suffix, nationality, birthday, age, 
        email, contactNumber, region, province, city, barangay, detailedAddress,
        medicalCondition, medicalDetails, branch, positionApplied 
    } = req.body;

    try {
        const applicantNo = 'APP-' + Date.now();
        const tempPassword = (lastName || 'USER').toUpperCase() + '123';
        const fullName = `${firstName} ${lastName}`.trim();

        const resumeUrl = await uploadFileToSupabase(files['resume']);
        const coverLetterUrl = await uploadFileToSupabase(files['coverLetter']);
        const prcIdUrl = await uploadFileToSupabase(files['prcId']);

        const cleanAge = parseInt(age) || 0; 
        const cleanContact = contactNumber ? contactNumber.replace(/\D/g, '') : null;

        // A. Save Applicant Data
        const { error: appError } = await supabase.from('applicant').insert([{ 
            applicant_no: applicantNo, password: tempPassword, first_name: firstName, last_name: lastName,
            middle_initial: middleInitial ? middleInitial.substring(0, 5) : null, suffix: suffix ? suffix.substring(0, 10) : null,
            nationality, birthday, age: cleanAge, email, contact_number: cleanContact,
            region, province, city_municipality: city, barangay, detailed_address: detailedAddress,
            resume_url: resumeUrl, cover_letter_url: coverLetterUrl, prc_id_url: prcIdUrl,
            medical_condition: medicalCondition || 'no', medical_details: medicalDetails || null,
            branch: branch || 'Not specified', position_applied: positionApplied || 'Not specified'
        }]);
        if (appError) throw appError;

        // B. Save Status
        const { data: newStatus, error: statusError } = await supabase.from('status').insert([{ 
            applied: 1, interview: 0, hired: 0, rejected: 0, applicant_no: applicantNo, applicant_name: fullName 
        }]).select().single();

        if (!statusError && newStatus) {
            await supabase.from('applicantfacttable').insert([{ applicant_no: applicantNo, status_id: newStatus.status_id }]);
        }

        // C. Send the Automated Email
        if (email) { 
            try {
                const mailOptions = {
                    from: `"6R Diamond Recruitment" <${process.env.EMAIL_USER}>`, 
                    to: email, 
                    subject: 'Application Received - Login Credentials',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                            <h2 style="color: #4A90E2;">Hello ${firstName},</h2>
                            <p>Thank you for submitting your application to <strong>6R Diamond International Cargo Logistics, Inc.</strong></p>
                            <p>We have successfully received your documents. You can track the status of your application through our portal using the credentials below:</p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0;"><strong>Applicant Number:</strong> <span style="font-size: 18px; color: #1e293b;">${applicantNo}</span></p>
                                <p style="margin: 0;"><strong>Password:</strong> <span style="font-size: 18px; color: #1e293b;">${tempPassword}</span></p>
                            </div>
                            
                            <p style="font-size: 14px; color: #64748b;">Please keep these details secure. We will review your application and update your status on the portal.</p>
                            <br/>
                            <p>Best regards,<br/><strong>Human Resources Department</strong><br/>6R Diamond International</p>
                        </div>
                    `
                };
                await transporter.sendMail(mailOptions);
                console.log(`Successfully sent credentials to applicant at: ${email}`);
            } catch (emailErr) {
                console.error("Warning: Failed to send email to applicant. Error: ", emailErr.message);
            }
        }

        res.status(201).json({ message: "Application submitted!", applicantId: applicantNo });
    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getApplicants = async (req, res) => {
    try {
        const { data, error } = await supabase.from('applicant').select(`*, applicantfacttable (status (applied, interview, hired, rejected))`).order('applicant_no', { ascending: false });
        if (error) throw error;
        res.json(data.map(app => ({
            id: app.applicant_no || 'N/A', name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
            firstName: app.first_name, lastName: app.last_name, middleInitial: app.middle_initial,
            nationality: app.nationality, birthday: app.birthday, age: app.age, email: app.email || 'N/A', phone: app.contact_number || 'N/A',
            region: app.region, province: app.province, city: app.city_municipality, barangay: app.barangay,
            detailedAddress: app.detailed_address, resume_url: app.resume_url, cover_letter_url: app.cover_letter_url,
            medicalCondition: app.medical_condition, medicalDetails: app.medical_details,
            status: extractApplicantStatus(app), branch: app.branch || 'Not assigned', position: app.position_applied || 'Not assigned'
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getReports = async (req, res) => {
    try {
        const period = getPeriodConfig(req.query || {});
        const selectedBranch = normalizeBranch(req.query?.branch);
        const hasBranchFilter = selectedBranch && selectedBranch !== 'all';
        const { data, error } = await supabase.from('applicant').select(`*, applicantfacttable (status (applied, interview, hired, rejected))`);
        if (error) throw error;

        const startMs = new Date(`${period.startDate}T00:00:00.000Z`).getTime();
        const endMs = new Date(`${period.endDate}T00:00:00.000Z`).getTime();

        const records = (data || []).map((app) => {
            const appliedRaw = app.created_at || app.createdAt || inferAppliedAtFromApplicant(app);
            return {
                id: app.applicant_no || 'N/A', name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'N/A',
                email: app.email || 'N/A', phone: app.contact_number || 'N/A', status: normalizeStatus(extractApplicantStatus(app)),
                position: app.position_applied || 'Not assigned', branch: app.branch || 'Not assigned', dateRaw: appliedRaw,
                appliedMs: appliedRaw ? new Date(appliedRaw).getTime() : Number.NaN
            };
        }).filter((row) => !Number.isNaN(row.appliedMs) && row.appliedMs >= startMs && row.appliedMs < endMs)
          .filter((row) => !hasBranchFilter || normalizeBranch(row.branch) === selectedBranch)
          .map((row) => ({ ...row, date: formatDate(row.dateRaw) }));

        const total = records.length;
        const statusBreakdown = records.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, { Applied: 0, Interview: 0, Hired: 0, Rejected: 0 });

        res.json({
            meta: { reportType: period.reportType, label: period.label, dateRange: { from: period.startDate, to: period.endDate }, filter: { ...period.filter, branch: hasBranchFilter ? selectedBranch : 'all' } },
            summary: { totalApplications: total, newApplications: statusBreakdown.Applied, interviewCount: statusBreakdown.Interview, hiredCount: statusBreakdown.Hired, rejectedCount: statusBreakdown.Rejected, interviewRate: percentage(statusBreakdown.Interview, total), hiringRate: percentage(statusBreakdown.Hired, total), rejectionRate: percentage(statusBreakdown.Rejected, total) },
            statusBreakdown, records
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getApplicantStatus = async (req, res) => {
    const { applicantNo, password } = req.body || {};
    if (!applicantNo || !password) return res.status(400).json({ error: 'Required' });
    try {
        const { data: applicant, error } = await supabase.from('applicant').select(`applicant_no, password, first_name, last_name, branch, position_applied, applicantfacttable (status (applied, interview, hired, rejected), schedule:schedule_id(*))`).eq('applicant_no', applicantNo).maybeSingle();
        if (error) throw error;
        if (!applicant || applicant.password !== password) return res.status(401).json({ error: 'Invalid' });
        res.json({
            applicant: {
                id: applicant.applicant_no,
                name: `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim(),
                status: extractApplicantStatus(applicant),
                branch: applicant.branch || 'Not assigned',
                position: applicant.position_applied || 'Not assigned',
                appliedAt: inferAppliedAtFromApplicant(applicant),
                checkedAt: new Date().toISOString(),
                interviewSchedule: extractInterviewScheduleFromApplicant(applicant)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateApplicantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = (req.body.status || '').toLowerCase();
        let newStatusObj = { applied: status === 'applied' ? 1 : 0, interview: status === 'interview' ? 1 : 0, hired: status === 'hired' ? 1 : 0, rejected: status === 'rejected' ? 1 : 0 };
        
        const { data: factData } = await supabase.from('applicantfacttable').select('status_id').eq('applicant_no', id).maybeSingle();
        if (factData && factData.status_id) {
            await supabase.from('status').update(newStatusObj).eq('status_id', factData.status_id);
        } else {
            const { data: appData } = await supabase.from('applicant').select('first_name, last_name').eq('applicant_no', id).single();
            newStatusObj.applicant_no = id;
            newStatusObj.applicant_name = appData ? `${appData.first_name} ${appData.last_name}`.trim() : 'Unknown';
            const { data: statusInsert } = await supabase.from('status').insert([newStatusObj]).select().single();
            await supabase.from('applicantfacttable').insert([{ applicant_no: id, status_id: statusInsert.status_id }]);
        }
        res.json({ message: `Status updated to ${status}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.loginEmployee = async (req, res) => {
    try {
        const { data, error } = await supabase.from('employees').select('*').eq('employee_id', req.body.employeeId).single();
        if (error || !data || data.password !== req.body.password) return res.status(401).json({ error: 'Invalid Credentials' });
        res.json({ message: "Login successful", user: { id: data.employee_id, name: `${data.first_name} ${data.last_name}`, role: data.role } });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
};
