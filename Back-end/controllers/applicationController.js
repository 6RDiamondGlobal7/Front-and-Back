const supabase = require('../config/supabaseClient');
const nodemailer = require('nodemailer'); // 1. Import Nodemailer
const crypto = require('crypto'); // <-- Added crypto module
const dns = require('dns');

try {
    // Render networking can fail on IPv6-only resolution for SMTP endpoints.
    dns.setDefaultResultOrder('ipv4first');
} catch (_) {
    // Ignore on Node runtimes that do not support this API.
}

// ==========================================
// --- Email Transporter Configuration ---
// ==========================================
const emailUser = String(process.env.EMAIL_USER || process.env.VITE_EMAIL_USER || '').trim();
const emailPass = String(process.env.EMAIL_PASS || process.env.VITE_EMAIL_PASS || '').replace(/\s+/g, '');
const smtpHost = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number.parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true' || smtpPort === 465;

let emailTransportVerified = false;
let transporter = null;

const resolveIpv4Host = (hostname) => new Promise((resolve) => {
    dns.lookup(hostname, { family: 4, all: false }, (error, address) => {
        if (error || !address) {
            resolve(hostname);
            return;
        }
        resolve(address);
    });
});

const getTransporter = async () => {
    if (transporter) return transporter;

    const smtpConnectionHost = await resolveIpv4Host(smtpHost);
    transporter = nodemailer.createTransport({
        host: smtpConnectionHost,
        port: smtpPort,
        secure: smtpSecure,
        requireTLS: !smtpSecure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        localAddress: '0.0.0.0',
        auth: {
            user: emailUser,
            pass: emailPass
        },
        tls: {
            servername: smtpHost
        }
    });

    return transporter;
};

const ensureEmailTransport = async () => {
    if (!emailUser || !emailPass) {
        throw new Error('Email sender credentials are missing. Set EMAIL_USER and EMAIL_PASS.');
    }

    const activeTransporter = await getTransporter();

    if (!emailTransportVerified) {
        await activeTransporter.verify();
        emailTransportVerified = true;
    }

    return activeTransporter;
};

const passwordResetStore = new Map();
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;
let employeeEmailColumnAvailable = null;
const responseCache = new Map();
const DEFAULT_CACHE_TTL_MS = Number.parseInt(process.env.API_CACHE_TTL_MS || '15000', 10);

// ==========================================
// --- Helper Functions ---
// ==========================================

// <-- Added Secure Password Generator -->
const generateSecurePassword = (length = 10) => {
    const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$&*"; 
    let password = "";
    const randomValues = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }
    return password;
};

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

const makeCacheKey = (scope, payload = {}) => `${scope}:${JSON.stringify(payload)}`;

const getCachedResponse = (key) => {
    const cached = responseCache.get(key);
    if (!cached) return null;
    if (Date.now() >= cached.expiresAt) {
        responseCache.delete(key);
        return null;
    }
    return cached.value;
};

const setCachedResponse = (key, value, ttlMs = DEFAULT_CACHE_TTL_MS) => {
    responseCache.set(key, {
        value,
        expiresAt: Date.now() + Math.max(1000, ttlMs)
    });
};

const invalidateCacheByScopes = (scopes = []) => {
    if (!Array.isArray(scopes) || scopes.length === 0) return;
    for (const key of responseCache.keys()) {
        if (scopes.some((scope) => key.startsWith(`${scope}:`))) {
            responseCache.delete(key);
        }
    }
};

const normalizeList = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item || '').trim()).filter(Boolean);
};

const deriveSectionsFromDescription = (description) => {
    const text = String(description || '').trim();
    if (!text) {
        return { responsibilities: [], qualifications: [], benefits: [] };
    }

    const lines = text
        .split(/\r?\n/)
        .map((line) => String(line || '').trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { responsibilities: [], qualifications: [], benefits: [] };
    }

    const sections = {
        responsibilities: [],
        qualifications: [],
        benefits: []
    };

    let current = 'responsibilities';
    lines.forEach((line) => {
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        if (!clean) return;

        const normalized = normalizeText(clean);
        if (/^key responsibilities:?$|^responsibilities:?$/.test(normalized)) {
            current = 'responsibilities';
            return;
        }
        if (/^qualifications:?$|^requirements:?$/.test(normalized)) {
            current = 'qualifications';
            return;
        }
        if (/^benefits:?$|^benefits and perks:?$|^benefits perks:?$/.test(normalized)) {
            current = 'benefits';
            return;
        }

        sections[current].push(clean);
    });

    return sections;
};

