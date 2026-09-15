/**
 * NCIS Portal - OCR Simulation & Intelligent Document Parsing Engine
 * Extracts up to 21 domain fields from Commercial Invoices & Bills of Lading
 */

export interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedField<T> {
  value: T;
  confidence: number;
  boundingBox?: BoundingBox;
  rawText?: string;
  isVerified: boolean;
  warnings?: string[];
}

export interface OcrExtractedData {
  vin: ExtractedField<string>;
  make: ExtractedField<string>;
  model: ExtractedField<string>;
  productionYear: ExtractedField<number>;
  engineDisplacementCc: ExtractedField<number>;
  fuelType: ExtractedField<string>;
  chassisNumber?: ExtractedField<string>;
  engineNumber?: ExtractedField<string>;
  color?: ExtractedField<string>;
  fobPrice: ExtractedField<number>;
  freightCharges: ExtractedField<number>;
  insuranceAmount: ExtractedField<number>;
  cifValue: ExtractedField<number>;
  currency: ExtractedField<string>;
  consigneeName: ExtractedField<string>;
  consigneeTin: ExtractedField<string>;
  shipperName: ExtractedField<string>;
  billOfLadingNumber: ExtractedField<string>;
  containerNumber: ExtractedField<string>;
  vesselName: ExtractedField<string>;
  portOfLoading: ExtractedField<string>;
  portOfDischarge: ExtractedField<string>;
  finalDestination: ExtractedField<string>;
}

export interface OcrScanResult {
  success: boolean;
  documentType: 'COMMERCIAL_INVOICE' | 'BILL_OF_LADING' | 'CUSTOMS_DECLARATION';
  confidence: number;
  fileName?: string;
  scannedAt: string;
  extractedData: OcrExtractedData;
}

export class OcrSimulatorEngine {
  private static readonly SAMPLE_TEMPLATES = [
    {
      keywords: ['TOYOTA', 'PRADO', 'LAND CRUISER', 'JAFZA', 'DUBAI'],
      data: {
        vin: 'JTEBU5JR8K5123894',
        make: 'Toyota',
        model: 'Land Cruiser Prado TX-L',
        year: 2025,
        engineCc: 2755,
        fuelType: 'DIESEL',
        color: 'Pearl White',
        fob: 38500,
        freight: 3200,
        insurance: 450,
        currency: 'USD',
        shipper: 'Toyota Tsusho Corporation Middle East FZE (Dubai, UAE)',
        consignee: 'Ethio-Red Sea Motors PLC',
        consigneeTin: '0019482716',
        bol: 'MSK-DXB-2026-90412',
        container: 'MSKU-784910-2',
        vessel: 'M/V Shebelle',
        pol: 'Jebel Ali Port, UAE',
        pod: 'Port of Djibouti',
        dest: 'Modjo Dry Port',
      },
    },
    {
      keywords: ['HYUNDAI', 'TUCSON', 'BUSAN', 'GLOVIS'],
      data: {
        vin: 'KMHJ381B2NU904123',
        make: 'Hyundai',
        model: 'Tucson 2.0L GLS',
        year: 2025,
        engineCc: 1999,
        fuelType: 'PETROL',
        color: 'Phantom Black',
        fob: 22000,
        freight: 2800,
        insurance: 300,
        currency: 'USD',
        shipper: 'Hyundai Glovis Co. Ltd (Busan, South Korea)',
        consignee: 'Addis Global Trading S.C.',
        consigneeTin: '0038192044',
        bol: 'EUKOR-SEL-2026-44109',
        container: 'EUKU-918231-0',
        vessel: 'Morning Crown',
        pol: 'Busan Port, South Korea',
        pod: 'Port of Djibouti',
        dest: 'Modjo Dry Port',
      },
    },
    {
      keywords: ['ISUZU', 'NPR', 'CARGO', 'TRUCK', 'JAPAN'],
      data: {
        vin: 'JALE6R140N7004819',
        make: 'Isuzu',
        model: 'NPR Commercial Cargo Truck',
        year: 2024,
        engineCc: 5193,
        fuelType: 'DIESEL',
        color: 'White / Blue Stripe',
        fob: 32000,
        freight: 4500,
        insurance: 500,
        currency: 'USD',
        shipper: 'Isuzu Motors International Operations (Yokohama, Japan)',
        consignee: 'Trans-Ethiopia Logistics S.C.',
        consigneeTin: '0048192031',
        bol: 'MOL-YOK-2026-11849',
        container: 'MOLU-391820-4',
        vessel: 'M/V Gibe',
        pol: 'Yokohama Port, Japan',
        pod: 'Port of Djibouti',
        dest: 'Kality Dry Port, Addis Ababa',
      },
    },
    {
      keywords: ['BYD', 'ATTO', 'ELECTRIC', 'SHENZHEN', 'BEV'],
      data: {
        vin: 'LGXCE4CB4P0198274',
        make: 'BYD',
        model: 'Atto 3 Electric SUV',
        year: 2025,
        engineCc: 0,
        fuelType: 'ELECTRIC',
        color: 'Skiing White',
        fob: 21000,
        freight: 2200,
        insurance: 250,
        currency: 'USD',
        shipper: 'BYD Auto Industry Company Ltd (Shenzhen, China)',
        consignee: 'Green Mobility Ethiopia PLC',
        consigneeTin: '0078192055',
        bol: 'COSCO-SZX-2026-55018',
        container: 'COSU-829104-9',
        vessel: 'COSCO Shipping Pisces',
        pol: 'Shenzhen Port, China',
        pod: 'Port of Berbera',
        dest: 'Modjo Dry Port',
      },
    },
  ];

