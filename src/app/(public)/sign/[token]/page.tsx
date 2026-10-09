import { Metadata } from "next";
import SigningForm from "./SigningForm";

export const metadata: Metadata = {
  title: "Signature électronique — DJAMA",
  description: "Signer un document électroniquement",
  robots: "noindex, nofollow",
};

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SigningForm token={token} />;
}
