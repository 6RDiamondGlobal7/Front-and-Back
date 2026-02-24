const supabase = require('../config/supabaseClient');

// --- Helper Function: Upload Single File ---
const uploadFileToSupabase = async (fileObject) => {
    if (!fileObject) return null;
    
    const file = fileObject[0];
    const fileName = `${Date.now()}_${file.originalname}`;
    
    const { data, error } = await supabase
        .storage
        .from('resumes')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype
        });

    if (error) throw error;

    const { data: publicUrlData } = supabase
        .storage
        .from('resumes')
        .getPublicUrl(fileName);
        
    return publicUrlData.publicUrl;
};

// --- Helper Functions for Reports ---
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

const getPeriodConfig = ({ reportType, month, quarter, year }) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const safeYear = toIntegerInRange(year, 2000, 2100, currentYear);
    const normalizedType = String(reportType || 'monthly').toLowerCase();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (normalizedType === 'annual') {
        const start = `${safeYear}-01-01`;
        const end = `${safeYear + 1}-01-01`;
        return {
            reportType: 'annual',
            startDate: start,
            endDate: end,
            label: `${safeYear} Annual Report`,
            filter: { year: safeYear }
        };
    }

    if (normalizedType === 'quarterly') {
        const safeQuarter = toIntegerInRange(quarter, 1, 4, Math.floor(now.getMonth() / 3) + 1);
        const startMonth = (safeQuarter - 1) * 3;
        const endMonth = startMonth + 3;
        const start = new Date(Date.UTC(safeYear, startMonth, 1)).toISOString().slice(0, 10);
        const end = new Date(Date.UTC(safeYear, endMonth, 1)).toISOString().slice(0, 10);
        return {
            reportType: 'quarterly',
            startDate: start,
            endDate: end,
            label: `Q${safeQuarter} ${safeYear} Report`,
            filter: { year: safeYear, quarter: safeQuarter }
        };
    }

    const safeMonth = toIntegerInRange(month, 1, 12, now.getMonth() + 1);
    const start = new Date(Date.UTC(safeYear, safeMonth - 1, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(safeYear, safeMonth, 1)).toISOString().slice(0, 10);
    return {
        reportType: 'monthly',
        startDate: start,
        endDate: end,
        label: `${monthNames[safeMonth - 1]} ${safeYear} Report`,
        filter: { year: safeYear, month: safeMonth }
    };
};

// 1. Test Database Connection
exports.testDb = async (req, res) => {
    try {
        const { data, error } = await supabase.from('jobpostings').select('job_id').limit(1);
        if (error) throw error;
        res.json({ status: "Success", message: "Connected to Supabase!", data });
    } catch (err) {
        res.status(500).json({ status: "Error", error: err.message });
    }
};

