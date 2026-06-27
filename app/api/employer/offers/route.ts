import { NextRequest, NextResponse } from 'next/server';
import { getEmployerSessionFromRequest } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { JobOffer } from '@/lib/models/JobOffer';
import { Employer } from '@/lib/models/Employer';

const MAX_ACTIVE_STANDARD = 10; // Standard + Pack Sponsoring

export async function GET(req: NextRequest) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  await connectEmployerDB();
  const offers = await JobOffer.find({ employer_id: session.id })
    .sort({ created_at: -1 })
    .lean();

  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, location, contract_type, salary, level, sector,
      application_method, application_email, application_url, is_sponsored } = body;

    if (!title || !description || !location || !contract_type) {
      return NextResponse.json({ error: 'Titre, description, ville et type de contrat requis.' }, { status: 400 });
    }

    await connectEmployerDB();

    // Plan limit check (Standard/Pack: max 10 active)
    const employer = await Employer.findById(session.id).select('plan trusted approved_offers_count sponsoring_credits credits_expire_at email_verified phone phone_verified');
    if (!employer) return NextResponse.json({ error: 'Employeur introuvable.' }, { status: 404 });

    // Require verified email before posting
    if (!employer.email_verified) {
      return NextResponse.json({
        error: 'Vous devez vérifier votre adresse email avant de publier une offre. Vérifiez votre boîte de réception.',
        code: 'EMAIL_NOT_VERIFIED',
      }, { status: 403 });
    }

    // Require phone number before posting
    if (!employer.phone) {
      return NextResponse.json({
        error: 'Vous devez renseigner votre numéro de téléphone dans votre profil avant de publier une offre.',
        code: 'PHONE_MISSING',
      }, { status: 403 });
    }

    const isUnlimited = employer.plan === 'pro' || employer.plan === 'business';
    if (!isUnlimited) {
      const activeCount = await JobOffer.countDocuments({ employer_id: session.id, status: { $in: ['active', 'pending'] } });
      if (activeCount >= MAX_ACTIVE_STANDARD) {
        return NextResponse.json({
          error: `Votre plan ${employer.plan === 'standard' ? 'Standard' : 'Pack Sponsoring'} est limité à ${MAX_ACTIVE_STANDARD} offres actives. Passez à Pro pour des offres illimitées.`,
          limit_reached: true,
        }, { status: 403 });
      }
    }

    // Sponsoring: consume a credit
    let creditConsumed = false;
    let sponsored_until: Date | undefined;
    if (is_sponsored) {
      const creditsValid = employer.sponsoring_credits > 0 &&
        (!employer.credits_expire_at || employer.credits_expire_at > new Date());
      if (!creditsValid) {
        return NextResponse.json({ error: 'Aucun crédit de sponsoring disponible.' }, { status: 403 });
      }
      creditConsumed = true;
      sponsored_until = new Date(Date.now() + 30 * 86400000);
    }

    // Determine initial status
    const status = employer.trusted ? 'active' : 'pending';

    const offer = await JobOffer.create({
      employer_id: session.id,
      title: title.trim(),
      description: description.trim(),
      location,
      contract_type,
      salary,
      level,
      sector,
      status,
      is_sponsored: creditConsumed,
      sponsored_until,
      application_method: application_method || 'email',
      application_email,
      application_url,
      views: 0,
      ai_enriched: false,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 60 * 86400000),
    });

    // Consume credit if sponsored
    if (creditConsumed) {
      await Employer.findByIdAndUpdate(session.id, { $inc: { sponsoring_credits: -1 } });
    }

    // Trigger AI enrichment async (fire-and-forget)
    triggerAIEnrichment(offer._id.toString(), offer.title, offer.description, offer.location, offer.contract_type).catch(console.error);

    return NextResponse.json({
      success: true,
      offer_id: offer._id.toString(),
      status,
      message: status === 'pending'
        ? 'Offre soumise pour modération. Elle sera publiée après validation.'
        : 'Offre publiée !',
    }, { status: 201 });
  } catch (err) {
    console.error('[employer/offers/create]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

async function triggerAIEnrichment(offerId: string, title: string, description: string, location: string, contractType: string) {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    if (!process.env.ANTHROPIC_API_KEY) return;

    const prompt = `Tu es un expert RH au Maroc. Enrichis cette offre d'emploi avec un texte accrocheur de 180 à 230 mots en français. Ne répète pas le titre. Commence directement par décrire l'opportunité. Structure: missions clés (3-4 bullets), profil recherché (2-3 bullets), avantages entreprise (1-2 bullets). Offre: ${title} | ${location} | ${contractType} | ${description.slice(0, 400)}`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const enriched = (msg.content[0] as any).text?.trim();
    if (enriched && enriched.length > 100) {
      await JobOffer.findByIdAndUpdate(offerId, {
        $set: { description: enriched, ai_enriched: true },
      });
    }
  } catch (err) {
    console.error('[AI enrichment]', err);
  }
}
