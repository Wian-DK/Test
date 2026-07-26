export type FilingStatus =
  | "single"
  | "marriedJoint"
  | "headOfHousehold"
  | "marriedSeparate";

export type TaxInputs = {
  filingStatus: FilingStatus;
  w2Wages: number;
  federalWithholding: number;
  selfEmploymentIncome: number;
  ordinaryInvestmentIncome: number;
  preferentialIncome: number;
  aboveLineAdjustments: number;
  estimatedTaxPaid: number;
};

type Bracket = {
  top: number;
  rate: number;
};

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  marriedJoint: 32_200,
  headOfHousehold: 24_150,
  marriedSeparate: 16_100,
};

// 2026 ordinary income brackets from IRS Rev. Proc. 2025-32.
const ORDINARY_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { top: 12_400, rate: 0.10 },
    { top: 50_400, rate: 0.12 },
    { top: 105_700, rate: 0.22 },
    { top: 201_775, rate: 0.24 },
    { top: 256_225, rate: 0.32 },
    { top: 640_600, rate: 0.35 },
    { top: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  marriedJoint: [
    { top: 24_800, rate: 0.10 },
    { top: 100_800, rate: 0.12 },
    { top: 211_400, rate: 0.22 },
    { top: 403_550, rate: 0.24 },
    { top: 512_450, rate: 0.32 },
    { top: 768_700, rate: 0.35 },
    { top: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  headOfHousehold: [
    { top: 17_700, rate: 0.10 },
    { top: 67_450, rate: 0.12 },
    { top: 105_700, rate: 0.22 },
    { top: 201_750, rate: 0.24 },
    { top: 256_200, rate: 0.32 },
    { top: 640_600, rate: 0.35 },
    { top: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  marriedSeparate: [
    { top: 12_400, rate: 0.10 },
    { top: 50_400, rate: 0.12 },
    { top: 105_700, rate: 0.22 },
    { top: 201_775, rate: 0.24 },
    { top: 256_225, rate: 0.32 },
    { top: 384_350, rate: 0.35 },
    { top: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
};

// 0% ceiling and 15% ceiling for qualified dividends / long-term capital gains.
const CAPITAL_GAIN_THRESHOLDS: Record<
  FilingStatus,
  { zeroRateCeiling: number; fifteenRateCeiling: number }
> = {
  single: { zeroRateCeiling: 49_450, fifteenRateCeiling: 545_500 },
  marriedJoint: { zeroRateCeiling: 98_900, fifteenRateCeiling: 613_700 },
  headOfHousehold: { zeroRateCeiling: 66_200, fifteenRateCeiling: 579_600 },
  marriedSeparate: { zeroRateCeiling: 49_450, fifteenRateCeiling: 306_850 },
};

const SOCIAL_SECURITY_WAGE_BASE_2026 = 184_500;

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function taxUsingBrackets(income: number, brackets: Bracket[]): number {
  let remaining = nonNegative(income);
  let lower = 0;
  let tax = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const width = bracket.top - lower;
    const amountInBracket = Math.min(remaining, width);
    tax += amountInBracket * bracket.rate;
    remaining -= amountInBracket;
    lower = bracket.top;
  }

  return tax;
}

function overlap(start: number, end: number, bandStart: number, bandEnd: number): number {
  return Math.max(0, Math.min(end, bandEnd) - Math.max(start, bandStart));
}

function calculatePreferentialTax(
  ordinaryTaxableIncome: number,
  preferentialIncome: number,
  filingStatus: FilingStatus,
): number {
  const capital = nonNegative(preferentialIncome);
  if (capital === 0) return 0;

  const { zeroRateCeiling, fifteenRateCeiling } = CAPITAL_GAIN_THRESHOLDS[filingStatus];
  const start = nonNegative(ordinaryTaxableIncome);
  const end = start + capital;

  const atZero = overlap(start, end, 0, zeroRateCeiling);
  const atFifteen = overlap(start, end, zeroRateCeiling, fifteenRateCeiling);
  const atTwenty = Math.max(0, capital - atZero - atFifteen);

  return atFifteen * 0.15 + atTwenty * 0.20;
}

function calculateSelfEmploymentTax(w2Wages: number, selfEmploymentIncome: number): number {
  const profit = nonNegative(selfEmploymentIncome);
  const netEarnings = profit * 0.9235;

  if (netEarnings < 400) return 0;

  // For this educational calculator we use W-2 Box 1 wages as an approximation
  // for wages already consuming the Social Security wage base. A production tax
  // product should instead use the appropriate W-2 Social Security wage fields.
  const remainingSocialSecurityBase = Math.max(
    0,
    SOCIAL_SECURITY_WAGE_BASE_2026 - nonNegative(w2Wages),
  );

  const socialSecurityTax = Math.min(netEarnings, remainingSocialSecurityBase) * 0.124;
  const medicareTax = netEarnings * 0.029;

  return socialSecurityTax + medicareTax;
}

export function calculateFederalTax(inputs: TaxInputs) {
  const wages = nonNegative(inputs.w2Wages);
  const ordinaryInvestment = nonNegative(inputs.ordinaryInvestmentIncome);
  const preferentialIncome = nonNegative(inputs.preferentialIncome);
  const selfEmploymentIncome = nonNegative(inputs.selfEmploymentIncome);
  const adjustments = nonNegative(inputs.aboveLineAdjustments);
  const withholding = nonNegative(inputs.federalWithholding);
  const estimatedPayments = nonNegative(inputs.estimatedTaxPaid);

  const selfEmploymentTax = calculateSelfEmploymentTax(wages, selfEmploymentIncome);
  const deductibleHalfOfSeTax = selfEmploymentTax / 2;

  const totalIncome =
    wages + ordinaryInvestment + preferentialIncome + selfEmploymentIncome;

  const adjustedGrossIncome = Math.max(
    0,
    totalIncome - adjustments - deductibleHalfOfSeTax,
  );

  const standardDeduction = STANDARD_DEDUCTION[inputs.filingStatus];
  const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);

  // Qualified dividends / LTCG cannot exceed total taxable income after deductions.
  const preferentialTaxableIncome = Math.min(preferentialIncome, taxableIncome);
  const ordinaryTaxableIncome = Math.max(0, taxableIncome - preferentialTaxableIncome);

  const ordinaryIncomeTax = taxUsingBrackets(
    ordinaryTaxableIncome,
    ORDINARY_BRACKETS[inputs.filingStatus],
  );
  const preferentialTax = calculatePreferentialTax(
    ordinaryTaxableIncome,
    preferentialTaxableIncome,
    inputs.filingStatus,
  );

  const incomeTaxBeforeCredits = ordinaryIncomeTax + preferentialTax;
  const totalFederalTax = incomeTaxBeforeCredits + selfEmploymentTax;
  const totalPayments = withholding + estimatedPayments;
  const balance = totalPayments - totalFederalTax;

  return {
    totalIncome,
    selfEmploymentTax,
    deductibleHalfOfSeTax,
    adjustedGrossIncome,
    standardDeduction,
    taxableIncome,
    ordinaryTaxableIncome,
    preferentialTaxableIncome,
    ordinaryIncomeTax,
    preferentialTax,
    incomeTaxBeforeCredits,
    totalFederalTax,
    totalPayments,
    refund: Math.max(0, balance),
    amountOwed: Math.max(0, -balance),
  };
}
