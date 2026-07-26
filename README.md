# Federal Tax Worksheet — Tax Year 2026

Stage 1 rebuild of the personal federal income-tax site.

## What works now

- Filing-status selector
- W-2 wage input
- Federal withholding input
- Self-employment income input
- Ordinary investment income
- Qualified dividends / long-term capital-gain input
- Above-the-line adjustments
- Estimated tax payments
- 2026 standard deduction
- 2026 ordinary federal income-tax brackets
- 2026 0% / 15% / 20% preferential-rate stacking
- Basic self-employment tax
- Live refund / amount-owed estimate
- W-2 file picker UI (not processed yet)

## Intentionally not included yet

This is educational software, not filing software. Stage 1 does **not** attempt to cover credits, AMT, NIIT, itemised deductions, QBI, Additional Medicare Tax, dependent rules, senior deductions, special OBBBA deductions, state/local tax, or every interaction among IRS forms.

## Run on your Mac

1. Install Node.js 20.9 or newer.
2. Open Terminal.
3. Change into this project folder.
4. Run:

```bash
npm install
npm run dev
```

5. Open `http://localhost:3000`.

## Main files to learn first

- `app/page.tsx` — the home route.
- `components/TaxWorkbook.tsx` — the visible calculator and user interaction.
- `lib/tax2026.ts` — the deterministic tax-calculation logic.
- `app/globals.css` — visual design.

## Next stage

Add a server-side W-2 extraction route using an AI API. The AI will extract structured W-2 fields; the deterministic TypeScript tax engine will remain responsible for the calculation.

## Tax-data sources

The 2026 figures in this learning build were based on IRS Rev. Proc. 2025-32 / IRS 2026 inflation-adjustment guidance and SSA 2026 Social Security wage-base guidance. Verify rules again before using any tax calculation commercially.
