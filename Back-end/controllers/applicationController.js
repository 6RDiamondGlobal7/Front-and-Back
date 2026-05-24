const supabase = require('../config/supabaseClient');
const nodemailer = require('nodemailer'); // 1. Import Nodemailer
const crypto = require('crypto'); // <-- Added crypto module

// ==========================================
// --- Email Transporter Configuration ---
// ==========================================
const emailUser = String(process.env.EMAIL_USER || '').trim();
const emailPass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const defaultFromAddress = emailUser || 'no-reply@6rdiamond.local';

const createPrimaryTransporter = () => nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_SMTP_PORT || 465),
    secure: String(process.env.EMAIL_SMTP_SECURE || 'true').toLowerCase() === 'true',
    family: 4, // Avoid IPv6 ENETUNREACH in environments without IPv6 routing.
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

const createFallbackTransporter = () => nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

const sendEmail = async (mailOptions) => {
    // Normalize mail options
    const fromAddress = String((mailOptions && mailOptions.from) || process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL_ADDRESS || defaultFromAddress).trim();
    const to = Array.isArray(mailOptions.to) ? mailOptions.to.join(',') : String(mailOptions.to || '').trim();

    // Attempt Resend API first when configured (recommended for reliable delivery)
    const resendKey = String(process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
        try {
            const payload = {
                from: fromAddress,
                to,
                subject: String(mailOptions.subject || '').slice(0, 256),
                html: String(mailOptions.html || mailOptions.text || '')
            };

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resendKey}`
                },
                body: JSON.stringify(payload),
                // small timeout environments will be handled by host; rely on host-level timeouts
            });

            if (res.ok) {
                const body = await res.json().catch(() => null);
                console.log('Email sent via Resend to', to, 'status', res.status);
                return { provider: 'resend', status: res.status, body };
            }

            const text = await res.text().catch(() => '');
            const err = new Error(`Resend API error: ${res.status} ${res.statusText} ${text}`);
            err.code = res.status;
            throw err;
        } catch (resendErr) {
            console.warn('Resend send failed, trying next provider:', resendErr?.message || resendErr);
            // try next provider (SendGrid) or SMTP below
        }
    }

    // Next: try SendGrid if configured
    const sendgridKey = String(process.env.SENDGRID_API_KEY || '').trim();
    if (sendgridKey) {
        try {
            const sgPayload = {
                personalizations: [{ to: to.split(',').map(t => ({ email: t.trim() })), subject: String(mailOptions.subject || '') }],
                from: { email: fromAddress },
                content: [{ type: 'text/html', value: String(mailOptions.html || mailOptions.text || '') }]
            };

            const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sendgridKey}`
                },
                body: JSON.stringify(sgPayload)
            });

            if (sgRes.ok) {
                console.log('Email sent via SendGrid to', to, 'status', sgRes.status);
                return { provider: 'sendgrid', status: sgRes.status };
            }

            const sgText = await sgRes.text().catch(() => '');
            const sgErr = new Error(`SendGrid API error: ${sgRes.status} ${sgRes.statusText} ${sgText}`);
            sgErr.code = sgRes.status;
            throw sgErr;
        } catch (sgErr) {
            console.warn('SendGrid send failed, falling back to SMTP:', sgErr?.message || sgErr);
            // continue to SMTP fallback
        }
    }

    // If we get here, use SMTP. Ensure credentials exist.
    if (!emailUser || !emailPass) {
        throw new Error('Email sender credentials are missing. Set EMAIL_USER and EMAIL_PASS in Back-end/.env or configure RESEND_API_KEY.');
    }

    const primaryTransporter = createPrimaryTransporter();
    try {
        // Ensure `from` is present on mailOptions for nodemailer
        const smtpOptions = { ...mailOptions, from: fromAddress };
        return await primaryTransporter.sendMail(smtpOptions);
    } catch (primaryErr) {
        console.warn('Primary SMTP failed, trying fallback transporter:', primaryErr?.message || primaryErr);
        const fallbackTransporter = createFallbackTransporter();
        try {
            const smtpOptions = { ...mailOptions, from: fromAddress };
            return await fallbackTransporter.sendMail(smtpOptions);
        } catch (fallbackErr) {
            // Surface original primary error for inspection
            primaryErr.fallback = fallbackErr;
            throw primaryErr;
        }
    }
};

const passwordResetStore = new Map();
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;
let hrEmailColumnAvailable = null;

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
        summary: String(job?.description || '').trim() || null
    };
};

const ROLE_ID_TO_TITLE = {
    'corp-sec': 'Corporate Secretary',
    'licensed-broker': 'Licensed Customs Broker',
    'office-manager': 'Office Manager',
    'messenger': 'Messenger / Logistics',
    'internship': 'Internship',
    'secretary': 'Secretary to the Office Manager',
    'brokerage-specialist': 'Brokerage Specialist',
    'import-export-head': 'Import & Export Head',
    'admin-staff': 'Administration Staff',
    'doc-head': 'Documentation Head'
};

const TITLE_TO_ROLE_IDS = Object.entries(ROLE_ID_TO_TITLE).reduce((acc, [roleId, title]) => {
    const key = normalizeText(title);
    if (!acc[key]) acc[key] = [];
    acc[key].push(roleId);
    return acc;
}, {});

const isJobActive = (status) => status === true || status === 'true' || status === 'Open' || status === 'Active';

const isAllBranchesValue = (value) => {
    const normalized = normalizeText(value);
    return normalized === 'all branches' || normalized === 'all branch' || normalized === 'all';
};

const normalizeIsoDateOnly = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    return raw;
};

const todayIsoDateOnly = () => new Date().toISOString().slice(0, 10);

