import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planning Agenda | DJAMA",
  description: "Gérez votre planning et vos événements avec DJAMA.",
  robots: { index: false, follow: false },
};

export default function PlanningAgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
