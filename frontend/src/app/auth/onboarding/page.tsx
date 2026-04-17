"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import type {
  Background,
  FirmSlug,
  PrepLevel,
  RoleType,
  Timeline,
} from '@/lib/onboarding/options'
import ProgressBar from './_components/ProgressBar'
import Screen1Background from './_components/Screen1Background'
import Screen2Firms from './_components/Screen2Firms'
import Screen3Role from './_components/Screen3Role'
import Screen4Timeline from './_components/Screen4Timeline'
import Screen5PrepLevel from './_components/Screen5PrepLevel'

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [background, setBackground] = useState<Background | ''>('')
  const [targetFirms, setTargetFirms] = useState<FirmSlug[]>([])
  const [targetFirmsOther, setTargetFirmsOther] = useState('')
  const [roleType, setRoleType] = useState<RoleType | ''>('')
  const [timeline, setTimeline] = useState<Timeline | ''>('')
  const [prepLevel, setPrepLevel] = useState<PrepLevel | ''>('')

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Create a stub profile if one doesn't exist (e.g. Google OAuth users).
    async function ensureProfile() {
      if (!user) return

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!existingProfile) {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            onboarding_completed: false,
          })
      }
    }

    ensureProfile()
  }, [user, router])

  const toggleFirm = (firm: FirmSlug) => {
    setTargetFirms((prev) =>
      prev.includes(firm) ? prev.filter((f) => f !== firm) : [...prev, firm],
    )
  }

  const otherFundsSelected = targetFirms.includes('other_funds')

  const isStepValid = (() => {
    switch (step) {
      case 1:
        return background !== ''
      case 2:
        if (targetFirms.length === 0) return false
        if (otherFundsSelected && !targetFirmsOther.trim()) return false
        return true
      case 3:
        return roleType !== ''
      case 4:
        return timeline !== ''
      case 5:
        return prepLevel !== ''
      default:
        return false
    }
  })()

  const handleBack = () => {
    setError('')
    setStep((s) => Math.max(1, s - 1))
  }

  const handleNext = () => {
    setError('')
    if (!isStepValid) {
      setError('Please answer before continuing.')
      return
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  const handleSubmit = async () => {
    setError('')

    if (!isStepValid) {
      setError('Please answer before continuing.')
      return
    }

    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          background,
          target_firms: targetFirms,
          target_firms_other: otherFundsSelected
            ? targetFirmsOther.trim()
            : null,
          role_type: roleType,
          timeline,
          prep_level: prepLevel,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating profile:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        })
        setError(
          updateError.message
            ? `Failed to save: ${updateError.message}`
            : 'Failed to save your information. Please try again.',
        )
        return
      }

      router.push('/problems')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to save your information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-xl">
        <div
          className="rounded-xl shadow-lg p-8"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="text-center mb-6">
            <h1
              className="text-2xl font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Let&apos;s get you set up.
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--muted-foreground)' }}
            >
              A few quick questions so we can tailor your prep.
            </p>
          </div>

          <ProgressBar current={step} total={TOTAL_STEPS} />

          <div className="min-h-[320px] max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {step === 1 && (
              <Screen1Background
                value={background}
                onChange={setBackground}
              />
            )}
            {step === 2 && (
              <Screen2Firms
                selected={targetFirms}
                onToggle={toggleFirm}
                otherText={targetFirmsOther}
                onOtherTextChange={setTargetFirmsOther}
              />
            )}
            {step === 3 && (
              <Screen3Role value={roleType} onChange={setRoleType} />
            )}
            {step === 4 && (
              <Screen4Timeline value={timeline} onChange={setTimeline} />
            )}
            {step === 5 && (
              <Screen5PrepLevel value={prepLevel} onChange={setPrepLevel} />
            )}
          </div>

          {error && (
            <div
              className="mt-4 p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                color: '#b91c1c',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (step !== 1 && !isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid || isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid || isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                }}
              >
                {isLoading ? 'Saving...' : (
                  <>
                    Finish
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
