import React from "react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy — Epigram",
};

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "#faf9f5", height: "100vh", overflowY: "auto" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-sm" style={{ backgroundColor: "rgba(250,249,245,0.8)", borderBottom: "1px solid rgb(240,238,230)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center">
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <Image src="/epigram_logo.svg" alt="Epigram Logo" width={32} height={32} />
              <span style={{ fontWeight: 700, fontSize: "20px", color: "#141310" }}>Epigram</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 10% 96px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: "#a16207", marginBottom: "16px" }}>Legal</p>
        <h1 style={{ fontFamily: "var(--font-playfair, Playfair Display, serif)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 700, color: "#141310", lineHeight: 1.15, letterSpacing: "-1px", marginBottom: "12px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "13px", color: "#9b9b93", marginBottom: "48px" }}>Last modified: May 1, 2026</p>

        <div style={{ fontSize: "15px", color: "#4A5B78", lineHeight: 1.8 }}>

          <p style={{ marginBottom: "48px" }}>
            Epigram, Inc. (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides this Privacy Policy to inform you of our policies and procedures regarding the collection, use, and disclosure of personal information we may receive from users of our website and any other services offered by us (the &quot;Services&quot;).
          </p>

          <Section title="INFORMATION COLLECTION">
            <p style={{ marginBottom: "16px" }}>In the course of using the Services, we collect the following categories of personally identifiable information:</p>

            <p style={{ marginBottom: "8px", fontWeight: 600, color: "#141310" }}>Account Information:</p>
            <p style={{ marginBottom: "20px" }}>
              When you create an account, we collect your email address, username, and password (securely hashed). You may optionally provide additional profile information such as a display name.
            </p>

            <p style={{ marginBottom: "8px", fontWeight: 600, color: "#141310" }}>Learning & Practice Data:</p>
            <p style={{ marginBottom: "20px" }}>
              To provide our educational services, we collect your problem attempts and solutions, practice session history and progress, AI tutor conversation history, mock interview results, and topic and difficulty preferences. AI tutor conversations are processed to provide responses and are not used to train models or shared with third parties.
            </p>

            <p style={{ marginBottom: "8px", fontWeight: 600, color: "#141310" }}>Usage Data:</p>
            <p>
              We automatically collect IP address and device information, browser type and version, pages visited and time spent, and feature usage patterns. This data is used to support the internal operations of our Services.
            </p>
          </Section>

          <Section title="COOKIES AND OTHER TECHNOLOGIES">
            <p style={{ marginBottom: "16px" }}>
              Like many websites and applications, we use &quot;cookies&quot; to collect information. A cookie is a small data file that we transfer to your device for record-keeping purposes. We may use session cookies to enable certain features of the Site, to better understand how you interact with it, and to monitor aggregate usage.
            </p>
            <p>
              You can instruct your browser to stop accepting cookies or to prompt you before accepting a cookie. If you do not accept cookies, you may not be able to use all portions of the Site or all functionality of the Services.
            </p>
          </Section>

          <Section title="INFORMATION SHARING AND DISCLOSURE">
            <p style={{ marginBottom: "16px", fontWeight: 600, color: "#141310" }}>
              WE WILL NOT SHARE, SELL, RENT, OR TRADE YOUR PERSONAL INFORMATION WITH OTHER PARTIES EXCEPT AS PROVIDED BELOW:
            </p>

            <p style={{ marginBottom: "8px", fontWeight: 600, color: "#141310" }}>Service Providers:</p>
            <p style={{ marginBottom: "20px" }}>
              We employ third-party companies to facilitate our services. These include Supabase for database and authentication infrastructure, and Stripe for payment processing. These parties have access to your personal information only to perform tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>

            <p style={{ marginBottom: "8px", fontWeight: 600, color: "#141310" }}>Aggregate Information:</p>
            <p style={{ marginBottom: "20px" }}>
              We may share aggregated, non-identifying information with third parties for industry analysis and service improvement.
            </p>

            <p style={{ marginBottom: "8px", fontWeight: 600, color: "#141310" }}>Compliance with Laws:</p>
            <p>
              We may disclose personal information if required to do so by law or in the good-faith belief that such action is necessary to comply with state and federal laws, respond to a court order, or protect the security or integrity of the Services.
            </p>
          </Section>

          <Section title="SECURITY">
            <p style={{ marginBottom: "16px" }}>
              We are committed to taking reasonable steps to protect your personal information from unauthorized access and use. Specifically:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              {[
                "Passwords are securely hashed using modern algorithms.",
                "All data transmission is encrypted via HTTPS/TLS.",
                "Database access is restricted and monitored.",
                "Payment processing is handled by PCI-compliant providers (Stripe).",
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>{item}</li>
              ))}
            </ul>
            <p>
              No method of transmission over the Internet or electronic storage is one hundred percent secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
            </p>
          </Section>

          <Section title="INTERNATIONAL TRANSFER">
            <p>
              Your information may be transferred to and maintained on computers located outside of your state, province, or country where privacy laws may differ. If you are located outside the United States and choose to provide information to us, we may transfer and process it in the United States. Use of our Services represents your consent to this Privacy Policy and your agreement to that transfer.
            </p>
          </Section>

          <Section title="LINKS TO OTHER SITES">
            <p>
              Our Services may contain links to other websites or online services. The fact that we link to a website is not an endorsement or representation of our affiliation with that third party, nor is it an endorsement of their privacy practices. We do not exercise control over third-party websites and encourage you to read their privacy policies.
            </p>
          </Section>

          <Section title="ACCOUNT DELETION">
            <p style={{ marginBottom: "16px" }}>
              You can request to delete your Epigram account at any time through your account settings. Before proceeding, please understand the following:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              {[
                "You will lose access to all content, progress, and records associated with your account.",
                "You will lose access to any active subscriptions or purchased content.",
                "You will not be able to recover any account-related information.",
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>{item}</li>
              ))}
            </ul>
            <p>
              If you have an active subscription, please cancel it before requesting account deletion.
            </p>
          </Section>

          <Section title="YOUR DATA RIGHTS">
            <p style={{ marginBottom: "16px" }}>You have the right to:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              {[
                "Access – Request a copy of your personal data.",
                "Rectification – Correct inaccurate information.",
                "Erasure – Request deletion of your account data.",
                "Portability – Export your data in a machine-readable format.",
                "Restriction – Limit how we process your data.",
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>{item}</li>
              ))}
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a href="mailto:info@epi-gram.app" style={{ color: "#a16207" }}>info@epi-gram.app</a>.
            </p>
          </Section>

          <Section title="CHILDREN'S PRIVACY">
            <p>
              Our Service is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately.
            </p>
          </Section>

          <Section title="CHANGES TO THIS PRIVACY POLICY">
            <p>
              This Privacy Policy may be revised periodically, as reflected by the &quot;last modified&quot; date above. Our amended Privacy Policy will automatically take effect 30 days after the change. If you do not agree with any changes, you may terminate your use of the Services.
            </p>
          </Section>

          <p style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid rgb(240,238,230)" }}>
            Please contact us with any questions or comments about this Privacy Policy at{" "}
            <a href="mailto:info@epi-gram.app" style={{ color: "#a16207" }}>info@epi-gram.app</a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgb(240,238,230)", padding: "24px 10%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "13px", color: "#9b9b93", textDecoration: "none" }}>← Back to home</Link>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="/terms" style={{ fontSize: "13px", color: "#4A5B78", textDecoration: "none" }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: "13px", color: "#141310", textDecoration: "none" }}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#a16207", marginBottom: "16px" }}>
        {title}
      </p>
      {children}
    </div>
  );
}
