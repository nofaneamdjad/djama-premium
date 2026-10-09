import { Metadata } from "next";
import SigningForm from "./SigningForm";

export const metadata: Metadata = {
  title: "Signature électronique — DJAMA",
  description: "Signer un document électroniquement",
  robots: "noindex, nofollow",
};

export default function SignPage({ params }: { params: { token: string } }) {
  return <SigningForm token={params.token} />;
}
