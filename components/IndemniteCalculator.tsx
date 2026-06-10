"use client";
import { useState, useMemo } from "react";

type Result = {
  licenciement: number | null;
  preavis: number | null;
  retraite: number | null;
  detail: string[];
};

// Art. 53 — barème indemnité de licenciement (heures de salaire)
function heuresLicenciement(anciennete: number): number {
  if (anciennete < 1) return 0;
  if (anciennete <= 5) return 96;
  if (anciennete <= 10) return 144;
  if (anciennete <= 15) return 192;
  return 240;
}

// Art. 43 — durée préavis (jours)
function joursPreavis(anciennete: number, categorie: string): number {
  if (categorie === "cadre") {
    if (anciennete < 1) return 30;
    if (anciennete <= 5) return 60;
    return 90;
  }
  // employé / ouvrier
  if (anciennete < 1) return 8;
  if (anciennete <= 5) return 15;
  return 30;
}

function salaireJournalier(mensuel: number) { return mensuel / 26; }
function salaireHoraire(mensuel: number) { return mensuel / 191.66; }

export default function IndemniteCalculator({ isAr = false }: { isAr?: boolean }) {
  const [annees, setAnnees]       = useState("");
  const [mois, setMois]           = useState("");
  const [salaire, setSalaire]     = useState("");
  const [categorie, setCategorie] = useState("employe");
  const [motif, setMotif]         = useState("licenciement");
  const [copied, setCopied]       = useState(false);

  const result = useMemo<Result | null>(() => {
    const a = parseFloat(annees) || 0;
    const m = parseFloat(mois)   || 0;
    const s = parseFloat(salaire);
    if (!s || s <= 0) return null;

    const anciennete = a + m / 12;
    const detail: string[] = [];
    let licenciement: number | null = null;
    let preavis: number | null      = null;
    let retraite: number | null     = null;
    const taux = salaireHoraire(s);

    if (motif === "licenciement") {
      const h = heuresLicenciement(anciennete);
      licenciement = Math.round(h * taux);
      detail.push(`Art. 53 : ${h}h × ${taux.toFixed(2)} MAD/h`);
      const j = joursPreavis(anciennete, categorie);
      preavis = Math.round(j * salaireJournalier(s));
      detail.push(`Art. 43 préavis : ${j} jours × ${salaireJournalier(s).toFixed(2)} MAD/j`);
    } else if (motif === "retraite") {
      const h = heuresLicenciement(anciennete);
      retraite = Math.round(h * taux);
      detail.push(`Art. 74 : ${h}h × ${taux.toFixed(2)} MAD/h`);
    } else {
      const j = joursPreavis(anciennete, categorie);
      preavis = Math.round(j * salaireJournalier(s));
      detail.push(`Art. 43 (démission) : ${j} jours`);
    }

    return { licenciement, preavis, retraite, detail };
  }, [annees, mois, salaire, categorie, motif]);

  const total = (result?.licenciement ?? 0) + (result?.preavis ?? 0) + (result?.retraite ?? 0);

  function handleCopy() {
    if (!result) return;
    const lines = [
      "📊 Résultat — Calculateur Indemnités InteractJob",
      `Ancienneté : ${annees || 0} ans ${mois || 0} mois`,
      `Salaire brut : ${salaire} MAD`,
      result.licenciement != null ? `Indemnité licenciement (Art. 53) : ${result.licenciement.toLocaleString("fr-FR")} MAD` : "",
      result.preavis      != null ? `Indemnité préavis (Art. 43-44) : ${result.preavis.toLocaleString("fr-FR")} MAD`      : "",
      result.retraite     != null ? `Indemnité retraite (Art. 74) : ${result.retraite.toLocaleString("fr-FR")} MAD`       : "",
      `TOTAL ESTIMÉ : ${total.toLocaleString("fr-FR")} MAD`,
      "",
      "⚠️ Ce calcul est indicatif. Consultez un juriste pour votre situation.",
      "Calculé sur interactjob.ma/code-travail",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const t = {
    title:      isAr ? "حاسبة التعويضات"                  : "Calculateur d'indemnités",
    subtitle:   isAr ? "الفصول 43، 53، 74 — مدونة الشغل"  : "Art. 43, 53, 74 — Code du Travail Maroc",
    anciennete: isAr ? "الأقدمية"                          : "Ancienneté",
    years:      isAr ? "سنوات"                             : "Années",
    months:     isAr ? "أشهر"                              : "Mois",
    salaire:    isAr ? "الراتب الشهري الإجمالي (MAD)"      : "Salaire mensuel brut (MAD)",
    categorie:  isAr ? "الفئة المهنية"                     : "Catégorie professionnelle",
    cadre:      isAr ? "إطار"                              : "Cadre",
    employe:    isAr ? "موظف"                              : "Employé",
    ouvrier:    isAr ? "عامل"                              : "Ouvrier",
    motif:      isAr ? "سبب انتهاء العقد"                  : "Motif de rupture",
    licenciement: isAr ? "فصل من العمل" : "Licenciement",
    demission:    isAr ? "استقالة"       : "Démission",
    retraite:     isAr ? "تقاعد"         : "Départ retraite",
    resultTitle:  isAr ? "النتيجة التقديرية" : "Résultat estimé",
    indemLic:   isAr ? "تعويض الفصل (الفصل 53)"      : "Indemnité licenciement (Art. 53)",
    indemPre:   isAr ? "تعويض الإخطار (الفصل 43-44)" : "Indemnité préavis (Art. 43-44)",
    indemRet:   isAr ? "تعويض التقاعد (الفصل 74)"    : "Indemnité retraite (Art. 74)",
    total:      isAr ? "الإجمالي التقديري" : "Total estimé",
    copy:       isAr ? "نسخ النتيجة"       : "Copier le résultat",
    copied:     isAr ? "تم النسخ ✓"        : "Copié ✓",
    enterSalaire: isAr ? "أدخل راتبك للحساب" : "Renseignez votre salaire pour calculer",
    disclaimer: isAr
      ? "هذا الحساب تقديري فقط. للحصول على المبلغ الدقيق، استشر محامياً متخصصاً في قانون الشغل."
      : "Ce calcul est indicatif. Consultez un juriste spécialisé pour votre situation spécifique.",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" dir={isAr ? "rtl" : "ltr"} id="calculateur">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-700 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧮</span>
          <div>
            <h2 className="font-bold text-lg">{t.title}</h2>
            <p className="text-blue-100 text-xs mt-0.5">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Ancienneté */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.anciennete}</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input type="number" min="0" max="50" value={annees} onChange={e => setAnnees(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t.years}</span>
            </div>
            <div className="relative">
              <input type="number" min="0" max="11" value={mois} onChange={e => setMois(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t.months}</span>
            </div>
          </div>
        </div>

        {/* Salaire */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.salaire}</label>
          <div className="relative">
            <input type="number" min="0" value={salaire} onChange={e => setSalaire(e.target.value)}
              placeholder="ex: 8 000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">MAD</span>
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.categorie}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["cadre", "employe", "ouvrier"] as const).map(c => (
              <button key={c} onClick={() => setCategorie(c)}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  categorie === c ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                }`}
              >{t[c]}</button>
            ))}
          </div>
        </div>

        {/* Motif */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.motif}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["licenciement", "demission", "retraite"] as const).map(m => (
              <button key={m} onClick={() => setMotif(m)}
                className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                  motif === m ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                }`}
              >{t[m]}</button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && salaire ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-bold text-green-900">{t.resultTitle}</p>
            {result.licenciement != null && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t.indemLic}</span>
                <span className="font-bold text-gray-900">{result.licenciement.toLocaleString("fr-FR")} MAD</span>
              </div>
            )}
            {result.preavis != null && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t.indemPre}</span>
                <span className="font-bold text-gray-900">{result.preavis.toLocaleString("fr-FR")} MAD</span>
              </div>
            )}
            {result.retraite != null && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t.indemRet}</span>
                <span className="font-bold text-gray-900">{result.retraite.toLocaleString("fr-FR")} MAD</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-green-200">
              <span className="font-bold text-green-900">{t.total}</span>
              <span className="text-xl font-extrabold text-green-700">{total.toLocaleString("fr-FR")} MAD</span>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5 pt-1">
              {result.detail.map((d, i) => <p key={i}>· {d}</p>)}
            </div>
            <button onClick={handleCopy}
              className="w-full mt-2 bg-white border border-green-300 text-green-700 hover:bg-green-50 font-semibold text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {copied ? `✓ ${t.copied}` : `📋 ${t.copy}`}
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400 border border-dashed border-gray-200">
            {t.enterSalaire}
          </div>
        )}

        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-100 leading-relaxed">
          ⚠️ {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