const enrichJobPosting = (job) => {
    const derived = deriveSectionsFromDescription(job?.description);
    const responsibilities = normalizeList(job?.responsibilities);
    const qualifications = normalizeList(job?.qualifications);
    const benefits = normalizeList(job?.benefits);

    return {
        ...job,
        responsibilities: responsibilities.length > 0 ? responsibilities : derived.responsibilities,
        qualifications: qualifications.length > 0 ? qualifications : derived.qualifications,
        benefits: benefits.length > 0 ? benefits : derived.benefits,
        summary: String(job?.summary || '').trim() || String(job?.description || '').trim() || null
    };
};

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

const makeApplicantCountKey = (title, branch) => `${title}::${branch || '*'}`;

const buildApplicantCountIndex = (applicants = []) => {
    const counts = new Map();

    const add = (title, branch) => {
        if (!title) return;
        const key = makeApplicantCountKey(title, branch);
        counts.set(key, (counts.get(key) || 0) + 1);
    };

    for (const applicant of applicants) {
        const normalizedPosition = normalizeText(applicant?.position_applied);
        const normalizedRoleTitle = normalizeText(ROLE_ID_TO_TITLE[applicant?.position_applied]);
        const normalizedBranch = normalizeText(applicant?.branch);
        const titles = new Set([normalizedPosition, normalizedRoleTitle].filter(Boolean));

        for (const title of titles) {
            add(title, '*');
            if (normalizedBranch) add(title, normalizedBranch);
        }
    }

    return counts;
};

const countApplicantsForJob = (job, applicantCountIndex) => {
    const jobTitle = normalizeText(job?.job_title);
    if (!jobTitle) return 0;

    const jobBranch = normalizeText(job?.branch);
    if (jobBranch) {
        return applicantCountIndex.get(makeApplicantCountKey(jobTitle, jobBranch)) || 0;
    }

    return applicantCountIndex.get(makeApplicantCountKey(jobTitle, '*')) || 0;
};

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

const resolveJobPostingId = async ({ jobId, positionApplied, branch }) => {
    const cleanJobId = String(jobId || '').trim();
    if (cleanJobId) {
        const { data, error } = await supabase
            .from('jobpostings')
            .select('job_id')
            .eq('job_id', cleanJobId)
            .maybeSingle();
        if (error) throw error;
        if (data?.job_id) return data.job_id;
    }

    const normalizedPosition = normalizeText(positionApplied);
    if (!normalizedPosition) return null;

    const normalizedRoleTitle = normalizeText(ROLE_ID_TO_TITLE[positionApplied]);
    const normalizedBranchInput = normalizeText(branch);

    const { data: jobs, error: jobsError } = await supabase
        .from('jobpostings')
        .select('job_id, job_title, branch, job_status, date_posted');
    if (jobsError) throw jobsError;

    const candidates = (jobs || []).filter((job) => {
        const normalizedJobTitle = normalizeText(job.job_title);
        const titleMatches = normalizedJobTitle === normalizedPosition || normalizedJobTitle === normalizedRoleTitle;
        if (!titleMatches) return false;

        const normalizedJobBranch = normalizeText(job.branch);
        if (normalizedBranchInput && normalizedJobBranch) return normalizedBranchInput === normalizedJobBranch;
        return true;
    });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
        const activeA = isJobActive(a.job_status) ? 1 : 0;
        const activeB = isJobActive(b.job_status) ? 1 : 0;
        if (activeA !== activeB) return activeB - activeA;

        const dateA = new Date(a.date_posted || 0).getTime();
        const dateB = new Date(b.date_posted || 0).getTime();
        return dateB - dateA;
    });

    return candidates[0].job_id;
};

