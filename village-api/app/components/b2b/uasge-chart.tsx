import { Card } from "@/components/ui/card";
import pool from "@/lib/db";

async function getUsage(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM usage_logs
     WHERE user_id = $1 AND timestamp::date = $2`,
    [userId, today]
  );
  return result.rows[0].count;
}

export default async function UsageChart({ userId }: { userId: string }) {
  const todayCount = await getUsage(userId);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Today&apos;s Usage</h3>
      <div className="text-3xl font-bold text-blue-600">{todayCount}</div>
      <p className="text-sm text-gray-400">API calls today</p>
    </Card>
  );
}