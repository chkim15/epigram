"use client";

import { Suspense, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Cal, { getCalApi } from "@calcom/embed-react";

function TutoringPageContent() {
  const { showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard({ requireAuth: false });

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "tutoring" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? "";

  return (
    <AppShell showCheckoutSuccess={showCheckoutSuccess} onDismissCheckout={() => setShowCheckoutSuccess(false)}>
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#faf9f5" }}>
        <div style={{ padding: "80px 16%" }}>

          {/* Header */}
          <p style={{ fontSize: "13px", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 500, color: "#a16207", marginBottom: "16px", textAlign: "center" }}>
            1-on-1 Tutoring
          </p>
          <h1 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700, color: "#141310", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: "12px", textAlign: "center" }}>
            Work directly with the author
          </h1>
          <p style={{ fontSize: "16px", color: "#6b6b63", marginBottom: "8px", textAlign: "center" }}>
            60-min sessions · $120 · Math PhD, former Wharton lecturer
          </p>
          <p style={{ fontSize: "14px", color: "#9b9b93", marginBottom: "48px", textAlign: "center" }}>
            Pre-session email discussion included — tailored to you
          </p>

          {/* Cal.com inline embed */}
          <Cal
            namespace="tutoring"
            calLink={calLink}
            style={{ width: "100%", minHeight: "600px", overflow: "scroll" }}
            config={{ layout: "month_view" }}
          />

        </div>
      </div>
    </AppShell>
  );
}

export default function TutoringPage() {
  return (
    <Suspense>
      <TutoringPageContent />
    </Suspense>
  );
}
