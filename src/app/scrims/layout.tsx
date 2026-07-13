import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function ScrimsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />
      {children}
    </div>
  );
}
