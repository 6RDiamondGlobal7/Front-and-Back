require('dotenv').config();
const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

const PAGE_SIZE = 1000;
const INSERT_BATCH_SIZE = 200;

const fetchAllApplicants = async () => {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('applicant')
      .select('applicant_no, resume_url, cover_letter_url, prc_id_url, medical_condition')
      .order('applicant_no', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch applicant rows: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    rows.push(...data);
    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
};

const generateDocumentId = () => {
  const randomPart = (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(12).toString('hex'))
    .replace(/-/g, '')
    .toUpperCase()
    .slice(0, 12);
  return `DOC-${Date.now()}-${randomPart}`;
};

const fetchAllExistingApplicantNosInDocument = async () => {
  const ids = new Set();
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('document')
      .select('applicant_no')
      .order('applicant_no', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch document applicant_no rows: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const row of data) {
      if (row?.applicant_no) {
        ids.add(String(row.applicant_no));
      }
    }

    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return ids;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const run = async () => {
  console.log('Starting backfill: applicant -> document');

  const [applicants, existingApplicantNos] = await Promise.all([
    fetchAllApplicants(),
    fetchAllExistingApplicantNosInDocument()
  ]);

  console.log(`Applicants found: ${applicants.length}`);
  console.log(`Existing document rows (by applicant_no): ${existingApplicantNos.size}`);

  const inserts = [];
  for (const applicant of applicants) {
    const applicantNo = String(applicant?.applicant_no || '').trim();
    if (!applicantNo) continue;

    if (existingApplicantNos.has(applicantNo)) {
      continue;
    }

    inserts.push({
      document_id: generateDocumentId(),
      applicant_no: applicantNo,
      resume: Boolean(applicant?.resume_url),
      cover_letter: Boolean(applicant?.cover_letter_url),
      prc_id_url: Boolean(applicant?.prc_id_url),
      medical_condition: applicant?.medical_condition || 'no'
    });
  }

  if (inserts.length === 0) {
    console.log('No missing document rows found. Nothing to insert.');
    return;
  }

  console.log(`Missing document rows to insert: ${inserts.length}`);

  const batches = chunk(inserts, INSERT_BATCH_SIZE);
  let inserted = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    const { error } = await supabase.from('document').insert(batch);
    if (error) {
      throw new Error(`Insert failed at batch ${i + 1}/${batches.length}: ${error.message}`);
    }
    inserted += batch.length;
    console.log(`Inserted batch ${i + 1}/${batches.length} (${inserted}/${inserts.length})`);
  }

  console.log(`Backfill complete. Inserted ${inserted} rows into document.`);
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  });
