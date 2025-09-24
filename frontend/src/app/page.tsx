"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function LandingPage() {
  const [pricingPeriod, setPricingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const pricingData = {
    weekly: { free: 0, pro: 4.99 },
    monthly: { free: 0, pro: 14.99 },
    yearly: { free: 0, pro: 99.99 }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F3' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full" style={{ backgroundColor: '#FAF8F3' }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo and Nav Links */}
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <Image src="/epigram_logo.svg" alt="Epigram Logo" width={32} height={32} />
                <h1 className="font-bold text-xl text-black">Epigram</h1>
              </div>

              <nav className="flex items-center gap-8">
                <Link href="/" className="text-sm text-black hover:opacity-70 cursor-pointer">
                  Home
                </Link>
                <Link href="/mission" className="text-sm text-black hover:opacity-70 cursor-pointer">
                  Our Mission
                </Link>
                <Link href="#" className="text-sm text-black hover:opacity-70 cursor-pointer">
                  Pricing
                </Link>
              </nav>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/signin">
                <button className="px-4 py-2 text-sm text-black hover:opacity-70">
                  Sign In
                </button>
              </Link>
              <Link href="/app">
                <button className="px-4 py-2.5 text-base font-medium text-white bg-black rounded-xl hover:bg-gray-800">
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
              Active Learning. Smarter Practice<br />Higher Grades
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              We don't just give answers. We guide you with personalized practice, active learning, and tutoring support that make math studying efficient and impactful.
            </p>
            <div className="flex justify-center">
              <Link href="/app">
                <button className="px-4 py-2.5 text-base font-medium text-white bg-black rounded-xl hover:bg-gray-800">
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
            <img
              src="/demo.png"
              alt="Example calculus problem with AI-powered solution"
              className="w-full h-auto rounded-3xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Main Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              Transform Your Learning Experience
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover innovative ways to master complex concepts through interactive practice and personalized guidance.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Card 1 - Understand What AI is Saying */}
            <div className="bg-white rounded-3xl p-8 shadow-sm transition-transform duration-300 hover:scale-105">
              {/* Dashboard Mockup Placeholder */}
              <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center">
                <span className="text-gray-400">Dashboard Preview 1</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Advanced Problem Solving
              </h3>
              <p className="text-gray-600">
                Tackle challenging problems with step-by-step guidance and instant feedback to build deep understanding.
              </p>
            </div>

            {/* Card 2 - Track AI Visibility */}
            <div className="bg-white rounded-3xl p-8 shadow-sm transition-transform duration-300 hover:scale-105">
              {/* Dashboard Mockup Placeholder */}
              <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center">
                <span className="text-gray-400">Dashboard Preview 2</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Progress Tracking
              </h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed analytics and performance insights across all topics.
              </p>
            </div>

            {/* Card 3 - Boost Product Visibility */}
            <div className="bg-white rounded-3xl p-8 shadow-sm transition-transform duration-300 hover:scale-105">
              {/* Dashboard Mockup Placeholder */}
              <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center">
                <span className="text-gray-400">Dashboard Preview 3</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Personalized Learning
              </h3>
              <p className="text-gray-600">
                Experience adaptive content that adjusts to your pace and learning style for optimal results.
              </p>
            </div>
          </div>

          {/* Bottom Row - Two Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Find Sources Referenced by AI */}
            <div className="bg-white rounded-3xl p-8 shadow-sm transition-transform duration-300 hover:scale-105">
              {/* Content Placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 mb-6 flex items-center justify-center">
                <span className="text-gray-400">Dashboard Preview 4</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Comprehensive Resources
              </h3>
              <p className="text-gray-600">
                Access a vast library of practice problems, solutions, and study materials all in one place.
              </p>
            </div>

            {/* Compare Competitors */}
            <div className="bg-white rounded-3xl p-8 shadow-sm transition-transform duration-300 hover:scale-105">
              {/* Content Placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 mb-6 flex items-center justify-center">
                <span className="text-gray-400">Dashboard Preview 5</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Collaborative Learning
              </h3>
              <p className="text-gray-600">
                Connect with peers, share insights, and learn together in a supportive community environment.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section className="px-6 py-20">
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
            <div className="bg-white rounded-3xl p-8 border border-gray-200 flex flex-col">
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
            <div className="bg-white rounded-3xl p-8 border-2 border-black flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-3xl font-bold text-black">Pro</h3>
                <span className="bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
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
                <button className="w-full py-3 px-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors cursor-pointer">
                  Select Plan
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}