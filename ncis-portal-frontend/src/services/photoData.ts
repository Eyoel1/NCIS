export interface VehicleCheckpointPhoto {
  id: string;
  stageName: string;
  title: string;
  timestamp: string;
  location: string;
  inspector: string;
  imageUrl: string;
  verified: boolean;
}

export const MOCK_VEHICLE_PHOTOS: Record<string, VehicleCheckpointPhoto[]> = {
  'ET-SHP-2026-001': [
    {
      id: 'PH-01',
      stageName: 'Port of Loading',
      title: 'Pre-Shipment Inspection at Jebel Ali Bay 4',
      timestamp: '2026-02-21 11:20',
      location: 'Dubai, UAE',
      inspector: 'SGS International Marine Surveyor',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      verified: true
    },
    {
      id: 'PH-02',
      stageName: 'Port Discharge',
      title: 'Discharged from Ro-Ro Vessel MV Horn Pioneer',
      timestamp: '2026-02-28 09:15',
      location: 'Doraleh Port, Djibouti',
      inspector: 'Djibouti Port Berth Stevedore Officer',
      imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80',
      verified: true
    },
    {
      id: 'PH-03',
      stageName: 'Border Customs Check',
      title: 'Galafi E-Seal Integrity & Chassis Examination',
      timestamp: '2026-03-04 14:40',
      location: 'Galafi Border Post, Ethiopia',
      inspector: 'ECC Border Transit Police',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
      verified: true
    },
    {
      id: 'PH-04',
      stageName: 'Final Technical Inspection',
      title: 'Euro-4 Emissions & Brake Safety Testing',
      timestamp: '2026-03-07 10:30',
      location: 'Kality MOTL Inspection Depot',
      inspector: 'Federal Transport Authority Examiner Biruk',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
      verified: true
    }
  ]
};
