"use client";

export default function CoursesPage() {
  return (
    <div className="flex h-full items-start justify-center bg-white dark:bg-gray-900 pt-6">
      <div className="max-w-4xl mx-auto text-center p-8">
        {/* Title */}
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Epigram Course Catalog
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-16">
          Choose from our available math courses
        </p>

        {/* Course Cards */}
        <div className="space-y-8">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-12 hover:shadow-lg transition-shadow cursor-pointer hover:border-gray-300 dark:hover:border-gray-600">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              Single Variable Calculus I / AP Calculus AB
            </h2>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-12 hover:shadow-lg transition-shadow cursor-pointer hover:border-gray-300 dark:hover:border-gray-600">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              Single Variable Calculus II / AP Calculus BC
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}