// 2. Get Jobs
exports.getJobs = async (req, res) => {
    try {
        const { data, error } = await supabase.from('jobpostings').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Submit Application
exports.submitApplication = async (req, res) => {
    const files = req.files || {};
    
    const {
        firstName, lastName, middleInitial, suffix,
        nationality, birthday, age, email, contactNumber,
        region, province, city, barangay, detailedAddress,
        medicalCondition, medicalDetails,
        branch, positionApplied 
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
        const safeMiddleInitial = middleInitial ? middleInitial.substring(0, 5) : null;
        const safeSuffix = suffix ? suffix.substring(0, 10) : null;

        // 1. Insert sa Applicant table
        const { error: appError } = await supabase
            .from('applicant') 
            .insert([{ 
                applicant_no: applicantNo,
                password: tempPassword,
                first_name: firstName,
                last_name: lastName,
                middle_initial: safeMiddleInitial,
                suffix: safeSuffix,
                nationality: nationality,
                birthday: birthday,
                age: cleanAge,
                email: email,
                contact_number: cleanContact,
                region: region,
                province: province,
                city_municipality: city,
                barangay: barangay,
                detailed_address: detailedAddress,
                resume_url: resumeUrl,
                cover_letter_url: coverLetterUrl,
                prc_id_url: prcIdUrl,
                medical_condition: medicalCondition || 'no',
                medical_details: medicalDetails || null,
                branch: branch || 'Not specified',
                position_applied: positionApplied || 'Not specified'
            }]);

        if (appError) throw appError;

        // 2. Insert sa Status table
        const { data: newStatus, error: statusError } = await supabase
            .from('status')
            .insert([{ 
                applied: 1, interview: 0, hired: 0, rejected: 0,
                applicant_no: applicantNo,
                applicant_name: fullName 
            }])
            .select()
            .single();

        // 3. Link sa applicantfacttable
        if (!statusError && newStatus) {
            await supabase
                .from('applicantfacttable')
                .insert([{ 
                    applicant_no: applicantNo,
                    status_id: newStatus.status_id
                }]);
        }

        res.status(201).json({ message: "Application submitted!", applicantId: applicantNo });
    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 4. Get All Applicants
exports.getApplicants = async (req, res) => {
    try {
        // TAMA NA SYNTAX PANG JOIN NG STATUS TABLE
        const { data, error } = await supabase
            .from('applicant')
            .select(`
                *,
                applicantfacttable (
                    status ( applied, interview, hired, rejected )
                )
            `)
            .order('applicant_no', { ascending: false });

        if (error) throw error;

        const formattedData = data.map(app => {
            let realStatus = 'Applied';
            if (app.applicantfacttable && app.applicantfacttable.length > 0 && app.applicantfacttable[0].status) {
                const s = app.applicantfacttable[0].status;
                if (s.interview === 1) realStatus = 'Interview';
                else if (s.hired === 1) realStatus = 'Hired';
                else if (s.rejected === 1) realStatus = 'Rejected';
                else if (s.applied === 1) realStatus = 'Applied';
            }

            return {
                id: app.applicant_no || 'N/A',
                name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
                firstName: app.first_name,
                lastName: app.last_name,
                middleInitial: app.middle_initial,
                nationality: app.nationality,
                birthday: app.birthday,
                age: app.age,
                email: app.email || 'N/A',
                phone: app.contact_number || 'N/A',
                region: app.region,
                province: app.province,
                city: app.city_municipality,
                barangay: app.barangay,
                detailedAddress: app.detailed_address,
                resume_url: app.resume_url,
                cover_letter_url: app.cover_letter_url,
                medicalCondition: app.medical_condition,
                medicalDetails: app.medical_details,
                status: realStatus, 
                branch: app.branch || 'Not assigned',
                position: app.position_applied || 'Not assigned'
            };
        });

        res.json(formattedData);
    } catch (err) {
        console.error('Error fetching applicants:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 5. Reports
exports.getReports = async (req, res) => {
    try {
        const period = getPeriodConfig(req.query || {});
        const { data, error } = await supabase
            .from('applicant')
            .select(`
                *,
                applicantfacttable (
                    status ( applied, interview, hired, rejected )
                )
            `)
            .order('applicant_no', { ascending: false });

        if (error) throw error;

        const startMs = new Date(`${period.startDate}T00:00:00.000Z`).getTime();
        const endMs = new Date(`${period.endDate}T00:00:00.000Z`).getTime();

        const inferDate = (app) => {
            if (app.created_at || app.createdAt) return app.created_at || app.createdAt;
            return new Date().toISOString();
        };

        const records = (data || [])
            .map((app) => {
                const appliedRaw = inferDate(app);
                const appliedMs = appliedRaw ? new Date(appliedRaw).getTime() : Number.NaN;
                
                let realStatus = 'Applied';
                if (app.applicantfacttable && app.applicantfacttable.length > 0 && app.applicantfacttable[0].status) {
                    const s = app.applicantfacttable[0].status;
                    if (s.interview === 1) realStatus = 'Interview';
                    else if (s.hired === 1) realStatus = 'Hired';
                    else if (s.rejected === 1) realStatus = 'Rejected';
                    else if (s.applied === 1) realStatus = 'Applied';
                }

                return {
                    id: app.applicant_no || 'N/A',
                    name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'N/A',
                    email: app.email || 'N/A',
                    phone: app.contact_number || 'N/A',
                    status: normalizeStatus(realStatus),
                    position: app.position_applied || 'Not assigned',
                    branch: app.branch || 'Not assigned',
                    dateRaw: appliedRaw,
                    appliedMs
                };
            })
            .filter((row) => !Number.isNaN(row.appliedMs) && row.appliedMs >= startMs && row.appliedMs < endMs)
            .map((row) => ({
                ...row,
                date: formatDate(row.dateRaw)
            }));

        const total = records.length;
        const statusBreakdown = records.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, { Applied: 0, Interview: 0, Hired: 0, Rejected: 0 });

        const summary = {
            totalApplications: total,
            newApplications: statusBreakdown.Applied,
            interviewCount: statusBreakdown.Interview,
            hiredCount: statusBreakdown.Hired,
            rejectedCount: statusBreakdown.Rejected,
            interviewRate: percentage(statusBreakdown.Interview, total),
            hiringRate: percentage(statusBreakdown.Hired, total),
            rejectionRate: percentage(statusBreakdown.Rejected, total)
        };

        res.json({
            meta: {
                reportType: period.reportType,
                label: period.label,
                dateRange: { from: period.startDate, to: period.endDate },
                filter: period.filter
            },
            summary,
            statusBreakdown,
            records
        });
    } catch (err) {
        console.error('Error generating report:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 6. Update Applicant Status
exports.updateApplicantStatus = async (req, res) => {
    const { id } = req.params; // APP-xxxx
    const { status } = req.body;

    try {
        let newStatusObj = { applied: 0, interview: 0, hired: 0, rejected: 0 };
        if (status.toLowerCase() === 'interview') newStatusObj.interview = 1;
        if (status.toLowerCase() === 'rejected') newStatusObj.rejected = 1;
        if (status.toLowerCase() === 'hired') newStatusObj.hired = 1;
        if (status.toLowerCase() === 'applied') newStatusObj.applied = 1;

        const { data: factData } = await supabase
            .from('applicantfacttable')
            .select('status_id')
            .eq('applicant_no', id)
            .maybeSingle();

        if (factData && factData.status_id) {
            const { error: updateError } = await supabase
                .from('status')
                .update(newStatusObj)
                .eq('status_id', factData.status_id);
            if (updateError) throw updateError;
        } else {
            // Safety fallback just in case
            const { data: appData } = await supabase.from('applicant').select('first_name, last_name').eq('applicant_no', id).single();
            const fullName = appData ? `${appData.first_name} ${appData.last_name}`.trim() : 'Unknown';
            newStatusObj.applicant_no = id;
            newStatusObj.applicant_name = fullName;

            const { data: statusInsert } = await supabase.from('status').insert([newStatusObj]).select().single();
            await supabase.from('applicantfacttable').insert([{ applicant_no: id, status_id: statusInsert.status_id }]);
        }

        res.json({ message: `Status updated to ${status} successfully` });
    } catch (err) {
        console.error('Error updating status:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 7. Employee Login
exports.loginEmployee = async (req, res) => {
    const { employeeId, password } = req.body;

    try {
        const { data, error } = await supabase.from('employees').select('*').eq('employee_id', employeeId).single();
        if (error || !data) return res.status(401).json({ error: 'Invalid Employee ID or Password' });
        if (data.password !== password) return res.status(401).json({ error: 'Invalid Employee ID or Password' });

        res.json({ 
            message: "Login successful", 
            user: { id: data.employee_id, name: `${data.first_name} ${data.last_name}`, role: data.role } 
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};