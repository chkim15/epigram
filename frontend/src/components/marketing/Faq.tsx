"use client";

import React, { useState } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/schema";

export type FaqItem = {
  q: string;
  a: string;
};

/**
 * Marketing FAQ accordion with embedded FAQPage JSON-LD for AEO.
 *
 * Visual design matches the existing landing-page FAQ exactly — extracted
 * from frontend/src/app/page.tsx without style changes. The schema emit
 * is the only behavioural addition.
 */
export function Faq({
  items,
  title = "FAQ",
  eyebrow = "Common Questions",
}: {
  items: FaqItem[];
  title?: string;
  eyebrow?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20" style={{ background: "#e9e6dc" }}>
      <JsonLd data={faqPageSchema(items)} />
      <div className="mx-auto max-w-4xl px-8">
        <p
          style={{
            color: "#a16207",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: "clamp(22px, 2.8vw, 38px)",
            fontWeight: 700,
            color: "#141310",
            lineHeight: 1.15,
            letterSpacing: "-1px",
            marginBottom: "48px",
          }}
        >
          {title}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgb(220,218,210)",
                borderRadius: "12px",
                background: "#faf9f5",
                cursor: "pointer",
              }}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div
                className="flex items-center justify-between"
                style={{ padding: "20px 24px" }}
              >
                <span style={{ fontSize: "15px", color: "#141310", fontWeight: 500 }}>
                  {item.q}
                </span>
                <span
                  style={{
                    color: "#9b9b93",
                    fontSize: "20px",
                    marginLeft: "16px",
                    flexShrink: 0,
                  }}
                >
                  {openIndex === i ? "−" : "+"}
                </span>
              </div>
              {openIndex === i && (
                <div
                  style={{
                    padding: "0 24px 20px",
                    fontSize: "14px",
                    color: "#4a4a42",
                    lineHeight: 1.7,
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
