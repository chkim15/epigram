import React from "react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service — Epigram",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: "13px", color: "#9b9b93", marginBottom: "48px" }}>Last modified: May 1, 2026</p>

        <div style={{ fontSize: "15px", color: "#4A5B78", lineHeight: 1.8 }}>

          <p style={{ marginBottom: "24px" }}>
            These Terms of Service are entered into between you and Epigram, Inc. (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) for the use of our application in relation to our quantitative finance interview preparation and training tools. By accessing our websites and services (the &quot;Services&quot;), you acknowledge that you have read, understood, and agree to the most recent version of these Terms of Service (&quot;Terms&quot;).
          </p>
          <p style={{ marginBottom: "48px" }}>
            We reserve the right to revise these Terms at any time. If we do, we will post the modified Terms on this page and indicate the date of the most recent change above. Your continued use of the Services constitutes acceptance of these Terms and any modifications thereto. If you object to any changes, your sole recourse is to cease use of the Services.
          </p>

          <Section title="USE OF SERVICES">
            <p style={{ marginBottom: "16px" }}>
              You agree that by using our Services, you have accepted these Terms and understand your obligations herein and under the Privacy Policy. You further agree that you are authorized to use our Services for your sole benefit. We reserve the right, at our sole discretion, to terminate any transactions or activities where we believe that the activities violate these Terms, Privacy Policy, or any laws.
            </p>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Restrictions:</p>
            <p style={{ marginBottom: "12px" }}>You agree that the use of our Service must not involve any activities that are dangerous, harmful, fraudulent, deceptive, threatening, harassing, defamatory, or obscene. Specifically, you are prohibited from:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "24px" }}>
              {[
                "Attempting to obtain any password, account, or security information belonging to another user.",
                "Running autoresponders, spam, or any process that operates while you are not logged into the platform or that interferes with the Service's operation.",
                "Using the Service in violation of any law or regulation.",
                "\"Crawling,\" \"scraping,\" or \"spidering\" any part of the Service.",
                "Attempting to decompile, reverse engineer, or discover the source code of the Service.",
                "Sharing solutions publicly in a way that undermines the educational value of the platform.",
                "Using automated tools to bypass platform functionality or manipulate progress metrics.",
                "Creating multiple accounts to gain unfair advantages.",
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>{item}</li>
              ))}
            </ul>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Content:</p>
            <p style={{ marginBottom: "12px" }}>
              &quot;Content&quot; refers to all software, images, problems, solutions, communications, and any related material available from our Service. Content may be owned by us (&quot;Our Content&quot;) or contributed by users (&quot;User Submitted Content&quot;). Unless otherwise specified in writing, all Our Content is owned, controlled, or licensed by us and is protected under United States copyright laws.
            </p>
            <p>
              By submitting any User Submitted Content (including notes or feedback), you grant us a worldwide, non-exclusive, royalty-free, perpetual, and irrevocable license to use, reproduce, modify, and distribute it in connection with the Services. This right persists even if such content is subsequently removed or your account is deleted.
            </p>
          </Section>

          <Section title="ACCOUNT INFORMATION">
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Registration:</p>
            <p style={{ marginBottom: "20px" }}>
              We may ask you to register an account for the use of our services. You may create an account directly or via a third-party service such as Google. If you use a third-party service, you will also be subject to their terms and privacy policies.
            </p>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Terms of Account:</p>
            <p style={{ marginBottom: "20px" }}>
              You agree that the information you provide is accurate to the best of your knowledge. You must be at least 18 years of age. You are solely responsible for all activity that occurs on your account. Failure to maintain accurate account information may result in your inability to use our services.
            </p>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Privacy:</p>
            <p>
              The terms of your account shall be protected by our Privacy Policy, including any user-generated material or confidential information provided as part of your account. Please refer to our Privacy Policy, which is incorporated into this agreement by reference.
            </p>
          </Section>

          <Section title="PAYMENT PROCESSING">
            <p>
              We utilize Stripe, a third-party service, for processing payments. We do not track or retain any information regarding your banking details, including credit card numbers. We do not accept liability for the security of your banking information as processed by Stripe.
            </p>
          </Section>

          <Section title="WARRANTIES AND LIMITATIONS ON LIABILITY">
            <p style={{ marginBottom: "16px" }}>
              USE OF THE SERVICES IS AT YOUR OWN RISK. THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. WE EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p style={{ marginBottom: "16px" }}>
              WE MAKE NO WARRANTY THAT (I) THE SERVICES WILL MEET YOUR REQUIREMENTS; (II) THE SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. EPIGRAM IS AN EDUCATIONAL PLATFORM. NOTHING WE PROVIDE CONSTITUTES PROFESSIONAL CAREER ADVICE OR GUARANTEES JOB PLACEMENT.
            </p>
            <p>
              TO THE FULLEST EXTENT PERMITTED UNDER LAW, WE HAVE NO OBLIGATION OR LIABILITY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING FROM OR RELATED TO YOUR USE OF THE SERVICES. OUR LIABILITY TO YOU UNDER ANY CIRCUMSTANCE IS LIMITED TO A MAXIMUM AMOUNT OF $100.
            </p>
          </Section>

          <Section title="DISPUTE RESOLUTION">
            <p style={{ marginBottom: "16px" }}>
              You agree that any dispute shall be settled via binding arbitration. The arbitrator shall issue a written decision on the merits and shall have the power to award any remedies available under applicable law. The award rendered may be entered as a final and binding judgment in any court having jurisdiction thereof.
            </p>
            <p style={{ marginBottom: "16px" }}>
              ANY LEGAL CLAIM AGAINST US MUST BE FILED WITHIN ONE YEAR AFTER THE EVENT THAT GAVE RISE TO YOUR CLAIM. OTHERWISE, YOUR CLAIM WILL BE PERMANENTLY BARRED.
            </p>
            <p>
              You and we agree that claims may be brought solely in each party&apos;s individual capacity and not as a class action, and that the arbitrator may not consolidate claims from multiple parties.
            </p>
          </Section>

          <Section title="MISCELLANEOUS">
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Governing Law:</p>
            <p style={{ marginBottom: "20px" }}>
              This Agreement shall be governed by the laws of the United States, without regard to the conflicts of law provisions of any jurisdiction.
            </p>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Force Majeure:</p>
            <p style={{ marginBottom: "20px" }}>
              We shall not be liable for any delay or failure to perform resulting from causes outside our reasonable control, including acts of God, war, terrorism, natural disasters, or disruptions in communications infrastructure.
            </p>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Entire Agreement:</p>
            <p style={{ marginBottom: "20px" }}>
              This Agreement constitutes the entire agreement between you and us with respect to the subject matter herein and supersedes all prior written and oral agreements.
            </p>
            <p style={{ marginBottom: "12px", fontWeight: 600, color: "#141310" }}>Severability:</p>
            <p>
              If any portion of these Terms is deemed invalid or unenforceable, such provision will be enforced to the maximum extent permissible, and the remainder will continue in full force and effect.
            </p>
          </Section>

          <Section title="CANCELLATION, REFUND, AND TERMINATION">
            <p style={{ marginBottom: "16px" }}>
              You can cancel your current Premium subscription in your account settings. You must cancel before your renewal date to avoid the next billing charge. After cancellation, your subscription will remain active until the end of the current billing period, but you will not receive a refund.
            </p>
            <p style={{ marginBottom: "16px" }}>
              Epigram may deny you access to all or any part of the Services or terminate your account with or without prior notice if you engage in any conduct that Epigram determines, in its sole discretion, violates these Terms.
            </p>
            <p>
              All fees paid in connection with any Services are non-refundable, and Epigram will not prorate any fees paid for a subscription terminated before the end of its term.
            </p>
          </Section>

          <p style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid rgb(240,238,230)" }}>
            If you need to contact us, email us at{" "}
            <a href="mailto:info@epi-gram.app" style={{ color: "#a16207" }}>info@epi-gram.app</a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgb(240,238,230)", padding: "24px 10%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "13px", color: "#9b9b93", textDecoration: "none" }}>← Back to home</Link>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="/terms" style={{ fontSize: "13px", color: "#141310", textDecoration: "none" }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: "13px", color: "#4A5B78", textDecoration: "none" }}>Privacy</Link>
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
