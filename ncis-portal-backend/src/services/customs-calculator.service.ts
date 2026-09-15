/**
 * NCIS Portal - Ethiopian Customs Duty & Tax Calculator Engine
 * Conforms to Proclamation 859/2014, Excise Proclamation 1186/2020,
 * VAT Proclamation 285/2002, Surtax Regulation 133/2007, Income Tax Proclamation 979/2016
 */

export type VehicleCategory =
  | 'PASSENGER'
  | 'PASSENGER_ICE'
  | 'COMMERCIAL'
  | 'COMMERCIAL_TRUCK'
  | 'ELECTRIC'
  | 'ELECTRIC_VEHICLE'
  | 'HYBRID'
  | 'HYBRID_VEHICLE'
  | 'PUBLIC_TRANSPORT'
  | 'MOTORCYCLE';

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'GASOLINE';

export interface DutyCalculationInput {
  cifValue?: number;
  fobUsd?: number;
  freightUsd?: number;
  insuranceUsd?: number;
  exchangeRate?: number; // e.g. 120.00 or 125.50 ETB/USD
  vehicleCategory?: string;
  engineDisplacementCc?: number;
  engineCapacityCc?: number;
  fuelType?: string;
  grossVehicleWeightTonnes?: number;
  productionYear?: number;
  depreciationYears?: number;
}

export interface TaxLineItem {
  name: string;
  nameAmharic: string;
  legalReference: string;
  ratePercent: number;
  taxBaseEtb: number;
  taxAmountEtb: number;
}

export interface DutyCalculationResult {
  cifUsd: number;
  cifEtb: number;
  cifValue: number;
  exchangeRateUsed: number;
  hsCode: string;
  dutyRate: number;
  dutyAmount: number;
  exciseRate: number;
  exciseAmount: number;
  vatRate: number;
  vatAmount: number;
  surtaxRate: number;
  surtaxAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  totalPayable: number;
  totalDutiesAndTaxesEtb: number;
  totalLandedCostEtb: number;
  effectiveTaxRatePercent: number;
  currency: 'ETB';
  calculatedAt: string;
  duty: TaxLineItem;
  excise: TaxLineItem;
  vat: TaxLineItem;
  surtax: TaxLineItem;
  withholding: TaxLineItem;
}

export class EthiopianCustomsEngine {
  public static round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  public static resolveRates(
    categoryRaw?: string,
    displacementCcRaw?: number,
    fuelRaw?: string,
    gvwTonnes: number = 0
  ): { dutyRate: number; exciseRate: number; surtaxRate: number; hsCode: string } {
    const category = (categoryRaw || 'PASSENGER_ICE').toUpperCase();
    const fuel = (fuelRaw || 'PETROL').toUpperCase();
    const displacementCc = displacementCcRaw || 0;

    // 1. Electric Vehicles
    if (
      category === 'ELECTRIC' ||
      category === 'ELECTRIC_VEHICLE' ||
      category === 'EV' ||
      fuel === 'ELECTRIC' ||
      fuel === 'EV'
    ) {
      return { dutyRate: 0.05, exciseRate: 0.05, surtaxRate: 0.10, hsCode: '8703.80.00' };
    }

    // 2. Commercial Cargo Trucks
    if (category === 'COMMERCIAL' || category === 'COMMERCIAL_TRUCK' || category === 'TRUCK') {
      if (gvwTonnes >= 5 || displacementCc >= 4000) {
        // Heavy commercial truck - surtax exempt
        return { dutyRate: 0.10, exciseRate: 0.00, surtaxRate: 0.00, hsCode: '8704.22.00' };
      }
      return { dutyRate: 0.20, exciseRate: 0.10, surtaxRate: 0.00, hsCode: '8704.21.00' };
    }

    // 3. Public Transport / Bus
    if (category === 'PUBLIC_TRANSPORT' || category === 'BUS') {
      return { dutyRate: 0.10, exciseRate: 0.00, surtaxRate: 0.00, hsCode: '8702.10.00' };
    }

    // 4. Hybrid Vehicles
    if (category === 'HYBRID' || category === 'HYBRID_VEHICLE' || fuel === 'HYBRID') {
      if (displacementCc <= 1800) {
        return { dutyRate: 0.35, exciseRate: 0.20, surtaxRate: 0.10, hsCode: '8703.40.10' };
      }
      return { dutyRate: 0.35, exciseRate: 0.50, surtaxRate: 0.10, hsCode: '8703.40.90' };
    }

    // 5. Motorcycles
    if (category === 'MOTORCYCLE') {
      return { dutyRate: 0.30, exciseRate: 0.30, surtaxRate: 0.10, hsCode: '8711.20.00' };
    }

    // 6. Default: Passenger ICE Vehicles
    const dutyRate = 0.35;
    const surtaxRate = 0.10;
    let exciseRate = 0.30;
    let hsCode = '8703.21.00';

    if (displacementCc <= 1300) {
      exciseRate = 0.30;
      hsCode = '8703.21.90';
    } else if (displacementCc <= 1800) {
      exciseRate = 0.60;
      hsCode = '8703.22.90';
    } else {
      exciseRate = 1.00;
      hsCode = '8703.23.90';
    }

    return { dutyRate, exciseRate, surtaxRate, hsCode };
  }

