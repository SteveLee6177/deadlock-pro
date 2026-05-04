import { ChartNoAxesCombined } from "lucide-react";
import { getStatlockerProfileUrl } from "@/lib/steam-profile";

type StatlockerProfileLinkProps = {
  className?: string;
  iconClassName?: string;
  profileName: string;
  steamId: string;
};

export function StatlockerProfileLink({
  className,
  iconClassName,
  profileName,
  steamId,
}: StatlockerProfileLinkProps) {
  const statlockerUrl = getStatlockerProfileUrl(steamId);

  if (!statlockerUrl) {
    return null;
  }

  return (
    <a
      href={statlockerUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${profileName}'s Statlocker profile`}
      title="Open Statlocker profile"
      className={className}
    >
      <ChartNoAxesCombined className={iconClassName} />
    </a>
  );
}
