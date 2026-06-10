"use client";

import { useState, useMemo } from "react";

type Categorie = "cadre" | "employe" | "ouvrier";
type TypeContrat = "cdi" | "cdd";
type MotifRupture = "licenciement" | "demission" | "retraite" | "accord_mutuel";

interface Result {
  indemniteLicenciement: number;
  indemnitePreavis: number;
  indemniteRetraite: number;
  totalBrut: number;
  preavisDuree: string;
  details: string[];
}

const LABELS = {
  fr: {
    title: "Calculateur d'indemnités de rupture",
    subtitle: "Estimez votre indemnité selon le Code du Travail marocain (Loi 65-99)",
    anciennete: "Ancienneté",
    annees: "Années",
    mois: "Mois",
    salaire: "Salaire mensuel brut (MAD)",
    salaireHint: "Entrez votre salaire brut mensuel en dirhams",
    typeContrat: "Type de contrat",
    cdi: "CDI",
    cdd: "CDD",
    motif: "Motif de rupture",
    licenciement: "Licenciement",
    demission: "Démission",
    retraite: "Départ à la retraite",
    accord_mutuel: "Accord mutuel",
    categorie: "Catégorie professionnelle",
    cadre: "Cadre / Ingénieur",
    employe: "Employé / Technicien",
    ouvrier: "Ouvrier / Manœuvre",
    calculer: "Calculer",
    result_title: "Résultat du calcul",
    indemnite_lic: "Indemnité de licenciement",
    indemnite_preavis: "Indemnité compensatrice de préavis",
    indemnite_retraite: "Indemnité de départ à la retraite",
    total: "Total brut estimé",
    preavis_label: "Durée de préavis",
    details_title: "Détail du calcul",
    disclaimer: "Ce calcul est indicatif basé sur les minima légaux (Art. 52-53-43-74). Consultez un juriste pour votre situation.",
    copy: "Copier le résultat",
    copied: "Copié !",
    na: "Non applicable",
    reset: "Nouveau calcul",
    mad: "MAD",
  },
  ar: {
    title: "حاسبة تعويضات إنهاء العقد",
    subtitle: "احسب تعويضك وفق مدونة الشغل المغربية (القانون 65.99)",
    anciennete: "الأقدمية",
    annees: "سنوات",
    mois: "أشهر",
    salaire: "الأجر الشهري الإجمالي (درهم)",
    salaireHint: "أدخل أجرك الإجمالي الشهري بالدراهم",
    typeContrat: "نوع العقد",
    cdi: "عقد غير محدد المدة",
    cdd: "عقد محدد المدة",
    motif: "سبب إنهاء العقد",
    licenciement: "الفصل من العمل",
    demission: "الاستقالة",
    retraite: "التقاعد",
    accord_mutuel: "الاتفاق المتبادل",
    categorie: "الفئة المهنية",
    cadre: "إطار / مهندس",
    employe: "موظف / تقني",
    ouvrier: "عامل / يدوي",
    calculer: "احسب",
    result_title: "نتيجة الحساب",
    indemnite_lic: "تعويض الفصل من العمل",
    indemnite_preavis: "تعويض عدم احترام الإخطار",
    indemnite_retraite: "تعويض التقاعد",
    total: "المجموع الإجمالي التقديري",
    preavis_label: "مدة الإخطار",
    details_title: "تفاصيل الحساب",
    disclaimer: "هذا الحساب تقديري بناءً على الحد الأدنى القانوني (الفصول 52-53-43-74). استشر محامياً لحالتك الخاصة.",
    copy: "نسخ النتيجة",
    copied: "تم النسخ!",
    na: "غير مطبق",
    reset: "حساب جديد",
    mad: "درهم",
  },
};

// Art. 53 — barème légal minimum indemnité de licenciement
function calcIndemniteLicenciement(anneesTotales: number, salaireMensuel: number): number {
  if (anneesTotales <= 0) return 0;
  const tauxHoraire = salaireMensuel / 191; // ~191h / mois
  let heures = 0;
  // Tranche 1 : 1-5 ans → 96h/an
  const t1 = Math.min(anneesTotales, 5);
  heures += t1 * 96;
  // Tranche 2 : 6-10 ans → 144h/an
  if (anneesTotales > 5) {
    const t2 = Math.min(anneesTotales - 5, 5);
    heures += t2 * 144;
  }
  // Tranche 3 : 11-15 ans → 192h/an
  if (anneesTotales > 10) {
    const t3 = Math.min(anneesTotales - 10, 5);
    heures += t3 * 192;
  }
  // Tranche 4 : >15 ans → 240h/an
  if (anneesTotales > 15) {
    const t4 = anneesTotales - 15;
    heures += t4 * 240;
  }
  return Math.round(tauxHoraire * heures);
}

