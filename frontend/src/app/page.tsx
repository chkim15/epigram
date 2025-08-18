// TEMPORARY REDIRECT TO APP - Remove this when landing page is ready
import { redirect } from 'next/navigation';

export default function LandingPage() {
  redirect('/app');
}

/* ORIGINAL LANDING PAGE CODE - Uncomment when ready to use

"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Clock, Target, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header *//*}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur dark:bg-gray-950/80 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Nav Links *//*}
            <div className="flex items-center gap-12">
              <h1 className="font-bold text-xl text-gray-900 dark:text-white">epigram</h1>
              
              <nav className="flex items-center gap-12">
                <span className="text-sm text-gray-500 cursor-default">
                  Pricing
                </span>
                <span className="text-sm text-gray-500 cursor-default">
                  Careers
                </span>
              </nav>
            </div>
            
            {/* Open App Button *//*}
            <Link href="/app">
              <Button size="default" className="cursor-pointer">
                Open App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section *//*}
      <section className="relative px-4 py-40 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Master Calculus Through
              <span className="text-blue-600 dark:text-blue-400"> Active Practice</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Practice with real exam problems from top universities. Get instant AI-powered help when you're stuck.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/app">
                <Button size="lg" className="cursor-pointer">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Demo Image *//*}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16"
          >
            <img
              src="/demo.png"
              alt="Epigram Platform Demo"
              className="rounded-lg shadow-2xl w-full max-w-5xl mx-auto"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section *//*}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Everything You Need to Excel
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Built for students who want to master calculus efficiently
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">AI Tutor</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Get instant help with step-by-step explanations
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Real Exams</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Practice with actual problems from top universities
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Instant Feedback</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Check your work and learn from mistakes immediately
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Track Progress</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Monitor your improvement over time
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer *//*}
      <footer className="px-4 py-8 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 Epigram. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                Privacy
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                Terms
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

*/ 