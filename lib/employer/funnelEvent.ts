import { connectDB } from '@/lib/db';
import { ToolEvent } from '@/lib/models/ToolEvent';

export type EmployerFunnelEvent =
  | 'register'
  | 'verification_email_sent'
  | 'verified'
  | 'first_offer_submitted'
  | 'offer_approved';

/** Best-effort — a tracking failure must never break the employer flow it's tracking. */
export async function recordEmployerFunnelEvent(
  event: EmployerFunnelEvent,
  employerId: string,
  metadata?: Record<string, unknown>
) {
  try {
    await connectDB();
    await ToolEvent.create({
      session_id: `employer_${employerId}`,
      tool: 'employer_funnel',
      event,
      employer_id: employerId,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error('[employer/funnelEvent]', event, err);
  }
}