const buildJobPostingsSnapshot = async () => {
    const { data: jobs, error: jobsError } = await supabase.from('jobpostings').select('*').order('date_posted', { ascending: false });
    if (jobsError) throw jobsError;

    const { data: applicants, error: applicantsError } = await supabase.from('applicant').select('applicant_no, position_applied, branch');
    if (applicantsError) throw applicantsError;

    const { data: viewEvents, error: viewEventsError } = await supabase
        .from('site_events')
        .select('event_id, created_at');
    if (viewEventsError) throw viewEventsError;

    const applicantCountIndex = buildApplicantCountIndex(applicants || []);
    const jobsWithCounts = (jobs || []).map((job) => (
        enrichJobPosting({ ...job, total_applicants: countApplicantsForJob(job, applicantCountIndex) })
    ));

    const activeJobPosts = jobsWithCounts.filter((job) => isJobActive(job.job_status)).length;
    const totalApplications = (applicants || []).length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    const totalViews = (viewEvents || []).length;

    const viewsThisMonth = (viewEvents || []).reduce((count, event) => {
        const ts = new Date(event.created_at).getTime();
        if (Number.isNaN(ts)) return count;
        if (ts >= monthStart && ts < nextMonthStart) return count + 1;
        return count;
    }, 0);

    return { summary: { activeJobPosts, totalApplications, totalViews, viewsThisMonth }, jobs: jobsWithCounts };
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

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const isMissingEmailColumnError = (error) => String(error?.message || '').toLowerCase().includes('column employees.email does not exist');

const employeeSelectColumns = () => (
    employeeEmailColumnAvailable === false
        ? 'employee_id, first_name, last_name, role, password'
        : 'employee_id, first_name, last_name, role, password, email'
);

const buildEmployeeLookupQuery = async (employeeId) => {
    const cleanId = String(employeeId || '').trim();

    const byEmployeeId = await supabase
        .from('employees')
        .select(employeeSelectColumns())
        .eq('employee_id', cleanId)
        .maybeSingle();

    if (byEmployeeId.error) {
        if (isMissingEmailColumnError(byEmployeeId.error)) {
            employeeEmailColumnAvailable = false;
            return buildEmployeeLookupQuery(cleanId);
        }
        return byEmployeeId;
    }

    if (byEmployeeId.data) {
        if (employeeEmailColumnAvailable === null && Object.prototype.hasOwnProperty.call(byEmployeeId.data, 'email')) {
            employeeEmailColumnAvailable = true;
        }
        return byEmployeeId;
    }

    return { data: null, error: null };
};

const createResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

const toPublicResetError = (error) => {
    const message = String(error?.message || 'Unable to process request.');
    const normalized = message.toLowerCase();

    if (normalized.includes('invalid login') || normalized.includes('username and password not accepted')) {
        return 'Email sender credentials are invalid. Update EMAIL_USER and EMAIL_PASS in Back-end/.env.';
    }

    if (normalized.includes('missing credentials')) {
        return 'Email sender credentials are missing. Set EMAIL_USER and EMAIL_PASS in Back-end/.env.';
    }

    return message;
};

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
    const factAppliedDate = applicantRow?.applicantfacttable?.[0]?.applied_date;
    if (factAppliedDate) {
        const parsed = new Date(factAppliedDate);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    if (!applicantRow) return null;
    const tsMatch = String(applicantRow.applicant_no || '').match(/^APP-(\d+)$/);
    if (tsMatch) {
        const ts = Number.parseInt(tsMatch[1], 10);
        if (!Number.isNaN(ts)) return new Date(ts).toISOString();
    }
    return null;
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
    try {
        const branchQuery = normalizeText(req.query?.branch);
        const activeOnly = String(req.query?.activeOnly || '').trim().toLowerCase() === 'true';
        const cacheKey = makeCacheKey('jobs', { branchQuery, activeOnly });
        const cached = getCachedResponse(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { data: jobs, error } = await supabase
            .from('jobpostings')
            .select('*')
            .order('date_posted', { ascending: false });
        if (error) throw error;

        const filtered = (jobs || []).filter((job) => {
            if (activeOnly && !isJobActive(job.job_status)) return false;
            if (!branchQuery) return true;

            const branchText = normalizeText(job?.branch);
            const locationText = normalizeText(job?.location);
            return branchText.includes(branchQuery) || locationText.includes(branchQuery);
        });

        const payload = filtered.map((job) => enrichJobPosting(job));
        setCachedResponse(cacheKey, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getJobPostingsDashboard = async (req, res) => {
    try {
        const cacheKey = makeCacheKey('dashboard', {});
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);

        const payload = await buildJobPostingsSnapshot();
        setCachedResponse(cacheKey, payload);
        res.json(payload);
    } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getUpcomingInterviews = async (req, res) => {
    try {
        const cacheKey = makeCacheKey('upcomingInterviews', {});
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);

        const { data, error } = await supabase
            .from('applicantfacttable')
            .select('schedule:schedule_id(interview_schedule), status!inner(interview)')
            .eq('status.interview', 1)
            .not('schedule_id', 'is', null);

        if (error) throw error;

        const grouped = (data || []).reduce((acc, row) => {
            const date = row?.schedule?.interview_schedule;
            if (!date) return acc;
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const dates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const schedule = dates.map((date) => ({ date, count: grouped[date] }));
        const totalScheduled = schedule.reduce((sum, item) => sum + item.count, 0);

        const payload = { totalScheduled, schedule };
        setCachedResponse(cacheKey, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.recordJobView = async (req, res) => {
    const { roleId, branch } = req.body || {};
    if (!roleId) return res.status(400).json({ error: 'roleId required' });
    try {
        const eventId = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { error } = await supabase.from('site_events').insert([
            {
                event_id: eventId,
                event_type: 'JOB_VIEW',
                action: 'VIEW_JOB',
                page: 'apply',
                role_id: roleId,
                branch: branch || null
            }
        ]);
        if (error) throw error;
        invalidateCacheByScopes(['dashboard']);
        res.status(201).json({ message: 'View recorded' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.recordSiteView = async (req, res) => {
    const { action, page } = req.body || {};
    const normalizedAction = String(action || '').trim();
    if (!normalizedAction) return res.status(400).json({ error: 'action required' });

    try {
        const eventId = `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { error } = await supabase.from('site_events').insert([
            {
                event_id: eventId,
                event_type: 'SITE_VIEW',
                action: normalizedAction,
                page: String(page || 'unknown')
            }
        ]);

        if (error) throw error;
        invalidateCacheByScopes(['dashboard']);
        res.status(201).json({ message: 'Site view recorded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createJobPosting = async (req, res) => {
    const { job_title, department, contract_type, branch, description, summary, responsibilities, qualifications, benefits } = req.body || {};
    const normalizedDescription = String(description || '').trim();
    const normalizedSummary = String(summary || '').trim() || normalizedDescription || null;
    try {
        const { data, error } = await supabase.from('jobpostings').insert([{
            job_title,
            department,
            contract_type,
            branch,
            description: normalizedDescription || null,
            summary: normalizedSummary,
            responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
            qualifications: Array.isArray(qualifications) ? qualifications : [],
            benefits: Array.isArray(benefits) ? benefits : [],
            date_posted: new Date().toISOString().slice(0, 10),
            job_status: true,
            total_applicants: 0
        }]).select().single();
        if (error) throw error;
        invalidateCacheByScopes(['jobs', 'dashboard', 'reports']);
        res.status(201).json({ message: 'Created successfully', job: data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateJobPosting = async (req, res) => {
    try {
        const payload = { ...(req.body || {}) };
        if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
            const normalizedDescription = String(payload.description || '').trim();
            payload.description = normalizedDescription || null;
            if (!Object.prototype.hasOwnProperty.call(payload, 'summary')) {
                payload.summary = normalizedDescription || null;
            }
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'summary')) {
            const normalizedSummary = String(payload.summary || '').trim();
            payload.summary = normalizedSummary || null;
        }

        const { data, error } = await supabase.from('jobpostings').update(payload).eq('job_id', req.params.id).select().single();
        if (error) throw error;
        invalidateCacheByScopes(['jobs', 'dashboard', 'reports']);
        res.json({ message: 'Updated successfully', job: data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const { data, error } = await supabase.from('jobpostings').update({ job_status: Boolean(req.body.job_status) }).eq('job_id', req.params.id).select().single();
        if (error) throw error;
        invalidateCacheByScopes(['jobs', 'dashboard', 'reports']);
        res.json({ message: 'Status updated', job: data });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteJobPosting = async (req, res) => {
    try {
        const { error } = await supabase.from('jobpostings').delete().eq('job_id', req.params.id);
        if (error) throw error;
        invalidateCacheByScopes(['jobs', 'dashboard', 'reports']);
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
        medicalCondition, medicalDetails, branch, positionApplied, jobId
    } = req.body;

    try {
        const normalizedFirstName = String(firstName || '').trim();
        const normalizedLastName = String(lastName || '').trim();
        if (!normalizedFirstName || !normalizedLastName) {
            return res.status(400).json({ error: 'First name and last name are required.' });
        }

        const normalizedEmail = normalizeEmail(email);

        // <-- Updated to use the secure password generator -->
        const tempPassword = generateSecurePassword(10); 
        const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();

        const [resumeUrl, coverLetterUrl, prcIdUrl] = await Promise.all([
            uploadFileToSupabase(files['resume']),
            uploadFileToSupabase(files['coverLetter']),
            uploadFileToSupabase(files['prcId'])
        ]);

        const cleanAge = parseInt(age) || 0; 
        const cleanContact = contactNumber ? contactNumber.replace(/\D/g, '') : null;

        // A. Save Applicant Data
        const { data: createdApplicant, error: appError } = await supabase.from('applicant').insert([{ 
            password: tempPassword, first_name: normalizedFirstName, last_name: normalizedLastName,
            middle_initial: middleInitial ? middleInitial.substring(0, 5) : null, suffix: suffix ? suffix.substring(0, 10) : null,
            nationality, birthday, age: cleanAge, email: normalizedEmail, contact_number: cleanContact,
            region, province, city_municipality: city, barangay, detailed_address: detailedAddress,
            resume_url: resumeUrl, cover_letter_url: coverLetterUrl, prc_id_url: prcIdUrl,
            medical_condition: medicalCondition || 'no', medical_details: medicalDetails || null,
            branch: branch || 'Not specified', position_applied: positionApplied || 'Not specified'
        }]).select('applicant_no').single();
        if (appError) throw appError;
        const applicantNo = createdApplicant?.applicant_no;
        if (!applicantNo) throw new Error('Failed to generate applicant number.');

        // B. Save Status
        const statusPromise = supabase.from('status').insert([{ 
            applied: 1, interview: 0, hired: 0, rejected: 0, applicant_no: applicantNo, applicant_name: fullName 
        }]).select().single();
        const resolvedJobIdPromise = resolveJobPostingId({ jobId, positionApplied, branch });

        const [{ data: newStatus, error: statusError }, resolvedJobId] = await Promise.all([
            statusPromise,
            resolvedJobIdPromise
        ]);

        if (!statusError && newStatus) {
            const factPayload = { applicant_no: applicantNo, status_id: newStatus.status_id };
            if (resolvedJobId) {
                factPayload.job_id = resolvedJobId;
            }
            await supabase.from('applicantfacttable').insert([factPayload]);
        }

        // C. Send the Automated Email
        let emailSent = false;
        let emailWarning = null;

        if (normalizedEmail) { 
            try {
                const activeTransporter = await ensureEmailTransport();

                const mailOptions = {
                    from: `"6R Diamond Recruitment" <${emailUser}>`, 
                    to: normalizedEmail, 
                    subject: 'Application Received - Login Credentials',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                            <h2 style="color: #4A90E2;">Hello ${normalizedFirstName},</h2>
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
                await activeTransporter.sendMail(mailOptions);
                emailSent = true;
                console.log(`Successfully sent credentials to applicant at: ${normalizedEmail}`);
            } catch (emailErr) {
                emailWarning = String(emailErr?.message || 'Unable to send credentials email.');
                console.error('Warning: Failed to send email to applicant:', emailErr);
            }
        }

        invalidateCacheByScopes(['jobs', 'dashboard', 'reports', 'applicants', 'upcomingInterviews']);

        res.status(201).json({
            message: 'Application submitted!',
            applicantId: applicantNo,
            emailSent,
            emailWarning
        });
    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getApplicants = async (req, res) => {
    try {
        const cacheKey = makeCacheKey('applicants', {});
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);

        const { data, error } = await supabase.from('applicant').select(`*, applicantfacttable (applied_date, status (applied, interview, hired, rejected))`).order('applicant_no', { ascending: false });
        if (error) throw error;
        const payload = data.map(app => ({
            appliedAt: app.created_at || app.createdAt || inferAppliedAtFromApplicant(app),
            created_at: app.created_at || null,
            application_date: app.created_at || app.createdAt || inferAppliedAtFromApplicant(app),
            id: app.applicant_no || 'N/A', name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
            firstName: app.first_name, lastName: app.last_name, middleInitial: app.middle_initial,
            nationality: app.nationality, birthday: app.birthday, age: app.age, email: app.email || 'N/A', phone: app.contact_number || 'N/A',
            region: app.region, province: app.province, city: app.city_municipality, barangay: app.barangay,
            detailedAddress: app.detailed_address, resume_url: app.resume_url, cover_letter_url: app.cover_letter_url,
            medicalCondition: app.medical_condition, medicalDetails: app.medical_details,
            status: extractApplicantStatus(app), branch: app.branch || 'Not assigned', position: app.position_applied || 'Not assigned'
        }));

        setCachedResponse(cacheKey, payload);
        res.json(payload);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getReports = async (req, res) => {
    try {
        const period = getPeriodConfig(req.query || {});
        const selectedBranch = normalizeBranch(req.query?.branch);
        const hasBranchFilter = selectedBranch && selectedBranch !== 'all';
        const cacheKey = makeCacheKey('reports', {
            reportType: period.reportType,
            startDate: period.startDate,
            endDate: period.endDate,
            selectedBranch: hasBranchFilter ? selectedBranch : 'all'
        });
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);

        const { data, error } = await supabase.from('applicant').select(`*, applicantfacttable (applied_date, status (applied, interview, hired, rejected))`);
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

        const payload = {
            meta: { reportType: period.reportType, label: period.label, dateRange: { from: period.startDate, to: period.endDate }, filter: { ...period.filter, branch: hasBranchFilter ? selectedBranch : 'all' } },
            summary: { totalApplications: total, newApplications: statusBreakdown.Applied, interviewCount: statusBreakdown.Interview, hiredCount: statusBreakdown.Hired, rejectedCount: statusBreakdown.Rejected, interviewRate: percentage(statusBreakdown.Interview, total), hiringRate: percentage(statusBreakdown.Hired, total), rejectionRate: percentage(statusBreakdown.Rejected, total) },
            statusBreakdown, records
        };

        setCachedResponse(cacheKey, payload);
        res.json(payload);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getApplicantStatus = async (req, res) => {
    const { applicantNo, password } = req.body || {};
    if (!applicantNo || !password) return res.status(400).json({ error: 'Required' });
    try {
        const { data: applicant, error } = await supabase
            .from('applicant')
            .select(`
                applicant_no,
                password,
                first_name,
                last_name,
                branch,
                position_applied,
                applicantfacttable (
                    applied_date,
                    status (applied, interview, hired, rejected),
                    schedule:schedule_id (*)
                )
            `)
            .eq('applicant_no', applicantNo)
            .maybeSingle();
        if (error) throw error;
        if (!applicant || applicant.password !== password) return res.status(401).json({ error: 'Invalid' });

        const fact = Array.isArray(applicant.applicantfacttable) ? applicant.applicantfacttable[0] : null;
        const schedule = fact?.schedule || null;

        res.json({
            applicant: {
                id: applicant.applicant_no,
                name: `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim(),
                status: extractApplicantStatus(applicant),
                branch: applicant.branch || 'Not assigned',
                position: applicant.position_applied || 'Not assigned',
                appliedAt: inferAppliedAtFromApplicant(applicant),
                checkedAt: new Date().toISOString(),
                interviewSchedule: schedule
                    ? {
                        date: schedule.interview_schedule || null,
                        time: schedule.interview_time || null,
                        location: schedule.location || null,
                        room: schedule.room_number || null,
                        reminders: schedule.reminders || null
                    }
                    : null
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
        invalidateCacheByScopes(['jobs', 'dashboard', 'reports', 'applicants', 'upcomingInterviews']);
        res.json({ message: `Status updated to ${status}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.loginEmployee = async (req, res) => {
    try {
        const employeeId = String(req.body.employeeId || '').trim();
        const password = String(req.body.password || '');

        if (!employeeId || !password) {
            return res.status(400).json({ error: 'Employee ID and password are required.' });
        }

        const { data, error } = await buildEmployeeLookupQuery(employeeId);
        if (error) throw error;
        if (!data || data.password !== password) return res.status(401).json({ error: 'Invalid Credentials' });

        res.json({
            message: 'Login successful',
            user: {
                id: data.employee_id,
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                role: data.role || 'HR',
                email: data.email || ''
            }
        });
    } catch (err) { res.status(500).json({ error: err.message || 'Server Error' }); }
};

exports.getEmployeeProfile = async (req, res) => {
    try {
        const employeeId = String(req.params.employeeId || '').trim();
        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required.' });
        }

        const { data, error } = await buildEmployeeLookupQuery(employeeId);
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Employee not found.' });

        res.json({
            user: {
                id: data.employee_id,
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                role: data.role || 'HR',
                email: data.email || ''
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Unable to load employee profile.' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const employeeId = String(req.body.employeeId || '').trim();
    const email = normalizeEmail(req.body.email);

    if (!employeeId || !email) {
        return res.status(400).json({ error: 'Employee ID and registered email are required.' });
    }

    try {
        const { data, error } = await buildEmployeeLookupQuery(employeeId);
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Account not found.' });

        if (employeeEmailColumnAvailable === false) {
            return res.status(500).json({ error: 'Reset requires employees.email column. Add and populate registered HR emails in Supabase.' });
        }

        const accountEmail = normalizeEmail(data.email);
        if (!accountEmail) {
            return res.status(400).json({ error: 'This HR account has no registered email. Contact admin to update email in Supabase first.' });
        }

        if (accountEmail !== email) {
            return res.status(401).json({ error: 'Email does not match this account.' });
        }

        const code = createResetCode();
        passwordResetStore.set(String(data.employee_id), {
            code,
            expiresAt: Date.now() + PASSWORD_RESET_EXPIRY_MS,
            email: accountEmail
        });

        const activeTransporter = await ensureEmailTransport();

        await activeTransporter.sendMail({
            from: `"6R Diamond Recruitment" <${emailUser}>`,
            to: accountEmail,
            subject: 'Password Reset Verification Code',
            html: `<p>Hello ${data.first_name || 'HR User'},</p><p>Your password reset code is <strong>${code}</strong>.</p><p>This code will expire in 15 minutes.</p>`
        });

        res.json({ message: 'Verification code sent to your registered email.' });
    } catch (err) {
        console.error('Password reset request failed:', err.message);
        res.status(500).json({ error: toPublicResetError(err) });
    }
};

exports.confirmPasswordReset = async (req, res) => {
    const employeeId = String(req.body.employeeId || '').trim();
    const code = String(req.body.code || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!employeeId || !code || !newPassword) {
        return res.status(400).json({ error: 'Employee ID, code, and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    try {
        const { data, error } = await buildEmployeeLookupQuery(employeeId);
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Account not found.' });

        const resetSession = passwordResetStore.get(String(data.employee_id));
        if (!resetSession) return res.status(400).json({ error: 'No reset request found. Request a new code.' });
        if (Date.now() > resetSession.expiresAt) {
            passwordResetStore.delete(String(data.employee_id));
            return res.status(400).json({ error: 'Verification code has expired. Request a new code.' });
        }
        if (resetSession.code !== code) return res.status(401).json({ error: 'Invalid verification code.' });

        const { error: updateError } = await supabase
            .from('employees')
            .update({ password: newPassword })
            .eq('employee_id', data.employee_id);
        if (updateError) throw updateError;

        passwordResetStore.delete(String(data.employee_id));
        res.json({ message: 'Password updated successfully. You can now login.' });
    } catch (err) {
        console.error('Password reset confirmation failed:', err.message);
        res.status(500).json({ error: err.message || 'Unable to reset password.' });
    }
};