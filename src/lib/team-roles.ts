export function formatTeamRole(role: string | null | undefined) {
  if (role === "OWNER") {
    return "Team Captain";
  }

  if (role === "TRIAL") {
    return "Applicant";
  }

  return role ?? "";
}
