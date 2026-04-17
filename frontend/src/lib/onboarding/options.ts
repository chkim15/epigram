// Shared option definitions for the onboarding wizard and the
// Settings > Profile tab. Slugs below are persisted directly to
// public.user_profiles; do not rename without a DB migration.

export type Background =
  | 'undergrad'
  | 'masters'
  | 'phd'
  | 'working_professional';

export type RoleType =
  | 'quant_trader'
  | 'quant_researcher'
  | 'quant_dev'
  | 'data_scientist_ml'
  | 'unsure';

export type Timeline =
  | 'lt_2_weeks'
  | '2_4_weeks'
  | '1_3_months'
  | '3plus_months'
  | 'exploring';

export type PrepLevel =
  | 'scratch'
  | 'some_exposure'
  | 'fairly_prepared'
  | 'almost_ready';

export type FirmSlug =
  | 'jane_street'
  | 'citadel_securities'
  | 'sig'
  | 'optiver'
  | 'imc'
  | 'flow_traders'
  | 'five_rings'
  | 'virtu_financial'
  | 'citadel'
  | 'two_sigma'
  | 'de_shaw'
  | 'squarepoint'
  | 'point72_cubist'
  | 'bank_quant'
  | 'other_funds'
  | 'not_sure';

export interface Option<V extends string> {
  value: V;
  label: string;
  description?: string;
}

export const BACKGROUND_OPTIONS: Option<Background>[] = [
  { value: 'undergrad', label: 'Undergraduate student' },
  { value: 'masters', label: "Master's student" },
  { value: 'phd', label: 'PhD student' },
  { value: 'working_professional', label: 'Working professional' },
];

export const ROLE_OPTIONS: Option<RoleType>[] = [
  { value: 'quant_trader', label: 'Quantitative Trader' },
  { value: 'quant_researcher', label: 'Quantitative Researcher' },
  { value: 'quant_dev', label: 'Quantitative Developer / Engineer' },
  { value: 'data_scientist_ml', label: 'Data Scientist / ML Engineer' },
  { value: 'unsure', label: 'Not sure yet' },
];

export const TIMELINE_OPTIONS: Option<Timeline>[] = [
  { value: 'lt_2_weeks', label: 'Less than 2 weeks (urgent)' },
  { value: '2_4_weeks', label: '2\u20134 weeks' },
  { value: '1_3_months', label: '1\u20133 months' },
  { value: '3plus_months', label: '3+ months' },
  { value: 'exploring', label: 'Just exploring for now' },
];

export const PREP_LEVEL_OPTIONS: Option<PrepLevel>[] = [
  { value: 'scratch', label: 'Starting from scratch' },
  { value: 'some_exposure', label: 'Some exposure, need structure' },
  { value: 'fairly_prepared', label: 'Fairly prepared, need hard problems' },
  { value: 'almost_ready', label: 'Almost ready, want to stress-test' },
];

export const FIRM_OPTIONS: Option<FirmSlug>[] = [
  { value: 'jane_street', label: 'Jane Street' },
  { value: 'citadel', label: 'Citadel' },
  { value: 'citadel_securities', label: 'Citadel Securities' },
  { value: 'sig', label: 'SIG' },
  { value: 'two_sigma', label: 'Two Sigma' },
  { value: 'de_shaw', label: 'D. E. Shaw' },
  { value: 'five_rings', label: 'Five Rings' },
  { value: 'optiver', label: 'Optiver' },
  { value: 'squarepoint', label: 'Squarepoint' },
  { value: 'point72_cubist', label: 'Point72 / Cubist' },
  { value: 'virtu_financial', label: 'Virtu Financial' },
  { value: 'imc', label: 'IMC' },
  { value: 'flow_traders', label: 'Flow Traders' },
  { value: 'other_funds', label: 'Other funds' },
  { value: 'bank_quant', label: 'Quant role at a bank (Goldman, JP Morgan, etc.)' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const byValue = <V extends string>(opts: Option<V>[]) =>
  Object.fromEntries(opts.map((o) => [o.value, o.label])) as Record<V, string>;

export const BACKGROUND_LABELS = byValue(BACKGROUND_OPTIONS);
export const ROLE_LABELS = byValue(ROLE_OPTIONS);
export const TIMELINE_LABELS = byValue(TIMELINE_OPTIONS);
export const PREP_LEVEL_LABELS = byValue(PREP_LEVEL_OPTIONS);
export const FIRM_LABELS = byValue(FIRM_OPTIONS);
