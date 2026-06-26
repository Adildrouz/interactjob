const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.interactjob.ma';
const TEST_MODE = process.env.EMPLOYER_EMAIL_TEST_MODE === 'true';

async function sendEmployerEmail(to: string, subject: string, html: string) {
  if (TEST_MODE || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`\n[EMPLOYER EMAIL — TEST MODE]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, '').slice(0, 400));
    console.log('─'.repeat(40));
    return;
  }
  const { sendEmail } = await import('@/lib/mailer');
  await sendEmail({ to, subject, text: html.replace(/<[^>]+>/g, '') });
}

export async function sendVerificationEmail(email: string, token: string, companyName: string) {
  const link = `${BASE_URL}/employeur/verify-email?token=${token}`;
  await sendEmployerEmail(
    email,
    'Vérifiez votre adresse email — InteractJob Employeurs',
    `<p>Bonjour ${companyName},</p>
<p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
<p><a href="${link}">${link}</a></p>
<p>Ce lien expire dans 24 heures.</p>`
  );
}

export async function sendWelcomeEmail(email: string, companyName: string) {
  await sendEmployerEmail(
    email,
    `Bienvenue sur InteractJob Employeurs — ${companyName}`,
    `<p>Bonjour ${companyName},</p>
<p>Votre compte employeur InteractJob est activé. Vous pouvez dès maintenant publier vos offres d'emploi.</p>
<p><a href="${BASE_URL}/employeur">Accéder à mon espace →</a></p>`
  );
}

export async function sendApplicationNotification(
  employerEmail: string,
  offerTitle: string,
  candidateName: string,
  offerId: string
) {
  await sendEmployerEmail(
    employerEmail,
    `Nouvelle candidature — ${offerTitle}`,
    `<p>Vous avez reçu une nouvelle candidature pour <strong>${offerTitle}</strong>.</p>
<p>Candidat : ${candidateName}</p>
<p><a href="${BASE_URL}/employeur/candidatures?offer=${offerId}">Voir la candidature →</a></p>`
  );
}

export async function sendPlanActivationEmail(email: string, companyName: string, plan: string) {
  const planLabels: Record<string, string> = {
    pack_sponsoring: 'Pack Sponsoring',
    pro: 'Pro Mensuel',
    business: 'Business Annuel',
  };
  await sendEmployerEmail(
    email,
    `Votre plan ${planLabels[plan] || plan} est activé — InteractJob`,
    `<p>Bonjour ${companyName},</p>
<p>Votre paiement a bien été reçu. Votre plan <strong>${planLabels[plan]}</strong> est maintenant actif.</p>
<p><a href="${BASE_URL}/employeur/facturation">Voir mes factures →</a></p>`
  );
}
