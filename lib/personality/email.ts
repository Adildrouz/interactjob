import nodemailer from 'nodemailer';
import type { PersonalityResult, PremiumReport } from '@/types/personality';

const SECTIONS: { key: keyof Omit<PremiumReport, 'generatedAt'>; title: string }[] = [
  { key: 'overview',                   title: 'Vue d\'ensemble' },
  { key: 'coreStrengths',              title: 'Forces principales' },
  { key: 'potentialWeaknesses',        title: 'Axes de progression' },
  { key: 'leadershipStyle',            title: 'Style de leadership' },
  { key: 'communicationStyle',         title: 'Communication' },
  { key: 'teamworkBehavior',           title: 'Dynamique d\'équipe' },
  { key: 'stressResponse',             title: 'Gestion du stress' },
  { key: 'workplaceCompatibility',     title: 'Compatibilité professionnelle' },
  { key: 'productivityHabits',         title: 'Habitudes de productivité' },
  { key: 'idealWorkEnvironment',       title: 'Environnement idéal' },
  { key: 'careerRecommendations',      title: 'Recommandations carrière' },
  { key: 'interviewAdvice',            title: 'Conseils entretien' },
  { key: 'bestManagementStyle',        title: 'Management idéal' },
  { key: 'relationshipWithColleagues', title: 'Relations avec les collègues' },
  { key: 'decisionMakingStyle',        title: 'Prise de décision' },
  { key: 'careerGrowthAdvice',         title: 'Évolution de carrière' },
  { key: 'workplaceRisks',             title: 'Risques professionnels' },
  { key: 'aiCareerCoaching',           title: 'Coaching IA' },
];

function buildHtmlEmail(result: PersonalityResult, report: PremiumReport): string {
  const date = new Date(report.generatedAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' });

  const sectionsHtml = SECTIONS.map(({ key, title }) => `
    <div style="margin-bottom:28px;">
      <h3 style="color:#6366f1;font-size:15px;font-weight:700;margin:0 0 8px;border-left:3px solid #6366f1;padding-left:10px;">${title}</h3>
      <p style="color:#374151;font-size:14px;line-height:1.75;margin:0;white-space:pre-line;">${report[key]}</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:680px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#ec4899);padding:40px 40px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Rapport Personnalité IA — InteractJob</p>
      <div style="font-size:56px;margin-bottom:12px;">${result.emoji}</div>
      <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px;">${result.label}</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;font-style:italic;margin:0;">"${result.tagline}"</p>
    </div>

    <!-- Scores -->
    <div style="padding:28px 40px;background:#f8f7ff;border-bottom:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Profil comportemental</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        ${([['L','Leader Energy','#6366f1'],['I','Influence Sociale','#ec4899'],['S','Stabilité','#10b981'],['P','Précision','#3b82f6']] as const).map(([dim, label, color]) => `
          <div style="flex:1;min-width:120px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:${color};">${result.percentages[dim as keyof typeof result.percentages]}%</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Sections -->
    <div style="padding:32px 40px;">
      ${sectionsHtml}
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Généré le ${date} · InteractJob.ma</p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">Ce rapport est personnel et confidentiel. Propulsé par l'IA Claude.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendReportEmail(to: string, result: PersonalityResult, report: PremiumReport): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"InteractJob Personnalité" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: `Votre rapport ${result.label} — InteractJob Personnalité IA`,
    html: buildHtmlEmail(result, report),
  });
}
