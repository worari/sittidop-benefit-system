import { VulnerabilityLevel } from "../value-objects/enums";

export interface CitizenEntity {
  id: string;
  nationalId: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  monthlyIncome: number;
  hasStateWelfareCard: boolean;
  isDisabilityRegistered: boolean;
  disabilityType?: string | null;
  vulnerabilityScore: number;
  vulnerabilityLevel: VulnerabilityLevel;
  livingCondition?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function calculateAge(dateOfBirth: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - dateOfBirth.getFullYear();
  const m = referenceDate.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function computeVulnerabilityScore(citizen: {
  age: number;
  monthlyIncome: number;
  hasDisability: boolean;
  hasStateWelfareCard: boolean;
  livingCondition?: string | null;
}): { score: number; level: VulnerabilityLevel } {
  let score = 0;

  // Age factor
  if (citizen.age >= 90) score += 30;
  else if (citizen.age >= 80) score += 25;
  else if (citizen.age >= 70) score += 15;
  else if (citizen.age >= 60) score += 10;

  // Income factor
  if (citizen.monthlyIncome === 0) score += 30;
  else if (citizen.monthlyIncome < 3000) score += 25;
  else if (citizen.monthlyIncome < 8000) score += 15;
  else if (citizen.monthlyIncome < 15000) score += 5;

  // Vulnerability indicators
  if (citizen.hasStateWelfareCard) score += 15;
  if (citizen.hasDisability) score += 20;
  if (citizen.livingCondition === "ALONE" || citizen.livingCondition === "BEDRIDDEN") score += 15;

  score = Math.min(100, score);

  let level = VulnerabilityLevel.LOW;
  if (score >= 75) level = VulnerabilityLevel.CRITICAL;
  else if (score >= 50) level = VulnerabilityLevel.HIGH;
  else if (score >= 25) level = VulnerabilityLevel.MODERATE;

  return { score, level };
}
