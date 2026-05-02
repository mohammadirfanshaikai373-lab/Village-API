// components/sidebar.tsx
import Link from "next/link";
import { SignOutButton } from "./sidebar-client";
import { Session } from "@/auth";

export default function Sidebar({ session }: { session: Session | null }) {
  return (
    <aside className="w-64 bg-white border-r flex flex-col p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-blue-600">VillageAPI</h2>
        <p className="text-xs text-gray-400">B2B Portal</p>
      </div>
      <nav className="space-y-1 flex-1">
        <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
        <Link href="/dashboard/keys" className="block px-3 py-2 rounded hover:bg-gray-100">API Keys</Link>
        <Link href="/dashboard/usage" className="block px-3 py-2 rounded hover:bg-gray-100">Usage</Link>
        <Link href="/dashboard/plan" className="block px-3 py-2 rounded hover:bg-gray-100">Plan</Link>
      </nav>
      <div className="border-t pt-4">
        {session && (
          <>
            <p className="text-sm font-medium">{session.user?.name}</p>
            <p className="text-xs text-gray-500">{session.user?.email}</p>
          </>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}