  public static calculate(input: DutyCalculationInput): DutyCalculationResult {
    const exchangeRate = input.exchangeRate && input.exchangeRate > 0 ? input.exchangeRate : 120.00;

    let cifUsd = 0;
    let cifEtb = 0;

    if (input.fobUsd !== undefined || input.freightUsd !== undefined || input.insuranceUsd !== undefined) {
      const fob = Math.max(0, input.fobUsd || 0);
      const freight = Math.max(0, input.freightUsd || 0);
      const insurance = Math.max(0, input.insuranceUsd || 0);
      cifUsd = this.round(fob + freight + insurance);
      cifEtb = this.round(cifUsd * exchangeRate);
    } else if (input.cifValue !== undefined) {
      if (input.cifValue > 200000) {
        // Likely already in ETB
        cifEtb = this.round(input.cifValue);
        cifUsd = this.round(cifEtb / exchangeRate);
      } else {
        // In USD
        cifUsd = this.round(input.cifValue);
        cifEtb = this.round(cifUsd * exchangeRate);
      }
    } else {
      throw new Error('Either cifValue or fobUsd/freightUsd/insuranceUsd must be provided.');
    }

    const cc = input.engineDisplacementCc ?? input.engineCapacityCc ?? 0;
    const gvw = input.grossVehicleWeightTonnes ?? 0;

    const { dutyRate, exciseRate, surtaxRate, hsCode } = this.resolveRates(
      input.vehicleCategory,
      cc,
      input.fuelType,
      gvw
    );

    // 1. Customs Duty
    const dutyBase = cifEtb;
    const dutyAmount = this.round(dutyBase * dutyRate);

    // 2. Excise Tax (Base = CIF + Duty)
    const exciseBase = this.round(cifEtb + dutyAmount);
    const exciseAmount = this.round(exciseBase * exciseRate);

    // 3. VAT (Base = CIF + Duty + Excise)
    const vatBase = this.round(cifEtb + dutyAmount + exciseAmount);
    const vatRate = 0.15;
    const vatAmount = this.round(vatBase * vatRate);

    // 4. Surtax (Base = CIF + Duty + Excise)
    const surtaxBase = vatBase;
    const surtaxAmount = this.round(surtaxBase * surtaxRate);

    // 5. Withholding Tax (Base = CIF)
    const withholdingBase = cifEtb;
    const withholdingRate = 0.03;
    const withholdingAmount = this.round(withholdingBase * withholdingRate);

    const totalDutiesAndTaxesEtb = this.round(
      dutyAmount + exciseAmount + vatAmount + surtaxAmount + withholdingAmount
    );
    const totalLandedCostEtb = this.round(cifEtb + totalDutiesAndTaxesEtb);
    const effectiveTaxRatePercent = cifEtb > 0 ? this.round((totalDutiesAndTaxesEtb / cifEtb) * 100) : 0;

    return {
      cifUsd,
      cifEtb,
      cifValue: cifEtb,
      exchangeRateUsed: exchangeRate,
      hsCode,
      dutyRate,
      dutyAmount,
      exciseRate,
      exciseAmount,
      vatRate,
      vatAmount,
      surtaxRate,
      surtaxAmount,
      withholdingRate,
      withholdingAmount,
      totalPayable: totalDutiesAndTaxesEtb,
      totalDutiesAndTaxesEtb,
      totalLandedCostEtb,
      effectiveTaxRatePercent,
      currency: 'ETB',
      calculatedAt: new Date().toISOString(),
      duty: {
        name: 'Customs Duty',
        nameAmharic: 'የጉምሩክ ቀረጥ',
        legalReference: 'Proclamation 859/2014',
        ratePercent: dutyRate * 100,
        taxBaseEtb: dutyBase,
        taxAmountEtb: dutyAmount,
      },
      excise: {
        name: 'Excise Tax',
        nameAmharic: 'የኤክሳይዝ ታክስ',
        legalReference: 'Proclamation 1186/2020',
        ratePercent: exciseRate * 100,
        taxBaseEtb: exciseBase,
        taxAmountEtb: exciseAmount,
      },
      vat: {
        name: 'Value Added Tax (VAT)',
        nameAmharic: 'የተጨማሪ እሴት ታክስ (ቫት)',
        legalReference: 'Proclamation 285/2002',
        ratePercent: vatRate * 100,
        taxBaseEtb: vatBase,
        taxAmountEtb: vatAmount,
      },
      surtax: {
        name: 'Surtax',
        nameAmharic: 'የሱር ታክስ',
        legalReference: 'Regulation 133/2007',
        ratePercent: surtaxRate * 100,
        taxBaseEtb: surtaxBase,
        taxAmountEtb: surtaxAmount,
      },
      withholding: {
        name: 'Withholding Tax on Import',
        nameAmharic: 'የቅድመ ግብር ክፍያ (ዊዝሆልዲንግ)',
        legalReference: 'Proclamation 979/2016',
        ratePercent: withholdingRate * 100,
        taxBaseEtb: withholdingBase,
        taxAmountEtb: withholdingAmount,
      },
    };
  }
}
