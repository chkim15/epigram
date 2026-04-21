"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

import { Playfair_Display, DM_Sans } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });

const faqs = [
  {
    q: "How is this different from the Green Book or Heard on the Street?",
    a: "Three things. First, our problems come from real, recent interviews — updated every 2–3 days, not fixed in a book from 2008. Second, the curriculum is structured and self-contained: no wading through irrelevant material, just a targeted path from foundations to firm-ready. Third, we incorporate learner feedback continuously — the platform improves as you use it.",
  },
  {
    q: "What are the prerequisites?",
    a: "Undergraduate probability, statistics, and basic algorithms are helpful but not required. If you haven't taken these courses yet, the 4-Week Intensive is designed to be self-contained — you learn by doing, starting from the fundamentals and building up progressively.",
  },
  {
    q: "Is this only for quant finance roles?",
    a: "Primarily built for quant trader, researcher, and developer roles — probability, statistics, and coding modules transfer directly to data science and ML interviews. We're also working on dedicated courses for these roles, coming soon.",
  },
  {
    q: "How should I use Epigram most effectively?",
    a: "Block 2–3 hours a day and protect that time. Before checking any solution, attempt the problem as if you're in a real interview — the struggle is where the learning happens. Then study the solution carefully, understand the core technique, and redo it from scratch. Review, redo, repeat.",
  },
  {
    q: "What if I'm confused even after reading the solution?",
    a: "Email us directly and we'll explain personally — every question gets a real response, not a template. Premium users get up to 3 email support a week. For deeper help, 1-on-1 tutoring with the author is available from $49.",
  },
  {
    q: "How often are new problems added?",
    a: "Every 2–3 days. Premium users get priority access the moment new problems go live. Spotted a problem in your own interview? Submit it — accepted problems earn Premium credit and attribution of your choice.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section className="py-20" style={{ background: '#e9e6dc' }}>
      <div className="mx-auto max-w-4xl px-8">
        <p style={{ color: '#a16207', fontSize: '13px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
          Common Questions
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(22px, 2.8vw, 38px)', fontWeight: 700, color: '#141310', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '48px' }}>FAQ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {faqs.map((item, i) => (
            <div
              key={i}
              style={{ border: '1px solid rgb(220,218,210)', borderRadius: '12px', background: '#faf9f5', cursor: 'pointer' }}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center justify-between" style={{ padding: '20px 24px' }}>
                <span style={{ fontSize: '15px', color: '#141310', fontWeight: 500 }}>{item.q}</span>
                <span style={{ color: '#9b9b93', fontSize: '20px', marginLeft: '16px', flexShrink: 0 }}>
                  {openIndex === i ? '−' : '+'}
                </span>
              </div>
              {openIndex === i && (
                <div style={{ padding: '0 24px 20px', fontSize: '14px', color: '#4a4a42', lineHeight: 1.7 }}>
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

export default function LandingPage() {
  return (
    <div className={`min-h-screen overflow-y-auto scroll-smooth ${playfair.variable} ${dmSans.variable}`} style={{ backgroundColor: '#faf9f5', height: '100vh' }}>
      {/* Announcement Bar */}
      <div style={{ background: 'rgba(161,98,7,0.12)', borderBottom: '1px solid rgba(161,98,7,0.4)', padding: '9px 16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <span style={{ background: '#a16207', color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>Launch Offer</span>
        <span style={{ fontSize: '14px', color: '#141310' }}>
          Sign up before <strong>Sep 1</strong>: <strong>50% off any paid plan</strong>
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#faf9f5]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-16">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="#hero" onClick={(e) => {
                e.preventDefault();
                document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth' });
              }} className="flex items-center gap-2 cursor-pointer">
                <Image src="/epigram_logo.svg" alt="Epigram Logo" width={32} height={32} />
                <h1 className="font-bold text-xl text-black">Epigram</h1>
              </Link>
              <nav className="flex items-center gap-8">
                <Link href="#curriculum" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#curriculum')?.scrollIntoView({ behavior: 'smooth' });
                }} className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>Curriculum</Link>
                <Link href="#features" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                }} className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>Features</Link>
                <Link href="#pricing" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                }} className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>Pricing</Link>
                <Link href="#tutoring" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#tutoring')?.scrollIntoView({ behavior: 'smooth' });
                }} className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>Tutoring</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <button className="px-4 py-2 hover:opacity-70 cursor-pointer rounded-xl" style={{ fontSize: '14px', color: '#141310', border: '1px solid rgb(220,218,210)' }}>Sign In</button>
              </Link>
              <Link href="/problems">
                <button className="px-4 py-2.5 text-sm font-medium text-white rounded-xl cursor-pointer" style={{ backgroundColor: '#a16207' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}>
                  Start Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        style={{
          minHeight: '80vh',
          background: '#faf9f5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '30px 16% 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-playfair, Playfair Display, serif)',
            fontSize: 'clamp(30px, 4vw, 56px)',
            fontWeight: 700,
            color: '#141310',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            maxWidth: '740px',
            marginBottom: '28px',
          }}
        >
          Fewer, harder problems.<br />
          <em style={{ color: '#a16207', fontStyle: 'italic' }}>The ones top funds<br />actually ask.</em>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ color: '#4A5B78', fontSize: '16px', lineHeight: 1.7, marginBottom: '48px', maxWidth: '740px' }}
        >
          The prep books are outdated. The forums are unverified. Epigram is built for one thing: the exact problems top funds actually ask, at the difficulty they actually ask them.
        </motion.p>

        {/* Created by */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}
        >
          <span style={{ fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9b9b93', fontWeight: 500 }}>
            Created by
          </span>
          <span style={{ fontSize: '13px', color: '#4A5B78' }}>
            Math PhD &amp; former Wharton lecturer
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Link href="/problems">
            <button
              className="cursor-pointer"
              style={{ background: '#a16207', color: '#fff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 500, border: 'none', letterSpacing: '0.2px', transition: 'background 0.2s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#8b5006'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#a16207'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start Free →
            </button>
          </Link>
          <Link href="/problems">
            <button
              className="cursor-pointer"
              style={{ color: '#141310', padding: '14px 28px', fontSize: '15px', background: 'transparent', border: '1px solid rgba(20,19,16,0.25)', borderRadius: '8px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#141310'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(20,19,16,0.25)'; }}
            >
              Browse all problems
            </button>
          </Link>
        </motion.div>

        {/* No credit card note */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          style={{ fontSize: '13px', color: '#9b9b93', marginTop: '14px' }}
        >
          No credit card required. Free account unlocks problems + two cheatsheets instantly.
        </motion.p>

      </section>

      {/* Firms Bar */}
      <div style={{ background: '#e9e6dc', padding: '20px 16%', borderBottom: '1px solid rgb(220,218,210)', borderTop: '1px solid rgb(220,218,210)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'nowrap' }}>
          <span style={{ fontSize: '9px', color: '#9b9b93', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>
            Problems sourced from
          </span>
          {[
            { name: 'Citadel', file: 'citadel.svg' },
            { name: 'Jane Street', file: 'jane-street.svg' },
            { name: 'Two Sigma', file: 'two-sigma.svg' },
            { name: 'D.E. Shaw', file: 'de-shaw.svg' },
            { name: 'Optiver', file: 'optiver.svg' },
            { name: 'Hudson River Trading', file: 'hrt.svg', filter: 'opacity(0.6)' },
            { name: 'Jump Trading', file: 'jump-trading.svg' },
            { name: 'IMC Trading', file: 'imc.svg' },
          ].map(({ name, file, filter }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={file}
              src={`/company_logo/${file}`}
              alt={name}
              style={{ height: '24px', maxWidth: '100px', width: 'auto', filter: filter ?? 'brightness(0) opacity(0.45)', objectFit: 'contain', flexShrink: 0 }}
            />
          ))}
          <span style={{ fontSize: '12px', color: '#9b9b93', fontWeight: 500, flexShrink: 0 }}>+ more</span>
        </div>
      </div>

      {/* Founder Story Section */}
      <section style={{ background: '#faf9f5', padding: '100px 16%' }}>
        <div style={{ maxWidth: '800px' }}>
          <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '24px' }}>From the founder</p>
          {/* Avatar + quote */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(161,98,7,0.1)', border: '2px solid rgba(161,98,7,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-playfair, serif)', fontSize: '24px', fontWeight: 700, color: '#a16207' }}>
              J
            </div>
            <blockquote style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(16px, 1.8vw, 22px)', fontStyle: 'italic', color: '#141310', lineHeight: 1.55, margin: 0 }}>
              &ldquo;I was preparing for top quant fund interviews. I had the mathematical background. I read the books everyone reads. And they felt like practice for a different exam. Too easy. Too broad. No way to tell which problems actually mattered. I spent hours on material that wasn&apos;t going to appear in the room — and I couldn&apos;t shake the feeling that my prep wasn&apos;t mapping to what I was about to face. I built Epigram because that resource shouldn&apos;t be this hard to find.<span style={{ color: '#a16207' }}>&rdquo;</span>
            </blockquote>
          </div>
          {/* Attribution */}
          <p style={{ fontSize: '14px', color: '#4A5B78', lineHeight: 1.6, paddingLeft: '96px' }}>
            Founder{' · '}Math PhD from Penn{' · '}Former Wharton lecturer in stochastic processes
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section style={{ padding: '100px 16%', background: '#e9e6dc' }}>
        {/* Eyebrow */}
        <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '20px' }}>
          The problem with current resources
        </p>

        {/* Heading */}
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(26px, 3.5vw, 46px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1px', color: '#141310', marginBottom: '20px', maxWidth: '700px' }}>
          Every other resource was built for a different exam.
        </h2>

        {/* Subtext */}
        <p style={{ fontSize: '17px', color: '#6b7280', lineHeight: 1.7, marginBottom: '56px', maxWidth: '560px' }}>
          The quant interview has evolved. The prep landscape hasn&apos;t. What&apos;s out there is scattered, outdated, or built for the wrong problem type entirely.
        </p>

        {/* 2×2 Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            {
              source: 'Heard on the Street',
              verdict: '"Too many questions. No emphasis on what actually matters."',
              body: '500+ problems with no signal for what to prioritize. You can finish it and still not know which topics firms weight most heavily.',
            },
            {
              source: 'The Green Book (2008)',
              verdict: '"Answers scattered. Not self-contained. Calibrated too low."',
              body: 'Written for solid undergrad math — not for what Citadel puts in front of you. The problems that matter aren\'t in this book.',
            },
            {
              source: 'Glassdoor & forums',
              verdict: 'Real questions exist somewhere. Finding them doesn\'t help you.',
              body: 'Scattered across thousands of threads with no explanation of what the interviewer was testing. Fragments, not a curriculum.',
            },
            {
              source: 'AI-generated explanations',
              verdict: 'Wrong answers, delivered with total confidence.',
              body: 'ChatGPT and similar tools frequently produce incorrect solutions to hard quant problems. You won\'t know the difference until you\'re in the room. Every Epigram solution is human-verified by a Math PhD.',
            },
          ].map(({ source, verdict, body }) => (
            <div key={source} style={{ background: '#faf9f5', border: '1px solid rgb(220,218,210)', borderRadius: '16px', padding: '32px' }}>
              <p style={{ fontSize: '12px', color: '#C03030', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700 }}>✕</span> {source}
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#141310', lineHeight: 1.35, marginBottom: '14px' }}>{verdict}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.65 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Four-Week Intensive Section */}
      <section id="curriculum" style={{ background: '#faf9f5', padding: '80px 16%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Left */}
          <div>
            <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '20px' }}>
              Our Flagship Product
            </p>

            <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(26px, 3.5vw, 46px)', fontWeight: 700, color: '#141310', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '24px' }}>
              One month from now, you could walk into any quant interview ready.
            </h2>

            <p style={{ fontSize: '17px', color: '#4A5B78', lineHeight: 1.75, marginBottom: '16px' }}>
              Most candidates walk into a quant interview hoping the right problems come up. You won&apos;t need to hope.
            </p>
            <p style={{ fontSize: '17px', color: '#4A5B78', lineHeight: 1.75, marginBottom: '16px' }}>
              The Four-Week Intensive takes you through every topic top firms test — probability, stochastics, statistics, game theory, etc. — and deeper into the firm-specific problems the standard books never reach. Coding woven throughout, the way quant interviews actually work: math and code tested together, not siloed.
            </p>
            <p style={{ fontSize: '17px', color: '#4A5B78', lineHeight: 1.75, marginBottom: '40px' }}>
              29 topics. ~180 curated problems. Four weeks from where you are now to ready.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#a16207', background: 'rgba(161,98,7,0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(161,98,7,0.25)' }}>
                Included in Premium
              </p>
              <Link href="/curriculum">
                <button
                  className="cursor-pointer"
                  style={{ background: 'transparent', color: '#a16207', border: '1px solid #a16207', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(161,98,7,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  View full curriculum →
                </button>
              </Link>
            </div>
          </div>

          {/* Right — Week timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              {
                week: 'W1', label: 'WEEK 01 — PROBABILITY',
                title: 'Foundations through Distributions',
                topics: 'Foundations of Probability Modeling · Conditional Probability · Distributions · Gaussian Distribution · Expectation & Variance · Covariance & Correlation',
              },
              {
                week: 'W2', label: 'WEEK 02 — STOCHASTIC PROCESSES + CODING',
                title: 'Markov Chains, Random Walks & DP',
                topics: 'Markov chains · Martingales & random walks · Dynamic programming (I & II) · Backtracking · Data structures',
              },
              {
                week: 'W3', label: 'WEEK 03 — STATISTICS + CODING',
                title: 'Inference, Regression & Simulation',
                topics: 'CLT & Law of Large Numbers · Hypothesis Testing · Linear Regression I & II · Time Series Basics · Monte Carlo Methods · Stack & Queue · BFS & DFS',
              },
              {
                week: 'W4', label: 'WEEK 04 — GAME THEORY, BRAINTEASERS + CODING',
                title: 'Strategy, Mental Math & Mock Interviews',
                topics: 'Nash Equilibrium · Bayesian Games · Number Theory & Mental Math · Brain Teasers · Options Pricing & Black-Scholes · Sorting Algorithms · Searching Algorithms',
              },
            ].map(({ week, label, title, topics }, i, arr) => (
              <div key={week} style={{ display: 'flex', gap: '20px' }}>
                {/* Timeline spine */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(161,98,7,0.12)', border: '1px solid rgba(161,98,7,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#a16207', flexShrink: 0 }}>
                    {week}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: '1px', flexGrow: 1, background: 'rgba(161,98,7,0.2)', margin: '6px 0' }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: i < arr.length - 1 ? '32px' : '0' }}>
                  <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#a16207', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
                  <p style={{ fontSize: '17px', fontWeight: 700, color: '#141310', marginBottom: '8px', lineHeight: 1.3 }}>{title}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.65 }}>{topics}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* What's Inside Section */}
      <section id="features" style={{ background: '#e9e6dc', padding: '100px 16%' }}>
        <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '20px' }}>
          What&apos;s Inside
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(26px, 3.5vw, 46px)', fontWeight: 700, color: '#141310', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '20px' }}>
          Curated to what top funds test.<br />
          <em style={{ color: '#a16207' }}>Nothing more. Nothing less.</em>
        </h2>
        <p style={{ fontSize: '17px', color: '#6b7280', lineHeight: 1.7, marginBottom: '56px', maxWidth: '720px' }}>
          The ones that appear in top fund interviews, at the difficulty they appear at, in the sequence that builds the right <span style={{ whiteSpace: 'nowrap' }}>mental models.</span>
        </p>

        <div style={{ border: '1px solid rgb(220,218,210)', borderRadius: '16px', overflow: 'hidden' }}>
          {[
            {
              num: '01',
              title: 'Real problems, rigorously organized',
              body: 'Actual quant interview questions from 15+ top firms — exclusive, not on Glassdoor or Reddit — organized across 29 of the most frequently-tested topics.',
              tags: ['UP-TO-DATE', 'REAL INTERVIEW QUESTIONS', 'ALL KEY TECHNIQUES COVERED'],
              badge: null,
            },
            {
              num: '02',
              title: 'Solution depth that actually teaches',
              body: 'Every human-verified solution is a full walkthrough with multiple approaches and the exact intuition interviewers look for.',
              tags: ['FULL WALKTHROUGHS', 'MULTIPLE SOLUTION PATHS', 'VERIFIED BY EXPERTS'],
              badge: null,
            },
            {
              num: '03',
              title: 'Practice under real conditions',
              body: 'Timed 30-minute sessions with real interview difficulty and an immediate full debrief — tracking your progress and exposing the gaps that only show up under real conditions.',
              tags: ['TIMED', 'REAL INTERVIEW DIFFICULTY', 'INSTANT FEEDBACK'],
              badge: null,
            },
          ].map(({ num, title, body, tags, badge }, i, arr) => (
            <div key={num} style={{ padding: '40px 48px', borderBottom: i < arr.length - 1 ? '1px solid rgb(220,218,210)' : 'none', background: '#faf9f5' }}>
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: '32px', fontWeight: 700, color: 'rgba(161,98,7,0.25)', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{num}</span>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#141310', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {title}
                    {badge && (
                      <span style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(161,98,7,0.12)', color: '#a16207', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                        {badge}
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.7, marginBottom: '20px' }}>{body}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                      <span key={tag} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: '#a16207', border: '1px solid rgba(161,98,7,0.3)', padding: '4px 10px', borderRadius: '6px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free Starter Kit Section */}
      <section style={{ background: '#faf9f5', padding: '100px 16%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'flex-end' }}>

          {/* Left */}
          <div>
            <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '16px' }}>
              Free Starter Kit
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(24px, 3vw, 42px)', fontWeight: 700, color: '#141310', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '20px' }}>
              Your free starter kit.<br />Unlocked on <span style={{ whiteSpace: 'nowrap' }}>sign-up.</span>
            </h2>
            <p style={{ fontSize: '16px', color: '#4A5B78', lineHeight: 1.75, marginBottom: '32px' }}>
              Create a free account and instantly unlock two interview cheatsheets — written by the founder.
            </p>

            {/* Cheatsheet cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  icon: 'Σ',
                  title: 'Quant Interview Cheatsheet',
                  desc: 'Probability · Stochastic Processes · Statistics · Game Theory · Options & Black-Scholes · Portfolio Theory. Every formula interviewers expect you to know cold, with key insights on when to use each.',
                },
                {
                  icon: '</>',
                  title: 'Coding Patterns Cheatsheet',
                  desc: '12 essential patterns — Binary Search, BFS/DFS, DP, Backtracking, Union Find, Trie, LRU Cache — each with a Python template, complexity, and a "when to use" heuristic.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: '#faf9f5', border: '1px solid rgb(240,238,230)', borderRadius: '12px', padding: '20px 22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '9px', background: '#141310', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, flexShrink: 0, fontFamily: 'monospace' }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#141310', marginBottom: '5px' }}>{title}</p>
                    <p style={{ fontSize: '13px', color: '#4A5B78', lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — cheatsheet preview */}
          <div style={{ background: '#faf9f5', borderRadius: '14px', border: '1px solid rgb(220,218,210)', boxShadow: '0 32px 64px rgba(20,19,16,0.1)', overflow: 'hidden' }}>
            {/* Browser chrome */}
            <div style={{ background: '#e9e6dc', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgb(220,218,210)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(20,19,16,0.15)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(20,19,16,0.15)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(20,19,16,0.15)' }} />
              <span style={{ fontSize: '11px', color: '#9b9b93', marginLeft: '8px', fontFamily: 'monospace' }}>Quant_Interview_Cheatsheet.pdf</span>
            </div>

            {/* Cheatsheet image with blur overlay */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <Image
                src="/demo_image/cheatsheet.png"
                alt="Quant Interview Cheatsheet preview"
                width={800}
                height={900}
                className="w-full h-auto"
                style={{ display: 'block', maxHeight: '480px', objectFit: 'cover', objectPosition: 'top' }}
              />
              {/* Blur overlay */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.97) 55%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '24px' }}>
                <Link href="/auth/signup">
                  <button
                    className="cursor-pointer"
                    style={{ background: '#141310', color: '#fff', padding: '12px 24px', borderRadius: '24px', fontSize: '13px', fontWeight: 500, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(20,19,16,0.2)', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a2520')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#141310')}
                  >
                    🔒 Sign up free to unlock two cheatsheets
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ background: '#e9e6dc', padding: '100px 16%' }}>
        <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '16px' }}>Pricing</p>
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(24px, 3vw, 42px)', fontWeight: 700, color: '#141310', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '48px' }}>
          Start free.<br />Go deeper when you&apos;re ready.
        </h2>

        {/* Launch offer banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '2px solid rgba(161,98,7,0.4)', borderRadius: '10px', padding: '14px 20px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, color: '#a16207', flexShrink: 0 }}>Launch offer</span>
          <span style={{ fontSize: '14px', color: '#141310' }}>Sign up before <span style={{ fontWeight: 700, color: '#a16207' }}>Sep 1</span> for <strong>50% off</strong> any paid plan — locked in for your entire committed period.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch' }}>

          {/* Free */}
          <div style={{ background: '#ffffff', border: '1px solid rgb(240,238,230)', borderRadius: '14px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: '#9b9b93', marginBottom: '8px' }}>Free Account</p>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '48px', fontWeight: 700, color: '#141310', lineHeight: 1 }}>$0</span>
            </div>
            <p style={{ fontSize: '12px', color: '#9b9b93', marginBottom: '4px' }}>No credit card required</p>
            <p style={{ fontSize: '11px', color: 'transparent', marginBottom: '24px', userSelect: 'none' }}>* Limited time launch offer</p>
            <div style={{ flex: 1 }}>
              {['Access to first topics of The 4-Week Intensive curriculum', 'Two interview cheatsheets', 'Core free-tier problems'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid rgb(240,238,230)', fontSize: '14px', color: '#4A5B78' }}>
                  <span style={{ color: '#2A6048', fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <Link href="/auth/signup" style={{ display: 'block', marginTop: '28px' }}>
              <button className="cursor-pointer" style={{ width: '100%', padding: '13px', borderRadius: '8px', border: '1px solid rgb(220,218,210)', background: 'transparent', color: '#141310', fontSize: '14px', fontWeight: 500, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#141310')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgb(220,218,210)')}
              >Create free account →</button>
            </Link>
          </div>

          {/* 1-month Premium */}
          <div style={{ background: '#ffffff', border: '1px solid rgb(240,238,230)', borderRadius: '14px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '8px' }}>Premium</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '32px', fontWeight: 500, color: '#9b9b93', lineHeight: 1, textDecoration: 'line-through' }}>$39</span>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '48px', fontWeight: 700, color: '#141310', lineHeight: 1 }}>$19</span>
              <span style={{ fontSize: '16px', color: '#9b9b93', fontWeight: 400 }}>/mo</span>
            </div>
            <p style={{ fontSize: '12px', color: '#9b9b93', marginBottom: '24px' }}>Billed every month · Cancel anytime</p>
            <div style={{ flex: 1 }}>
              {['Full access to The 4-Week Intensive curriculum', 'Exclusive problems not found online', 'Unlimited mock interviews', 'Company filters', 'Priority access to new premium problems', 'Up to 3 expert email responses per week'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid rgb(240,238,230)', fontSize: '14px', color: '#4A5B78' }}>
                  <span style={{ color: '#a16207', fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '28px', background: 'rgba(161,98,7,0.07)', border: '1px solid rgba(161,98,7,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#a16207', marginBottom: 0 }}>Free 30-min intro call included</p>
            </div>
            <Link href="/auth/signup" style={{ display: 'block' }}>
              <button className="cursor-pointer" style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: '#a16207', color: '#fff', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#8b5006')}
                onMouseLeave={e => (e.currentTarget.style.background = '#a16207')}
              >Start Premium →</button>
            </Link>
          </div>

          {/* 6-month Premium — Recommended */}
          <div style={{ position: 'relative', background: '#ffffff', border: '2px solid #a16207', borderRadius: '14px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            {/* Badge */}
            <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#a16207', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              Recommended
            </div>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '8px' }}>Premium · 6 months</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '32px', fontWeight: 500, color: '#9b9b93', lineHeight: 1, textDecoration: 'line-through' }}>$179</span>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '48px', fontWeight: 700, color: '#141310', lineHeight: 1 }}>$89</span>
              <span style={{ fontSize: '16px', color: '#9b9b93', fontWeight: 400 }}>/6 mo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '14px', fontWeight: 600, color: '#a16207' }}>$14.92/mo</span>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', background: '#a16207', color: '#fff', borderRadius: '4px', padding: '2px 6px' }}>Save 22%</span>
            </div>
            <p style={{ fontSize: '12px', color: '#9b9b93', marginBottom: '24px' }}>Billed every 6 months · Cancel anytime</p>
            <div style={{ flex: 1 }}>
              {['Everything in 1-month Premium', 'Best value for full interview prep cycle', 'Lock in price for 6 months'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid rgb(240,238,230)', fontSize: '14px', color: '#4A5B78' }}>
                  <span style={{ color: '#a16207', fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '28px', background: 'rgba(161,98,7,0.07)', border: '1px solid rgba(161,98,7,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#a16207', marginBottom: 0 }}>Free 30-min intro call included</p>
            </div>
            <Link href="/auth/signup" style={{ display: 'block' }}>
              <button className="cursor-pointer" style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: '#a16207', color: '#fff', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#8b5006')}
                onMouseLeave={e => (e.currentTarget.style.background = '#a16207')}
              >Start 6-Month Premium →</button>
            </Link>
          </div>

        </div>
      </section>

      {/* Tutoring Section */}
      <section id="tutoring" style={{ background: '#faf9f5', padding: '100px 16%' }}>
        <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '16px' }}>1-on-1 Tutoring</p>
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(22px, 2.8vw, 38px)', fontWeight: 700, color: '#141310', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '48px', whiteSpace: 'nowrap' }}>
          Work directly with the author
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center' }}>

          {/* Standard — 60 min */}
          <div style={{ background: '#ffffff', border: '1px solid rgb(240,238,230)', borderRadius: '14px', padding: '40px 32px', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '420px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: '#9b9b93', marginBottom: '8px' }}>60-Min Session</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '48px', fontWeight: 700, color: '#141310', lineHeight: 1 }}>$120</span>
              <span style={{ fontSize: '16px', color: '#9b9b93', fontWeight: 400 }}>/session</span>
            </div>
            <div style={{ flex: 1 }}>
              {['1-on-1 with author (Math PhD, former Wharton lecturer)', 'Pre-session email discussion — tailored to you', 'Flexible scheduling via video call'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid rgb(240,238,230)', fontSize: '14px', color: '#4A5B78' }}>
                  <span style={{ color: '#2A6048', fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <Link href="/tutoring" style={{ display: 'block', marginTop: '96px' }}>
              <button className="cursor-pointer" style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: '#a16207', color: '#fff', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#8b5006')}
                onMouseLeave={e => (e.currentTarget.style.background = '#a16207')}
              >Book a session →</button>
            </Link>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />

      {/* Final CTA Section */}
      <section style={{ background: '#faf9f5', padding: '100px 16%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 500, color: '#a16207', marginBottom: '16px' }}>
            Begin your preparation
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 700, color: '#141310', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '24px' }}>
            Stop hoping the right<br />problems come up.<br />
            <em style={{ color: '#a16207' }}>Start knowing you&apos;re ready.</em>
          </h2>
          <p style={{ fontSize: '17px', color: '#6b7280', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
            Join top candidates preparing with real interview questions, verified solutions, and a targeted curriculum.
          </p>
          <div style={{ marginTop: '40px' }} className="flex items-center justify-center gap-3">
            <Link href="/problems">
              <button
                className="cursor-pointer"
                style={{ backgroundColor: '#a16207', color: '#fff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 500, border: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}
              >
                Start free →
              </button>
            </Link>
            <Link href="/curriculum">
              <button
                className="cursor-pointer"
                style={{ backgroundColor: 'transparent', color: '#141310', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 500, border: '1px solid rgb(220,218,210)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(240,238,230)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                View curriculum
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#e9e6dc', padding: '32px 16% 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '48px' }}>

          {/* Left — logo + tagline */}
          <div style={{ maxWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Image src="/epigram_logo.svg" alt="Epigram Logo" width={24} height={24} />
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#141310' }}>Epigram</span>
            </div>
            <p style={{ fontSize: '13px', color: '#6b6b5f', lineHeight: 1.7 }}>
              Structured quant interview prep.<br />
              Built by a Math PhD &amp; former Wharton lecturer.
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              {([
                { label: 'Discord', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> },
                { label: 'LinkedIn', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { label: 'Instagram', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg> },
                { label: 'TikTok', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
                { label: 'Email', href: '#', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> },
              ] as { label: string; href: string; icon: React.ReactNode }[]).map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgb(220,218,210)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b5f', transition: 'border-color 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#a16207')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgb(220,218,210)')}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right — columns */}
          <div style={{ display: 'flex', gap: '64px' }}>

            {/* Product */}
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#9b9b93', marginBottom: '16px' }}>Product</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Problem Set', href: '/problems' },
                  { label: 'Mock Interview', href: '/mock-interview' },
                  { label: '4-Week Course', href: '/curriculum' },
                  { label: 'Pricing', href: '#pricing' },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} style={{ fontSize: '14px', color: '#6b6b5f' }} className="hover:opacity-70">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#9b9b93', marginBottom: '16px' }}>Company</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Terms', href: '/terms' },
                  { label: 'Privacy', href: '/privacy' },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} style={{ fontSize: '14px', color: '#6b6b5f' }} className="hover:opacity-70">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgb(220,218,210)' }}>
          <p style={{ fontSize: '12px', color: '#9b9b93' }}>© 2026 Epigram. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}