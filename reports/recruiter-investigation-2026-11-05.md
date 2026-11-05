# Parcours recruteur — constat et correctif du 5 novembre 2026

## Preuves en production InteractJob.ma avant correction

- Déploiement contrôlé : `dpl_FKRR4URw5jCJKK3RWz3iBMgFwFEf`, créé le 2 novembre ; branche main, source `b5d5d54bf71e655416201974ce526ea991673ca3`.
- L’adresse `/employeur/verify-email` envoyée dans les emails affiche une page 404. Seule la route `/api/employer/auth/verify-email` existe dans cette version.
- 24 comptes disposant d’un mot de passe, hors comptes de démonstration : 24 non activés. Les 48 entrées du fichier employeurs ne sont pas toutes des comptes inscrits : ne pas confondre ce total avec les 24 comptes.
- Des emails d’activation ont bien été envoyés les 28 et 30 octobre, puis les 3 et 4 novembre (métadonnées Gmail). Leur présence dans les envois ne prouve pas leur arrivée en boîte principale, mais confirme que le défaut ne se réduit pas à une absence d’envoi.
- Journaux Vercel des 3 derniers jours : inscriptions HTTP 200 puis tentatives répétées de connexion HTTP 403 et réinscriptions HTTP 409. Le code refuse les connexions aux comptes non activés.
- Sur 30 jours, `page_views` compte 30 visites de `/employeur/verify-email`, 26 de `/employeur/inscription`, 15 de `/employeur/connexion`, 34 de `/publier` et `/en/publier` réunis, et 54 des pages recruteurs dans les trois langues. Ce sont des compteurs de visites, pas des personnes uniques ni des soumissions.
- Zéro annonce actuellement en attente dans `data/pending-jobs.json` sur GitHub et zéro dans la vue admin. Aucun dépôt caché supplémentaire n’a été retrouvé dans cette file lors du contrôle.
- Six demandes de contact recruteur existent dans l’administration : deux contactées, deux closes, deux nouvelles. Certaines sont des recherches d’emploi ou des clients existants ; ce ne sont pas six nouveaux mandats à relancer indistinctement. Des suivis du 28 octobre existent déjà.
- La route publique écrit les demandes dans GitHub, mais la liste admin lit uniquement le fichier embarqué au déploiement et renvoie une liste vide en cas d’erreur. Défaut confirmé dans le code ; il ne démontre pas à lui seul une perte historique d’annonces.
- La notification de dépôt est lancée sans attente ni `after()` ; elle peut être interrompue en environnement serverless. Risque confirmé par le code, pas preuve que chaque email historique a été perdu.

## Conclusion

Il y a eu de l’intérêt et des tentatives. Le blocage principal confirmé est l’adresse d’activation inexistante, aggravée par l’absence de renvoi du lien. La page recruteurs privilégie cette inscription alors qu’un dépôt gratuit sans compte existe déjà. La visibilité faible de ce dépôt contribue probablement à la faible conversion ; cette dernière explication reste une inférence.

## Correctif isolé

- Rendre les liens d’activation déjà envoyés utilisables en réutilisant le même validateur ; activation atomique, liens nouveaux valides 24 heures et usage unique.
- Renvoyer l’activation depuis les écrans recruteurs, après vérification du mot de passe existant, avec un délai minimum d’une minute. Ne pas activer automatiquement les comptes de vrais recruteurs.
- Ne pas annoncer un email envoyé quand l’envoi a échoué. L’échec de l’email de bienvenue ne doit pas annuler une activation réussie.
- Proposer en priorité le dépôt gratuit sans compte dans la navigation, sur mobile, sur la page recruteurs et dans les écrans d’inscription/connexion.
- Autoriser le profil recherché dans la description, afficher les erreurs de contrat, désactiver le bouton pendant l’envoi et distinguer réception de l’annonce et publication après modération.
- Lire la file GitHub à jour dans l’admin, afficher une vraie erreur si elle est inaccessible, et préserver les données lors des erreurs de lecture.
- Utiliser la version exacte du fichier pour ajouter une demande, et réessayer les collisions entre deux dépôts simultanés.
- Conserver le dépôt avant notification, exécuter les emails dans `after()`, confirmer la réception au déposant avec une référence, et enregistrer les succès/échecs de notification.
- Ajouter des étapes du parcours sans coordonnées personnelles dans `tool_events` et un suivi dans la vue d’ensemble admin.

## Vérifications avant mise en ligne

- 14 tests automatisés ciblés réussis, dont collisions GitHub, erreurs de stockage, erreurs email, lecture admin et activation.
- Essai réel dans `interactjob_dev` : inscription, rotation du lien, délai de renvoi, expiration, activation et impossibilité de réutiliser le lien. Emails simulés ; seul le compte jetable créé par l’essai a été retiré.
- TypeScript et lint ciblé : réussis.
- Compilation de production : réussie, 15 482 pages générées. Premier essai bloqué par l’accès réseau aux polices ; deuxième essai avec accès réseau réussi.
- Aucun nouveau service payant, aucun appel de génération IA, aucune relance de vrais recruteurs, aucune modification manuelle de leur activation.

## Périmètre complémentaire .com

La page publique `.com/fr/publier` a également été consultée : elle conserve des champs marocains et les deux formules gratuit/sponsorisé. Le code local `.com` enregistre dans `pending_jobs` MongoDB sans notification email. Ce sont des défauts distincts ; le correctif principal de ce dossier concerne le blocage confirmé des comptes recruteurs `.ma`. Ne pas annoncer un correctif `.com` déployé sur la base de ces changements.

## Sources internes

- [Dépôt gratuit](https://www.interactjob.ma/publier)
- [Espace recruteur](https://www.interactjob.ma/employeur/connexion)
- [Demandes d’annonces](https://www.interactjob.ma/admin/offres)
- [Comptes recruteurs](https://www.interactjob.ma/admin/employeurs)
- [Demandes de contact](https://www.interactjob.ma/admin/leads)

La mise en ligne et l’essai de production doivent être documentés séparément après confirmation effective du déploiement.
