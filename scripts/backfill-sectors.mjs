#!/usr/bin/env node
/**
 * Backfill sectors for jobs stored as "Autre" (mostly scraped feeds that
 * never carried a sector). Deterministic keyword rules over title — a job
 * is only reclassified when a rule matches; otherwise it stays "Autre".
 *
 * Usage:
 *   node scripts/backfill-sectors.mjs          # dry-run, prints stats
 *   node scripts/backfill-sectors.mjs --write  # applies to data/jobs.json
 */
import { readFileSync, writeFileSync } from "fs";

const JOBS_PATH = new URL("../data/jobs.json", import.meta.url);

// Canonical value ← title keyword patterns (lowercase, accent-insensitive-ish)
const RULES = [
  ["Administration publique", /concours de recrutement|fonction publique|minist[èe]re|commune de|pr[ée]fecture|wilaya|office national|agence nationale/i],
  ["IT", /d[ée]veloppeur|software|full[- ]?stack|frontend|backend|devops|data (analyst|engineer|scientist)|informatique|syst[èe]mes? (linux|informatique)|r[ée]seaux|cybers[ée]curit[ée]|webmaster|d[ée]veloppement web|cloud|sql|python|java|php|react|node\.js|sysadmin|helpdesk|support technique/i],
  ["BPO", /t[ée]l[ée]conseill|centre d'appel|call ?center|t[ée]l[ée]vente|t[ée]l[ée]op[ée]rat|conseiller client|charg[ée]s? (de |d')assistance|relation client|customer service|anglophone|francophone|hispanophone/i],
  ["Automobile", /automobile|automotive|a[ée]ronautique|c[âa]blage|faisceaux|yazaki|leoni|aptiv|stellantis|renault|dacia|sews|delphi/i],
  ["Santé", /infirmi|m[ée]decin|pharmac|sant[ée]|param[ée]dical|aide[- ]soignant|kin[ée]sith|d[ée]l[ée]gu[ée]s? m[ée]dic|laborantin|dentaire|clinique|h[ôo]pital/i],
  ["Hôtellerie", /h[ôo]tel|restaurant|cuisine|chef de partie|serveur|r[ée]ceptionniste|boulanger|p[âa]tissier|barman|housekeeping|spa |riad|resort|tourisme|voyage/i],
  ["BTP", /btp|chantier|ma[çc]on|g[ée]nie civil|conducteur de travaux|topographe|ferrailleur|coffreur|second [œo]euvre|travaux publics|construction/i],
  ["Ingénierie", /ing[ée]nieurs?( |s)|bureau d'[ée]tudes|m[ée]canique|[ée]lectrom[ée]canique|maintenance industrielle|automatisme|qualit[ée]|hse\b|m[ée]thodes/i],
  ["Logistique", /logisti|supply ?chain|chauffeurs?|livreur|cariste|magasinier|transport|entrep[ôo]t|exp[ée]dition|douane|transit/i],
  ["Commerce", /commercial|vendeur|vente|t[ée]l[ée]prospect|business developer|account manager|caissi[èe]r|merchandiser|repr[ée]sentant/i],
  ["Finance", /comptab|finance|audit|contr[ôo]leur de gestion|tr[ée]sorerie|fiscalit[ée]|recouvrement|facturation/i],
  ["Banque", /banque|bancaire|assurance|actuari|attijariwafa|bmce|cih |soci[ée]t[ée] g[ée]n[ée]rale|cr[ée]dit/i],
  ["RH", /ressources humaines|\brh\b|talent acquisition|charg[ée]e? de recrutement|gestionnaire de paie|responsable recrutement/i],
  ["Marketing", /marketing|communication|community manager|seo\b|sea\b|growth|content|social media|graphiste|designer/i],
  ["Éducation", /enseignant|professeur|formateur|[ée]ducat|p[ée]dagog|[ée]cole|universit[ée]|crèche/i],
  ["Agriculture", /agricole|agronome|agroalimentaire|ferme|serre|irrigation|p[êe]che|[ée]levage/i],
  ["Textile", /textile|couture|confection|styliste|modéliste|cuir|habillement/i],
  ["Juridique", /juriste|juridique|avocat|notaire|contentieux/i],
  ["Télécoms", /t[ée]l[ée]com|fibre optique|inwi|orange maroc|maroc telecom/i],
  ["Énergie", /[ée]nergie|solaire|[ée]olien|photovolta|environnement|eau et [ée]lectricit[ée]|onee/i],
  ["Immobilier", /immobilier|foncier|syndic|promotion immobili/i],
  ["Administratif", /assistant[e]? (administrati|de direction)|secr[ée]taire|office manager|saisie|standardiste/i],
];

const LEGACY = {
  "Informatique & Tech": "IT", "Finance & Comptabilité": "Finance",
  "Marketing & Communication": "Marketing", "RH & Recrutement": "RH",
  "Commercial & Vente": "Commerce", "Logistique & Supply Chain": "Logistique",
  "Ingénierie & Production": "Ingénierie", "Éducation & Formation": "Éducation",
  "Hôtellerie & Tourisme": "Hôtellerie", "BTP & Architecture": "BTP",
};

function classify(title) {
  for (const [sector, re] of RULES) if (re.test(title)) return sector;
  return null;
}

const write = process.argv.includes("--write");
const jobs = JSON.parse(readFileSync(JOBS_PATH, "utf8"));

let legacyFixed = 0, reclassified = 0, stillAutre = 0;
const bySector = {};

for (const j of jobs) {
  if (LEGACY[j.sector]) {
    j.sector = LEGACY[j.sector];
    legacyFixed++;
  }
  if (j.sector === "Autre" && !j.sectorOther) {
    const s = classify(j.title || "");
    if (s) {
      j.sector = s;
      reclassified++;
      bySector[s] = (bySector[s] || 0) + 1;
    } else {
      stillAutre++;
    }
  }
}

console.log(`Total jobs: ${jobs.length}`);
console.log(`Legacy labels normalized: ${legacyFixed}`);
console.log(`"Autre" reclassified by keywords: ${reclassified}`);
console.log(`Still "Autre" (no rule matched): ${stillAutre}`);
console.log("By sector:", Object.entries(bySector).sort((a, b) => b[1] - a[1]));

if (write) {
  writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf8");
  console.log("✔ data/jobs.json updated");
} else {
  console.log("(dry-run — pass --write to apply)");
}
