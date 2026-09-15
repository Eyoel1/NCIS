export interface TimelineMilestone {
  id: string;
  stage: string;
  title: string;
  description: string;
  timestamp: string;
  ethiopianDate: string;
  actor: string;
  actorRole: string;
  location: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FLAGGED';
  blockHash: string;
  documents?: string[];
}

export const MOCK_TIMELINE_EVENTS: Record<string, TimelineMilestone[]> = {
  'ET-SHP-2026-001': [
    {
      id: 'EVT-01',
      stage: 'PRE_IMPORT',
      title: 'Commercial Invoice & Pro-Forma Lodged',
      description: 'Ethio Auto Imports filed pre-import declaration with NBE Foreign Exchange allocation approval.',
      timestamp: '2026-02-18 09:30 EAT',
      ethiopianDate: 'Yekatit 11, 2018',
      actor: 'Alazar Tadesse',
      actorRole: 'Importer / Consignee',
      location: 'Addis Ababa (Single Window)',
      status: 'COMPLETED',
      blockHash: '0x8f2a...b491',
      documents: ['Toyota_Commercial_Invoice_INV2026.pdf', 'NBE_FX_Permit.pdf']
    },
    {
      id: 'EVT-02',
      stage: 'SHIPPING',
      title: 'Ocean Bill of Lading Endorsed',
      description: 'Container MSCU7849201 loaded aboard MV Horn Pioneer at Jebel Ali; Title transferred under Sea B/L.',
      timestamp: '2026-02-22 14:15 EAT',
      ethiopianDate: 'Yekatit 15, 2018',
      actor: 'Capt. Michael Chen',
      actorRole: 'Horn Maritime Line',
      location: 'Port of Jebel Ali -> Red Sea',
      status: 'COMPLETED',
      blockHash: '0x4d19...c882',
      documents: ['Horn_Maritime_BOL_HML8492.pdf']
    },
    {
      id: 'EVT-03',
      stage: 'PORT_OPERATIONS',
      title: 'Vessel Discharged & Yard Staged',
      description: 'Discharged at Doraleh Container Terminal Berth 3. Assigned Yard Staging Bay-04 / Row-02.',
      timestamp: '2026-02-28 08:45 EAT',
      ethiopianDate: 'Yekatit 21, 2018',
      actor: 'Fatuma Omar',
      actorRole: 'Djibouti Port Authority',
      location: 'Doraleh Terminal (DCT)',
      status: 'COMPLETED',
      blockHash: '0x6e3b...a104'
    },
    {
      id: 'EVT-04',
      stage: 'CUSTOMS',
      title: 'Green Channel Clearance & Tax Settlement',
      description: 'Assessed CIF 4,450,000 ETB. Duty and taxes paid in full (2,845,000 ETB) via CBE RTGS escrow transfer.',
      timestamp: '2026-03-03 11:20 EAT',
      ethiopianDate: 'Yekatit 24, 2018',
      actor: 'Yohannes Wolde',
      actorRole: 'Ethiopian Customs Commission',
      location: 'Modjo Multimodal Dry Port',
      status: 'COMPLETED',
      blockHash: '0x99a1...ff43',
      documents: ['ECC_Electronic_Release_Warrant_ERW.pdf']
    },
    {
      id: 'EVT-05',
      stage: 'POST_CUSTOMS',
      title: 'Inland Prime Mover Corridor Dispatch',
      description: 'Mounted on Scania R500 prime mover. ECTS smart seal ES-99824 armed with geofence tracking to Kality.',
      timestamp: '2026-03-05 07:10 EAT',
      ethiopianDate: 'Yekatit 26, 2018',
      actor: 'Dawit Haile',
      actorRole: 'Trans-Ethiopia Logistics',
      location: 'Djibouti-Addis Corridor (Galafi Gate)',
      status: 'IN_PROGRESS',
      blockHash: '0x3c71...90bb'
    },
    {
      id: 'EVT-06',
      stage: 'DELIVERY',
      title: 'MOTL Roadworthiness & Title Issuance',
      description: 'Chassis verification, emissions test, and issuance of official Ethiopian Ownership Title ("Libre").',
      timestamp: 'Scheduled for 2026-03-08',
      ethiopianDate: 'Yekatit 29, 2018',
      actor: 'Biruk Assefa',
      actorRole: 'Federal Transport Authority',
      location: 'Kality Vehicle Testing Station',
      status: 'PENDING',
      blockHash: '0x0000...pending'
    }
  ]
};
