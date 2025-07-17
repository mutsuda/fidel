import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import authOptions from "../api/auth/authOptions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/login");
  }
  return <>{children}</>;
} 