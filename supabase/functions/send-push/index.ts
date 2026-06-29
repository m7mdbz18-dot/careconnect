import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    })
  }

  const { record } = await req.json()
  if (!record?.vendor_id) return new Response('no record', { status: 400 })

  webpush.setVapidDetails(
    'mailto:admin@careconnect.ae',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  )

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const [{ data: vendor }, { data: subs }] = await Promise.all([
    supabase.from('vendors').select('name, emoji').eq('id', record.vendor_id).single(),
    supabase.from('push_subscriptions').select('*').eq('vendor_id', record.vendor_id),
  ])

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  const location = record.location_type === 'room'
    ? `Room ${record.room} · Bed ${record.bed}`
    : (record.waiting_area || 'Waiting area')

  const items = (record.items || []).map((i: { name: string }) => i.name).join(', ')

  const payload = JSON.stringify({
    title: `New order — ${vendor?.emoji ?? ''} ${vendor?.name ?? 'Vendor'}`,
    body: `${location}${items ? ' · ' + items : ''}`,
    tag: `order-${record.id}`,
  })

  await Promise.allSettled(
    subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    })
  )

  return new Response(JSON.stringify({ sent: subs.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
