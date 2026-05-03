export const RECRUITING_ROLE_OPTIONS = [
  "Position 1 (Hard carry)",
  "Position 2 (Soft carry)",
  "Position 3 (Early-midgame carry)",
  "Position 4 (Frontline)",
  "Position 5 (Pick)",
  "Position 6 (Support)",
  "Coach",
  "Analyst",
] as const;

export type RecruitingRoleOption = (typeof RECRUITING_ROLE_OPTIONS)[number];