// Art. 43 — durée de préavis en jours
function getPreavisDuree(categorie: Categorie, anneesTotales: number): { jours: number; label_fr: string; label_ar: string } {
  if (categorie === "ouvrier") {
    if (anneesTotales < 1) return { jours: 8, label_fr: "8 jours", label_ar: "8 أيام" };
    if (anneesTotales <= 5) return { jours: 15, label_fr: "15 jours", label_ar: "15 يوماً" };
    return { jours: 30, label_fr: "1 mois", label_ar: "شهر واحد" };
  }
  if (categorie === "employe") {
    if (anneesTotales < 1) return { jours: 15, label_fr: "15 jours", label_ar: "15 يوماً" };
    if (anneesTotales <= 5) return { jours: 30, label_fr: "1 mois", label_ar: "شهر واحد" };
    return { jours: 60, label_fr: "2 mois", label_ar: "شهران" };
  }
  // cadre
  if (anneesTotales < 1) return { jours: 30, label_fr: "1 mois", label_ar: "شهر واحد" };
  if (anneesTotales <= 5) return { jours: 60, label_fr: "2 mois", label_ar: "شهران" };
  return { jours: 90, label_fr: "3 mois", label_ar: "3 أشهر" };
}

function calcIndemnitePreavis(salaireMensuel: number, preavisJours: number): number {
  return Math.round((salaireMensuel / 30) * preavisJours);
}

// Art. 74 — indemnité de départ à la retraite (même barème que licenciement)
function calcIndemniteRetraite(anneesTotales: number, salaireMensuel: number): number {
  return calcIndemniteLicenciement(anneesTotales, salaireMensuel);
}

function formatMAD(n: number): string {
  return n.toLocaleString("fr-MA") + " MAD";
}

