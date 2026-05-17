import { supabase } from '@/integrations/supabase/client'

export interface SendTransactionalEmailParams {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}

/**
 * Sends a transactional email via the /lovable/email/transactional/send route.
 * Caller must be authenticated (the route validates the Supabase JWT).
 */
export async function sendTransactionalEmail(params: SendTransactionalEmailParams) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/lovable/email/transactional/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      templateName: params.templateName,
      recipientEmail: params.recipientEmail,
      idempotencyKey: params.idempotencyKey,
      templateData: params.templateData,
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Failed to send email (${res.status}): ${errText.slice(0, 200)}`)
  }
  return res.json().catch(() => ({}))
}
