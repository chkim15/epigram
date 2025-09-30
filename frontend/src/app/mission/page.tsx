"use client";

import Link from "next/link";
import Image from "next/image";

// Import Inter font
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function MissionPage() {
  return (
    <div className={`min-h-screen ${inter.className}`} style={{ backgroundColor: '#faf9f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#faf9f5]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo and Nav Links */}
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/epigram_logo.svg" alt="Epigram Logo" width={32} height={32} />
                <h1 className="font-bold text-xl text-black">Epigram</h1>
              </Link>

              <nav className="flex items-center gap-8">
                <Link href="/" className="text-sm text-black hover:opacity-70 cursor-pointer">
                  Home
                </Link>
                <Link href="/mission" className="text-sm text-black hover:opacity-70 cursor-pointer font-semibold">
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
                <button className="px-4 py-2.5 text-base font-medium text-white rounded-xl cursor-pointer" style={{ backgroundColor: '#a16207' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}>
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mission Content */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-black mb-12 text-left">
            Why We Built Epigram
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              AI is rapidly reshaping our world. Mathematics, the foundation of AI and much of modern science, has never been more important. Today, AI can already solve challenging math problems, outperform humans on international competitions like the IMO, and even generate sophisticated proofs. Each day, these tools grow more powerful.
            </p>

            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              But this strength comes with risks. If students rely on AI only for answers, they risk losing the very skills that make human intelligence unique: asking the right questions, thinking creatively, and solving problems they&apos;ve never seen before. These are exactly the abilities cultivated through mathematics education.
            </p>

            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              At Epigram, we see AI not as a replacement, but as a tool. Like any tool, it has both strengths and weaknesses. Our mission is to guide students in using AI the right way: as a partner in active learning that helps them build problem-solving skills, gain confidence, and achieve academic success.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}