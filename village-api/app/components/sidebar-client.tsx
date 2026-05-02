"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => signOut()}>Sign Out</Button>;
}