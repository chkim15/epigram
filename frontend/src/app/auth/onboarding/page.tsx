"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight } from 'lucide-react'

const SCHOOLS = [
  { value: 'upenn', label: 'University of Pennsylvania' },
  { value: 'columbia', label: 'Columbia University' },
  { value: 'high_school', label: 'High school' },
  { value: 'other', label: 'Other' },
];

const COURSES = {
  high_school: [
    { value: 'AP Calculus AB', label: 'AP Calculus AB' },
    { value: 'AP Calculus BC', label: 'AP Calculus BC' },
    { value: 'other', label: 'Other' },
  ],
  upenn: [
    { value: 'Math 1300', label: 'Math 1300' },
    { value: 'Math 1400', label: 'Math 1400' },
    { value: 'other', label: 'Other' },
  ],
  columbia: [
    { value: 'Math 1101', label: 'Math 1101' },
    { value: 'Math 1102', label: 'Math 1102' },
    { value: 'other', label: 'Other' },
  ],
  other: [
    { value: 'other', label: 'Other' },
  ],
};

const REFERRAL_SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend', label: 'Friend or Colleague' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'other', label: 'Other' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const [school, setSchool] = useState('')
  const [schoolOther, setSchoolOther] = useState('')
  const [course, setCourse] = useState('')
  const [courseOther, setCourseOther] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [referralOther, setReferralOther] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check if profile exists, create if it doesn't (fallback for Google OAuth)
    async function ensureProfile() {
      if (!user) return
      
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist (Google OAuth users might not have one)
        await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            onboarding_completed: false
          })
      }
    }
    
    ensureProfile()
  }, [user, router])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!school || !course || !referralSource) {
      setError('Please fill in all required fields')
      return
    }

    if (school === 'other' && !schoolOther) {
      setError('Please specify your school')
      return
    }

    if (course === 'other' && !courseOther) {
      setError('Please specify your course')
      return
    }

    if (referralSource === 'other' && !referralOther) {
      setError('Please specify how you heard about us')
      return
    }

    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)

    // Determine the actual school and course values to save
    const schoolValue = school === 'other' ? schoolOther : SCHOOLS.find(s => s.value === school)?.label || school
    const courseValue = course === 'other' ? courseOther : course

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          school: schoolValue,
          course: courseValue,
          referral_source: referralSource,
          referral_other: referralSource === 'other' ? referralOther : null,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      router.push('/home')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to save your information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">
            Let&apos;s start your learning journey.
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Which school are you in?
              </label>
              <Select
                value={school}
                onValueChange={(value) => {
                  setSchool(value)
                  // Reset course when school changes
                  setCourse('')
                  setCourseOther('')
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your school..." />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOLS.map((schoolOption) => (
                    <SelectItem key={schoolOption.value} value={schoolOption.value}>
                      {schoolOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {school === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please specify your school
                </label>
                <input
                  type="text"
                  value={schoolOther}
                  onChange={(e) => setSchoolOther(e.target.value)}
                  placeholder="Enter your school name..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Which course are you taking?
              </label>
              <Select
                value={course}
                onValueChange={setCourse}
                disabled={isLoading || !school}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={school ? "Select your course..." : "Please select a school first"} />
                </SelectTrigger>
                <SelectContent>
                  {school && COURSES[school as keyof typeof COURSES]?.map((courseOption) => (
                    <SelectItem key={courseOption.value} value={courseOption.value}>
                      {courseOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {course === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please specify your course
                </label>
                <input
                  type="text"
                  value={courseOther}
                  onChange={(e) => setCourseOther(e.target.value)}
                  placeholder="Enter your course name..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How did you hear about us?
              </label>
              <Select
                value={referralSource}
                onValueChange={setReferralSource}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {referralSource === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please specify how you heard about us
                </label>
                <input
                  type="text"
                  value={referralOther}
                  onChange={(e) => setReferralOther(e.target.value)}
                  placeholder="Tell us how you discovered Epigram..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Saving...' : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}