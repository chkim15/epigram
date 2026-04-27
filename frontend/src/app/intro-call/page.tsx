"use client";

import { Suspense, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import Cal, { getCalApi } from "@calcom/embed-react";

function IntroCallPageContent() {
  const { showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard({ requireAuth: true });
  const { isPro } = useSubscriptionStore();

  const calLink = process.env.NEXT_PUBLIC_CAL_INTRO_CALL_LINK;

  useEffect(() => {
    if (!calLink) return;
    (async () => {
      const cal = await getCalApi({ namespace: "intro-call" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, [calLink]);

  return (
    <AppShell showCheckoutSuccess={showCheckoutSuccess} onDismissCheckout={() => setShowCheckoutSuccess(false)}>
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#faf9f5" }}>
        <div style={{ padding: "80px 16%" }}>

          <p style={{ fontSize: "13px", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 500, color: "#a16207", marginBottom: "16px", textAlign: "center" }}>
            Free for Premium Members
          </p>
          <h1 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700, color: "#141310", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: "12px", textAlign: "center" }}>
            Free 30-Min Intro Call
          </h1>
          <p style={{ fontSize: "16px", color: "#6b6b63", marginBottom: "48px", textAlign: "center" }}>
            Get a personalized study plan and walkthrough of the platform
          </p>

          {!isPro ? (
            <p style={{ textAlign: "center", color: "#9b9b93", fontSize: "15px" }}>
              This call is available to premium members.
            </p>
          ) : calLink ? (
            <Cal
              namespace="intro-call"
              calLink={calLink}
              style={{ width: "100%", minHeight: "600px", overflow: "scroll" }}
              config={{ layout: "month_view" }}
            />
          ) : (
            <p style={{ textAlign: "center", color: "#9b9b93", fontSize: "15px" }}>
              Booking calendar coming soon. Please check back later.
            </p>
          )}

        </div>
      </div>
    </AppShell>
  );
}

export default function IntroCallPage() {
  return (
    <Suspense>
      <IntroCallPageContent />
    </Suspense>
  );
}
