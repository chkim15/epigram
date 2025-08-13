"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Clock, Target, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Master Calculus Through
              <span className="text-blue-600 dark:text-blue-400"> Active Practice</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              Stop watching boring lectures. Start solving real problems with AI-powered guidance 
              and instant feedback. Learn calculus the way it should be taught.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/app">
                <Button size="lg" className="group">
                  Open App
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Demo Problem Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 rounded-xl border bg-white p-8 shadow-lg dark:bg-gray-900"
          >
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Example Problem</div>
            <div className="mt-4 text-lg">
              Find the derivative of <span className="font-mono">f(x) = x³ + 2x² - 5x + 3</span>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Derivatives
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
                Easy
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why Students Choose Our Platform
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Built for motivated students who want results
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <benefit.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-2xl bg-blue-600 px-8 py-16 text-center shadow-xl dark:bg-blue-700"
        >
          <h2 className="text-3xl font-bold text-white">
            Ready to Transform Your Learning?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of students mastering calculus through practice
          </p>
          <Link href="/app">
            <Button 
              size="lg" 
              variant="secondary"
              className="mt-8 bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-blue-400"
            >
              Start Learning Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

const benefits = [
  {
    icon: Brain,
    title: "Active Learning",
    description: "Learn by doing, not watching. Solve real problems with immediate feedback."
  },
  {
    icon: Zap,
    title: "AI-Powered Help",
    description: "Get unstuck instantly with contextual hints and step-by-step solutions."
  },
  {
    icon: Target,
    title: "Structured Path",
    description: "Follow a proven curriculum from basics to advanced topics."
  },
  {
    icon: Clock,
    title: "Efficient Study",
    description: "Maximize learning in minimum time with focused problem sets."
  }
];