  public static scan(input: {
    rawText?: string;
    documentType?: string;
    fileName?: string;
    templateType?: 'INVOICE' | 'BOL';
  }): OcrScanResult {
    const rawText = (input.rawText || '').toUpperCase();
    const docType: 'COMMERCIAL_INVOICE' | 'BILL_OF_LADING' | 'CUSTOMS_DECLARATION' =
      input.templateType === 'BOL' || (input.documentType && input.documentType.includes('BOL'))
        ? 'BILL_OF_LADING'
        : 'COMMERCIAL_INVOICE';

    // Check matching template or fallback to first
    let matchedTemplate = this.SAMPLE_TEMPLATES[0];
    for (const t of this.SAMPLE_TEMPLATES) {
      if (t.keywords.some((kw) => rawText.includes(kw))) {
        matchedTemplate = t;
        break;
      }
    }

    // Dynamic field extraction overrides if present in raw text
    const vinMatch = rawText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
    const vinValue = vinMatch ? vinMatch[1].toUpperCase() : matchedTemplate.data.vin;

    const ccMatch = rawText.match(/(?:DISP|ENGINE|CC|CAPACITY)[:\s]*(\d{3,4})/i);
    const engineCcValue = ccMatch ? parseInt(ccMatch[1], 10) : matchedTemplate.data.engineCc;

    const fobMatch = rawText.match(/(?:FOB|AMOUNT|TOTAL)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
    const fobValue = fobMatch ? parseFloat(fobMatch[1].replace(/,/g, '')) : matchedTemplate.data.fob;

    const bolMatch = rawText.match(/(?:B\/L|BOL|WAYBILL)[:\s]*([A-Z0-9\-]+)/i);
    const bolValue = bolMatch ? bolMatch[1] : matchedTemplate.data.bol;

    const containerMatch = rawText.match(/\b([A-Z]{3,4}[UJZ]?[\d\-]{6,8})\b/i);
    const containerValue = containerMatch ? containerMatch[1].toUpperCase() : matchedTemplate.data.container;

    const cif = fobValue + matchedTemplate.data.freight + matchedTemplate.data.insurance;

    const createField = <T>(value: T, conf = 0.96, box?: BoundingBox): ExtractedField<T> => ({
      value,
      confidence: conf,
      boundingBox: box || { page: 1, x: 10, y: 15, width: 30, height: 5 },
      isVerified: true,
      rawText: String(value),
    });

    return {
      success: true,
      documentType: docType,
      confidence: 0.96,
      fileName: input.fileName || 'commercial_document.pdf',
      scannedAt: new Date().toISOString(),
      extractedData: {
        vin: createField(vinValue, 0.99, { page: 1, x: 25, y: 32, width: 22, height: 4 }),
        make: createField(matchedTemplate.data.make, 0.98, { page: 1, x: 25, y: 36, width: 15, height: 4 }),
        model: createField(matchedTemplate.data.model, 0.97, { page: 1, x: 42, y: 36, width: 25, height: 4 }),
        productionYear: createField(matchedTemplate.data.year, 0.99, { page: 1, x: 70, y: 36, width: 10, height: 4 }),
        engineDisplacementCc: createField(engineCcValue, 0.95, { page: 1, x: 25, y: 40, width: 12, height: 4 }),
        fuelType: createField(matchedTemplate.data.fuelType, 0.98, { page: 1, x: 40, y: 40, width: 14, height: 4 }),
        chassisNumber: createField(vinValue, 0.98),
        engineNumber: createField(`ENG-${matchedTemplate.data.engineCc}-0981`, 0.92),
        color: createField(matchedTemplate.data.color, 0.94),
        fobPrice: createField(fobValue, 0.98, { page: 1, x: 70, y: 55, width: 18, height: 4 }),
        freightCharges: createField(matchedTemplate.data.freight, 0.96, { page: 1, x: 70, y: 60, width: 18, height: 4 }),
        insuranceAmount: createField(matchedTemplate.data.insurance, 0.95, { page: 1, x: 70, y: 65, width: 18, height: 4 }),
        cifValue: createField(cif, 0.98, { page: 1, x: 70, y: 70, width: 18, height: 4 }),
        currency: createField(matchedTemplate.data.currency, 0.99),
        consigneeName: createField(matchedTemplate.data.consignee, 0.95, { page: 1, x: 10, y: 20, width: 35, height: 6 }),
        consigneeTin: createField(matchedTemplate.data.consigneeTin, 0.97, { page: 1, x: 10, y: 26, width: 20, height: 4 }),
        shipperName: createField(matchedTemplate.data.shipper, 0.95, { page: 1, x: 55, y: 20, width: 40, height: 6 }),
        billOfLadingNumber: createField(bolValue, 0.98, { page: 1, x: 70, y: 10, width: 25, height: 4 }),
        containerNumber: createField(containerValue, 0.97, { page: 1, x: 10, y: 50, width: 22, height: 4 }),
        vesselName: createField(matchedTemplate.data.vessel, 0.96, { page: 1, x: 35, y: 50, width: 25, height: 4 }),
        portOfLoading: createField(matchedTemplate.data.pol, 0.95),
        portOfDischarge: createField(matchedTemplate.data.pod, 0.96),
        finalDestination: createField(matchedTemplate.data.dest, 0.97),
      },
    };
  }
}
