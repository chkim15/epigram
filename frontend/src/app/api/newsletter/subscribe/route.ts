export async function POST(request: Request) {
  const body = await request.json() as { email?: string }
  const { email } = body

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  const pubId = process.env.BEEHIIV_PUBLICATION_ID
  const apiKey = process.env.BEEHIIV_API_KEY

  if (!pubId || !apiKey) {
    return Response.json({ error: 'Newsletter not configured' }, { status: 500 })
  }

  const url = `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ email, reactivate_existing: true }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('[newsletter] Beehiiv error', res.status, text)
    return Response.json({ error: 'Subscription failed', status: res.status, detail: text }, { status: 500 })
  }

  return Response.json({ success: true })
}
