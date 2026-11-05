import { randomBytes } from 'crypto';
import { Employer } from '@/lib/models/Employer';
import { sendVerificationEmail } from '@/lib/employer/email';

/** Password must already have been checked by the caller. */
export async function resendEmployerVerification(id: string) {
  const now = new Date();
  const employer = await Employer.findOneAndUpdate({
    _id: id, email_verified: false,
    $or: [
      { verification_sent_at: { $exists: false } },
      { verification_sent_at: { $lte: new Date(now.getTime() - 60000) } },
    ],
  }, { $set: {
    email_verify_token: randomBytes(32).toString('hex'),
    email_verify_expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    verification_sent_at: now,
  } }, { new: true });
  if (!employer) return { sent: false, cooldown: true };
  try {
    const result = await sendVerificationEmail(employer.email, employer.email_verify_token!, employer.company_name);
    return { sent: result.delivered, cooldown: false };
  } catch {
    console.error('[employer/verification] email send failed');
    return { sent: false, cooldown: false };
  }
}
