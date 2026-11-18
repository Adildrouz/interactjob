export function isActiveDirectJob(job, now = Date.now()) {
  if (job.source !== 'Direct' && job.source_site !== 'Direct') return false;
  if (job.expired || ['closed', 'expired', 'rejected', 'pending'].includes(job.status)) return false;
  const expiry = job.date_expires || job.expires_at;
  return !expiry || new Date(expiry).getTime() + (/^\d{4}-\d{2}-\d{2}$/.test(expiry) ? 86400000 : 0) > now;
}

export function directJobCaption(job, siteUrl) {
  return [
    `📢 RECRUTEMENT — ${job.city || 'Maroc'}`,
    job.title,
    job.company ? `🏢 ${job.company}` : '',
    job.salary ? `💰 ${job.salary}` : '',
    job.contractType && job.contractType !== 'Non précisé' ? `📄 ${job.contractType}` : '',
    '',
    'Consultez le descriptif et les modalités de candidature sur InteractJob :',
    `${siteUrl.replace(/\/$/, '')}/offres/${encodeURIComponent(job.slug || job.id)}`,
    '',
    '#Recrutement #Emploi #Maroc',
  ].filter(line => line !== null).join('\n');
}
