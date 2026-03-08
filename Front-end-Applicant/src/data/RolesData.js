export const rolesData = {
  "corporate-secretary": {
    id: "corporate-secretary",
    title: "Corporate Secretary/Division Manager for Brokerage",
    description: "Oversee brokerage division operations and manage corporate secretarial duties",
    // TEST: Closed in Manila, Open in Davao/Cebu
    isOpen: { manila: false, cebu: true, davao: true },
    responsibilities: [
      "Oversee and manage all brokerage division operations",
      "Ensure compliance with corporate governance and regulatory requirements",
      "Manage documentation and filing of corporate records",
      "Coordinate with customs authorities and government agencies"
    ],
    qualifications: [
      "Bachelor's degree in Business Administration, Legal Management, or related field",
      "Minimum 5 years of experience in brokerage or logistics operations",
      "Strong knowledge of customs regulations and procedures"
    ],
    benefits: ["Competitive salary package", "Health insurance (HMO)", "Performance-based bonuses"]
  },

  "licensed-broker": {
    id: "licensed-broker",
    title: "Licensed Customs Broker",
    description: "Handle customs clearance procedures and regulatory compliance",
    // TEST: Open in Manila/Cebu, Closed in Davao
    isOpen: { manila: true, cebu: true, davao: false },
    responsibilities: [
      "Sign and process customs import/export entries and declarations",
      "Represent the company in Bureau of Customs (BOC) transactions",
      "Ensure accurate tariff classification and computation of duties and taxes",
      "Advise clients on latest customs laws, regulations, and CMTA compliance"
    ],
    qualifications: [
      "Valid PRC License as Customs Broker (Required)",
      "Bachelor's Degree in Customs Administration",
      "In-depth knowledge of TCCP, CMTA, and BOC procedures"
    ],
    benefits: ["Professional License Allowance", "Competitive salary", "Health insurance (HMO)"]
  },

  "office-manager": {
    id: "office-manager",
    title: "Office Manager",
    description: "Manage office operations and administrative functions",
    // TEST: Closed in Manila/Cebu, Open in Davao
    isOpen: { manila: false, cebu: false, davao: true },
    responsibilities: [
      "Oversee daily office operations and administrative activities",
      "Manage office supplies and equipment inventory",
      "Coordinate with different departments for operational efficiency"
    ],
    qualifications: [
      "Bachelor's degree in Business Administration or related field",
      "Minimum 3 years of experience in office management",
      "Strong organizational and multitasking abilities"
    ],
    benefits: ["Competitive salary", "Health insurance", "Professional growth opportunities"]
  },

  "messenger": {
    id: "messenger",
    title: "Messenger / Logistics",
    description: "Handle document delivery and logistics coordination",
    isOpen: { manila: true, cebu: true, davao: true },
    responsibilities: [
      "Deliver documents and packages to clients and government agencies",
      "Coordinate with clients for pickup and delivery schedules",
      "Maintain accurate delivery records and logs"
    ],
    qualifications: [
      "High school diploma or equivalent",
      "Valid driver's license (preferred)",
      "Familiarity with Metro Manila routes and locations"
    ],
    benefits: ["Daily/Monthly compensation", "Transportation allowance", "Health insurance"]
  },

  "secretary-office": {
    id: "secretary-office",
    title: "Secretary to the Office Manager",
    description: "Provide administrative support to the Office Manager",
    isOpen: { manila: true, cebu: false, davao: false },
    responsibilities: [
      "Provide administrative support to the Office Manager",
      "Manage calendars, appointments, and meetings",
      "Prepare correspondence, reports, and presentations"
    ],
    qualifications: [
      "Bachelor's degree or relevant certification",
      "Minimum 2 years of secretarial or administrative experience",
      "Excellent written and verbal communication skills"
    ],
    benefits: ["Competitive compensation", "Health insurance coverage", "Skill development programs"]
  },

  "brokerage-specialist": {
    id: "brokerage-specialist",
    title: "Brokerage Specialist",
    description: "Specialize in brokerage operations and client services",
    isOpen: { manila: true, cebu: false, davao: true },
    responsibilities: [
      "Process import and export documentation",
      "Coordinate with clients regarding shipment status",
      "Prepare customs entries and declarations"
    ],
    qualifications: [
      "Bachelor's degree in Logistics, Business, or related field",
      "Minimum 2 years of experience in brokerage or freight forwarding",
      "Knowledge of customs procedures and documentation"
    ],
    benefits: ["Competitive salary", "Health and wellness benefits", "Training and development"]
  },

  "import-export-head": {
    id: "import-export-head",
    title: "Import & Export Head",
    description: "Lead import and export operations and compliance",
    isOpen: { manila: false, cebu: false, davao: false },
    responsibilities: [], qualifications: [], benefits: []
  },

  "admin-staff": {
    id: "admin-staff",
    title: "Administration Staff",
    description: "Support administrative and operational functions",
    isOpen: { manila: true, cebu: true, davao: true },
    responsibilities: [
      "Provide general administrative support to the team",
      "Process and maintain operational documents and records",
      "Assist in data entry and database management"
    ],
    qualifications: [
      "Bachelor's degree in any field or relevant diploma",
      "Minimum 1 year of administrative experience",
      "Good computer skills (MS Office, email, internet)"
    ],
    benefits: ["Competitive starting salary", "Health insurance", "Training and mentorship"]
  },

  "docs-head": {
    id: "docs-head",
    title: "Documentations Head",
    description: "Manage documentation processes and compliance records",
    isOpen: { manila: false, cebu: false, davao: false },
    responsibilities: [], qualifications: [], benefits: []
  }
};