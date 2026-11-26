# Incident de dépôt d’annonce - 26 novembre 2026

## Constats

- Le suivi de production sur 7 jours indique 19 vues, 3 débuts, 3 tentatives, 3 erreurs client et 3 erreurs de stockage, sans dépôt confirmé.
- Les journaux de `/api/jobs/submit` indiquent `GitHub API 401: Bad credentials`. La file admin `/api/admin/jobs` retourne 503. L’ancien secret GitHub de production avait été configuré 183 jours auparavant ; sa cause précise d’invalidation n’est pas déduite de son âge.
- La demande n’était reconnue comme reçue qu’après écriture dans GitHub. Une clé invalide bloquait donc aussi bien le dépôt public que la consultation de la file d’attente.
- Le contact Espace M24 a signalé un problème de dépôt, puis a écrit qu’il cherchait lui-même un emploi de cuisinier à Casablanca. Sa qualité d’employeur reste donc à clarifier. Aucune annonce n’est publiée à son nom et aucun message ne lui est envoyé automatiquement.
- Les champs des demandes ayant échoué ne figurent pas dans les événements anonymes : ils ne sont pas récupérables à partir de ces événements. Les trois erreurs ne sont pas attribuées à trois employeurs distincts.

## Correctifs

- Renouvellement du secret de sauvegarde GitHub avec accord explicite d’Adil, sans exposition de la clé.
- Stockage durable des nouveaux dépôts dans MongoDB, déjà utilisé par le service, sans dépendance à un commit GitHub pour accuser réception.
- Fusion des files historique et MongoDB dans l’admin, avertissement si synchronisation historique indisponible, suivi des décisions de modération.
- Brouillon limité à l’onglet, reprise après rechargement, clé de reprise liée au contenu pour éviter les doublons, délai de confirmation limité et message explicite.
- Erreurs de validation suivies sans contenu personnel ; coordonnées et texte de l’annonce absents des événements anonymes.
- Contrat « À préciser », libellés accessibles et alternative email préremplie. Orientation des chercheurs d’emploi vers les offres.

## Vérification

Tests de sauvegarde indépendante de GitHub, reprise idempotente, modification du contenu, fusion et résolution de la file, échec de base, erreur SMTP sans perte du dépôt, validation et scénarios de compte employeur. Le test de production utilise exclusivement une annonce interne non publiée et une adresse InteractJob.
