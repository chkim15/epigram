"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

// Import Inter font
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

function DemoSlider() {
  return (
    <div className="relative">
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-3xl border-2 transition-transform duration-300 hover:scale-105" style={{ borderColor: '#a16207' }}>
        <Image
          src="/demo_image/demo_practice.png"
          alt="Practice mode with problem solving"
          width={1600}
          height={1000}
          className="w-full h-auto"
          priority
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [pricingPeriod, setPricingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const pricingData = {
    weekly: { free: 0, pro: 4.99 },
    monthly: { free: 0, pro: 14.99 },
    yearly: { free: 0, pro: 99.99 }
  };

  return (
    <div className={`min-h-screen ${inter.className}`} style={{ backgroundColor: '#faf9f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#faf9f5]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo and Nav Links */}
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <Image src="/epigram_logo.svg" alt="Epigram Logo" width={32} height={32} />
                <h1 className="font-bold text-xl text-black">Epigram</h1>
              </div>

              <nav className="flex items-center gap-8">
                <Link href="/" className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>
                  Home
                </Link>
                <Link href="/mission" className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>
                  Our Mission
                </Link>
                <Link href="#pricing" className="text-black hover:opacity-70 cursor-pointer" style={{ fontSize: '14px' }}>
                  Pricing
                </Link>
              </nav>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <button className="px-4 py-2 hover:opacity-70 cursor-pointer" style={{ fontSize: '14px', color: '#141310' }}>
                  Sign In
                </button>
              </Link>
              <Link href="/app">
                <button className="px-4 py-2.5 text-base font-medium text-white rounded-xl cursor-pointer" style={{ backgroundColor: '#a16207' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}>
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl font-bold leading-tight text-black mb-6">
              Active Learning, Smarter Practice,<br />Higher Grades
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              We don&apos;t just give answers. We guide you with personalized practice, active learning, and tutoring support that make math studying efficient and impactful.
            </p>
            <div className="flex justify-center">
              <Link href="/app">
                <button className="px-4 py-2.5 text-base font-medium text-white rounded-xl cursor-pointer" style={{ backgroundColor: '#a16207' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}>
                  Get Started
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Demo Problem Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-32"
          >
            <DemoSlider />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-12 py-20">
        <div className="mx-auto max-w-6xl">
          {/* Main Heading */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-black mb-4">
              Learn Math by Doing, Not Watching AI do it
            </h2>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left: Demo Image - Takes up 3 columns */}
            <div className="lg:col-span-3 relative overflow-hidden rounded-3xl border-2 transition-transform duration-300 hover:scale-105" style={{ borderColor: '#a16207' }}>
              <Image
                src="/demo_image/demo_tutor.png"
                alt="AI tutor providing step-by-step guidance"
                width={1200}
                height={900}
                className="w-full h-auto"
              />
            </div>

            {/* Right: Feature List - Takes up 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  AI Tutor That Guides, Not Solves
                </h3>
                <p className="text-gray-600">
                  Get strategic hints and guiding questions that help you work through problems yourself.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  Hundreds of Expert-Verified Problems
                </h3>
                <p className="text-gray-600">
                  Practice with high-quality problems from real university exams, carefully curated and verified by math experts.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  Multiple Solution Paths
                </h3>
                <p className="text-gray-600">
                  Explore different approaches to solving problems, learning how concepts connect and developing flexible problem-solving skills.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  Built to Make You Stronger
                </h3>
                <p className="text-gray-600">
                  Our active learning approach ensures you develop independence and confidence, not reliance on AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {/* Pricing Header */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-black mb-8">
              Pricing Plans
            </h2>

            {/* Pricing Toggle */}
            <div className="inline-flex items-center p-1 bg-gray-100 rounded-full">
              <button
                onClick={() => setPricingPeriod('weekly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  pricingPeriod === 'weekly'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  pricingPeriod === 'monthly'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingPeriod('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  pricingPeriod === 'yearly'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-xl p-8 border border-[rgb(240,238,230)] flex flex-col">
              <h3 className="text-3xl font-bold text-black mb-3">Free</h3>
              <p className="text-gray-600 mb-6">
                Perfect for students getting started with guided learning
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-black">
                  $0
                </span>
                <span className="text-gray-600">/{pricingPeriod === 'yearly' ? 'year' : pricingPeriod === 'monthly' ? 'mo' : 'week'}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Access to core problem sets</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Basic AI tutoring assistance</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Progress tracking dashboard</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>

              <Link href="/app">
                <button className="w-full py-3 px-6 border border-black text-black rounded-xl font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-xl p-8 border-2 flex flex-col" style={{ borderColor: '#a16207' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-3xl font-bold text-black">Pro</h3>
                <span className="text-white px-4 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#a16207' }}>
                  Most Popular
                </span>
              </div>
              <p className="text-gray-600 mb-6">
                For serious students who want comprehensive learning
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-black">
                  ${pricingData[pricingPeriod].pro}
                </span>
                <span className="text-gray-600">/{pricingPeriod === 'yearly' ? 'year' : pricingPeriod === 'monthly' ? 'mo' : 'week'}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Everything in Free, plus:</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited problem sets</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Advanced AI tutoring with step-by-step solutions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Practice exams and assessments</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>

              <Link href="/app">
                <button className="w-full py-3 px-6 text-white rounded-xl font-medium transition-colors cursor-pointer" style={{ backgroundColor: '#a16207' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}>
                  Select Plan
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-black mb-4">FAQ</h2>
            <p className="text-lg text-gray-600">
              Learn why Epigram works for serious math students like you.
            </p>
          </div>

          <div className="space-y-0 max-w-3xl mx-auto">
            {/* Question 1 */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center cursor-pointer py-6 hover:bg-white/30 transition-colors" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <span className="text-gray-400 text-2xl mr-4 group-open:rotate-45 transition-transform inline-block">+</span>
                <span className="text-lg font-medium text-black">
                  How is Epigram different from other AI tutoring platforms?
                </span>
              </summary>
              <div className="pb-6 ml-11 text-gray-600" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <p className="pt-4">
                  Unlike typical AI tutors that simply give answers, Epigram is built around <strong>active learning</strong>. We guide you with hints and key questions so you solve problems step by step, strengthening your problem-solving skills. This approach is widely adopted in top universities like Penn and Harvard.
                </p>
                <p className="pt-3">
                  We also provide our own <strong>concise handouts</strong> explaining core concepts and techniques, plus a <strong>proprietary database</strong> of high-quality, <strong>human-verified problems</strong> with carefully labeled difficulty and methods. Our recommendation system personalizes practice so you learn efficiently.
                </p>
              </div>
            </details>

            {/* Question 2 */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center cursor-pointer py-6 hover:bg-white/30 transition-colors" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <span className="text-gray-400 text-2xl mr-4 group-open:rotate-45 transition-transform inline-block">+</span>
                <span className="text-lg font-medium text-black">
                  How will Epigram help me?
                </span>
              </summary>
              <div className="pb-6 ml-11 text-gray-600" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <p className="pt-4">Epigram complements classroom learning by:</p>
                <ul className="mt-3 space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Answering your lecture or homework questions with guidance, not just solutions.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Providing practice sessions that help you improve your performance on standardized tests such as <strong>AP tests, university exams, and math competitions</strong>. Within our practice session, we also:</span>
                  </li>
                  <ul className="mt-2 space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="mr-2">◦</span>
                      <span>Pair <strong>handouts and problems side-by-side</strong> for quick reference.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">◦</span>
                      <span>Offer multiple solution approaches so you see connections between concepts.</span>
                    </li>
                  </ul>
                </ul>
              </div>
            </details>

            {/* Question 3 */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center cursor-pointer py-6 hover:bg-white/30 transition-colors" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <span className="text-gray-400 text-2xl mr-4 group-open:rotate-45 transition-transform inline-block">+</span>
                <span className="text-lg font-medium text-black">
                  What topics are covered?
                </span>
              </summary>
              <div className="pb-6 ml-11 text-gray-600" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <p className="pt-4">
                  Currently, Epigram covers <strong>first-year university Calculus (AP AB/BC)</strong>. We&apos;re actively expanding to include other common <strong>college-level math courses and high school competitions</strong>.
                </p>
              </div>
            </details>

            {/* Question 4 */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center cursor-pointer py-6 hover:bg-white/30 transition-colors" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <span className="text-gray-400 text-2xl mr-4 group-open:rotate-45 transition-transform inline-block">+</span>
                <span className="text-lg font-medium text-black">
                  How should I choose difficulty levels in practice?
                </span>
              </summary>
              <div className="pb-6 ml-11 text-gray-600" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <p className="pt-4">It depends on your goal. We suggest the following distributions, but feel free to adjust to your needs.</p>
                <ul className="mt-3 space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>AP & University Exams:</strong> 20% easy, 70% medium, 10% hard.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>GRE Math Subject Test:</strong> 10% easy, 60% medium, 20% hard, 10% very hard.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Math Competitions:</strong> 20% medium, 30% hard, 50% very hard.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Quant/DS Interviews:</strong> 50% medium, 50% hard.</span>
                  </li>
                </ul>
              </div>
            </details>

            {/* Question 5 */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center cursor-pointer py-6 hover:bg-white/30 transition-colors" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <span className="text-gray-400 text-2xl mr-4 group-open:rotate-45 transition-transform inline-block">+</span>
                <span className="text-lg font-medium text-black">
                  Can I cancel anytime?
                </span>
              </summary>
              <div className="pb-6 ml-11 text-gray-600" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <p className="pt-4">
                  Yes. You can cancel anytime and retain access until the end of your subscription.
                </p>
              </div>
            </details>

            {/* Question 6 */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center cursor-pointer py-6 hover:bg-white/30 transition-colors" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <span className="text-gray-400 text-2xl mr-4 group-open:rotate-45 transition-transform inline-block">+</span>
                <span className="text-lg font-medium text-black">
                  How does Epigram protect my data?
                </span>
              </summary>
              <div className="pb-6 ml-11 text-gray-600" style={{ paddingLeft: '65px', paddingRight: '65px' }}>
                <p className="pt-4">
                  Your data is safe. We don&apos;t use your inputs to train models, and we never share your information with third parties, universities, or tech companies.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white rounded-xl p-16 text-center border border-[rgb(240,238,230)]">
            <h2 className="text-4xl font-bold text-black mb-6">
              Start Your Journey to Higher Grades Today
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join students who practice with purpose and see results.
            </p>
            <Link href="/app">
              <button className="px-4 py-2.5 text-base font-medium text-white rounded-xl cursor-pointer" style={{ backgroundColor: '#a16207' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/epigram_logo.svg" alt="Epigram Logo" width={24} height={24} />
              <span className="font-bold text-lg text-black">Epigram</span>
            </div>
            <p className="text-gray-600 text-sm">
              Epigram. All rights reserved. © 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}