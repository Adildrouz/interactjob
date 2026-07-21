# InteractJob Agent

Agent automatique de scraping et d'enrichissement d'offres d'emploi marocaines.

## Fonctionnement

L'agent tourne tous les jours à **08h00 (heure du Maroc)** via un cron interne. Il :

1. Scrape 4 flux RSS en parallèle (Rekrute, Emploi.ma, Bayt, Indeed Maroc)
2. Déduplique par rapport aux offres existantes dans `data/jobs.json`
3. Enrichit chaque nouvelle offre via Claude (claude-sonnet-4-6)
4. Expire les offres de plus de 30 jours
5. Met à jour `data/jobs.json` et `data/linkedin-queue.txt`

## Installation

```bash
cd agent
npm install
cp .env.example .env
# Éditez .env et ajoutez votre clé ANTHROPIC_API_KEY
```

## Configuration

Créez un fichier `.env` dans le dossier `agent/` :

```
ANTHROPIC_API_KEY=sk-ant-...
SITE_URL=https://interactjob.vercel.app
```

## ⚠️ Ne jamais lancer l'agent en local avec le GITHUB_TOKEN/GITHUB_REPO de production

`agent.js` lit et écrit `data/jobs.json` sur disque, et `syncJobsFromGithub()`
tire la version de `main` au tout début de chaque run. Si vous lancez l'agent
en local avec un `GITHUB_TOKEN`/`GITHUB_REPO` pointant vers le dépôt de
production, un run local peut écraser votre `data/jobs.json` local, ou —
si `pushToGithub()` est appelé — pousser un état généré localement
(flux RSS différents, run partiel, etc.) directement sur `main`.

**Pour tester en local :** pointez `GITHUB_REPO` vers un fork, **ou**
laissez `GITHUB_TOKEN` vide/absent (`syncJobsFromGithub()` et
`pushToGithub()` no-op silencieusement sans token).

## Garde-fous contre la perte silencieuse de données

Deux incidents (2026-07-18 puis 2026-07-19/20) ont fait disparaître des
dizaines d'offres Direct : un run a silencieusement continué avec une copie
locale périmée de `jobs.json` (au lieu d'échouer) après un raté de sync
GitHub, puis a repoussé cet état périmé sur `main`. Trois garde-fous
protègent maintenant contre cette classe de bug :

- **`deduplicator.js#loadJobs()`** — une erreur de lecture/parsing de
  `jobs.json` fait échouer le run (`throw`), au lieu de retourner `[]` et de
  laisser le pipeline repartir de zéro.
- **`github-sync.js#syncJobsFromGithub()`** — un échec de pull GitHub fait
  échouer le run entier, au lieu de continuer silencieusement avec la copie
  locale périmée. Avant d'écraser `data/jobs.json` local avec le contenu
  récupéré, une sauvegarde (`jobs.json.bak`) est prise et le nombre d'offres
  (total + Direct) est comparé : une baisse de plus de 20% fait échouer le
  run plutôt que d'écrire.
- **`agent.js`** (étape 6, écriture finale) — même garde-fou de baisse de
  20% et même sauvegarde `jobs.json.bak`, juste avant l'écriture du
  `jobs.json` fusionné/enrichi.

La logique de seuil est centralisée dans `agent/job-safety.js`
(`assertNoSuspiciousDrop`), utilisée à la fois par `github-sync.js` et
`agent.js`.

## Utilisation

### Mode test (sans écriture de fichiers)

Enrichit les 2 premières offres par source et affiche le résultat en console. Aucun fichier n'est modifié.

```bash
npm test
# ou
node agent.js --test
```

### Lancement manuel

Lance le cron et attend 08h00 pour exécuter.

```bash
npm start
# ou
node agent.js
```

### Exécution immédiate (sans attendre le cron)

```bash
node -e "import('./agent.js').then(m => m.run?.())"
```

## Déploiement avec PM2

```bash
npm install -g pm2
cd agent
pm2 start agent.js --name interactjob-agent
pm2 save
pm2 startup   # pour démarrage automatique au boot
```

Commandes utiles PM2 :

```bash
pm2 logs interactjob-agent   # voir les logs en temps réel
pm2 status                   # état du processus
pm2 restart interactjob-agent
pm2 stop interactjob-agent
```

## Logs

Les logs journaliers se trouvent dans :

```
data/logs/agent-YYYY-MM-DD.log
```

Format des entrées : `[HH:MM:SS] message`

## File d'attente LinkedIn

Les captions générées sont ajoutées à :

```
data/linkedin-queue.txt
```

Format de chaque ligne :

```
[YYYY-MM-DD] | [Source] | [caption LinkedIn ↗] | [URL de l'offre]
```

## Sources RSS

| Nom        | Site          | Feed URL |
|------------|---------------|----------|
| Rekrute    | Rekrute.com   | `https://www.rekrute.com/offres.rss` |
| Emploi.ma  | Emploi.ma     | `https://www.emploi.ma/rss/offres-emploi.rss` |
| Bayt       | Bayt.com      | `https://www.bayt.com/en/international/jobs/rss/?country_id=149` |
| Indeed     | Indeed Maroc  | `https://ma.indeed.com/rss?q=&l=Maroc` |

## WhatsApp Auto-Posting

Génère et envoie (ou sauvegarde) un digest quotidien des meilleures offres dans la chaîne WhatsApp InteractJob.

### Mode 1 — Manuel (par défaut, sans configuration)

Le message du jour est généré automatiquement et sauvegardé dans :

```
data/whatsapp-queue.txt
```

Copiez-collez le message dans votre chaîne WhatsApp chaque matin. Temps : 30 secondes.

**Tester immédiatement :**

```bash
node agent.js --whatsapp
```

### Mode 2 — Automatique (WhatsApp Business API)

Nécessite un compte Meta Business vérifié.

1. Créer une app sur [developers.facebook.com](https://developers.facebook.com)
2. Activer **WhatsApp Business API** dans l'app
3. Récupérer : Access Token permanent, Phone Number ID, Channel ID
4. Ajouter dans `agent/.env` :

```env
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_CHANNEL_ID=your_channel_id
```

L'envoi est alors 100% automatique à **09h00** chaque matin (via PM2 `interactjob-whatsapp`).

### Logique de sélection des offres

- Jobs scrapés dans les dernières 24h (fallback : jobs actifs les plus récents)
- Priorité 1 : Hôtellerie (niche principale)
- Priorité 2 : IT, RH, Finance, Administratif, Commerce
- Maximum 8 offres par message
- Formatage via Claude API (fallback texte brut si API indisponible)

### Déploiement PM2 (avec le nouveau process)

```bash
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

Trois processes actifs :
| Process | Schedule | Description |
|---|---|---|
| `interactjob-agent` | 08h00 quotidien | Scraping + enrichissement |
| `interactjob-whatsapp` | 09h00 quotidien | Digest WhatsApp |
| `interactjob-blog` | 09h00 lundi | Rédaction articles blog |

## Structure des fichiers

```
agent/
├── agent.js          # Point d'entrée, orchestrateur principal
├── whatsapp.js       # Digest WhatsApp quotidien
├── parser.js         # Scraping et normalisation des flux RSS
├── deduplicator.js   # Chargement de jobs.json et déduplication
├── enricher.js       # Enrichissement via Claude API
├── expirer.js        # Expiration des offres et limite MAX_JOBS (500)
├── job-safety.js     # Garde-fou anti-baisse-suspecte (jobs.json write + GitHub sync)
├── logger.js         # Logger journalier
├── package.json
├── .env.example
└── README.md
```
