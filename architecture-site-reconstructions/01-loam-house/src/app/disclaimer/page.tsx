import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Disclaimer — Loam House" };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" subtitle="Auyin Pty Ltd (ACN 119 204 232)">
      <p>
        No responsibility is accepted by Auyin for the accuracy of any information contained herein or for any action
        taken in reliance thereon. Prospective purchasers should make their own enquiries to satisfy themselves on all
        aspects. Details contained herein do not constitute any representation by the vendor or by the agent and are
        excluded from any contract. Artists impressions are indicative only and are subject to change without notice.
      </p>
      <p>*Subject to SRO terms and conditions.</p>
    </LegalPage>
  );
}
