import type { ClinicConfig } from "./types";
import { badawi } from "./badawi";
import { ibrahim } from "./ibrahim";

export type { ClinicConfig, ClinicTheme, ClinicTeamMember, Bi } from "./types";

/** Every clinic this codebase knows about, keyed by slug. */
export const clinics: Record<string, ClinicConfig> = {
  badawi,
  ibrahim,
};

/** Fallback clinic when none is selected. */
export const DEFAULT_CLINIC = "badawi";

/**
 * The slug of the clinic this deployment serves. Set once per host via the env
 * var (always set NEXT_PUBLIC_CLINIC so the server and browser agree — CLINIC
 * alone would cause a hydration mismatch). Defaults to badawi.
 */
export function activeClinicSlug(): string {
  const slug = process.env.NEXT_PUBLIC_CLINIC || process.env.CLINIC || DEFAULT_CLINIC;
  return clinics[slug] ? slug : DEFAULT_CLINIC;
}

/** The active clinic's full config. */
export function activeClinic(): ClinicConfig {
  return clinics[activeClinicSlug()];
}
