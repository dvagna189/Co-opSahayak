import { UploadedDocument } from '../types';

export const SAMPLE_UPLOADED_DOCUMENTS: UploadedDocument[] = [
  {
    id: 'doc-sample-agm-notice',
    name: 'Adarsh CHS - 38th AGM Notice & Special Assessment 2024.txt',
    fileType: 'txt',
    category: 'AGM / Meeting Notice',
    uploadedAt: 'Today, 09:30 AM',
    fileSize: '4.2 KB',
    isSample: true,
    summary: 'Official notice convening the 38th Annual General Body Meeting (AGM) of Adarsh Cooperative Housing Society on Sunday, 29th September 2024. Includes agenda on audited accounts (₹4.2 Lakh surplus), special assessment levy of ₹18,500 per flat for lift overhaul, 18% p.a. default interest, and 90-day dues voting disqualification.',
    keyFindings: [
      'AGM Date & Time: Sunday, 29th September 2024 at 10:30 AM in Society Clubhouse.',
      'Quorum Requirement: Minimum 25% of eligible active members. If not present in 30 mins, adjourned to 11:30 AM same day and transacted without quorum.',
      'Special Assessment: ₹18,500 per flat for Major Lift Overhaul & Terrace Waterproofing payable by 31st Dec 2024.',
      'Default Interest: 18% p.a. simple interest on maintenance payment delays exceeding 60 days.',
      'Voting Disqualification: Members with outstanding dues exceeding 90 days are barred from voting.',
    ],
    suggestedQuestions: [
      'What is the date, time, and venue of the AGM?',
      'What happens if the quorum is not met at 10:30 AM?',
      'What is the special levy amount and what is it for?',
      'Who is disqualified from voting according to this notice?',
      'What is the penalty for late payment of maintenance charges?',
    ],
    rawText: `ADARSH COOPERATIVE HOUSING SOCIETY LTD.
Registration No: BOM/HSG/TC-48192/2004
Sector 14, Plot 8, Vashi, Navi Mumbai - 400703
--------------------------------------------------------------------------------
NOTICE OF THE 38TH ANNUAL GENERAL BODY MEETING (AGM)
Date of Notice: 10th September 2024

Dear Esteemed Members,

Notice is hereby given that the 38th Annual General Body Meeting (AGM) of the members of Adarsh Cooperative Housing Society Ltd. will be convened as scheduled below:

- Date: Sunday, 29th September 2024
- Time: 10:30 AM Sharp
- Venue: Society Community Hall & Clubhouse, Ground Floor

IMPORTANT NOTE ON QUORUM:
As per Society Bylaw No. 87 and State Cooperative Societies Act, the quorum for the General Body meeting shall be 25% of the total active members or 50 members, whichever is less. If within 30 minutes from the time appointed for the meeting there is no quorum, the meeting shall stand adjourned to 11:30 AM on the same day at the same venue, and the business on the agenda shall be transacted whether there is a quorum or not.

AGENDA FOR THE 38TH AGM:
1. Confirmation of the Minutes: To read, review, and confirm the minutes of the 37th Annual General Meeting held on 24th September 2023.
2. Adoption of Annual Accounts: To receive, deliberate upon, and adopt the Managing Committee's Annual Report along with the Audited Balance Sheet and Income & Expenditure Account for the financial year ended 31st March 2024. (Society has generated an operating surplus of ₹4,20,500 transferred to Statutory Reserve Fund).
3. Appointment of Statutory Auditor: To re-appoint M/s R. S. Kulkarni & Associates, Chartered Accountants (Empanelled Grade 'A' Auditor) as Statutory Auditors for FY 2024-25 and fix remuneration of ₹28,000.
4. Special Capital Assessment Levy (Lift Overhaul & Terrace Waterproofing):
   The Managing Committee has surveyed Wing-A and Wing-B elevators operating since 2004. An urgent technical overhaul and terrace chemical waterproofing are required before next monsoon. 
   Total estimated budget: ₹29,60,000.
   After drawing ₹14,80,000 from the Sinking Fund, the remaining balance shall be mobilized through a Special Assessment Levy of ₹18,500 per flat, payable in two equal installments:
   - 1st Installment: ₹9,250 on or before 31st October 2024
   - 2nd Installment: ₹9,250 on or before 31st December 2024.
5. Delayed Payment Interest Policy:
   To curb chronic maintenance defaulters, in accordance with Bylaw No. 72, simple interest at the rate of 18% per annum will be levied on all monthly maintenance and supplementary charges overdue for more than 60 days from the bill generation date.
6. Electoral Roll and Voting Eligibility:
   Notice is served to all members that in accordance with statutory election rules, any member who has defaulted on society dues for a continuous period exceeding 90 days as of 30th September 2024 shall be deemed disqualified from exercising voting rights in any upcoming managing committee election or special resolution voting.
7. Any other matter with the prior permission of the Chair.

By Order of the Managing Committee,
Sd/-
R. K. Sharma
Honorary Secretary
Adarsh Cooperative Housing Society Ltd.`,
    chunks: [
      {
        id: 'chunk-sample-agm-1',
        docId: 'doc-sample-agm-notice',
        docTitle: 'Adarsh CHS - 38th AGM Notice 2024',
        docType: 'AGM Notice',
        source: 'Uploaded Document',
        chapterOrPart: 'Meeting Date & Quorum Notice',
        section: 'Notice Header & Quorum Rule',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Notice of the 38th AGM of Adarsh Cooperative Housing Society Ltd. Scheduled for Sunday, 29th September 2024 at 10:30 AM Sharp at Society Community Hall. Quorum requirement is 25% of total active members or 50 members. If within 30 minutes from appointed time there is no quorum, the meeting shall stand adjourned to 11:30 AM on the same day at the same venue, and business transacted without quorum.`,
        keywords: ['agm date', '29th september 2024', '10:30 am', 'quorum', 'adjourned', '11:30 am'],
        isDemoData: false,
      },
      {
        id: 'chunk-sample-agm-2',
        docId: 'doc-sample-agm-notice',
        docTitle: 'Adarsh CHS - 38th AGM Notice 2024',
        docType: 'AGM Notice',
        source: 'Uploaded Document',
        chapterOrPart: 'Agenda Item 4: Special Capital Assessment',
        section: 'Special Assessment Levy for Lift Overhaul & Waterproofing',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Special Assessment Levy of ₹18,500 per flat for Major Lift Overhaul and Terrace Waterproofing. Total estimated budget is ₹29,60,000, with ₹14,80,000 funded from Sinking Fund. The balance of ₹18,500 per flat is payable in two installments: 1st installment of ₹9,250 on or before 31st October 2024; 2nd installment of ₹9,250 on or before 31st December 2024.`,
        keywords: ['special assessment', '₹18,500', 'lift overhaul', 'waterproofing', 'sinking fund', 'installments'],
        isDemoData: false,
      },
      {
        id: 'chunk-sample-agm-3',
        docId: 'doc-sample-agm-notice',
        docTitle: 'Adarsh CHS - 38th AGM Notice 2024',
        docType: 'AGM Notice',
        source: 'Uploaded Document',
        chapterOrPart: 'Agenda Items 5 & 6: Dues, Penalties & Voting Disqualification',
        section: 'Interest on Defaulters & Voting Disqualification',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Delayed Payment Interest Policy: In accordance with Bylaw No. 72, simple interest at 18% per annum will be levied on all monthly maintenance overdue for more than 60 days. Voting Disqualification: Any member who has defaulted on society dues for a continuous period exceeding 90 days as of 30th September 2024 shall be deemed disqualified from exercising voting rights in upcoming committee elections.`,
        keywords: ['18% interest', 'defaulters', '60 days', 'voting disqualification', '90 days dues', 'bylaw 72'],
        isDemoData: false,
      },
    ],
  },
  {
    id: 'doc-sample-pacs-ledger',
    name: 'Sri Lakshmi PACS - Member Passbook & Fertilizer Subsidy 2023-24.txt',
    fileType: 'txt',
    category: 'Share Certificate / Passbook',
    uploadedAt: 'Yesterday, 04:15 PM',
    fileSize: '3.6 KB',
    isSample: true,
    summary: 'Member ledger and crop loan passbook issued by Sri Lakshmi Primary Agricultural Cooperative Society (PACS) to Ravi (Member ID: MEM-8842). Outlines 20 shares (₹2,000), KCC crop loan of ₹1,50,000 at 4% net interest with prompt repayment incentive, 12 bags subsidized Urea allotment, and 9.5% annual dividend.',
    keyFindings: [
      'Member: Ravi (Member ID: MEM-8842, Ward 3)',
      'Share Capital: 20 Ordinary Shares @ ₹100 face value = ₹2,000 paid-up.',
      'Crop Loan Limit: ₹1,50,000 under KCC scheme @ 7% headline rate with 3% prompt repayment subvention (Effective 4%).',
      'Dividend Credit: 9.5% on share capital (₹190) credited to member savings ledger.',
      'Subsidized Agri Inputs: Quota of 12 bags Urea and 8 bags DAP under state fertilizer scheme.',
      'Dispute Redressal: Any discrepancy in passbook ledger entries must be submitted in writing within 21 days to the Society CEO.',
    ],
    suggestedQuestions: [
      'What is my KCC crop loan limit and effective interest rate?',
      'How much dividend was declared on my shares?',
      'What is my fertilizer quota under this cooperative account?',
      'What is the procedure and time limit if I find a discrepancy in my ledger?',
      'What are my total shares and paid-up capital in this PACS?',
    ],
    rawText: `SRI LAKSHMI PRIMARY AGRICULTURAL COOPERATIVE CREDIT SOCIETY (PACS)
Registration No: WAR/COOP/AGRI-1092/1984
Hanamkonda Road, Warangal District, Telangana
--------------------------------------------------------------------------------
MEMBER PASSBOOK & ANNUAL ACCOUNT STATEMENT (FY 2023-24)
Date of Issue: 1st July 2024

MEMBER PARTICULARS:
- Member Name: Ravi
- Member ID / Ledger No: MEM-8842
- Father's / Husband's Name: Ramaiah
- Residence: Ward No. 3, Hanamkonda Rural
- Member Classification: Active Farmer Member (Category A)
- Date of Admission: 14th June 2018

SHARE CAPITAL HOLDINGS:
- Number of Ordinary Shares Held: 20 Shares
- Face Value per Share: ₹100
- Total Paid-up Share Capital: ₹2,000.00
- Share Certificate Number: SC-48201
- Dividend Declared for FY 2023-24: 9.5% (Amount ₹190.00 credited to Member Savings Ledger on 28th June 2024).

KISAN CREDIT CARD (KCC) CROP LOAN ACCOUNT:
- Sanctioned Limit: ₹1,50,000.00 (Kharif: ₹90,000 / Rabi: ₹60,000)
- Current Outstanding Balance: ₹82,400.00
- Benchmark Interest Rate: 7.00% per annum
- Government Interest Subvention: 3.00% prompt repayment incentive
- Effective Interest Rate to Member: 4.00% per annum (applicable on prompt repayment within 12 months)
- Repayment Due Date for Kharif Disbursement: 31st March 2025

FERTILIZER & SEED QUOTA ALLOTMENT:
Under the State Cooperative Input Scheme, the member is entitled to purchase:
- Urea 45kg Bags: 12 Bags @ Government Subsidized Price
- DAP 50kg Bags: 8 Bags @ Government Subsidized Price
- Certified Paddy Seed: 4 Bags (30kg each)

MEMBER AUDIT & DISPUTE CLAUSE:
Under Section 28 of the Cooperative Societies Act and Society Special Rule 14, every member has the right to inspect their individual ledger and loan account free of charge. If any discrepancy, omission, or unauthorized debit is found, the member must submit a written representation along with this original passbook to the Chief Executive Officer (CEO) within 21 days of statement issuance. The Society is obligated to furnish a written clarification or correction within 15 working days.

Authorised Signatory:
Sd/-
Chief Executive Officer (CEO)
Sri Lakshmi PACS`,
    chunks: [
      {
        id: 'chunk-sample-pacs-1',
        docId: 'doc-sample-pacs-ledger',
        docTitle: 'Sri Lakshmi PACS - Member Passbook 2023-24',
        docType: 'Member Passbook',
        source: 'Uploaded Document',
        chapterOrPart: 'Member Particulars & Share Capital',
        section: 'Share Holding & Dividend',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Member Ravi (ID: MEM-8842, Ward 3) holds 20 ordinary shares with face value ₹100, totaling ₹2,000 paid-up share capital. Dividend declared for FY 2023-24 is 9.5% (Amount ₹190.00 credited to member savings ledger). Classification: Active Farmer Member Category A admitted 14th June 2018.`,
        keywords: ['ravi', 'mem-8842', '20 shares', '₹2,000', 'dividend 9.5%', '₹190'],
        isDemoData: false,
      },
      {
        id: 'chunk-sample-pacs-2',
        docId: 'doc-sample-pacs-ledger',
        docTitle: 'Sri Lakshmi PACS - Member Passbook 2023-24',
        docType: 'Member Passbook',
        source: 'Uploaded Document',
        chapterOrPart: 'KCC Crop Loan & Inputs',
        section: 'Loan Limit, Interest & Subsidized Quota',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `KCC Crop Loan Limit: ₹1,50,000 (Kharif ₹90,000 / Rabi ₹60,000). Current outstanding: ₹82,400. Interest rate is 7% with 3% prompt repayment subvention, giving an effective net interest rate of 4.00% per annum. Fertilizer entitlement: 12 bags Urea (45kg), 8 bags DAP (50kg) at subsidized rates.`,
        keywords: ['kcc loan', '₹1,50,000', '4% interest', '7% interest', 'subvention', '12 bags urea', '8 bags dap'],
        isDemoData: false,
      },
      {
        id: 'chunk-sample-pacs-3',
        docId: 'doc-sample-pacs-ledger',
        docTitle: 'Sri Lakshmi PACS - Member Passbook 2023-24',
        docType: 'Member Passbook',
        source: 'Uploaded Document',
        chapterOrPart: 'Inspection Rights & Dispute Window',
        section: '21-day Representation Rule',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Dispute & Inspection Clause: Under Section 28 of Cooperative Act, member has the right to inspect loan ledger free of charge. In case of discrepancy or unauthorized debit, member must submit written representation with original passbook to CEO within 21 days. Society must furnish written clarification within 15 working days.`,
        keywords: ['dispute window', '21 days', 'ceo representation', 'inspection right', '15 days response'],
        isDemoData: false,
      },
    ],
  },
  {
    id: 'doc-sample-maintenance-bill',
    name: 'Navodaya Cooperative Society - Maintenance Bill & Sinking Fund Dues.txt',
    fileType: 'txt',
    category: 'Maintenance Bill / Accounts',
    uploadedAt: '2 days ago',
    fileSize: '3.1 KB',
    isSample: true,
    summary: 'Quarterly maintenance invoice and breakdown for Flat B-402 in Navodaya Cooperative Housing Society. Outlines standard maintenance charges (₹3,200), sinking fund contribution (₹650), repair fund (₹400), non-occupancy charges, and statutory billing rules under cooperative bylaws.',
    keyFindings: [
      'Flat: B-402 (Carpet Area: 850 sq.ft)',
      'Total Quarterly Amount Due: ₹4,850.00',
      'Payment Due Date: 15th October 2024',
      'Sinking Fund Mandate: Calculated at 0.25% p.a. of construction cost as per statutory bylaw.',
      'Non-Occupancy Charges: Capped at maximum 10% of service charges (excluding municipal taxes).',
      'Audit Redressal: Members are entitled to copy of audited maintenance expenditure schedule on request.',
    ],
    suggestedQuestions: [
      'What is the total quarterly maintenance amount and due date?',
      'How is the sinking fund charge calculated?',
      'What are the non-occupancy charges and legal limits?',
      'What recourse do I have if maintenance charges are inflated or wrong?',
    ],
    rawText: `NAVODAYA COOPERATIVE HOUSING SOCIETY LTD.
Registration No: THN/HSG/8821/2012
Ghodbunder Road, Thane West - 400615
--------------------------------------------------------------------------------
QUARTERLY MAINTENANCE BILL & ACCOUNTS INVOICE
Bill No: MNT-Q3-2024/402
Billing Period: 1st October 2024 to 31st December 2024
Invoice Date: 1st October 2024
Due Date: 15th October 2024

MEMBER DETAILS:
- Flat No: B-402, Wing B, 4th Floor
- Member Name: Smt. Anuradha Sen
- Carpet Area: 850 Sq. Ft.

CHARGE BREAKDOWN (As per Approved AGM Tariff):
1. Service Charges (Security, Housekeeping, Lift AMC, Generator AMC): ₹1,800.00
2. Common Electricity & Water Pumping: ₹800.00
3. Sinking Fund Contribution (Statutory 0.25% per annum of construction cost): ₹650.00
4. Major Repair & Painting Reserve Fund: ₹400.00
5. Municipal Property Tax (Equal Share): ₹1,200.00
--------------------------------------------------------------------------------
TOTAL CURRENT CHARGES: ₹4,850.00
Arrears / Previous Balance: ₹0.00
NET PAYABLE ON OR BEFORE 15th OCT 2024: ₹4,850.00

STATUTORY BYLAW NOTICE REGARDING BILLING:
a. Interest on Arrears: Payments received after 15th October 2024 will attract simple interest at 12% p.a. from due date.
b. Non-Occupancy Charges Rule: If the flat is let out on leave and license, non-occupancy charges shall not exceed 10% of the service charges (₹180 per month) in strict accordance with State Government Circular No. SAG/2011/C.R.14/14-C. Levying non-occupancy charges higher than 10% is unlawful.
c. Right to Breakdown: Every member is entitled to request a complete audited expenditure breakdown from the Society Treasurer within 14 days of receipt of this invoice.

Sd/-
Treasurer / Secretary
Navodaya Cooperative Housing Society Ltd.`,
    chunks: [
      {
        id: 'chunk-sample-mnt-1',
        docId: 'doc-sample-maintenance-bill',
        docTitle: 'Navodaya CHS - Maintenance Bill Q3 2024',
        docType: 'Maintenance Invoice',
        source: 'Uploaded Document',
        chapterOrPart: 'Billing Breakdown',
        section: 'Quarterly Maintenance Charges',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Flat B-402 Quarterly Maintenance for period 1st Oct to 31st Dec 2024. Total payable: ₹4,850.00 on or before 15th October 2024. Includes Service Charges ₹1,800, Common Electricity ₹800, Sinking Fund ₹650, Major Repair Fund ₹400, Property Tax ₹1,200.`,
        keywords: ['flat b-402', '₹4,850', 'due 15th october 2024', 'sinking fund ₹650', 'service charges ₹1,800'],
        isDemoData: false,
      },
      {
        id: 'chunk-sample-mnt-2',
        docId: 'doc-sample-maintenance-bill',
        docTitle: 'Navodaya CHS - Maintenance Bill Q3 2024',
        docType: 'Maintenance Invoice',
        source: 'Uploaded Document',
        chapterOrPart: 'Statutory Rules',
        section: 'Non-Occupancy Charges & Late Interest',
        pageNumber: 1,
        jurisdiction: 'Society Specific',
        content: `Non-occupancy charges shall not exceed 10% of service charges (max ₹180/month) as per State Govt Circular SAG/2011/C.R.14/14-C. Levying higher is illegal. Late payment after 15th October attracts 12% p.a. simple interest. Member entitled to full audited expenditure breakdown within 14 days.`,
        keywords: ['non-occupancy charges', '10% cap', '12% interest', 'audited breakdown', '14 days'],
        isDemoData: false,
      },
    ],
  },
];
