"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  calculateFederalTax,
  FilingStatus,
  TaxInputs,
} from "@/lib/tax2026";

const STATUS_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married · joint" },
  { value: "headOfHousehold", label: "Head of household" },
  { value: "marriedSeparate", label: "Married · separate" },
];

const initialInputs: TaxInputs = {
  filingStatus: "single",
  w2Wages: 0,
  federalWithholding: 0,
  selfEmploymentIncome: 0,
  ordinaryInvestmentIncome: 0,
  preferentialIncome: 0,
  aboveLineAdjustments: 0,
  estimatedTaxPaid: 0,
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function InputRow({
  label,
  note,
  value,
  onChange,
}: {
  label: string;
  note?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span className="fieldLabel">
        {label} {note ? <small>{note}</small> : null}
      </span>
      <span className="moneyInputWrap">
        <span className="currencyMark">$</span>
        <input
          inputMode="decimal"
          min="0"
          step="100"
          type="number"
          value={value || ""}
          placeholder="0"
          onChange={(event) => onChange(Number(event.target.value || 0))}
        />
      </span>
    </label>
  );
}

function ResultRow({
  label,
  value,
  citation,
  negative = false,
  strong = false,
}: {
  label: string;
  value: number;
  citation?: string;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={`resultRow ${strong ? "strong" : ""}`}>
      <div>
        <div>{label}</div>
        {citation ? <small>{citation}</small> : null}
      </div>
      <div className={negative ? "negative" : ""}>
        {negative ? "−" : ""}
        {money(Math.abs(value))}
      </div>
    </div>
  );
}

export default function TaxWorkbook() {
  const [inputs, setInputs] = useState<TaxInputs>(initialInputs);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isLightBlue, setIsLightBlue] = useState(false);

  const result = useMemo(() => calculateFederalTax(inputs), [inputs]);

  useEffect(() => {
    const scheme = isLightBlue ? "light-blue" : "green";
    document.documentElement.dataset.colourScheme = scheme;
  }, [isLightBlue]);

  const setNumber = (key: keyof TaxInputs, value: number) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0]?.name ?? "");
  };

  const isRefund = result.refund > 0 || result.amountOwed === 0;

  return (
    <main className="pageShell">
      <div className="schemeControl" aria-label="Colour scheme">
        <span>Colour scheme</span>
        <button
          type="button"
          className={isLightBlue ? "active" : ""}
          aria-pressed={isLightBlue}
          aria-label={isLightBlue ? "Switch to green" : "Switch to light blue"}
          onClick={() => setIsLightBlue((current) => !current)}
        >
          <span className="schemeSwatch" aria-hidden="true" />
          {isLightBlue ? "Light blue" : "Switch to light blue"}
        </button>
      </div>

      <section className="hero">
        <div className="eyebrow">FEDERAL TAX WORKSHEET · TAX YEAR 2026</div>
        <h1>
          What you owe, <em>line by line</em> — with the law beside every figure.
        </h1>
        <p className="heroCopy">
          Enter your income once. The worksheet assembles a federal estimate — income
          tax, self-employment tax, standard deduction and preferential-rate income —
          and shows how the result is built.
        </p>
        <div className="notice">
          Educational estimate for tax year 2026 (returns generally filed in 2027).
          Federal only — no state or local tax. This first rebuild intentionally omits
          several complex areas, including credits, AMT, NIIT, itemised deductions,
          QBI, Additional Medicare Tax, special senior deductions and special OBBBA
          deductions. It is not tax-filing software and not tax advice.
        </div>
      </section>

      <div className="rule" />

      <section className="worksheetGrid">
        <aside className="inputsPanel">
          <div className="sectionKicker">YOUR SITUATION</div>
          <div className="statusLabel">Filing status</div>
          <div className="statusGrid">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={inputs.filingStatus === option.value ? "active" : ""}
                onClick={() =>
                  setInputs((current) => ({
                    ...current,
                    filingStatus: option.value,
                  }))
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="miniRule" />
          <div className="sectionKicker">INCOME</div>

          <label className="fileField">
            <span className="fieldLabel">
              Read from a document <small>image or PDF · W-2</small>
            </span>
            <span className="uploadBox">
              <input type="file" accept="image/*,.pdf" onChange={onFileChange} />
              <span className="uploadButton">Choose file</span>
              <span className="fileName">
                {selectedFile || "AI extraction will be connected in Stage 2"}
              </span>
            </span>
          </label>

          <InputRow
            label="W-2 wages"
            note="Box 1"
            value={inputs.w2Wages}
            onChange={(value) => setNumber("w2Wages", value)}
          />
          <InputRow
            label="Federal income tax withheld"
            note="Box 2"
            value={inputs.federalWithholding}
            onChange={(value) => setNumber("federalWithholding", value)}
          />
          <InputRow
            label="Net self-employment income"
            note="Schedule C profit"
            value={inputs.selfEmploymentIncome}
            onChange={(value) => setNumber("selfEmploymentIncome", value)}
          />
          <InputRow
            label="Interest, ordinary dividends, other"
            note="taxed as ordinary"
            value={inputs.ordinaryInvestmentIncome}
            onChange={(value) => setNumber("ordinaryInvestmentIncome", value)}
          />
          <InputRow
            label="Qualified dividends + long-term gains"
            note="preferential rate"
            value={inputs.preferentialIncome}
            onChange={(value) => setNumber("preferentialIncome", value)}
          />
          <InputRow
            label="Other above-the-line adjustments"
            note="educational input"
            value={inputs.aboveLineAdjustments}
            onChange={(value) => setNumber("aboveLineAdjustments", value)}
          />
          <InputRow
            label="Estimated tax already paid"
            note="quarterly payments"
            value={inputs.estimatedTaxPaid}
            onChange={(value) => setNumber("estimatedTaxPaid", value)}
          />
        </aside>

        <section className="resultsCard" aria-live="polite">
          <div className="sectionKicker green">INCOME</div>
          <ResultRow label="W-2 wages" value={inputs.w2Wages} />
          <ResultRow
            label="Net self-employment income"
            value={inputs.selfEmploymentIncome}
          />
          <ResultRow
            label="Investment and preferential-rate income"
            value={inputs.ordinaryInvestmentIncome + inputs.preferentialIncome}
          />
          <ResultRow label="Total income" value={result.totalIncome} strong />

          <div className="resultSection">
            <div className="sectionKicker green">ADJUSTMENTS & DEDUCTIONS</div>
            <ResultRow
              label="Deductible half of self-employment tax"
              value={result.deductibleHalfOfSeTax}
              citation="Schedule SE / §164(f)"
              negative
            />
            <ResultRow
              label="Other above-the-line adjustments"
              value={inputs.aboveLineAdjustments}
              negative
            />
            <ResultRow
              label="Adjusted gross income (AGI)"
              value={result.adjustedGrossIncome}
              citation="Form 1040 framework"
              strong
            />
            <ResultRow
              label="Less: standard deduction"
              value={result.standardDeduction}
              citation="§63(c) · Rev. Proc. 2025-32"
              negative
            />
            <ResultRow
              label="Taxable income"
              value={result.taxableIncome}
              citation="§63"
              strong
            />
          </div>

          <div className="resultSection">
            <div className="sectionKicker green">TAX ON INCOME</div>
            <ResultRow
              label="Tax on ordinary income"
              value={result.ordinaryIncomeTax}
              citation="§1(j) · 2026 brackets"
            />
            <ResultRow
              label="Tax on qualified dividends + long-term gains"
              value={result.preferentialTax}
              citation="§1(h) · 0% / 15% / 20%"
            />
            <ResultRow
              label="Income tax before credits"
              value={result.incomeTaxBeforeCredits}
              strong
            />
          </div>

          <div className="resultSection">
            <div className="sectionKicker green">OTHER FEDERAL TAXES</div>
            <ResultRow
              label="Self-employment tax"
              value={result.selfEmploymentTax}
              citation="12.4% Social Security + 2.9% Medicare"
            />
          </div>

          <div className="resultSection">
            <div className="sectionKicker green">PAYMENTS & TOTAL</div>
            <ResultRow label="Total federal tax" value={result.totalFederalTax} strong />
            <ResultRow
              label="Federal income tax withheld"
              value={inputs.federalWithholding}
              citation="W-2 Box 2"
              negative
            />
            <ResultRow
              label="Estimated tax paid"
              value={inputs.estimatedTaxPaid}
              negative
            />

            <div className={`finalBox ${isRefund ? "refund" : "owed"}`}>
              <div>
                <h2>{isRefund ? "Estimated refund" : "Estimated amount owed"}</h2>
                <p>
                  {isRefund
                    ? "Payments exceed the estimated federal liability."
                    : "Estimated federal liability exceeds payments entered."}
                </p>
              </div>
              <strong>{money(isRefund ? result.refund : result.amountOwed)}</strong>
            </div>
          </div>
        </section>
      </section>

      <footer>
        <strong>Stage 1 rebuild.</strong> The W-2 picker is visual only for now. In the
        next stage we will add a server route that sends the document to an AI model,
        validates structured output and fills the relevant fields automatically.
      </footer>
    </main>
  );
}
