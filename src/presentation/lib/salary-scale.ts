export const SALARY_LEVEL_OPTIONS = ["พ.1", "พ.2", "พ.3", "น.1", "น.2", "น.3", "น.4", "น.5", "น.6"];

export const SALARY_STEP_OPTIONS = Array.from({ length: 80 }, (_, index) => Number((index * 0.5 + 0.5).toFixed(1)));

type SalaryScale = {
  minStep: number;
  maxStep: number;
  minSalary: number;
  maxSalary: number;
};

const SALARY_SCALES: Record<string, SalaryScale> = {
  "พ.1": { minStep: 0.5, maxStep: 8.5, minSalary: 4870, maxSalary: 6970 },
  "พ.2": { minStep: 0.5, maxStep: 9, minSalary: 4870, maxSalary: 7140 },
  "พ.3": { minStep: 0.5, maxStep: 9, minSalary: 4870, maxSalary: 7140 },
  "น.1": { minStep: 1, maxStep: 11, minSalary: 6470, maxSalary: 10700 },
  "น.2": { minStep: 1, maxStep: 17, minSalary: 24400, maxSalary: 31200 },
  "น.3": { minStep: 0.5, maxStep: 21.5, minSalary: 21880, maxSalary: 43500 },
  "น.4": { minStep: 0.5, maxStep: 29.5, minSalary: 28880, maxSalary: 44310 },
  "น.5": { minStep: 0.5, maxStep: 33.5, minSalary: 24400, maxSalary: 62670 },
  "น.6": { minStep: 0.5, maxStep: 40, minSalary: 70360, maxSalary: 78030 },
};

export function normalizeSalaryLevel(value?: string) {
  return value ? value.replace(/^ป\./, "พ.") : "น.3";
}

export function formatSalaryStep(step: number) {
  return Number.isInteger(step) ? step.toFixed(0) : step.toFixed(1);
}

export function getSalaryAmount(level: string, step: number) {
  const scale = SALARY_SCALES[normalizeSalaryLevel(level)] || SALARY_SCALES["น.3"];
  const boundedStep = Math.min(scale.maxStep, Math.max(scale.minStep, step));
  const ratio = scale.maxStep === scale.minStep ? 0 : (boundedStep - scale.minStep) / (scale.maxStep - scale.minStep);
  return Math.round(scale.minSalary + (scale.maxSalary - scale.minSalary) * ratio);
}