const isFutureIsoDateOnly = (isoDateOnly) => {
    const normalized = normalizeIsoDateOnly(isoDateOnly);
    if (!normalized) return false;
    return normalized > todayIsoDateOnly();
};

const normalizeMaxApplicants = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number.parseInt(String(value).trim(), 10);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return parsed;
};

const isMissingColumnError = (error, columnName) => {
    const msg = String(error?.message || '');
    const col = String(columnName || '').trim();
    if (!col) return false;

    // Supabase/Postgres messages vary, e.g.:
    // - column max_applicants does not exist
    // - column "max_applicants" does not exist
    // - column jobpostings.max_applicants does not exist
    // - column "jobpostings.max_applicants" does not exist
    const escaped = col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`column\\s+\\"?(?:[a-z0-9_]+\\.)?${escaped}\\"?\\s+does\\s+not\\s+exist`, 'i');
    return pattern.test(msg);
};

const getApplicantJobId = (applicantRow) => {
    const fact = applicantRow?.applicantfacttable;
    if (Array.isArray(fact) && fact.length > 0 && fact[0]?.job_id) return fact[0].job_id;
    return applicantRow?.job_id || null;
};

const ensureAutoCloseForJobs = async (jobsWithCounts) => {
    const toCloseIds = (jobsWithCounts || [])
        .filter((job) => {
            const limit = normalizeMaxApplicants(job?.max_applicants);
            if (!limit) return false;
            const count = Number(job?.total_applicants || 0);
            return isJobActive(job?.job_status) && count >= limit;
        })
        .map((job) => job?.job_id)
        .filter(Boolean);

    if (toCloseIds.length === 0) return;

    // Best-effort: if the schema doesn't include this column or update fails, don't break reads.
    try {
        await supabase.from('jobpostings').update({ job_status: false }).in('job_id', toCloseIds);
    } catch (err) {
        // ignore
    }
};

