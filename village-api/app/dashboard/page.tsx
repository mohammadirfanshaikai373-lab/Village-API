// app/(dashboard)/page.tsx
import { auth } from "@/auth";
import ApiKeyCard from "@/components/b2b/api-key-card";
import UsageChart from "@/components/b2b/uasge-chart";

export default async function B2BDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {session.user.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ApiKeyCard userId={session.user.id as string} />
        <UsageChart userId={session.user.id as string} />
      </div>
    </div>
  );
}