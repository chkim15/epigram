"use client";

import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

function UpgradePageContent() {
  const { showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard({ requireAuth: false });
  const { startCheckout, isLoading, canStartTrial } = useSubscriptionStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleCheckout = async (planType: "monthly" | "six_month") => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }
    posthog.capture('upgrade_plan_selected', { plan_type: planType });
    const result = await startCheckout(planType);
    if (result.url) {
      window.location.href = result.url;
    } else if (result.error) {
      alert(result.error);
    }
  };

  const ctaLabel = (planType: "monthly" | "six_month") => {
    if (isLoading) return "Processing...";
    return planType === "monthly" ? "Start Premium →" : "Start 6-Month Premium →";
  };

  return (
    <AppShell showCheckoutSuccess={showCheckoutSuccess} onDismissCheckout={() => setShowCheckoutSuccess(false)}>
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "#faf9f5" }}>
        <div style={{ padding: "80px 16%" }}>
          <h1 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 700, color: "#141310", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "12px", textAlign: "center" }}>
            Premium
          </h1>
          <p style={{ fontSize: "16px", color: "#6b6b63", marginBottom: "48px", textAlign: "center" }}>
            Get started with an Epigram subscription that works for you.
          </p>

          {/* Launch offer banner */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#ffffff", border: "2px solid #a16207", borderRadius: "10px", padding: "14px 20px", marginBottom: "28px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600, color: "#a16207", flexShrink: 0 }}>Launch offer</span>
            <span style={{ fontSize: "14px", color: "#141310" }}>Sign up before <span style={{ fontWeight: 700, color: "#a16207" }}>Sep 1</span> for <strong>50% off</strong> any paid plan — locked in for your entire committed period.</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", alignItems: "stretch" }}>

            {/* Free */}
            <div style={{ background: "#ffffff", border: "1px solid rgb(240,238,230)", borderRadius: "14px", padding: "32px", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500, color: "#9b9b93", marginBottom: "8px" }}>Free Account</p>
              <div style={{ marginBottom: "4px" }}>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: "48px", fontWeight: 700, color: "#141310", lineHeight: 1 }}>$0</span>
              </div>
              <p style={{ fontSize: "12px", color: "#9b9b93", marginBottom: "4px" }}>No credit card required</p>
              <p style={{ fontSize: "11px", color: "transparent", marginBottom: "24px", userSelect: "none" }}>* Limited time launch offer</p>
              <div style={{ flex: 1 }}>
                {["Access to first topics of The 4-Week Intensive curriculum", "Two interview cheatsheets", "Core free-tier problems"].map(f => (
                  <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid rgb(240,238,230)", fontSize: "14px", color: "#4A5B78" }}>
                    <span style={{ color: "#2A6048", fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "28px" }}>
                <button
                  className="cursor-pointer"
                  onClick={() => router.push(user ? "/problems" : "/auth/signup")}
                  style={{ width: "100%", padding: "13px", borderRadius: "8px", border: "1px solid rgb(220,218,210)", background: "transparent", color: "#141310", fontSize: "14px", fontWeight: 500, transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#141310")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgb(220,218,210)")}
                >{user ? "Continue free →" : "Create free account →"}</button>
              </div>
            </div>

            {/* 1-month Premium */}
            <div style={{ background: "#ffffff", border: "1px solid rgb(240,238,230)", borderRadius: "14px", padding: "32px", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500, color: "#a16207", marginBottom: "8px" }}>Premium</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: "32px", fontWeight: 500, color: "#9b9b93", lineHeight: 1, textDecoration: "line-through" }}>$39</span>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: "48px", fontWeight: 700, color: "#141310", lineHeight: 1 }}>$19</span>
                <span style={{ fontSize: "16px", color: "#9b9b93", fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: "12px", color: "#9b9b93", marginBottom: "24px" }}>Billed every month · Cancel anytime</p>
              <div style={{ flex: 1 }}>
                {["Full access to The 4-Week Intensive curriculum", "Exclusive problems not found online", "Unlimited mock interviews", "Company filters", "Priority access to new premium problems", "Up to 3 expert email responses per week"].map(f => (
                  <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid rgb(240,238,230)", fontSize: "14px", color: "#4A5B78" }}>
                    <span style={{ color: "#a16207", fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "28px", background: "rgba(161,98,7,0.07)", border: "1px solid rgba(161,98,7,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#a16207", marginBottom: 0 }}>Free 30-min intro call included</p>
              </div>
              <button
                className="cursor-pointer"
                onClick={() => handleCheckout("monthly")}
                disabled={isLoading}
                style={{ width: "100%", padding: "13px", borderRadius: "8px", border: "none", background: "#a16207", color: "#fff", fontSize: "14px", fontWeight: 500, transition: "background 0.2s", opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#8b5006"; }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = "#a16207"; }}
              >{ctaLabel("monthly")}</button>
            </div>

            {/* 6-month Premium — Recommended */}
            <div style={{ position: "relative", background: "#ffffff", border: "2px solid #a16207", borderRadius: "14px", padding: "32px", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", background: "#a16207", color: "#fff", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "5px 16px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                Recommended
              </div>
              <p style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500, color: "#a16207", marginBottom: "8px" }}>Premium · 6 months</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: "32px", fontWeight: 500, color: "#9b9b93", lineHeight: 1, textDecoration: "line-through" }}>$179</span>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: "48px", fontWeight: 700, color: "#141310", lineHeight: 1 }}>$89</span>
                <span style={{ fontSize: "16px", color: "#9b9b93", fontWeight: 400 }}>/6 mo</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: "14px", fontWeight: 600, color: "#a16207" }}>$14.92/mo</span>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", background: "#a16207", color: "#fff", borderRadius: "4px", padding: "2px 6px" }}>Save 22%</span>
              </div>
              <p style={{ fontSize: "12px", color: "#9b9b93", marginBottom: "24px" }}>Billed every 6 months · Cancel anytime</p>
              <div style={{ flex: 1 }}>
                {["Everything in 1-month Premium", "Best value for full interview prep cycle", "Lock in price for 6 months"].map(f => (
                  <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid rgb(240,238,230)", fontSize: "14px", color: "#4A5B78" }}>
                    <span style={{ color: "#a16207", fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "28px", background: "rgba(161,98,7,0.07)", border: "1px solid rgba(161,98,7,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#a16207", marginBottom: 0 }}>Free 30-min intro call included</p>
              </div>
              <button
                className="cursor-pointer"
                onClick={() => handleCheckout("six_month")}
                disabled={isLoading}
                style={{ width: "100%", padding: "13px", borderRadius: "8px", border: "none", background: "#a16207", color: "#fff", fontSize: "14px", fontWeight: 500, transition: "background 0.2s", opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#8b5006"; }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = "#a16207"; }}
              >{ctaLabel("six_month")}</button>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageContent />
    </Suspense>
  );
}