const isJobExpiredByDate = (job, nowIsoDateOnly) => {
    const deadline = normalizeIsoDateOnly(job?.accepting_until);
    if (!deadline) return false;
    return deadline < (nowIsoDateOnly || todayIsoDateOnly());
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
    if (applicantBranch && jobBranch && !isAllBranchesValue(job.branch)) return applicantBranch === jobBranch;
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
        if (normalizedBranchInput && normalizedJobBranch && !isAllBranchesValue(job.branch)) return normalizedBranchInput === normalizedJobBranch;
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

    const { data: applicants, error: applicantsError } = await supabase
        .from('applicant')
        .select('applicant_no, position_applied, branch, applicantfacttable (job_id)');
    if (applicantsError) throw applicantsError;

    const { data: viewEvents, error: viewEventsError } = await supabase
        .from('site_events')
        .select('event_id, created_at');
    if (viewEventsError) throw viewEventsError;

    const applicantsList = applicants || [];
    const nowDateOnly = todayIsoDateOnly();

    const jobsWithCounts = (jobs || []).map((job) => {
        const limit = normalizeMaxApplicants(job?.max_applicants);
        const hasLimit = Boolean(limit);
        const expiredByDate = isJobExpiredByDate(job, nowDateOnly);

        const countByJobId = applicantsList.filter((applicant) => (
            String(getApplicantJobId(applicant) || '').trim() === String(job?.job_id || '').trim()
        )).length;

        const fallbackCount = applicantsList.filter((applicant) => applicantMatchesJob(applicant, job)).length;
        const applicantCount = countByJobId > 0 ? countByJobId : fallbackCount;

        const isFull = hasLimit && applicantCount >= limit;
        const jobStatus = (isFull || expiredByDate) ? false : job?.job_status;

        return enrichJobPosting({
            ...job,
            job_status: jobStatus,
            total_applicants: applicantCount,
            is_full: isFull,
            is_expired: expiredByDate
        });
    });

    await ensureAutoCloseForJobs(jobsWithCounts);

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

const formatApplicantFullName = (firstName, lastName) => {
    const fullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
    return fullName || 'Applicant';
};

const formatApplicantGreeting = (firstName, lastName) => `Hi, ${formatApplicantFullName(firstName, lastName)}`;

const isMissingEmailColumnError = (error) => String(error?.message || '').toLowerCase().includes('column hr.email does not exist');

const HR_TABLE_CANDIDATES = ['hr', 'HR'];
const HR_ID_COLUMN_CANDIDATES = ['employee_id', 'id'];
const HR_BASE_SELECT = 'employee_id, id, first_name, last_name, role, password';

const hrSelectColumns = () => (
    hrEmailColumnAvailable === false ? HR_BASE_SELECT : `${HR_BASE_SELECT}, email`
);

const normalizeHrRecord = (row) => {
    if (!row) return null;
    return {
        id: String(row.employee_id || row.id || '').trim(),
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        role: row.role || 'HR',
        password: row.password || '',
        email: row.email || ''
    };
};

const buildHrLookupQuery = async (employeeId) => {
    const cleanId = String(employeeId || '').trim();
    if (!cleanId) return { data: null, error: null };

    for (const tableName of HR_TABLE_CANDIDATES) {
        for (const idColumn of HR_ID_COLUMN_CANDIDATES) {
            if (idColumn === 'id' && !/^\d+$/.test(cleanId)) {
                continue;
            }
            const lookup = await supabase
                .from(tableName)
                .select(hrSelectColumns())
                .eq(idColumn, cleanId)
                .maybeSingle();

            if (lookup.error) {
                if (isMissingEmailColumnError(lookup.error)) {
                    hrEmailColumnAvailable = false;
                    return buildHrLookupQuery(cleanId);
                }

                const message = String(lookup.error.message || '').toLowerCase();
                if (
                    message.includes('column') && message.includes('does not exist')
                    || message.includes('could not find the table')
                ) {
                    continue;
                }
                return lookup;
            }

            if (lookup.data) {
                if (hrEmailColumnAvailable === null && Object.prototype.hasOwnProperty.call(lookup.data, 'email')) {
                    hrEmailColumnAvailable = true;
                }
                return { data: normalizeHrRecord(lookup.data), error: null };
            }
        }
    }

    return { data: null, error: null };
};

const buildHrPasswordResetLookupQuery = async (employeeId) => {
    const cleanId = String(employeeId || '').trim();
    if (!cleanId) return { data: null, error: null };

    for (const tableName of HR_TABLE_CANDIDATES) {
        for (const idColumn of HR_ID_COLUMN_CANDIDATES) {
            if (idColumn === 'id' && !/^\d+$/.test(cleanId)) {
                continue;
            }

            const lookup = await supabase
                .from(tableName)
                .select('employee_id, id, first_name, last_name, role, password, email')
                .eq(idColumn, cleanId)
                .maybeSingle();

            if (lookup.error) {
                const message = String(lookup.error.message || '').toLowerCase();
                if (
                    message.includes('column') && message.includes('does not exist')
                    || message.includes('could not find the table')
                ) {
                    continue;
                }
                return lookup;
            }

            if (lookup.data) {
                return { data: normalizeHrRecord(lookup.data), error: null };
            }
        }
    }

    return { data: null, error: null };
};

const updateHrPassword = async (accountId, newPassword) => {
    const cleanId = String(accountId || '').trim();
    if (!cleanId) return { error: new Error('Missing account identifier.') };

    for (const tableName of HR_TABLE_CANDIDATES) {
        for (const idColumn of HR_ID_COLUMN_CANDIDATES) {
            if (idColumn === 'id' && !/^\d+$/.test(cleanId)) {
                continue;
            }
            const { error } = await supabase
                .from(tableName)
                .update({ password: newPassword })
                .eq(idColumn, cleanId);

            if (!error) return { error: null };

            const message = String(error.message || '').toLowerCase();
            if (
                message.includes('column') && message.includes('does not exist')
                || message.includes('could not find the table')
            ) {
                continue;
            }
            return { error };
        }
    }

    return { error: new Error('Unable to update HR password. Verify HR table and ID columns in Supabase.') };
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

const toPublicEmailError = (error) => {
    const message = String(error?.message || 'Unable to send email.');
    const normalized = message.toLowerCase();

    if (normalized.includes('invalid login') || normalized.includes('username and password not accepted')) {
        return 'Email sender credentials are invalid. Update EMAIL_USER and EMAIL_PASS (Gmail app password) in Back-end/.env.';
    }

    if (normalized.includes('missing credentials')) {
        return 'Email sender credentials are missing. Set EMAIL_USER and EMAIL_PASS in Back-end/.env.';
    }

    if (normalized.includes('invalid from')) {
        return 'Sender address is invalid. Ensure EMAIL_USER is a valid email address in Back-end/.env.';
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

const APPLICATION_ACTIVE_WINDOW_DAYS = 90;

const buildApplicationPolicy = (appliedAt) => {
    if (!appliedAt) {
        return {
            activeWindowDays: APPLICATION_ACTIVE_WINDOW_DAYS,
            activeUntil: null,
            statement: `Applications remain active for ${APPLICATION_ACTIVE_WINDOW_DAYS} calendar days from the submission date, unless HR closes the application earlier by marking it as Hired or Rejected.`
        };
    }

    const appliedDate = new Date(appliedAt);
    if (Number.isNaN(appliedDate.getTime())) {
        return {
            activeWindowDays: APPLICATION_ACTIVE_WINDOW_DAYS,
            activeUntil: null,
            statement: `Applications remain active for ${APPLICATION_ACTIVE_WINDOW_DAYS} calendar days from the submission date, unless HR closes the application earlier by marking it as Hired or Rejected.`
        };
    }

    const activeUntil = new Date(appliedDate);
    activeUntil.setDate(activeUntil.getDate() + APPLICATION_ACTIVE_WINDOW_DAYS);

    return {
        activeWindowDays: APPLICATION_ACTIVE_WINDOW_DAYS,
        activeUntil: activeUntil.toISOString(),
        statement: `Applications remain active for ${APPLICATION_ACTIVE_WINDOW_DAYS} calendar days from the submission date, unless HR closes the application earlier by marking it as Hired or Rejected.`
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

exports.getUpcomingInterviews = async (req, res) => {
    try {
        const today = todayIsoDateOnly();
        const { data, error } = await supabase
            .from('applicantfacttable')
            .select('schedule:schedule_id!inner(interview_schedule), status!inner(interview)')
            .eq('status.interview', 1)
            .gte('schedule.interview_schedule', today);

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

        res.json({ totalScheduled, schedule });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getInterviewQueue = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applicantfacttable')
            .select(`
                applicant_no,
                schedule_id,
                status:status_id!inner(applied, interview, hired, rejected),
                applicant:applicant_no(first_name, last_name, position_applied, branch),
                schedule:schedule_id(interview_schedule, interview_time, location, room_number, reminders)
            `)
            .eq('status.interview', 1)
            .order('applied_date', { ascending: true });

        if (error) throw error;

        const applicantNos = Array.from(new Set((data || []).map((row) => String(row.applicant_no || '').trim()).filter(Boolean)));
        let applicantsByNo = {};

        if (applicantNos.length > 0) {
            const { data: fullApplicants, error: fullApplicantsError } = await supabase
                .from('applicant')
                .select(`
                    applicant_no,
                    first_name,
                    middle_initial,
                    last_name,
                    birthday,
                    age,
                    nationality,
                    email,
                    contact_number,
                    landline_number,
                    region,
                    province,
                    city_municipality,
                    barangay,
                    detailed_address,
                    resume_url,
                    application_letter_url,
                    medical_condition,
                    medical_details,
                    position_applied,
                    branch
                `)
                .in('applicant_no', applicantNos);
            if (fullApplicantsError) throw fullApplicantsError;

            applicantsByNo = (fullApplicants || []).reduce((acc, row) => {
                const key = String(row.applicant_no || '').trim();
                if (key) acc[key] = row;
                return acc;
            }, {});
        }

        const rows = (data || []).map((row) => ({
            applicant_no: row.applicant_no,
            applicant: applicantsByNo[String(row.applicant_no || '').trim()] || row.applicant || null,
            schedule_id: row.schedule_id || null,
            schedule: row.schedule || null,
            status: 'Interview'
        }));

        const pendingApplicants = rows.filter((row) => !row.schedule);
        const scheduledApplicants = rows.filter((row) => Boolean(row.schedule));

        // Keep `queue` for backward compatibility with any existing consumers.
        const queue = rows.map((row) => ({
            applicantNo: row.applicant_no,
            name: `${row?.applicant?.first_name || ''} ${row?.applicant?.last_name || ''}`.trim() || 'N/A',
            position: row?.applicant?.position_applied || 'Not assigned',
            branch: row?.applicant?.branch || 'Not assigned',
            status: 'Interview',
            schedule: row.schedule
                ? {
                    date: row.schedule.interview_schedule || null,
                    time: row.schedule.interview_time || null,
                    location: row.schedule.location || null,
                    room: row.schedule.room_number || null,
                    reminders: row.schedule.reminders || null
                }
                : null
        }));

        res.json({
            schemaVersion: 'interview-queue-v2',
            total: rows.length,
            pendingApplicants,
            scheduledApplicants,
            queue
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.saveInterviewSchedules = async (req, res) => {
    const payload = req.body || {};
    const defaultLocation = String(payload.location || '').trim() || null;
    const defaultRoomNumber = String(payload.room || payload.room_number || '').trim() || null;
    const defaultReminders = String(payload.reminders || '').trim() || null;

    const rows = Array.isArray(payload.schedules)
        ? payload.schedules
        : (payload.applicantNo || payload.applicant_no)
            ? [payload]
            : [];

    if (rows.length === 0) {
        return res.status(400).json({ error: 'No interview schedule payload received.' });
    }

    const created = [];
    const failedApplicants = [];

    try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] || {};
            const applicantNo = String(row.applicantNo || row.applicant_no || '').trim();
            const interviewDate = String(row.date || row.assignedDate || row.interview_schedule || '').trim();
            const interviewTime = String(row.time || row.timeSlot || row.interview_time || '').trim();
            const location = String(row.location || defaultLocation || '').trim() || null;
            const roomNumber = String(row.room || row.room_number || defaultRoomNumber || '').trim() || null;
            const reminders = String(row.reminders || defaultReminders || '').trim() || null;

            if (!applicantNo || !interviewDate || !interviewTime) {
                failedApplicants.push({
                    applicant_no: applicantNo || null,
                    reason: 'Each schedule requires applicantNo, date, and time.'
                });
                continue;
            }

            try {
                const schedulePayload = {
                    interview_schedule: interviewDate,
                    interview_time: interviewTime,
                    location: location,
                    room_number: roomNumber,
                    reminders: reminders
                };

                const { data: occupiedSlot, error: occupiedSlotError } = await supabase
                    .from('schedule')
                    .select('schedule_id, interview_schedule, interview_time')
                    .eq('interview_schedule', interviewDate)
                    .eq('interview_time', interviewTime)
                    .maybeSingle();

                if (occupiedSlotError) throw occupiedSlotError;
                if (occupiedSlot) {
                    failedApplicants.push({
                        applicant_no: applicantNo,
                        reason: `The selected time slot (${interviewTime}) is already occupied for ${interviewDate}.`
                    });
                    continue;
                }

                let insertResult = await supabase
                    .from('schedule')
                    .insert([schedulePayload])
                    .select('schedule_id')
                    .single();

                if (insertResult.error && String(insertResult.error.message || '').toLowerCase().includes('schedule_id')) {
                    insertResult = await supabase
                        .from('schedule')
                        .insert([{
                            schedule_id: `SCH-${Date.now()}-${i + 1}`,
                            ...schedulePayload
                        }])
                        .select('schedule_id')
                        .single();
                }

                if (insertResult.error) throw insertResult.error;
                const scheduleId = insertResult.data?.schedule_id;

                const { data: factData, error: factError } = await supabase
                    .from('applicantfacttable')
                    .select('status_id')
                    .eq('applicant_no', applicantNo)
                    .maybeSingle();

                if (factError) throw factError;

                const { data: applicantInfo } = await supabase
                    .from('applicant')
                    .select('first_name, last_name, email')
                    .eq('applicant_no', applicantNo)
                    .maybeSingle();

                if (factData?.status_id) {
                    const { error: statusUpdateError } = await supabase
                        .from('status')
                        .update({ applied: 0, interview: 1, hired: 0, rejected: 0 })
                        .eq('status_id', factData.status_id);
                    if (statusUpdateError) throw statusUpdateError;

                    const { error: factUpdateError } = await supabase
                        .from('applicantfacttable')
                        .update({ schedule_id: scheduleId })
                        .eq('applicant_no', applicantNo);
                    if (factUpdateError) throw factUpdateError;
                } else {
                    const { data: appData } = await supabase
                        .from('applicant')
                        .select('first_name, last_name, email')
                        .eq('applicant_no', applicantNo)
                        .maybeSingle();

                    const applicantName = appData
                        ? formatApplicantFullName(appData.first_name, appData.last_name)
                        : 'Unknown';

                    const { data: statusInsert, error: statusInsertError } = await supabase
                        .from('status')
                        .insert([{
                            applied: 0,
                            interview: 1,
                            hired: 0,
                            rejected: 0,
                            applicant_no: applicantNo,
                            applicant_name: applicantName
                        }])
                        .select('status_id')
                        .single();
                    if (statusInsertError) throw statusInsertError;

                    const { error: factInsertError } = await supabase
                        .from('applicantfacttable')
                        .insert([{
                            applicant_no: applicantNo,
                            status_id: statusInsert.status_id,
                            schedule_id: scheduleId
                        }]);
                    if (factInsertError) throw factInsertError;
                }

                if (applicantInfo?.email) {
                    try {
                        await sendEmail({
                            from: `"6R Diamond Recruitment" <${defaultFromAddress}>`,
                            to: String(applicantInfo.email).trim(),
                            subject: 'Interview Status Updated',
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #333; max-width:600px; margin:auto;">
                                  <h2 style="color:#4A90E2;">${formatApplicantGreeting(applicantInfo.first_name, applicantInfo.last_name)}</h2>
                                  <p>Your application (Applicant No: <strong>${applicantNo}</strong>) is now in the <strong>Interview</strong> stage.</p>
                                  <p>HR will send a separate email after your interview date and time are scheduled.</p>
                                  <p>Best regards,<br/><strong>Human Resources Department</strong></p>
                                </div>
                            `
                        });
                        console.log(`Interview-stage email sent to applicant ${applicantNo} at ${String(applicantInfo.email).trim()}`);
                    } catch (notifyErr) {
                        console.warn('Failed to send interview-stage notification email to applicant', {
                            applicantNo,
                            recipient: String(applicantInfo.email).trim(),
                            message: notifyErr?.message || notifyErr
                        });
                    }
                }

                const { data: scheduledApplicant } = await supabase
                    .from('applicant')
                    .select('first_name, last_name, email')
                    .eq('applicant_no', applicantNo)
                    .maybeSingle();

                if (scheduledApplicant?.email) {
                    try {
                        await sendEmail({
                            from: `"6R Diamond Recruitment" <${defaultFromAddress}>`,
                            to: String(scheduledApplicant.email).trim(),
                            subject: 'Your Interview Schedule is Ready',
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #333; max-width:600px; margin:auto;">
                                  <h2 style="color:#4A90E2;">${formatApplicantGreeting(scheduledApplicant.first_name, scheduledApplicant.last_name)}</h2>
                                  <p>Your interview has been scheduled. Here are the details:</p>
                                  <div style="background-color:#f8fafc; padding:20px; border-radius:8px; border:1px solid #e2e8f0; margin:20px 0;">
                                    <p style="margin:0 0 8px 0;"><strong>Date:</strong> ${interviewDate}</p>
                                    <p style="margin:0 0 8px 0;"><strong>Time:</strong> ${interviewTime}</p>
                                    ${location ? `<p style="margin:0 0 8px 0;"><strong>Location:</strong> ${location}</p>` : ''}
                                    ${roomNumber ? `<p style="margin:0 0 8px 0;"><strong>Room Number:</strong> ${roomNumber}</p>` : ''}
                                    ${reminders ? `<p style="margin:0;"><strong>Reminders:</strong> ${reminders}</p>` : ''}
                                  </div>
                                  <p>Best regards,<br/><strong>Human Resources Department</strong></p>
                                </div>
                            `
                        });
                        console.log(`Interview schedule email sent to applicant ${applicantNo} at ${String(scheduledApplicant.email).trim()}`);
                    } catch (scheduleNotifyErr) {
                        console.warn('Failed to send interview schedule email to applicant', {
                            applicantNo,
                            recipient: String(scheduledApplicant.email).trim(),
                            message: scheduleNotifyErr?.message || scheduleNotifyErr
                        });
                    }
                }

                created.push({ applicantNo, scheduleId, interviewDate, interviewTime });
            } catch (rowError) {
                failedApplicants.push({
                    applicant_no: applicantNo || null,
                    reason: String(rowError?.message || 'Failed to save schedule row.')
                });
            }
        }

        const successCount = created.length;
        const totalCount = rows.length;
        const message = successCount > 0
            ? 'Interview schedule saved.'
            : 'No schedules were saved.';

        res.status(200).json({
            message,
            totalCount,
            successCount,
            failedApplicants,
            schedules: created
        });
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
        res.status(201).json({ message: 'Site view recorded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createJobPosting = async (req, res) => {
    const { job_title, department, contract_type, branch, description, responsibilities, qualifications, benefits, max_applicants, accepting_until } = req.body || {};
    const normalizedDescription = String(description || '').trim();
    try {
        const basePayload = {
            job_title,
            department,
            contract_type,
            branch,
            description: normalizedDescription || null,
            responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
            qualifications: Array.isArray(qualifications) ? qualifications : [],
            benefits: Array.isArray(benefits) ? benefits : [],
            date_posted: new Date().toISOString().slice(0, 10),
            job_status: true,
            total_applicants: 0
        };

        const maxApplicants = normalizeMaxApplicants(max_applicants);
        if (maxApplicants) {
            basePayload.max_applicants = maxApplicants;
        }

        const acceptingUntil = normalizeIsoDateOnly(accepting_until);
        if (accepting_until !== undefined) {
            if (acceptingUntil && !isFutureIsoDateOnly(acceptingUntil)) {
                return res.status(400).json({ error: 'Accepting-until date must be a future date.' });
            }
            basePayload.accepting_until = acceptingUntil;
        }

        let created = null;
        const { data, error } = await supabase.from('jobpostings').insert([basePayload]).select().single();
        if (!error) created = data;

        if (error && (isMissingColumnError(error, 'max_applicants') || isMissingColumnError(error, 'accepting_until'))) {
            if (isMissingColumnError(error, 'max_applicants')) delete basePayload.max_applicants;
            if (isMissingColumnError(error, 'accepting_until')) delete basePayload.accepting_until;

            const retry = await supabase.from('jobpostings').insert([basePayload]).select().single();
            if (retry.error) throw retry.error;
            created = retry.data;
        } else if (error) {
            throw error;
        }

        res.status(201).json({ message: 'Created successfully', job: created });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateJobPosting = async (req, res) => {
    try {
        const payload = { ...(req.body || {}) };
        // Ignore legacy clients still sending `summary` after the column is removed.
        delete payload.summary;
        if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
            const normalizedDescription = String(payload.description || '').trim();
            payload.description = normalizedDescription || null;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'max_applicants')) {
            const normalized = normalizeMaxApplicants(payload.max_applicants);
            payload.max_applicants = normalized;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'accepting_until')) {
            const normalized = normalizeIsoDateOnly(payload.accepting_until);
            if (normalized && !isFutureIsoDateOnly(normalized)) {
                return res.status(400).json({ error: 'Accepting-until date must be a future date.' });
            }
            payload.accepting_until = normalized;
        }

        const { data, error } = await supabase.from('jobpostings').update(payload).eq('job_id', req.params.id).select().single();
        if (!error) {
            res.json({ message: 'Updated successfully', job: data });
            return;
        }

        if ((isMissingColumnError(error, 'max_applicants') && Object.prototype.hasOwnProperty.call(payload, 'max_applicants'))
            || (isMissingColumnError(error, 'accepting_until') && Object.prototype.hasOwnProperty.call(payload, 'accepting_until'))) {
            const retryPayload = { ...payload };
            if (isMissingColumnError(error, 'max_applicants')) delete retryPayload.max_applicants;
            if (isMissingColumnError(error, 'accepting_until')) delete retryPayload.accepting_until;
            const retry = await supabase.from('jobpostings').update(retryPayload).eq('job_id', req.params.id).select().single();
            if (retry.error) throw retry.error;
            res.json({ message: 'Updated successfully', job: retry.data });
            return;
        }

        throw error;
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
        email, contactNumber, landlineNumber, region, province, city, barangay, detailedAddress,
        medicalCondition, medicalDetails, branch, positionApplied, jobId
    } = req.body;

    try {
        const resolvedJobIdPre = await resolveJobPostingId({ jobId, positionApplied, branch });
        if (resolvedJobIdPre) {
            const { data: jobRow, error: jobError } = await supabase
                .from('jobpostings')
                .select('job_id, job_title, job_status, max_applicants, accepting_until')
                .eq('job_id', resolvedJobIdPre)
                .maybeSingle();

            if (jobError) throw jobError;

            const limit = normalizeMaxApplicants(jobRow?.max_applicants);
            const expiredByDate = isJobExpiredByDate(jobRow, todayIsoDateOnly());
            if (expiredByDate) {
                try { await supabase.from('jobpostings').update({ job_status: false }).eq('job_id', resolvedJobIdPre); } catch {}
                return res.status(409).json({
                    error: `This job posting is closed and no longer accepting applications.`,
                    jobId: resolvedJobIdPre,
                    jobTitle: jobRow?.job_title || null
                });
            }
            if (limit) {
                const { count, error: countError } = await supabase
                    .from('applicantfacttable')
                    .select('job_id', { count: 'exact', head: true })
                    .eq('job_id', resolvedJobIdPre);
                if (countError) throw countError;

                const total = Number(count || 0);
                const isClosed = !isJobActive(jobRow?.job_status) || total >= limit;
                if (isClosed) {
                    // Ensure we reflect closure going forward.
                    try { await supabase.from('jobpostings').update({ job_status: false }).eq('job_id', resolvedJobIdPre); } catch {}
                    return res.status(409).json({
                        error: `This job posting is closed and no longer accepting applications.`,
                        jobId: resolvedJobIdPre,
                        jobTitle: jobRow?.job_title || null
                    });
                }
            }
        }

        // <-- Updated to use the secure password generator -->
        const tempPassword = generateSecurePassword(10); 
        const fullName = `${firstName} ${lastName}`.trim();

        const resumeUrl = await uploadFileToSupabase(files['resume']);
        const applicationLetterUrl = await uploadFileToSupabase(files['coverLetter']);
        const prcIdUrl = await uploadFileToSupabase(files['prcId']);

        const cleanAge = parseInt(age) || 0; 
        const cleanContact = contactNumber ? contactNumber.replace(/\D/g, '') : null;
        const cleanLandline = landlineNumber ? landlineNumber.replace(/\D/g, '') : null;
        const cleanMiddleInitial = middleInitial
            ? middleInitial.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2)
            : null;

        // A. Save Applicant Data
        const { data: createdApplicant, error: appError } = await supabase.from('applicant').insert([{ 
            password: tempPassword, first_name: firstName, last_name: lastName,
            middle_initial: cleanMiddleInitial, suffix: suffix ? suffix.substring(0, 10) : null,
            nationality, birthday, age: cleanAge, email, contact_number: cleanContact, landline_number: cleanLandline,
            region, province, city_municipality: city, barangay, detailed_address: detailedAddress,
            resume_url: resumeUrl, application_letter_url: applicationLetterUrl, prc_id_url: prcIdUrl,
            medical_condition: medicalCondition || 'no', medical_details: medicalDetails || null,
            branch: branch || 'Not specified', position_applied: positionApplied || 'Not specified'
        }]).select('applicant_no').single();
        if (appError) throw appError;
        const applicantNo = createdApplicant?.applicant_no;
        if (!applicantNo) throw new Error('Failed to generate applicant number.');

        // B. Save Document Flags (for public.document + applicantfacttable.document_id)
        const { data: createdDocument, error: documentError } = await supabase
            .from('document')
            .insert([{
                applicant_no: applicantNo,
                resume: Boolean(resumeUrl),
                application_letter: Boolean(applicationLetterUrl),
                prc_id_url: Boolean(prcIdUrl),
                medical_condition: medicalCondition || 'no'
            }])
            .select('document_id')
            .single();
        if (documentError) throw documentError;
        const documentId = createdDocument?.document_id || null;

        // C. Save Status
        const { data: newStatus, error: statusError } = await supabase.from('status').insert([{ 
            applied: 1, interview: 0, hired: 0, rejected: 0, applicant_no: applicantNo, applicant_name: fullName 
        }]).select().single();

        if (!statusError && newStatus) {
            const resolvedJobId = resolvedJobIdPre || await resolveJobPostingId({ jobId, positionApplied, branch });
            const factPayload = { applicant_no: applicantNo, status_id: newStatus.status_id };
            if (documentId) {
                factPayload.document_id = documentId;
            }
            if (resolvedJobId) {
                factPayload.job_id = resolvedJobId;
            }
            await supabase.from('applicantfacttable').insert([factPayload]);

            if (resolvedJobId) {
                // Best-effort auto-close after this application is recorded.
                try {
                    const { data: jobRow } = await supabase
                        .from('jobpostings')
                        .select('job_status, max_applicants')
                        .eq('job_id', resolvedJobId)
                        .maybeSingle();

                    const limit = normalizeMaxApplicants(jobRow?.max_applicants);
                    if (limit && isJobActive(jobRow?.job_status)) {
                        const { count } = await supabase
                            .from('applicantfacttable')
                            .select('job_id', { count: 'exact', head: true })
                            .eq('job_id', resolvedJobId);

                        if (Number(count || 0) >= limit) {
                            await supabase.from('jobpostings').update({ job_status: false }).eq('job_id', resolvedJobId);
                        }
                    }
                } catch {
                    // ignore auto-close failures
                }
            }
        }

        // D. Send the Automated Email
        if (email) { 
            try {
                const mailOptions = {
                    from: `"6R Diamond Recruitment" <${defaultFromAddress}>`, 
                    to: email, 
                    subject: 'Application Received - Login Credentials',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                            <h2 style="color: #4A90E2;">${formatApplicantGreeting(firstName, lastName)}</h2>
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
                await sendEmail(mailOptions);
                console.log(`Successfully sent credentials to applicant at: ${email}`);
            } catch (emailErr) {
                const publicEmailError = toPublicEmailError(emailErr);
                console.error('Warning: Failed to send email to applicant.', {
                    applicantNo,
                    recipient: email,
                    message: publicEmailError,
                    smtpCode: emailErr?.code || null,
                    responseCode: emailErr?.responseCode || null
                });
                return res.status(502).json({
                    error: `Application submitted but email delivery failed: ${publicEmailError}`,
                    applicantId: applicantNo
                });
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
        const { data, error } = await supabase.from('applicant').select(`*, applicantfacttable (applied_date, status (applied, interview, hired, rejected))`).order('applicant_no', { ascending: false });
        if (error) throw error;
        res.json(data.map(app => ({
            appliedAt: inferAppliedAtFromApplicant(app) || app.created_at || app.createdAt,
            created_at: app.created_at || null,
            application_date: inferAppliedAtFromApplicant(app) || app.created_at || app.createdAt,
            id: app.applicant_no || 'N/A', name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
            firstName: app.first_name, lastName: app.last_name, middleInitial: app.middle_initial,
            nationality: app.nationality, birthday: app.birthday, age: app.age, email: app.email || 'N/A', phone: app.contact_number || 'N/A',
            landlineNumber: app.landline_number || 'N/A',
            region: app.region, province: app.province, city: app.city_municipality, barangay: app.barangay,
            detailedAddress: app.detailed_address, resume_url: app.resume_url, application_letter_url: app.application_letter_url,
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
        const { data, error } = await supabase.from('applicant').select(`*, applicantfacttable (applied_date, status (applied, interview, hired, rejected))`);
        if (error) throw error;

        const startMs = new Date(`${period.startDate}T00:00:00.000Z`).getTime();
        const endMs = new Date(`${period.endDate}T00:00:00.000Z`).getTime();

        const records = (data || []).map((app) => {
            const appliedRaw = inferAppliedAtFromApplicant(app) || app.created_at || app.createdAt;
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
            summary: { totalApplications: total, newApplications: statusBreakdown.Applied, inProcessCount: statusBreakdown.Applied, interviewCount: statusBreakdown.Interview, hiredCount: statusBreakdown.Hired, rejectedCount: statusBreakdown.Rejected, interviewRate: percentage(statusBreakdown.Interview, total), hiringRate: percentage(statusBreakdown.Hired, total), rejectionRate: percentage(statusBreakdown.Rejected, total) },
            statusBreakdown, records
        });
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
        const appliedAt = inferAppliedAtFromApplicant(applicant);
        const policy = buildApplicationPolicy(appliedAt);

        res.json({
            applicant: {
                id: applicant.applicant_no,
                name: `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim(),
                status: extractApplicantStatus(applicant),
                branch: applicant.branch || 'Not assigned',
                position: applicant.position_applied || 'Not assigned',
                appliedAt,
                checkedAt: new Date().toISOString(),
                policy,
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
            newStatusObj.applicant_name = appData ? formatApplicantFullName(appData.first_name, appData.last_name) : 'Unknown';
            const { data: statusInsert } = await supabase.from('status').insert([newStatusObj]).select().single();
            await supabase.from('applicantfacttable').insert([{ applicant_no: id, status_id: statusInsert.status_id }]);
        }
        // After updating DB, attempt to notify the applicant by email about the status change.
        try {
            const { data: applicantRow, error: applicantErr } = await supabase.from('applicant').select('first_name, last_name, email').eq('applicant_no', id).maybeSingle();
            if (!applicantErr && applicantRow && applicantRow.email) {
                const recipient = String(applicantRow.email).trim();
                const statusLabel = (status || '').charAt(0).toUpperCase() + (status || '').slice(1);
                const statusMessage = status === 'hired'
                    ? 'Congratulations, you have been hired.'
                    : status === 'rejected'
                        ? 'We appreciate your interest. You may re-apply after 1 month.'
                        : status === 'interview'
                            ? 'You are now in the interview stage. HR will send a separate email once your interview date and time are scheduled.'
                            : 'Please log in to the application portal to view more details or updates.';
                const mailOptions = {
                    from: `"6R Diamond Recruitment" <${defaultFromAddress}>`,
                    to: recipient,
                    subject: `Application Status Update: ${statusLabel}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width:600px; margin:auto;">
                          <h2 style="color:#4A90E2;">${formatApplicantGreeting(applicantRow.first_name, applicantRow.last_name)}</h2>
                          <p>Your application (Applicant No: <strong>${id}</strong>) status has been updated to <strong>${statusLabel}</strong>.</p>
                          <p>${statusMessage}</p>
                          <p>Best regards,<br/><strong>Human Resources Department</strong></p>
                        </div>
                    `
                };

                try {
                    await sendEmail(mailOptions);
                    console.log(`Status notification sent to applicant ${id} at ${recipient}`);
                } catch (notifyErr) {
                    console.warn('Failed to send status notification email to applicant', { applicantNo: id, recipient, message: notifyErr?.message || notifyErr });
                    // Do not fail the request if notification fails.
                }
            }
        } catch (errNotify) {
            console.warn('Unexpected error while attempting to notify applicant:', errNotify?.message || errNotify);
        }

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

        const { data, error } = await buildHrLookupQuery(employeeId);
        if (error) throw error;
        if (!data || data.password !== password) return res.status(401).json({ error: 'Invalid Credentials' });

        res.json({
            message: 'Login successful',
            user: {
                id: data.id,
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

        const { data, error } = await buildHrLookupQuery(employeeId);
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'HR account not found.' });

        res.json({
            user: {
                id: data.id,
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                role: data.role || 'HR',
                email: data.email || ''
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Unable to load HR profile.' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const employeeId = String(req.body.employeeId || '').trim();
    const email = normalizeEmail(req.body.email);

    if (!employeeId || !email) {
        return res.status(400).json({ error: 'Employee ID and registered email are required.' });
    }

    try {
        const { data, error } = await buildHrPasswordResetLookupQuery(employeeId);
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Account not found.' });

        const accountEmail = normalizeEmail(data.email);
        if (!accountEmail) {
            return res.status(400).json({ error: 'This HR account has no registered email. Contact admin to update email in Supabase first.' });
        }

        if (accountEmail !== email) {
            return res.status(401).json({ error: 'Email does not match this account.' });
        }

        const code = createResetCode();
        passwordResetStore.set(String(data.id), {
            code,
            expiresAt: Date.now() + PASSWORD_RESET_EXPIRY_MS,
            email: accountEmail
        });

        await sendEmail({
            from: `"6R Diamond Recruitment" <${defaultFromAddress}>`,
            to: accountEmail,
            subject: 'Password Reset Verification Code',
            html: `<p>${formatApplicantGreeting(data.first_name, data.last_name)},</p><p>Your password reset code is <strong>${code}</strong>.</p><p>This code will expire in 15 minutes.</p>`
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
        const { data, error } = await buildHrPasswordResetLookupQuery(employeeId);
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Account not found.' });

        const resetSession = passwordResetStore.get(String(data.id));
        if (!resetSession) return res.status(400).json({ error: 'No reset request found. Request a new code.' });
        if (Date.now() > resetSession.expiresAt) {
            passwordResetStore.delete(String(data.id));
            return res.status(400).json({ error: 'Verification code has expired. Request a new code.' });
        }
        if (resetSession.code !== code) return res.status(401).json({ error: 'Invalid verification code.' });

        const { error: updateError } = await updateHrPassword(data.id, newPassword);
        if (updateError) throw updateError;

        passwordResetStore.delete(String(data.id));
        res.json({ message: 'Password updated successfully. You can now login.' });
    } catch (err) {
        console.error('Password reset confirmation failed:', err.message);
        res.status(500).json({ error: err.message || 'Unable to reset password.' });
    }
};

// Lightweight debug endpoint to send a test email from the live service.
exports.debugSendTestEmail = async (req, res) => {
    try {
        const to = String(req.query.to || req.body?.to || process.env.EMAIL_USER || '').trim();
        if (!to) return res.status(400).json({ error: 'Recipient `to` is required as query param or body.' });

        const subject = String(req.query.subject || req.body?.subject || 'Test email from 6R Diamond backend');
        const html = String(req.query.html || req.body?.html || `<p>This is a test email sent at ${new Date().toISOString()}</p>`);

        const result = await sendEmail({ from: undefined, to, subject, html });
        res.json({ message: 'Test email attempted', result });
    } catch (err) {
        console.error('Debug test email failed:', err?.message || err);
        res.status(500).json({ error: String(err?.message || err) });
    }
};