export default function IndemniteCalculator({ locale = "fr" }: { locale?: string }) {
  const isAr = locale === "ar";
  const L = isAr ? LABELS.ar : LABELS.fr;
  const dir = isAr ? "rtl" : "ltr";

  const [annees, setAnnees] = useState("");
  const [mois, setMois] = useState("0");
  const [salaire, setSalaire] = useState("");
  const [typeContrat, setTypeContrat] = useState<TypeContrat>("cdi");
  const [motif, setMotif] = useState<MotifRupture>("licenciement");
  const [categorie, setCategorie] = useState<Categorie>("employe");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const canCalculate = annees !== "" && salaire !== "" && Number(salaire) > 0 && Number(annees) >= 0;

  function calculate() {
    const anneesNum = Number(annees) + Number(mois) / 12;
    const salaireNum = Number(salaire);
    const preavisInfo = getPreavisDuree(categorie, anneesNum);
    const details: string[] = [];

    let indemniteLicenciement = 0;
    let indemnitePreavis = 0;
    let indemniteRetraite = 0;

    if (motif === "licenciement" && typeContrat === "cdi") {
      indemniteLicenciement = calcIndemniteLicenciement(anneesNum, salaireNum);
      indemnitePreavis = calcIndemnitePreavis(salaireNum, preavisInfo.jours);

      const tauxH = salaireNum / 191;
      if (anneesNum > 0) details.push(isAr
        ? `الفصول 1-5 سنوات: ${Math.min(anneesNum, 5).toFixed(1)} × 96 ساعة × ${tauxH.toFixed(2)} = ${formatMAD(Math.round(Math.min(anneesNum, 5) * 96 * tauxH))}`
        : `Tranche 1-5 ans : ${Math.min(anneesNum, 5).toFixed(1)} × 96h × ${tauxH.toFixed(2)} MAD/h = ${formatMAD(Math.round(Math.min(anneesNum, 5) * 96 * tauxH))}`);
      if (anneesNum > 5) details.push(isAr
        ? `الفصول 6-10 سنوات: ${Math.min(anneesNum - 5, 5).toFixed(1)} × 144 ساعة × ${tauxH.toFixed(2)} = ${formatMAD(Math.round(Math.min(anneesNum - 5, 5) * 144 * tauxH))}`
        : `Tranche 6-10 ans : ${Math.min(anneesNum - 5, 5).toFixed(1)} × 144h × ${tauxH.toFixed(2)} MAD/h = ${formatMAD(Math.round(Math.min(anneesNum - 5, 5) * 144 * tauxH))}`);
      if (anneesNum > 10) details.push(isAr
        ? `الفصول 11-15 سنوات: ${Math.min(anneesNum - 10, 5).toFixed(1)} × 192 ساعة = ${formatMAD(Math.round(Math.min(anneesNum - 10, 5) * 192 * tauxH))}`
        : `Tranche 11-15 ans : ${Math.min(anneesNum - 10, 5).toFixed(1)} × 192h × ${tauxH.toFixed(2)} MAD/h = ${formatMAD(Math.round(Math.min(anneesNum - 10, 5) * 192 * tauxH))}`);
      if (anneesNum > 15) details.push(isAr
        ? `أكثر من 15 سنة: ${(anneesNum - 15).toFixed(1)} × 240 ساعة = ${formatMAD(Math.round((anneesNum - 15) * 240 * tauxH))}`
        : `Tranche >15 ans : ${(anneesNum - 15).toFixed(1)} × 240h × ${tauxH.toFixed(2)} MAD/h = ${formatMAD(Math.round((anneesNum - 15) * 240 * tauxH))}`);

    } else if (motif === "retraite") {
      indemniteRetraite = calcIndemniteRetraite(anneesNum, salaireNum);
      details.push(isAr
        ? `تعويض التقاعد = نفس حساب الفصل (الفصل 74)`
        : `Indemnité retraite = même barème que licenciement (Art. 74)`);

    } else if (motif === "demission") {
      indemnitePreavis = calcIndemnitePreavis(salaireNum, preavisInfo.jours);
      details.push(isAr
        ? `عند الاستقالة: لا يحق الحصول على تعويض الفصل. تعويض الإخطار يُحسب فقط إذا لم يتم احترام مدة الإخطار من طرفك.`
        : `En cas de démission : pas d'indemnité de licenciement. Préavis dû par le salarié, sinon retenu.`);

    } else if (motif === "accord_mutuel") {
      indemniteLicenciement = Math.round(calcIndemniteLicenciement(anneesNum, salaireNum) * 0.5);
      details.push(isAr
        ? `الاتفاق المتبادل: التعويض قابل للتفاوض (عادة 50-100% من تعويض الفصل).`
        : `Accord mutuel : montant négocié, estimé ici à 50% de l'indemnité légale.`);
    }

    const preavisLabel = isAr ? preavisInfo.label_ar : preavisInfo.label_fr;

    setResult({
      indemniteLicenciement,
      indemnitePreavis,
      indemniteRetraite,
      totalBrut: indemniteLicenciement + indemnitePreavis + indemniteRetraite,
      preavisDuree: preavisLabel,
      details,
    });
  }

  function copyResult() {
    if (!result) return;
    const anneesNum = Number(annees) + Number(mois) / 12;
    const text = isAr
      ? `حساب تعويضات إنهاء عقد الشغل (مدونة الشغل المغربية)
الأقدمية: ${anneesNum.toFixed(1)} سنة | الأجر: ${salaire} درهم
${L.indemnite_lic}: ${formatMAD(result.indemniteLicenciement)}
${L.indemnite_preavis}: ${formatMAD(result.indemnitePreavis)}
${L.indemnite_retraite}: ${formatMAD(result.indemniteRetraite)}
${L.total}: ${formatMAD(result.totalBrut)}
${L.disclaimer}
المصدر: www.interactjob.ma/ar/code-travail`
      : `Calcul indemnités de rupture — Code du Travail Maroc
Ancienneté : ${anneesNum.toFixed(1)} an(s) | Salaire : ${salaire} MAD
${L.indemnite_lic} : ${formatMAD(result.indemniteLicenciement)}
${L.indemnite_preavis} : ${formatMAD(result.indemnitePreavis)}
${L.indemnite_retraite} : ${formatMAD(result.indemniteRetraite)}
${L.total} : ${formatMAD(result.totalBrut)}
${L.disclaimer}
Source : www.interactjob.ma/code-travail`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${isAr ? "text-right" : ""}`;
  const selectCls = inputCls + " bg-white";

  return (
    <div dir={dir} className="bg-white rounded-2xl border border-primary/20 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-5">
        <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
          <span className="text-3xl">🧮</span>
          <div className={isAr ? "text-right" : ""}>
            <h2 className="font-bold text-lg">{L.title}</h2>
            <p className="text-blue-100 text-xs mt-0.5">{L.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ancienneté */}
          <div>
            <label className={`block text-xs font-semibold text-gray-600 mb-1.5 ${isAr ? "text-right" : ""}`}>{L.anciennete}</label>
            <div className={`flex gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
              <div className="flex-1">
                <input type="number" min="0" max="50" value={annees} onChange={e => setAnnees(e.target.value)}
                  placeholder={isAr ? "مثال: 7" : "ex: 7"} className={inputCls} />
                <span className="text-xs text-gray-400 mt-0.5 block">{L.annees}</span>
              </div>
              <div className="flex-1">
                <select value={mois} onChange={e => setMois(e.target.value)} className={selectCls}>
                  {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                    <option key={m} value={m}>{m} {L.mois}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Salaire */}
          <div>
            <label className={`block text-xs font-semibold text-gray-600 mb-1.5 ${isAr ? "text-right" : ""}`}>{L.salaire}</label>
            <input type="number" min="0" value={salaire} onChange={e => setSalaire(e.target.value)}
              placeholder={isAr ? "مثال: 5000" : "ex: 5000"} className={inputCls} />
            <span className="text-xs text-gray-400 mt-0.5 block">{L.salaireHint}</span>
          </div>

          {/* Type contrat */}
          <div>
            <label className={`block text-xs font-semibold text-gray-600 mb-1.5 ${isAr ? "text-right" : ""}`}>{L.typeContrat}</label>
            <select value={typeContrat} onChange={e => setTypeContrat(e.target.value as TypeContrat)} className={selectCls}>
              <option value="cdi">{L.cdi}</option>
              <option value="cdd">{L.cdd}</option>
            </select>
          </div>

          {/* Motif */}
          <div>
            <label className={`block text-xs font-semibold text-gray-600 mb-1.5 ${isAr ? "text-right" : ""}`}>{L.motif}</label>
            <select value={motif} onChange={e => setMotif(e.target.value as MotifRupture)} className={selectCls}>
              <option value="licenciement">{L.licenciement}</option>
              <option value="demission">{L.demission}</option>
              <option value="retraite">{L.retraite}</option>
              <option value="accord_mutuel">{L.accord_mutuel}</option>
            </select>
          </div>

          {/* Catégorie */}
          <div className="sm:col-span-2">
            <label className={`block text-xs font-semibold text-gray-600 mb-1.5 ${isAr ? "text-right" : ""}`}>{L.categorie}</label>
            <div className={`grid grid-cols-3 gap-2 ${isAr ? "direction-rtl" : ""}`}>
              {(["cadre", "employe", "ouvrier"] as Categorie[]).map(cat => (
                <button key={cat} onClick={() => setCategorie(cat)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                    categorie === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                  }`}>
                  {L[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA button */}
        {!result ? (
          <button
            onClick={calculate}
            disabled={!canCalculate}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {L.calculer}
          </button>
        ) : (
          /* Results */
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className={`font-bold text-gray-900 text-sm mb-4 ${isAr ? "text-right" : ""}`}>{L.result_title}</h3>
              <div className="space-y-3">
                {[
                  { label: L.preavis_label, value: result.preavisDuree, highlight: false },
                  { label: L.indemnite_lic, value: result.indemniteLicenciement > 0 ? formatMAD(result.indemniteLicenciement) : L.na, highlight: false },
                  { label: L.indemnite_preavis, value: result.indemnitePreavis > 0 ? formatMAD(result.indemnitePreavis) : L.na, highlight: false },
                  { label: L.indemnite_retraite, value: result.indemniteRetraite > 0 ? formatMAD(result.indemniteRetraite) : L.na, highlight: false },
                  { label: L.total, value: formatMAD(result.totalBrut), highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 last:pt-2 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className={`text-sm ${highlight ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</span>
                    <span className={`font-bold ${highlight ? "text-primary text-lg" : "text-gray-800 text-sm"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            {result.details.length > 0 && (
              <details className="group">
                <summary className={`cursor-pointer text-xs text-primary font-medium flex items-center gap-1 list-none ${isAr ? "flex-row-reverse" : ""}`}>
                  <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {L.details_title}
                </summary>
                <div className="mt-2 space-y-1 bg-gray-50 rounded-xl p-4">
                  {result.details.map((d, i) => (
                    <p key={i} className={`text-xs text-gray-600 font-mono ${isAr ? "text-right" : ""}`}>{d}</p>
                  ))}
                </div>
              </details>
            )}

            {/* Disclaimer */}
            <p className={`text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed ${isAr ? "text-right" : ""}`}>
              ⚠️ {L.disclaimer}
            </p>

            {/* Actions */}
            <div className={`flex gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
              <button onClick={copyResult}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                {copied ? `✓ ${L.copied}` : `📋 ${L.copy}`}
              </button>
              <button onClick={() => setResult(null)}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                {L.reset}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
