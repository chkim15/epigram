<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Epigram Next.js App Router application. This includes client-side initialization via `instrumentation-client.ts`, a reverse proxy for improved data reliability, server-side event tracking on all critical API routes, user identification across all auth flows, and session reset on logout.

## Changes summary

### New files created
| File | Purpose |
|------|---------|
| `frontend/instrumentation-client.ts` | Client-side PostHog initialization with exception tracking |
| `frontend/src/lib/posthog-server.ts` | Singleton PostHog Node.js client for server-side routes |

### Modified files
| File | Changes |
|------|---------|
| `frontend/next.config.ts` | Added `/ingest/*` reverse proxy rewrites + `skipTrailingSlashRedirect` |
| `frontend/src/stores/authStore.ts` | Added `posthog.reset()` on sign-out |
| `frontend/src/hooks/useAuthGuard.ts` | Added `posthog.identify()` whenever an authenticated user is loaded (covers all pages, all auth methods including Google OAuth) |
| `frontend/src/app/auth/signin/page.tsx` | Added `posthog.identify()` + `user_signed_in` capture on email sign-in |
| `frontend/src/app/auth/signup/page.tsx` | Added `user_signed_up` capture on successful email registration |
| `frontend/src/app/auth/onboarding/page.tsx` | Added `onboarding_completed` capture with profile data |
| `frontend/src/app/upgrade/page.tsx` | Added `upgrade_plan_selected` capture with plan type |
| `frontend/src/app/problems/page.tsx` | Added `problem_bookmarked` / `problem_unbookmarked` captures |
| `frontend/src/components/interview/InterviewSession.tsx` | Added `mock_interview_started` and `mock_interview_completed` captures |
| `frontend/src/app/api/checkout/create-session/route.ts` | Added server-side `checkout_session_created` capture |
| `frontend/src/app/api/webhooks/stripe/route.ts` | Added server-side `subscription_created`, `payment_succeeded`, `payment_failed` captures |
| `frontend/src/app/api/subscription/cancel/route.ts` | Added server-side `subscription_canceled` capture |

## Event tracking table

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User successfully created an account with email/password | `src/app/auth/signup/page.tsx` |
| `user_signed_in` | User successfully signed in with email/password | `src/app/auth/signin/page.tsx` |
| `onboarding_completed` | User completed the onboarding flow and saved their profile | `src/app/auth/onboarding/page.tsx` |
| `upgrade_plan_selected` | User clicked checkout for a premium plan | `src/app/upgrade/page.tsx` |
| `checkout_session_created` | Server: Stripe checkout session created successfully | `src/app/api/checkout/create-session/route.ts` |
| `subscription_created` | Server: Stripe webhook confirmed a new subscription | `src/app/api/webhooks/stripe/route.ts` |
| `subscription_canceled` | Server: User confirmed subscription cancellation | `src/app/api/subscription/cancel/route.ts` |
| `payment_succeeded` | Server: Stripe invoice payment succeeded | `src/app/api/webhooks/stripe/route.ts` |
| `payment_failed` | Server: Stripe invoice payment failed | `src/app/api/webhooks/stripe/route.ts` |
| `mock_interview_started` | User started a mock interview session | `src/components/interview/InterviewSession.tsx` |
| `mock_interview_completed` | User ended a mock interview session with elapsed time | `src/components/interview/InterviewSession.tsx` |
| `problem_bookmarked` | User bookmarked a problem | `src/app/problems/page.tsx` |
| `problem_unbookmarked` | User removed a bookmark from a problem | `src/app/problems/page.tsx` |

## Next steps

We've built a dashboard and 5 insights for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/406019/dashboard/1534806)
- **Signup → Onboarding Completion Funnel**: [nGfjgTgA](https://us.posthog.com/project/406019/insights/nGfjgTgA)
- **Upgrade Funnel: Plan Selected → Subscription Created**: [mylz51Pa](https://us.posthog.com/project/406019/insights/mylz51Pa)
- **New Subscriptions Over Time**: [kSYNSrdS](https://us.posthog.com/project/406019/insights/kSYNSrdS)
- **Mock Interview Sessions Started vs Completed**: [dMzbqlrE](https://us.posthog.com/project/406019/insights/dMzbqlrE)
- **Subscription Cancellations vs Payments Failed**: [haakg55v](https://us.posthog.com/project/406019/insights/haakg55v)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
