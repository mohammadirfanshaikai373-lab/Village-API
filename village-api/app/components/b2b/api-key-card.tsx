import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import pool from "@/lib/db";

async function getApiKey(userId: string) {
  const result = await pool.query(
    `SELECT api_key, plan, created_at FROM api_keys
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

export default async function ApiKeyCard({ userId }: { userId: string }) {
  const keyData = await getApiKey(userId);

  if (!keyData) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">API Key</h3>
        <p className="text-gray-500 mb-4">You don&apos;t have an active API key.</p>
        <GenerateApiKeyButton userId={userId} />
      </Card>
    );
  }

  const maskedKey = keyData.api_key.slice(0, 8) + "..." + keyData.api_key.slice(-4);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Your API Key</h3>
      <div className="flex items-center gap-2 mb-2">
        <code className="bg-gray-100 p-2 rounded text-sm">{maskedKey}</code>
        <Copy className="h-4 w-4 cursor-pointer text-gray-500" />
      </div>
      <Badge variant="secondary">{keyData.plan}</Badge>
      <p className="text-xs text-gray-400 mt-2">
        Created at {new Date(keyData.created_at).toLocaleDateString()}
      </p>
    </Card>
  );
}

// Client component for generating key
import { generateApiKey } from "@/lib/api-utils";
import { revalidatePath } from "next/cache";

function GenerateApiKeyButton({ userId }: { userId: string }) {
  async function generate() {
    "use server";
    await generateApiKey(userId);
    revalidatePath("/dashboard");
  }

  return (
    <form action={generate}>
      <Button type="submit">Generate API Key</Button>
    </form>
  );
}