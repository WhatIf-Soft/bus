# Spécifications Fonctionnelles — Système de Réservation de Bus en Ligne

**Projet :** BusExpress  
**Version :** 2.0 — Complète  
**Date :** Avril 2026  
**Statut :** Validé  
**Audience :** Équipe technique, Product Owners, Parties prenantes

> **Journal des modifications v1.0 → v2.0**  
> Intégration de l'audit complet : 18 lacunes critiques corrigées, 27 améliorations de specs existantes, 12 nouveaux modules ajoutés, 6 incohérences internes résolues. Le document passe de 54 à **127 spécifications fonctionnelles** et de 13 à **23 sections**.

---

## Table des matières

1. [Présentation générale du système](#1-présentation-générale-du-système)
2. [Module : Recherche de trajets](#2-module--recherche-de-trajets)
3. [Module : Sélection de siège](#3-module--sélection-de-siège)
4. [Module : Réservation et paiement](#4-module--réservation-et-paiement)
5. [Module : Compte voyageur](#5-module--compte-voyageur)
6. [Module : Billets électroniques et embarquement](#6-module--billets-électroniques-et-embarquement)
7. [Module : Suivi GPS et notifications](#7-module--suivi-gps-et-notifications)
8. [Module : Portail opérateur de bus](#8-module--portail-opérateur-de-bus)
9. [Module : Administration back-office](#9-module--administration-back-office)
10. [Module : Avis et notation](#10-module--avis-et-notation)  *(nouveau)*
11. [Module : Liste d'attente](#11-module--liste-dattente)  *(nouveau)*
12. [Module : Support client](#12-module--support-client)  *(nouveau)*
13. [Module : Réconciliation financière opérateur](#13-module--réconciliation-financière-opérateur)  *(nouveau)*
14. [Module : Gestion des bagages](#14-module--gestion-des-bagages)  *(nouveau)*
15. [Module : Comptes entreprise et groupes](#15-module--comptes-entreprise-et-groupes)  *(nouveau)*
16. [Module : Parrainage et referral](#16-module--parrainage-et-referral)  *(nouveau)*
17. [Module : Canal USSD et SMS basique](#17-module--canal-ussd-et-sms-basique)  *(nouveau)*
18. [Module : Intermodalité et dernier kilomètre](#18-module--intermodalité-et-dernier-kilomètre)  *(nouveau)*
19. [Module : API publique partenaires](#19-module--api-publique-partenaires)  *(nouveau)*
20. [Exigences non fonctionnelles](#20-exigences-non-fonctionnelles)
21. [Modèle de données](#21-modèle-de-données)
22. [Interfaces et intégrations externes](#22-interfaces-et-intégrations-externes)
23. [Plan de livraison — Priorités](#23-plan-de-livraison--priorités)

---

## 1. Présentation générale du système

### 1.1 Contexte et objectifs

Le système BusExpress est une application web de réservation de tickets de bus en ligne, conçue pour connecter les voyageurs aux compagnies de transport routier d'Afrique de l'Ouest et au-delà. Il vise à moderniser un marché traditionnellement fragmenté en proposant une plateforme unifiée, disponible 24h/24, accessible sur mobile comme sur desktop, supportant les méthodes de paiement locales (Mobile Money, USSD, carte bancaire) et adaptée aux contraintes de connectivité variable des marchés cibles.

#### 1.1.1 Objectifs business

- Digitaliser le processus d'achat de tickets, réduire les files d'attente aux guichets
- Connecter les opérateurs locaux (PME) à une audience numérique élargie, y compris les entreprises (segment B2B)
- Générer des revenus par commissions sur chaque transaction (modèle marketplace) et services premium
- Collecter des données d'usage pour optimiser les tarifs, horaires et l'expérience voyageur
- Atteindre un taux de rétention de 60 % à 6 mois et un NPS ≥ 45

#### 1.1.2 Objectifs techniques

- Disponibilité cible : 99,9 % (moins de 8,7 heures d'indisponibilité par an)
- Temps de réponse des recherches : inférieur à 800 ms au P95
- Support de 10 000 utilisateurs simultanés au lancement, extensible à 100 000
- Zéro double-booking grâce au verrouillage distribué Redis (algorithme Redlock multi-nœuds)
- RPO (Recovery Point Objective) : 1 heure maximum ; RTO (Recovery Time Objective) : 4 heures maximum

### 1.2 Périmètre fonctionnel

Le système couvre dix-neuf domaines fonctionnels :

1. Recherche et consultation des trajets disponibles
2. Sélection interactive des sièges
3. Réservation et paiement sécurisé (incluant guest checkout)
4. Gestion du compte voyageur (historique, profil, fidélité, 2FA)
5. Billets électroniques, QR Code et embarquement
6. Suivi GPS et notifications multi-canaux (dont WhatsApp)
7. Portail de gestion opérateur avec multi-agences
8. Administration back-office
9. Avis et notation des opérateurs
10. Liste d'attente pour trajets complets
11. Support client intégré
12. Réconciliation financière opérateur
13. Gestion des bagages
14. Comptes entreprise et tarifs groupes (B2B)
15. Programme de parrainage et referral
16. Canal de réservation USSD/SMS
17. Intermodalité et dernier kilomètre
18. API publique partenaires
19. Assistant IA conversationnel *(Phase 3)*

### 1.3 Acteurs du système

| Acteur | Description | Canaux d'accès |
|---|---|---|
| Voyageur (Utilisateur final) | Personne qui recherche, réserve et paie un ticket de bus | Web PWA, Application mobile, SMS, USSD, WhatsApp |
| Voyageur invité | Réservation sans création de compte (guest checkout) | Web, Mobile |
| Passager corporate | Employé d'une entreprise cliente avec compte B2B | Web, Mobile, API entreprise |
| Opérateur de bus | Compagnie de transport qui gère ses lignes et sièges | Portail web opérateur |
| Agent opérateur | Employé d'une agence régionale d'un opérateur | Portail web (sous-compte) |
| Contrôleur à bord | Personnel chargé de scanner les billets à l'embarquement | Application mobile de scan |
| Chauffeur | Conducteur affecté à un trajet | Application mobile conducteur (lecture seule) |
| Administrateur plateforme | Gestionnaire interne qui supervise et configure le système | Back-office web sécurisé |
| Agent support | Opérateur du service client BusExpress | Interface support interne |
| Partenaire agrégateur | Tiers accédant aux données via l'API publique | API REST publique |
| Système de paiement | Passerelles bancaires et Mobile Money | API REST |
| Système GPS tiers | Fournisseur de localisation temps réel des bus | API WebSocket / REST |

### 1.4 Contraintes du marché cible

- **Connectivité :** forte proportion d'utilisateurs en 2G/3G ; les fonctionnalités critiques doivent fonctionner sur des connexions à 1 Mbit/s
- **Terminaux :** 40-50 % des utilisateurs n'ont pas de smartphone avec connexion stable → nécessité du canal USSD
- **Paiement :** majorité des transactions via Mobile Money (Wave, Orange Money, MTN MoMo) ; faible taux de bancarisation
- **Langue :** prédominance du français, mais besoin de support des langues locales (fon, éwé, dioula, wolof)
- **Réglementation :** obligation de manifeste passager selon les lois de transport routier locales

---

## 2. Module : Recherche de trajets

### 2.1 Vue d'ensemble

Le module de recherche est le point d'entrée principal du parcours voyageur. Il permet de trouver des trajets disponibles entre deux arrêts pour une date donnée, avec prise en charge des trajets directs et des correspondances. La recherche s'appuie sur un index ElasticSearch (algorithme BM25) pour la pertinence textuelle, et sur l'algorithme A* pour le calcul des itinéraires optimaux. Les données de disponibilité sont rafraîchies en continu via une stratégie stale-while-revalidate pour rester cohérentes sans surcharger les serveurs.

### 2.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-RCH-01 | Formulaire de recherche principal | L'interface présente un formulaire avec les champs : Ville de départ (autocomplétion), Ville d'arrivée (autocomplétion), Date de départ, et la sélection du type et du nombre de passagers par catégorie tarifaire (adulte, enfant 2-11 ans, senior 60+, étudiant avec justificatif). La validation s'effectue en temps réel côté client. Maximum 9 passagers au total par recherche. | MUST | Voyageur |
| SF-RCH-02 | Autocomplétion des arrêts | Dès 2 caractères saisis, le système propose les arrêts correspondants en moins de 200 ms. Les suggestions incluent les variantes orthographiques et les alias locaux (ex : "Cot" → "Cotonou", "Cotonou-Ville"). Structure Trie en mémoire pour les lookups de préfixes. Les 3 dernières destinations recherchées par l'utilisateur apparaissent en premier. | MUST | Voyageur |
| SF-RCH-03 | Recherche de trajets directs | Le système retourne tous les trajets directs disponibles triés par heure de départ par défaut. Les données de disponibilité sont servies depuis le cache Redis (TTL 60 s). Une bannière indique la fraîcheur des données avec timestamp de dernière mise à jour. | MUST | Voyageur |
| SF-RCH-04 | Recherche avec correspondances | Si aucun trajet direct n'existe ou si l'utilisateur le demande, le système calcule les itinéraires avec 1 correspondance maximum via l'algorithme A*. Le temps de correspondance minimum est configurable par l'opérateur (défaut : 30 minutes). | SHOULD | Voyageur |
| SF-RCH-05 | Filtres de résultats | Filtres disponibles : plage horaire, type de bus (standard / climatisé / couchette / VIP), opérateur, prix maximum, durée maximale, équipements (Wi-Fi, prises, toilettes), catégorie de confort. Les filtres s'appliquent côté client sur les données chargées. La durée de validité des données affichées est de 60 secondes ; un indicateur "Résultats mis à jour" apparaît après rafraîchissement silencieux (stale-while-revalidate). | MUST | Voyageur |
| SF-RCH-06 | Tri des résultats | Cinq options de tri : Prix croissant, Prix décroissant, Durée la plus courte, Départ le plus tôt, Note opérateur (alimentée par le module Section 10). Le tri par défaut est « Recommandé » (score composite : 40 % prix, 30 % durée, 20 % note opérateur, 10 % taux de ponctualité). | MUST | Voyageur |
| SF-RCH-07 | Affichage de la carte des arrêts | Chaque résultat indique le point de départ et d'arrivée sur une carte miniature (OpenStreetMap, sans dépendance Google Maps). Un clic ouvre une vue carte plein écran avec géolocalisation de l'utilisateur et les arrêts à proximité. | SHOULD | Voyageur |
| SF-RCH-08 | Recherche aller-retour | En mode aller-retour, les résultats pour le trajet retour s'affichent dans un second panneau. La sélection des deux trajets se fait en une seule session avant paiement. | MUST | Voyageur |
| SF-RCH-09 | Historique des recherches | Les paramètres des 10 dernières recherches distinctes sont sauvegardés en localStorage. À la prochaine visite, le formulaire est pré-rempli avec la dernière recherche, et un menu déroulant propose les recherches récentes. Effacement possible depuis les paramètres. | SHOULD | Voyageur |
| SF-RCH-10 | Mode hors-ligne | Les résultats de la dernière recherche sont mis en cache par le Service Worker (stratégie Cache First). En mode hors-ligne, l'utilisateur voit les données mises en cache avec un bandeau d'avertissement précisant la date de mise en cache. Les billets confirmés sont toujours accessibles hors-ligne. | SHOULD | Voyageur |
| SF-RCH-11 | Tarifs différenciés par catégorie | Le système calcule automatiquement le prix pour chaque catégorie de passager : adulte (prix de référence), enfant 2-11 ans (réduction configurable par opérateur, défaut 50 %), senior 60+ (réduction configurable, défaut 20 %), étudiant (réduction sur justificatif). Le récapitulatif affiche le détail du tarif par passager. | MUST | Voyageur |
| SF-RCH-12 | Alerte de prix (Price Alert) | L'utilisateur peut s'abonner à une alerte pour une route et une période données. Lorsque le prix passe sous un seuil défini, une notification push/email/SMS est envoyée. L'alerte expire automatiquement 7 jours après la date de voyage ou à la réservation. Maximum 5 alertes actives par compte. | SHOULD | Voyageur |
| SF-RCH-13 | Gestion des fuseaux horaires | Toutes les heures de départ et d'arrivée sont stockées en UTC et converties dans le fuseau horaire local du point concerné (départ en heure locale de la ville de départ, arrivée en heure locale de la ville d'arrivée). L'interface affiche clairement les deux fuseaux si différents (ex : "14h00 GMT+1 → 16h30 GMT+0"). | MUST | Voyageur |
| SF-RCH-14 | Abonnement trajet récurrent | Les voyageurs réguliers peuvent créer un abonnement hebdomadaire ou mensuel sur un trajet fixe. L'abonnement génère automatiquement les réservations selon la fréquence choisie. Facturation mensuelle regroupée. Annulation de l'abonnement avec préavis de 72 h. | COULD | Voyageur |

### 2.3 Cas d'utilisation principal : UC-RCH-01

**Titre :** Rechercher un trajet de bus avec sélection de catégories tarifaires  
**Acteur principal :** Voyageur (authentifié ou anonyme)  
**Préconditions :** L'utilisateur accède à la page d'accueil de l'application  
**Déclencheur :** L'utilisateur saisit des informations dans le formulaire de recherche

**Scénario nominal :**
1. L'utilisateur saisit la ville de départ → autocomplétion affichée, recherches récentes proposées
2. L'utilisateur saisit la ville d'arrivée → autocomplétion affichée
3. L'utilisateur sélectionne la date de départ
4. L'utilisateur sélectionne les catégories de passagers (ex : 2 adultes, 1 enfant)
5. L'utilisateur clique sur « Rechercher »
6. Le système interroge l'index ElasticSearch et le cache Redis, calcule les prix différenciés
7. La liste des trajets disponibles s'affiche en moins de 800 ms avec les prix exacts par catégorie
8. L'utilisateur applique des filtres si nécessaire ; les données se rafraîchissent silencieusement toutes les 60 s
9. L'utilisateur sélectionne un trajet → redirection vers la sélection de siège

**Exceptions :**
- E1 : Aucun trajet disponible → message « Aucun bus disponible » + suggestion des 3 dates proches avec disponibilité
- E2 : Erreur réseau → affichage des données mises en cache avec avertissement horodaté
- E3 : Trajet complet → affichage de l'option liste d'attente (Module 11)
- E4 : Fuseau horaire incohérent détecté → avertissement clair avec les deux fuseaux horaires affichés

**Postconditions :** Le voyageur dispose d'une liste de trajets triés, filtrés et tarifés par catégorie, prêts à être sélectionnés.

### 2.4 Règles métier — Recherche

- **RG-RCH-01 :** Une recherche sans résultat affiche automatiquement les 3 dates proches avec disponibilité
- **RG-RCH-02 :** Les prix affichés incluent toutes les taxes et frais applicables (affichage TTC)
- **RG-RCH-03 :** La disponibilité affichée est actualisée silencieusement toutes les 60 secondes (stale-while-revalidate)
- **RG-RCH-04 :** Si moins de 5 sièges restants, le système affiche « Plus que X places disponibles » en orange
- **RG-RCH-05 :** Les trajets affichant 0 siège disponible restent visibles mais marqués « Complet — rejoindre la liste d'attente »
- **RG-RCH-06 :** Les réductions tarifaires (enfant, senior, étudiant) sont configurables par opérateur dans le portail. L'opérateur peut désactiver certaines catégories sur certaines lignes
- **RG-RCH-07 :** Une alerte de prix (SF-RCH-12) ne peut être créée que sur une route existante avec au moins un trajet planifié dans les 90 jours

---

## 3. Module : Sélection de siège

### 3.1 Vue d'ensemble

La sélection de siège est la fonctionnalité différenciante par rapport aux systèmes de réservation simples. Elle présente un plan 2D interactif du bus, avec la disponibilité des sièges en temps réel. Le verrou distribué Redis implémente l'algorithme Redlock sur 3 instances Redis indépendantes pour garantir la cohérence même en cas de partition réseau.

### 3.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-SIE-01 | Affichage du plan de bus | Plan 2D interactif fidèle à la configuration réelle du véhicule (rangées, sièges numérotés, couloirs, toilettes, porte). Couleurs de statut : Vert = disponible, Rouge = réservé, Jaune = verrouillé par un autre utilisateur en cours, Gris = non disponible (avarie, PMR, réservé opérateur). Légende toujours visible. | MUST | Voyageur |
| SF-SIE-02 | Mise à jour temps réel | Le statut des sièges est mis à jour en temps réel via WebSocket. Quand un autre utilisateur verrouille un siège, il passe immédiatement en jaune sur tous les clients connectés. En cas de perte de connexion WebSocket, le client bascule sur du polling HTTP toutes les 10 secondes avec indicateur dégradé. | MUST | Système |
| SF-SIE-03 | Sélection et verrou distribué (Redlock) | Au clic sur un siège disponible, le système tente d'acquérir le verrou via l'algorithme Redlock sur 3 instances Redis indépendantes (quorum = 2/3). Commande : `SET seat:{tripId}:{seatId} {userId}:{sessionId} NX EX 600` sur chaque instance. Si quorum atteint : siège passe en jaune, minuterie 10 min affichée. Si quorum non atteint : message « Ce siège vient d'être pris » + suggestions BFS de sièges alternatifs. | MUST | Voyageur |
| SF-SIE-04 | Minuterie de réservation | Compte à rebours visible (10:00 → 0:00). Alerte à 2:00 restantes. À expiration, les verrous TTL expirent automatiquement sur toutes les instances Redis, les sièges repassent en vert, et l'utilisateur est notifié avec possibilité de recommencer. | MUST | Voyageur |
| SF-SIE-05 | Sélection multiple et rollback atomique | Pour N passagers (N ≥ 2), l'utilisateur sélectionne N sièges. Le système acquiert les N verrous Redlock séquentiellement. Si l'un des verrous échoue, un `PIPELINE` Redis libère immédiatement tous les verrous acquis (rollback atomique). L'utilisateur est notifié du siège non disponible. | MUST | Voyageur |
| SF-SIE-06 | Suggestions de sièges (BFS) | Le bouton « Sélection automatique optimale » applique l'algorithme BFS sur le graphe des sièges pour proposer : les sièges contigus disponibles, les sièges fenêtre en priorité si préférence profil, les sièges proches de la porte pour les voyageurs à mobilité réduite. | SHOULD | Voyageur |
| SF-SIE-07 | Informations de siège | Au survol (desktop) ou au toucher long (mobile) : infobulle avec numéro, type (fenêtre/couloir/milieu), rangée, équipements (prise, inclinaison), et supplément de prix éventuel pour les sièges premium. | SHOULD | Voyageur |
| SF-SIE-08 | Accessibilité PMR | Les sièges PMR sont signalés par une icône dédiée et un marquage distinctif. Ils ne peuvent être sélectionnés que par des utilisateurs ayant déclaré un besoin PMR dans leur profil, ou sur demande auprès du support. L'opérateur définit le nombre de sièges PMR par bus. | MUST | Voyageur / Admin |
| SF-SIE-09 | Affectation de siège par catégorie | Pour une réservation mixte (adultes + enfants), le système suggère l'affectation optimale : l'enfant adjacent à l'adulte accompagnant, jamais seul en extrémité de rangée. L'utilisateur peut modifier librement. | SHOULD | Voyageur |

### 3.3 Algorithme de verrou distribué — Spécification Redlock

> **Algorithme Redlock (3 instances Redis indépendantes)**
>
> ```
> Instances: redis1:6379, redis2:6379, redis3:6379
> Quorum: 2 (majorité sur 3)
> TTL verrou: 600 secondes
> Tolérance d'horloge: 50 ms
>
> Acquisition:
>   Pour chaque instance i:
>     t_start = now()
>     result_i = SET seat:{tripId}:{seatId} {token} NX EX 600
>     elapsed = now() - t_start
>   Si count(result_i == OK) >= 2 ET elapsed < 600s:
>     → verrou acquis, continuer
>   Sinon:
>     → libérer tous les verrous acquis, siège indisponible
>
> Libération:
>   Script Lua sur chaque instance (atomique):
>     if redis.call("GET", key) == token then
>       return redis.call("DEL", key)
>     else return 0
> ```
>
> **Pourquoi Redlock :** Un verrou sur une seule instance Redis peut être perdu si l'instance redémarre entre l'acquisition et l'expiration. Redlock garantit qu'au moins 2 instances sur 3 doivent défaillir simultanément pour perdre un verrou — probabilité < 0,001 % avec des instances dans des AZ différentes.

---

## 4. Module : Réservation et paiement

### 4.1 Vue d'ensemble

Le module de paiement orchestre la conversion d'une sélection provisoire (siège verrouillé) en réservation confirmée. Il gère plusieurs passerelles, applique les règles de tarification différenciée, émet les billets électroniques, publie les événements sur Kafka, et inclut un job de réconciliation pour traiter les webhooks perdus.

### 4.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-PAY-01 | Récapitulatif de commande | Page récapitulatif affichant : trajet, siège(s), détail des passagers par catégorie avec prix unitaire, frais de service (affichés séparément, transparence tarifaire), total TTC, conditions d'annulation applicables, et le compte à rebours du verrou. | MUST | Voyageur |
| SF-PAY-02 | Méthodes de paiement | Carte bancaire (Visa, Mastercard via Stripe 3DS v2), Orange Money, Wave, MTN Mobile Money, Virement bancaire (confirmation différée 24h). Moov Money (Bénin). Sauvegarde tokenisée des méthodes autorisée (aucun numéro de carte stocké côté BusExpress). | MUST | Voyageur |
| SF-PAY-03 | Sécurité des transactions | 3D Secure v2 obligatoire pour les cartes bancaires. Tokenisation Stripe : les PAN ne transitent jamais par les serveurs BusExpress. Canal TLS 1.3 minimum. Conformité PCI-DSS SAQ A (marchand redirigeant vers le formulaire Stripe hébergé) — pas de stockage de données de carte. | MUST | Système |
| SF-PAY-04 | Confirmation de paiement | Après paiement réussi : (1) verrous Redlock libérés et réservation écrite en SQL dans une transaction ACID, (2) événement `BOOKING_CONFIRMED` publié sur Kafka, (3) billet PDF + QR Code générés asynchronement et envoyés par email, SMS et WhatsApp, (4) confirmation affichée à l'écran immédiatement sans attendre la génération PDF. | MUST | Système |
| SF-PAY-05 | Gestion des échecs de paiement | En cas d'échec : les verrous Redis restent actifs 5 minutes supplémentaires pour permettre une nouvelle tentative. Après 3 échecs consécutifs sur la même méthode, l'utilisateur est invité à essayer une autre méthode. Après 5 échecs toutes méthodes confondues, les verrous sont libérés. | MUST | Système |
| SF-PAY-06 | Paiement en attente Mobile Money | La confirmation Mobile Money peut prendre 1-15 minutes. Le siège reste verrouillé pendant 20 minutes. L'utilisateur voit un écran d'attente avec le statut en temps réel via polling toutes les 10 secondes. Notification push/SMS/WhatsApp dès confirmation ou échec. | MUST | Système |
| SF-PAY-07 | Job de réconciliation webhooks | Un job Kafka Streams s'exécute toutes les 5 minutes pour détecter les paiements en statut `PENDING_PAYMENT` depuis plus de 15 minutes. Pour chaque cas, le job interroge l'API de la passerelle de paiement (Stripe/Orange Money/Wave) pour obtenir le statut réel et mettre à jour la réservation en conséquence. Alertes admin si le volume dépasse 10 cas/heure. | MUST | Système |
| SF-PAY-08 | Coupon et code promo | Champ de saisie de code promo sur la page récapitulatif. Validation en temps réel : existence, date d'expiration, nombre d'utilisations restantes, restriction par route ou opérateur. Application immédiate de la réduction sur le total. | SHOULD | Voyageur |
| SF-PAY-09 | Facture téléchargeable | Facture PDF conforme aux exigences légales locales (numéro séquentiel, coordonnées BusExpress, TVA appliquée, identité opérateur, détail des passengers) disponible immédiatement après confirmation. | MUST | Voyageur |
| SF-PAY-10 | Idempotence des transactions | Chaque tentative de paiement est associée à un `idempotency_key` UUID unique généré côté client. En cas de rejeu (timeout réseau, double-clic), le serveur retourne la réponse de la première tentative sans créer de doublon. Les idempotency keys sont stockées 24 heures. | MUST | Système |
| SF-PAY-11 | Guest checkout (paiement sans compte) | Un visiteur non inscrit peut réserver en fournissant uniquement email, nom et téléphone. Un compte temporaire est créé automatiquement avec un token de session. Après le paiement, l'utilisateur est invité à définir un mot de passe pour conserver l'accès à ses réservations. | MUST | Voyageur |
| SF-PAY-12 | Remboursement partiel groupe | Pour une réservation multi-passagers, un passager individuel peut annuler sa part. Le remboursement est calculé au prorata (montant total / nombre de passagers × passagers annulant), selon les conditions d'annulation de l'opérateur. Les sièges libérés par l'annulation partielle redeviennent disponibles immédiatement. | MUST | Voyageur |
| SF-PAY-13 | Gestion des chargebacks | Lorsque Stripe notifie un chargeback (webhook `charge.dispute.created`) : (1) le billet concerné est marqué `DISPUTED`, (2) une alerte est créée dans l'interface admin, (3) les preuves sont collectées automatiquement (logs de connexion, métadonnées de réservation) et transmises à Stripe dans les 48h via l'API Disputes. Si le chargeback est perdu, le remboursement est imputé à la réserve financière de l'opérateur. | MUST | Admin |
| SF-PAY-14 | Paiement fractionné | Pour les montants supérieurs à 20 000 FCFA, l'utilisateur peut choisir un paiement en 2x ou 3x sans frais. La première fraction (50 % ou 34 %) est prélevée à la réservation, les suivantes à J+30 et J+60. En cas d'impayé sur une fraction, le billet est suspendu et l'utilisateur notifié 3 jours avant. | COULD | Voyageur |

### 4.3 Machine d'états d'une réservation

| État | Description | Transitions possibles |
|---|---|---|
| `PENDING_SEAT` | Siège verrouillé (Redlock acquis), paiement non initié | → `PENDING_PAYMENT`, → `EXPIRED` |
| `PENDING_PAYMENT` | Paiement en cours de traitement | → `CONFIRMED`, → `FAILED`, → `EXPIRED` |
| `CONFIRMED` | Paiement reçu, billet émis | → `CANCELLED`, → `USED`, → `DISPUTED` |
| `CANCELLED` | Annulée par le voyageur ou l'opérateur | → `REFUNDED` |
| `PARTIALLY_CANCELLED` | Annulation partielle sur réservation groupe | → `PARTIALLY_REFUNDED` |
| `REFUNDED` | Remboursement total effectué | État final |
| `PARTIALLY_REFUNDED` | Remboursement partiel effectué | État final |
| `EXPIRED` | Timeout dépassé, sièges libérés | État final |
| `USED` | Billet scanné à l'embarquement | État final |
| `FAILED` | Paiement définitivement refusé | → `PENDING_SEAT` (retry avec nouveau verrou) |
| `DISPUTED` | Chargeback en cours | → `CONFIRMED` (gagné), → `REFUNDED` (perdu) |

### 4.4 Règles métier — Paiement et tarification

- **RG-PAY-01 :** Le prix affiché est garanti pendant la durée du verrou Redlock (10 minutes). Toute variation de pricing dynamique n'affecte pas une transaction en cours.
- **RG-PAY-02 :** Les frais de service BusExpress (commissions) sont affichés séparément du prix billet sur le récapitulatif.
- **RG-PAY-03 :** Un email de confirmation doit être envoyé dans les 60 secondes suivant la confirmation de paiement. SMS et WhatsApp dans les 90 secondes.
- **RG-PAY-04 :** Pour les mineurs non accompagnés (âge < 16 ans déclaré), une validation parentale par email est requise avant l'émission du billet.
- **RG-PAY-05 :** La devise d'affichage est la devise locale de l'opérateur. Les conversions utilisent les taux de change du jour (source : API Frankfurter ou équivalent open source).
- **RG-PAY-06 :** Le guest checkout (SF-PAY-11) ne permet pas de sauvegarder une méthode de paiement. Le token de session guest expire après 30 jours sans activation de compte.
- **RG-PAY-07 :** Un remboursement partiel (SF-PAY-12) ne peut être initié que si la réservation est en statut `CONFIRMED` et que la date de départ est supérieure à 2 heures dans le futur.

---

## 5. Module : Compte voyageur

### 5.1 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-USR-01 | Inscription et authentification | Inscription par email + mot de passe ou OAuth2 (Google, Facebook, Apple). JWT RS256 : access token 15 min, refresh token 30 jours. Mot de passe haché en bcrypt (coût 12). Vérification email obligatoire avant la première réservation avec compte. Guest checkout disponible sans vérification (SF-PAY-11). | MUST | Voyageur |
| SF-USR-02 | Authentification à deux facteurs (2FA) | 2FA activable depuis les paramètres de compte. Méthodes supportées : TOTP (Google Authenticator, Authy), SMS OTP (via Twilio). 2FA obligatoire pour les comptes admin et agent opérateur. Codes de récupération d'urgence (8 codes à usage unique) générés à l'activation. | MUST | Voyageur / Admin |
| SF-USR-03 | Profil voyageur | Nom, prénom, date de naissance, photo (optionnel, stockée sur CDN), téléphone vérifié par SMS OTP, pièce d'identité (type + numéro, chiffré AES-256 en base), préférences de siège (fenêtre/couloir), besoins spéciaux (PMR, allergie), langue préférée. | MUST | Voyageur |
| SF-USR-04 | Gestion des sessions | Liste des appareils connectés (type, IP, date dernière activité). Révocation de session individuelle ou globale (« Déconnexion de tous les appareils »). Notification email automatique lors de toute nouvelle connexion depuis un appareil non reconnu. | MUST | Voyageur |
| SF-USR-05 | Historique de réservations | Liste paginée de toutes les réservations (passées, futures, annulées). Filtres par statut, date, opérateur. Accès au billet PDF depuis l'historique. Bouton d'annulation si les conditions le permettent. Bouton « Réserver à nouveau » pour dupliquer une réservation passée. | MUST | Voyageur |
| SF-USR-06 | Profils passagers sauvegardés | Sauvegarde de jusqu'à 10 profils récurrents (famille, collègues) avec nom, prénom, date de naissance, et numéro de pièce d'identité (optionnel). Pré-remplissage automatique lors des futures réservations. | SHOULD | Voyageur |
| SF-USR-07 | Programme de fidélité | 1 point par tranche de 500 FCFA dépensés. Points échangeables contre des réductions (100 points = 500 FCFA de réduction). Solde et historique des points visibles sur le tableau de bord. Points expirés après 18 mois sans activité. Statuts : Bronze (0-499 pts), Argent (500-1999 pts), Or (2000+ pts) avec avantages progressifs (réduction, priorité, support dédié). | COULD | Voyageur |
| SF-USR-08 | Préférences de notification | Paramétrage fin par type d'événement (confirmation, rappel J-1 et H-2, retard, promotion) et par canal (email, SMS, WhatsApp Business, push). Opt-out granulaire par canal et par type. Respect des horaires silencieux (22h00-07h00 locale). | MUST | Voyageur |
| SF-USR-09 | Transfert de billet | L'utilisateur peut transférer un billet confirmé à un tiers jusqu'à 4 heures avant le départ. Il renseigne les nom, prénom, email et téléphone du bénéficiaire. Un nouveau QR Code est émis au nom du bénéficiaire, l'ancien est invalidé. Traçabilité complète du transfert dans l'audit log. | SHOULD | Voyageur |
| SF-USR-10 | Portabilité et suppression des données (RGPD) | Suppression : données personnelles anonymisées sous 30 jours, données transactionnelles conservées 10 ans (obligation légale). Portabilité (RGPD Art. 20) : export téléchargeable en JSON/CSV de l'intégralité des données personnelles et historique de voyages, disponible sous 72 heures. | MUST | Voyageur |

---

## 6. Module : Billets électroniques et embarquement

### 6.1 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-TKT-01 | Génération du billet PDF | À confirmation de paiement : PDF généré de manière asynchrone (queue de travail) contenant logo opérateur, numéro de billet UUID, QR Code, trajet complet, siège, passager(s), catégorie tarifaire, conditions d'annulation. Archivé sur stockage objet (S3 compatible). Accessible via URL signée à durée limitée (7 jours). | MUST | Système |
| SF-TKT-02 | QR Code anti-clone | Encode : `bookingId`, `seatId`, `tripId`, `passengerName`, `expiresAt` (timestamp 24h avant départ), signature HMAC-SHA256 avec clé rotative quotidiennement. Validité : 24h avant le départ jusqu'à 2h après. Mécanisme anti-clone : (1) marquage `USED` synchrone obligatoire avant embarquement (la validation hors-ligne est limitée à 5 secondes max avant sync), (2) si même QR scanné une seconde fois : alerte immédiate au contrôleur et au système, (3) invalidation automatique si billet transféré (SF-USR-09). | MUST | Système |
| SF-TKT-03 | Validation à l'embarquement | L'application mobile de scan décode le QR Code, vérifie la signature HMAC et la date de validité, interroge l'API en temps réel pour marquer le billet `USED` et afficher les informations du passager. En mode hors-ligne (tunnel, zone sans réseau) : validation locale avec alerte sonore différente, synchronisation automatique dans les 30 secondes dès que le réseau revient. Maximum 30 validations hors-ligne simultanées avant blocage. | MUST | Contrôleur |
| SF-TKT-04 | Modification de billet | Modification de date/heure jusqu'à 2 heures avant le départ (seuil configurable par opérateur). La modification requiert la disponibilité d'un siège équivalent sur le nouveau trajet. Si différence de prix : paiement de la différence (positive) ou crédit sur le compte (négative). Un nouveau QR Code est émis, l'ancien invalidé. | MUST | Voyageur |
| SF-TKT-05 | Annulation et remboursement | Conditions configurées par l'opérateur : > 24h avant départ → 100 %, entre 2h et 24h → 50 %, < 2h → 0 %. Remboursement initié automatiquement vers la méthode de paiement initiale dans les 5 jours ouvrés (72h pour Mobile Money, 7 jours pour carte bancaire selon les réseaux). Le voyageur reçoit une confirmation de l'annulation et du montant remboursé. | MUST | Voyageur |
| SF-TKT-06 | Billet multi-passagers | Un seul PDF principal regroupe tous les billets d'une réservation groupée avec un QR Code par passager. Un PDF individuel est accessible séparément pour chaque passager. L'envoi par email peut être segmenté (un email par passager si les adresses sont différentes). | SHOULD | Voyageur |

---

## 7. Module : Suivi GPS et notifications

### 7.1 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-GPS-01 | Suivi en temps réel | Pour les billets du jour (J-0) et à partir de J-1 pour les trajets nuit, carte affichant la position actuelle du bus mise à jour toutes les 30 secondes via WebSocket. Affichage : position sur carte OSM, vitesse actuelle, prochain arrêt, ETA recalculé. En cas de perte de signal GPS > 5 minutes : indicateur « Connexion GPS perdue, dernière position connue à HH:MM ». | MUST | Voyageur |
| SF-GPS-02 | Alerte de départ imminent | Notification push/SMS/WhatsApp envoyée 60 minutes et 30 minutes avant le départ. Le message indique la position actuelle du bus, l'arrêt de départ avec géolocalisation, et l'ETA du bus à l'arrêt. | MUST | Voyageur |
| SF-GPS-03 | Alerte de retard adaptative | Seuil de déclenchement adaptatif : max(10 minutes, 15 % de la durée totale du trajet). Exemples : trajet 45 min → alerte si retard > 10 min ; trajet 6h → alerte si retard > 54 min. Le seuil de base est configurable par opérateur. Notification envoyée sur tous les canaux actifs du voyageur avec le nouveau délai estimé et la cause si communiquée par l'opérateur. | MUST | Voyageur |
| SF-GPS-04 | ETA dynamique | ETA recalculé en continu selon position GPS, vitesse moyenne sur les 5 dernières minutes, et données de trafic temps réel (intégration OpenStreetMap + OSRM pour les calculs d'itinéraire, sans dépendance Google Maps). L'ETA est affiché dans l'app et dans le widget de suivi. | SHOULD | Voyageur |
| SF-GPS-05 | Historique de trajet | Le tracé GPS complet est archivé en base time-series (InfluxDB ou équivalent) pendant 90 jours, puis purgé ou agrégé. Accessible par l'opérateur pour analyses et par l'admin pour les réclamations. Le voyageur peut consulter le tracé de ses voyages passés pendant 30 jours. | COULD | Opérateur / Voyageur |
| SF-GPS-06 | Notifications multi-canaux | En plus de push/SMS/email, les notifications (confirmation, rappel, retard, arrivée) sont envoyées via WhatsApp Business API (Meta). Template WhatsApp validé par Meta pour chaque type de message. Opt-in explicite requis au niveau du profil voyageur. | MUST | Voyageur |

---

## 8. Module : Portail opérateur de bus

### 8.1 Vue d'ensemble

Le portail opérateur est une interface web dédiée permettant aux compagnies de transport de gérer de manière autonome leurs lignes, horaires, tarifs, flotte, équipages et promotions. Il supporte une structure hiérarchique multi-agences et est accessible via sous-domaine sécurisé (`operateur.busexpress.com`) après validation par l'administrateur plateforme.

### 8.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-OPR-01 | Gestion des lignes | Création et modification des lignes : arrêts départ/arrivée (entités `Stop` de la base relationnelle), arrêts intermédiaires ordonnés avec horaires planifiés, jours de circulation (récurrence hebdomadaire ou calendrier spécifique avec exceptions), numéro de ligne, kilométrage. | MUST | Opérateur |
| SF-OPR-02 | Gestion de la flotte | Enregistrement des véhicules : immatriculation, capacité totale, plan de sièges (éditeur drag-and-drop ou import JSON/CSV), classe de confort, équipements (Wi-Fi, climatisation, prises, toilettes, couchettes), statut (actif / maintenance planifiée / hors service). Calendrier de maintenance préventive avec alertes kilométrage ou date. | MUST | Opérateur |
| SF-OPR-03 | Gestion des conducteurs | Enregistrement des conducteurs : nom, prénom, numéro de permis (type, date expiration), téléphone, photo (optionnel). Affectation d'un conducteur à un ou plusieurs trajets. Alerte automatique si le permis expire dans les 30 jours. Le nom du conducteur est optionnellement affiché aux voyageurs dans l'app. | MUST | Opérateur |
| SF-OPR-04 | Tarification par ligne | Prix de base par trajet et par tronçon (arrêt A→B). Réductions par catégorie de passager (enfant, senior, étudiant) configurables par ligne. Activation optionnelle de la tarification dynamique automatique (paliers : < 50 % rempli → prix de base, 50-80 % → +20 %, > 80 % → +50 %). Prix manuels par période (haute/basse saison). | MUST | Opérateur |
| SF-OPR-05 | Tableau de bord opérateur | Tableau de bord temps réel : taux de remplissage par trajet (en cours et à venir), revenus nets (après commission) jour/semaine/mois, nombre de réservations, annulations, comparaison avec la même période précédente, note moyenne des avis voyageurs. Export CSV/PDF. | MUST | Opérateur |
| SF-OPR-06 | Gestion des incidents en temps réel | Au-delà de l'annulation totale : signalement d'incidents partiels (panne en route, changement de bus, arrêt supplémentaire, incident de sécurité). Interface de communication d'urgence diffusant un message à tous les passagers du trajet concerné via tous leurs canaux actifs. Template de message prédéfinis + champ libre. | MUST | Opérateur |
| SF-OPR-07 | Annulation de voyage | Annulation d'un départ depuis le portail avec saisie du motif. Le système génère automatiquement les notifications aux passagers et initie les remboursements selon la politique de l'opérateur. Le départ annulé est marqué dans le tableau de bord avec impact revenue calculé. | MUST | Opérateur |
| SF-OPR-08 | Manifeste des passagers | Liste complète des passagers d'un départ (nom, prénom, siège, statut billet, catégorie tarifaire, numéro de téléphone), exportable PDF et CSV. Conforme aux exigences réglementaires de manifeste. Accessible jusqu'à 72h après le départ pour les réclamations. | MUST | Opérateur |
| SF-OPR-09 | Paramétrage des annulations | Configuration des conditions d'annulation par tranches horaires et pourcentages. Les conditions s'appliquent à toutes les réservations sur les lignes de l'opérateur et sont affichées aux voyageurs lors de la réservation et sur les billets. | MUST | Opérateur |
| SF-OPR-10 | Gestion multi-agences | Un opérateur peut créer des sous-comptes d'agences régionales (ex : Agence Cotonou, Agence Parakou). Chaque agence a accès uniquement à ses lignes assignées. Le compte principal de l'opérateur a une vue consolidée de toutes les agences. Rôles : Admin opérateur, Manager agence, Agent guichet (lecture + réservations au guichet uniquement). | MUST | Opérateur |
| SF-OPR-11 | Programme promotionnel opérateur | L'opérateur peut créer ses propres codes promo : réduction fixe ou pourcentage, limitation par date, par route, par nombre d'utilisations totales ou par utilisateur. Les promotions sont visibles dans la liste des trajets si actives. Suivi de l'utilisation dans le tableau de bord. | SHOULD | Opérateur |
| SF-OPR-12 | Application de scan mobile | Application mobile légère (Android/iOS, React Native) pour scanner les QR Codes à l'embarquement. Fonctionnement offline avec file de synchronisation différée. Affichage : photo passager (si disponible), nom, siège, statut billet, catégorie tarifaire. Son et couleur différents selon statut (OK / Déjà scanné / Invalide). | MUST | Contrôleur |

---

## 9. Module : Administration back-office

### 9.1 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-ADM-01 | Gestion des opérateurs | Validation des demandes d'inscription (vérification pièces légales : RCCM, identité gérant), définition du taux de commission par opérateur, suspension/réactivation de comptes avec motif, historique de toutes les actions sur un compte opérateur. | MUST | Admin |
| SF-ADM-02 | Supervision système | Dashboard technique (Grafana) : temps de réponse P50/P95/P99 par endpoint, taux d'erreur par service, occupation mémoire Redis (hit rate, évictions), lag des consumers Kafka, connexions DB actives, utilisation CPU/RAM par pod Kubernetes. Alertes PagerDuty configurables par seuil. | MUST | Admin |
| SF-ADM-03 | Gestion des litiges | Interface réclamations voyageurs : timeline horodatée de tous les événements d'une réservation, outils de remboursement manuel (total ou partiel) avec motif obligatoire, messagerie directe avec le voyageur, escalade vers l'opérateur. SLA de traitement : 24h pour les litiges financiers. | MUST | Admin |
| SF-ADM-04 | Analytics plateforme | Rapports interactifs : revenus (bruts et nets) par région/opérateur/période/méthode de paiement, routes les plus populaires, taux d'occupation moyen, taux d'annulation, taux de conversion entonnoir (recherche → sélection → paiement → confirmation), NPS voyageur. Connecteur vers outil BI externe (Metabase, Power BI) via API REST. | MUST | Admin |
| SF-ADM-05 | Gestion des fraudes avec feedback ML | Tableau de bord de détection : transactions signalées par le modèle ML (score > seuil configurable), liste de review avec contexte complet. Pour chaque case reviewée manuellement (faux positif / fraude confirmée), le verdict est enregistré comme label d'entraînement. Un job hebdomadaire réentraîne le modèle avec les nouveaux labels (pipeline MLflow). SLA de review : 4 heures pour les cas à score > 0,85. | MUST | Admin |
| SF-ADM-06 | Configuration globale (Feature Flags) | Paramètres configurables en temps réel sans redéploiement via LaunchDarkly ou équivalent open-source (Unleash) : durée du verrou Redis, seuils d'alerte, taux de commission par défaut, devises actives, canaux de notification activés, feature flags par module (activation progressive des nouvelles fonctionnalités). | MUST | Admin |
| SF-ADM-07 | Audit log immuable | Journal d'audit chiffré et signé (append-only) de toutes les actions sensibles : connexions admin/opérateur, modifications de configuration, remboursements manuels, blocages de compte, modifications de verrous Redis, exports de données. Conservation 5 ans. Non modifiable même par les super-admins. | MUST | Admin |
| SF-ADM-08 | Gestion des secrets | Tous les secrets (clés API Stripe/Orange Money/Wave, secrets JWT, credentials DB, clés HMAC QR) sont stockés dans HashiCorp Vault avec rotation automatique configurée : clés API partenaires → rotation tous les 90 jours, secrets JWT → tous les 30 jours, credentials DB → tous les 180 jours. Aucun secret dans les variables d'environnement ou le code source. | MUST | Admin |
| SF-ADM-09 | Conformité légale transport | Module de génération des rapports légaux de transport selon les réglementations locales : manifestes transmis aux autorités de transport (format configurable par pays), conservation des données de transport selon les durées légales, agrément numérique configurable par pays d'opération. | MUST | Admin |

---

## 10. Module : Avis et notation

### 10.1 Vue d'ensemble

Ce module collecte et affiche les avis des voyageurs sur les opérateurs et les trajets. Il alimente le critère "Note opérateur" du tri des résultats (SF-RCH-06) et le tableau de bord opérateur (SF-OPR-05). Les avis sont modérés avant publication.

### 10.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-AVS-01 | Collecte des avis post-voyage | 24 heures après la date de départ d'un billet `USED`, une invitation à laisser un avis est envoyée par email/WhatsApp. L'avis comporte une note globale (1-5 étoiles) et des notes dimensionnelles (ponctualité, confort, propreté, service) ainsi qu'un commentaire libre (max 500 caractères). | MUST | Voyageur |
| SF-AVS-02 | Modération des avis | Les avis sont soumis à une modération automatique (détection de langage offensant, spam, lien externe) puis à une validation humaine pour les cas ambigus. Délai de publication : 24h en semaine. L'opérateur ne peut pas supprimer les avis, seulement les signaler pour review admin. | MUST | Admin |
| SF-AVS-03 | Réponse de l'opérateur | L'opérateur peut publier une réponse publique à chaque avis (max 300 caractères) dans les 30 jours suivant la publication. La réponse est affichée sous l'avis dans l'interface voyageur. | SHOULD | Opérateur |
| SF-AVS-04 | Affichage des notes | Note globale affichée dans les résultats de recherche (score moyen sur 12 mois glissants, minimum 5 avis pour affichage). Fiche détaillée opérateur avec distribution des notes, avis récents, et taux de réponse aux avis. | MUST | Voyageur |
| SF-AVS-05 | Avis vérifiés uniquement | Seuls les voyageurs avec un billet `USED` (scanné à l'embarquement) ou `CONFIRMED` + date de départ passée peuvent laisser un avis. Chaque voyage ne génère qu'une seule invitation d'avis, non répétable. | MUST | Système |

---

## 11. Module : Liste d'attente

### 11.1 Vue d'ensemble

Lorsqu'un trajet est complet, les voyageurs intéressés peuvent rejoindre une liste d'attente. En cas de libération de siège (annulation, expiration de verrou, modification de billet), les voyageurs en attente sont notifiés par ordre de priorité et disposent d'un délai pour confirmer.

### 11.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-LDA-01 | Inscription sur liste d'attente | Sur un trajet complet, l'utilisateur peut rejoindre la liste d'attente en indiquant le nombre de sièges souhaités et ses préférences (type de siège). L'inscription est possible jusqu'à 4 heures avant le départ. Maximum 3 trajets en liste d'attente simultanément par compte. | MUST | Voyageur |
| SF-LDA-02 | Algorithme de file de priorité | La liste d'attente suit une file FIFO (premier inscrit, premier servi). À partir de la Phase 2 (lorsque le programme de fidélité SF-USR-07 est actif), les membres au statut Or et les voyageurs fréquents (> 10 voyages) bénéficient d'un bonus de priorité équivalent à 30 minutes d'avance dans la file. En Phase 1 (MVP), la file est strictement FIFO sans bonus de priorité. | MUST | Système |
| SF-LDA-03 | Notification de disponibilité | Dès qu'un siège correspondant se libère, le premier voyageur éligible sur la liste reçoit une notification multi-canal (push, SMS, WhatsApp) avec un lien de réservation à durée limitée. Il dispose de 15 minutes pour confirmer et payer. Passé ce délai, le siège est proposé au suivant. | MUST | Système |
| SF-LDA-04 | Gestion de l'expiration | La liste d'attente expire automatiquement 4 heures avant le départ du trajet. Les voyageurs non satisfaits reçoivent une notification et sont suggérés vers des trajets alternatifs (dates proches ou correspondances). | MUST | Système |

---

## 12. Module : Support client

### 12.1 Vue d'ensemble

Le module de support client fournit aux voyageurs un canal de contact intégré à l'application. Il réduit le volume d'escalades vers le back-office admin en traitant les demandes de premier niveau de manière autonome.

### 12.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-SUP-01 | Centre d'aide contextuel | FAQ dynamique et contextuelle : les questions affichées changent selon la page de l'utilisateur (page de réservation → FAQ paiement, page billet → FAQ annulation). Recherche full-text dans la base de connaissances. Les articles sont rédigés et mis à jour par l'équipe admin. | MUST | Voyageur |
| SF-SUP-02 | Ticket de support | Formulaire de création de ticket avec sélection de la catégorie (problème de paiement, billet, retard, remboursement, autre), liaison automatique à la réservation concernée si identifiée, pièce jointe possible (capture d'écran). Accusé de réception immédiat avec numéro de ticket. | MUST | Voyageur |
| SF-SUP-03 | Suivi des tickets | L'utilisateur peut consulter l'état de ses tickets depuis son espace compte (Ouvert, En cours, Résolu, Fermé) et répondre aux questions de l'agent. Notifications push/email à chaque mise à jour du ticket. | MUST | Voyageur |
| SF-SUP-04 | Interface agent support | L'agent support (rôle distinct de l'admin) dispose d'une interface de gestion des tickets avec : file de tickets par priorité et SLA, accès à l'historique complet de la réservation liée, outils de remboursement limité (selon barème défini par l'admin), templates de réponses rapides, escalade vers admin. | MUST | Agent support |
| SF-SUP-05 | Chatbot de premier niveau | Chatbot intégré répondant aux questions fréquentes (statut de remboursement, procédure d'annulation, retard de bus). Le chatbot peut accéder aux données de la réservation de l'utilisateur connecté pour des réponses personnalisées. Escalade vers un agent humain si le chatbot ne peut pas résoudre. | SHOULD | Voyageur |
| SF-SUP-06 | SLA et métriques support | Temps de première réponse cible : 2h en semaine, 6h le week-end. Temps de résolution cible : 24h (problème paiement), 48h (autres). Taux de résolution au premier contact cible : 70 %. Satisfaction post-ticket mesurée par CSAT (bouton pouce haut/bas). Tableau de bord des métriques accessible à l'admin. | MUST | Admin |

---

## 13. Module : Réconciliation financière opérateur

### 13.1 Vue d'ensemble

Ce module gère le calcul, la validation et le versement des revenus aux opérateurs de bus après déduction des commissions BusExpress et des frais de transaction. Il est critique pour la viabilité du modèle marketplace et doit être opérationnel dès le lancement.

### 13.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-REC-01 | Calcul des revenus nets | Pour chaque réservation confirmée, le système calcule automatiquement : prix billet HT, frais de transaction passerelle de paiement (déduits), commission BusExpress (taux configurable par opérateur, SF-ADM-01), TVA applicable selon le pays, revenu net opérateur. | MUST | Système |
| SF-REC-02 | Relevé de compte opérateur | Tableau de bord financier dans le portail opérateur affichant : solde courant, revenus bruts et nets de la période, liste détaillée des transactions (réservations, annulations, remboursements), commissions prélevées. Filtres par période, ligne, et type de transaction. | MUST | Opérateur |
| SF-REC-03 | Export comptable | Export des données financières en formats comptables : CSV (toutes données), PDF (relevé formaté), et intégration API vers les logiciels comptables courants (Sage, QuickBooks via webhooks). Export conforme aux exigences du Plan Comptable OHADA. | MUST | Opérateur |
| SF-REC-04 | Versement automatique | Selon la fréquence convenue avec l'opérateur (hebdomadaire ou mensuel) : calcul du solde à virer, déduction de la réserve pour chargebacks (5 % des revenus bruts du mois en cours), initiation du virement bancaire via l'API de la banque partenaire. Email de notification avec le relevé en PJ. | MUST | Système |
| SF-REC-05 | Réserve pour chargebacks | Une réserve de 5 % est constituée sur chaque versement opérateur pour couvrir les chargebacks potentiels. La réserve est libérée 90 jours après la date de voyage (délai typique de contestation). Le solde de la réserve est visible dans le relevé opérateur. | MUST | Système |
| SF-REC-06 | Facturation BusExpress → opérateur | Génération automatique mensuelle d'une facture de commission BusExpress émise à l'opérateur, conforme aux exigences fiscales locales (numéro séquentiel, TVA, coordonnées complètes). La facture est disponible en téléchargement dans le portail opérateur et envoyée par email. | MUST | Système |

---

## 14. Module : Gestion des bagages

### 14.1 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-BAG-01 | Politique de bagages par opérateur | Chaque opérateur configure sa politique dans le portail : franchise incluse (ex : 20 kg en soute + 5 kg cabine), tarif du kilo supplémentaire, bagages spéciaux autorisés (vélo, fauteuil roulant, animal en cage, instrument de musique) et leurs tarifs. | MUST | Opérateur |
| SF-BAG-02 | Déclaration de bagages à la réservation | Lors de la réservation, le voyageur déclare ses bagages : nombre, poids estimé, type spécial si applicable. Le système calcule et affiche le supplément bagages en temps réel. Les bagages sont payés avec le billet. | MUST | Voyageur |
| SF-BAG-03 | Affichage sur le billet | La déclaration de bagages et le supplément payé sont mentionnés sur le billet PDF. La génération d'un code-barres de bagage distinct par bagage enregistré est hors périmètre du modèle de données actuel mais prévue en Phase 3 (entité `Baggage` à créer). | SHOULD | Voyageur |
| SF-BAG-04 | Modification des bagages | Le voyageur peut modifier la déclaration de bagages jusqu'à 2 heures avant le départ. Augmentation : paiement de la différence. Réduction : remboursement du différentiel selon la politique d'annulation bagages de l'opérateur. | SHOULD | Voyageur |

---

## 15. Module : Comptes entreprise et groupes

### 15.1 Vue d'ensemble

Le segment B2B représente une part significative du marché du transport interurbain. Ce module permet aux entreprises de gérer les voyages de leurs employés, de bénéficier de tarifs négociés, et de centraliser la facturation.

### 15.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-B2B-01 | Compte entreprise | L'entreprise cliente soumet une demande d'inscription via un formulaire dédié (RCCM, coordonnées, contact RH/Finance désigné). L'admin BusExpress valide la demande et configure le taux de commission réduit négocié. L'entreprise dispose ensuite d'un solde prépayé (recharge par virement) et d'une limite de crédit optionnelle (facturation mensuelle). | MUST | Entreprise cliente / Admin |
| SF-B2B-02 | Gestion des voyageurs corporate | L'administrateur du compte entreprise peut ajouter/supprimer des employés. Chaque employé accède à BusExpress avec son compte personnel, qui est lié au compte entreprise. Les réservations de l'employé sont débitées du solde entreprise si configuré ainsi. | MUST | Passager corporate |
| SF-B2B-03 | Politique de voyage entreprise | L'admin entreprise configure des règles : budget maximum par trajet, routes autorisées, classes de bus autorisées, validation manager requise si dépassement. Les règles sont appliquées automatiquement lors des réservations des employés liés. | SHOULD | Passager corporate |
| SF-B2B-04 | Facturation mensuelle consolidée | Génération automatique le 1er de chaque mois d'une facture consolidée de tous les voyages du mois précédent, avec détail par employé et par ligne. Format PDF + CSV. Paiement par virement bancaire avec délai de 30 jours. | MUST | Passager corporate |
| SF-B2B-05 | Tableau de bord RH | Interface dédiée à l'administrateur RH : visualisation des dépenses par employé/département, top des routes utilisées, exports pour note de frais. | SHOULD | Passager corporate |
| SF-B2B-06 | Réservation de groupe ad hoc | Pour les voyages d'équipe (> 9 personnes), un formulaire de demande de groupe est disponible. BusExpress transmet la demande à l'opérateur concerné qui propose un tarif négocié. Confirmation sous 48h par email. | SHOULD | Passager corporate |

---

## 16. Module : Parrainage et referral

### 16.1 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-REF-01 | Lien de parrainage unique | Chaque compte enregistré dispose d'un lien de parrainage unique (ex : `busexpress.com/r/CODE6CAR`). Le lien est partageable depuis l'app via WhatsApp, SMS, ou copie directe. | MUST | Voyageur |
| SF-REF-02 | Récompenses de parrainage | À la première réservation payée du filleul : le parrain reçoit un crédit de 1 500 FCFA valable 90 jours ; le filleul reçoit une réduction de 1 000 FCFA sur sa première réservation. Les crédits ne sont pas convertibles en espèces. | MUST | Voyageur |
| SF-REF-03 | Tableau de bord parrainage | Dans l'espace compte : nombre de filleuls invités, nombre de filleuls ayant réservé, crédit total gagné, historique des crédits utilisés. | SHOULD | Voyageur |
| SF-REF-04 | Prévention de la fraude referral | Un filleul ne peut déclencher la récompense qu'une seule fois (lié à l'email et au numéro de téléphone). Détection en temps réel au moment de la première réservation du filleul : le système vérifie si l'appareil, l'IP ou le numéro de CB correspond au parrain — si oui, la récompense est bloquée immédiatement et jamais accordée (pas de crédit accordé puis retiré). Un job quotidien analyse les patterns suspects a posteriori (parrainages en cluster, vitesse d'inscription anormale) et soumet les cas détectés à la team fraude pour review manuel. | MUST | Système |

---

## 17. Module : Canal USSD et SMS basique

### 17.1 Vue d'ensemble

Pour atteindre les voyageurs sans smartphone ou sans connexion data stable, BusExpress propose un canal de réservation via USSD (`*345*BUS#`) et SMS structuré. Ce canal est volontairement simplifié : recherche et réservation de trajets directs uniquement.

### 17.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-USS-01 | Menu USSD de recherche | Composition de `*345*BUS#` → menu interactif : (1) Rechercher un trajet, (2) Mes réservations, (3) Annuler un trajet, (4) Aide. La session USSD dure maximum 180 secondes. Le menu s'adapte selon si le numéro est associé à un compte BusExpress. | MUST | Voyageur |
| SF-USS-02 | Réservation par USSD | Flux de réservation simplifié : saisie de la ville de départ (par code à 3 lettres, ex : COT pour Cotonou), ville d'arrivée, date (JJMM), heure de départ souhaitée. Liste des 3 premiers trajets disponibles affichés. Sélection par chiffre. Confirmation par PIN Mobile Money. | MUST | Voyageur |
| SF-USS-03 | Confirmation par SMS | Après paiement confirmé par Mobile Money : SMS de confirmation contenant le numéro de billet, le trajet, l'heure, le siège et un code de vérification à 6 chiffres (alternative au QR Code pour les portables basiques). Le contrôleur peut vérifier ce code manuellement dans son app. | MUST | Voyageur |
| SF-USS-04 | Consultation des réservations | Via USSD ou SMS `BILLET XXXXXXXX` (numéro de billet) : rappel des informations du voyage (trajet, heure, siège, code de vérification). | MUST | Voyageur |
| SF-USS-05 | Intégration opérateur téléphonique | Partenariats avec les opérateurs télécoms locaux (MTN Bénin, Moov Africa, Orange Bénin) pour le code court USSD et la tarification zéro-rating ou faible coût de la session. Pas de frais data pour l'utilisateur lors d'une session USSD. | MUST | Admin |

---

## 18. Module : Intermodalité et dernier kilomètre

### 18.1 Vue d'ensemble

La majorité des arrêts de bus en Afrique de l'Ouest ne sont pas desservis par les transports en commun locaux. Ce module intègre des options de mobilité pour le premier et le dernier kilomètre, directement dans l'application BusExpress.

### 18.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-INT-01 | Affichage des options de mobilité | Sur la page de confirmation de billet, le système affiche les options de transport disponibles pour rejoindre l'arrêt de départ et depuis l'arrêt d'arrivée : taxis, motos-taxis (Zem), services de ride-hailing partenaires (Gozem, Moov). Les options sont basées sur la géolocalisation de l'utilisateur et la géolocalisation de l'arrêt. | SHOULD | Voyageur |
| SF-INT-02 | Intégration partenaires mobilité | API d'intégration avec les services de mobilité partenaires : récupération des estimations de prix et durées, deep link vers l'app partenaire pour réservation. BusExpress ne gère pas la transaction du dernier kilomètre mais peut recevoir une commission d'affiliation. | COULD | Voyageur |
| SF-INT-03 | Cartographie des arrêts et accès | Chaque arrêt dispose d'une fiche détaillée : adresse précise, GPS, photos, services disponibles à proximité (restaurant, toilettes, pharmacie), accès pour PMR, heures d'ouverture si applicable. L'opérateur enrichit les données de ses arrêts. | SHOULD | Voyageur |

---

## 19. Module : API publique partenaires

### 19.1 Vue d'ensemble

L'API publique permet à des agrégateurs (Omio, Kombo, portails de voyage locaux) et à des développeurs tiers d'intégrer les données BusExpress dans leurs propres services.

### 19.2 Spécifications fonctionnelles

| ID | Intitulé | Description fonctionnelle | Priorité | Acteur |
|---|---|---|---|---|
| SF-API-01 | Portail développeur | Portail web (`developers.busexpress.com`) avec : documentation OpenAPI 3.0 interactive (Swagger UI), bac à sable (sandbox) avec données de test, gestion des clés API, suivi de la consommation et des limites. | SHOULD | Partenaire |
| SF-API-02 | Endpoints publics | Endpoints disponibles pour les partenaires : `GET /trips` (recherche de trajets), `GET /trips/{id}` (détail), `GET /stops` (liste des arrêts). Données en lecture seule. Format JSON:API. Authentification par API key dans les headers. | SHOULD | Partenaire |
| SF-API-03 | Endpoints de réservation partenaire | Endpoints de réservation pour les partenaires certifiés (niveau d'intégration supérieur) : `POST /bookings` (créer une réservation), `GET /bookings/{id}` (statut), `DELETE /bookings/{id}` (annuler). Webhooks configurables pour les notifications de statut. | COULD | Partenaire |
| SF-API-04 | Rate limiting et SLA partenaire | Rate limiting par clé API : 100 req/min niveau gratuit, 1000 req/min niveau certifié. SLA de disponibilité API publique : 99,5 %. Les pannes planifiées sont notifiées 48h à l'avance via la page status. Versioning : `/v1/`, `/v2/` avec politique de dépréciation de 12 mois minimum. | SHOULD | Système |

---

## 20. Exigences non fonctionnelles

### 20.1 Performance

| Indicateur | Cible | Méthode de mesure |
|---|---|---|
| Temps de réponse API recherche | < 800 ms au P95 | Prometheus + Grafana |
| Temps de réponse API réservation | < 500 ms au P95 | APM New Relic / Datadog |
| Chargement page initiale (LCP) | < 2,5 secondes sur 3G | Google Lighthouse / Web Vitals |
| Disponibilité plateforme | 99,9 % mensuel | Uptime Robot + SLA contractuel |
| Débit transactions simultanées | 500 TPS soutenu | Tests de charge JMeter / k6 |
| Temps de génération billet PDF | < 3 secondes (async) | Log service génération |
| Latence WebSocket GPS | < 200 ms | Mesure côté client |
| Temps de réponse API publique | < 1 000 ms au P95 | Prometheus |
| USSD — temps de réponse menu | < 3 secondes | Monitoring opérateur télécom |

### 20.2 Sécurité

- **SEC-01 :** Authentification par JWT RS256. Access token : 15 min. Refresh token : 30 jours, rotation à chaque usage. Rotation des clés de signature tous les 30 jours via HashiCorp Vault.
- **SEC-02 :** Chiffrement AES-256-GCM pour les données sensibles au repos (pièces d'identité, données bancaires tokenisées). Clés de chiffrement dans Vault, séparées des données.
- **SEC-03 :** Protection OWASP Top 10 : injection SQL (ORM + requêtes paramétrées), XSS (CSP headers stricts), CSRF (tokens SameSite + double submit cookie), Clickjacking (X-Frame-Options: DENY).
- **SEC-04 :** Rate limiting API : 100 req/min utilisateur authentifié, 20 req/min anonyme. Algorithme Token Bucket côté API Gateway.
- **SEC-05 :** Audit de sécurité externe annuel (PASSI certifié si disponible localement) + tests de pénétration semestriels par prestataire indépendant.
- **SEC-06 :** Conformité PCI-DSS SAQ A : BusExpress utilise exclusivement des formulaires de paiement hébergés par Stripe (Stripe.js / Payment Element). Aucune donnée de carte ne transite par les serveurs BusExpress. Aucun stockage de PAN, CVV, ou piste magnétique.
- **SEC-07 :** Gestion des secrets via HashiCorp Vault. Rotation automatique : clés API partenaires (90 j), secrets JWT (30 j), credentials DB (180 j). Aucun secret dans les variables d'environnement d'application ou le code source.
- **SEC-08 :** 2FA obligatoire pour tous les comptes admin, agent support, et admin opérateur.

### 20.3 Accessibilité et internationalisation

- **ACC-01 :** Conformité WCAG 2.1 niveau AA (contraste minimum 4.5:1, navigation clavier complète, attributs ARIA, textes alternatifs)
- **ACC-02 :** Support multilingue : Français (principal), Anglais, Arabe (RTL), et framework i18n extensible pour les langues locales (fon, éwé, dioula, wolof)
- **ACC-03 :** Localisation des formats : dates DD/MM/YYYY, nombres avec séparateurs locaux (1 000,50 FCFA), numéros de téléphone au format E.164 avec indicatif pays, formats de noms adaptables (prénom Nom)
- **ACC-04 :** Interface responsive mobile-first (breakpoints : 320px, 480px, 768px, 1024px, 1440px). Performance sur réseau 2G/3G : bundle JS ≤ 200 KB gzippé, images WebP avec lazy loading
- **ACC-05 :** Support navigateurs : Chrome ≥ 90, Firefox ≥ 88, Safari ≥ 14, Samsung Internet ≥ 14, UC Browser (fort taux de pénétration en Afrique subsaharienne)
- **ACC-06 :** Application PWA installable (Add to Home Screen) sur Android et iOS. Mode hors-ligne fonctionnel pour la consultation des billets et la dernière recherche

### 20.4 Scalabilité et maintenabilité

- **SCA-01 :** Architecture microservices containerisée (Docker + Kubernetes) avec scalabilité horizontale indépendante. HPA (Horizontal Pod Autoscaler) configuré sur les métriques CPU et file Kafka.
- **SCA-02 :** Zero-downtime deployments via rolling updates Kubernetes. Blue/green deployments pour les migrations de base de données.
- **SCA-03 :** Feature flags (Unleash ou LaunchDarkly) pour activation progressive des nouvelles fonctionnalités sans redéploiement.
- **SCA-04 :** Documentation API OpenAPI 3.0 auto-générée et maintenue synchrone avec le code (contract-first development).
- **SCA-05 :** Couverture de tests automatisés ≥ 80 % (unitaires + intégration). Tests de contrat (Pact) entre microservices. Tests de bout en bout (Playwright) sur les parcours critiques.
- **SCA-06 :** Versioning d'API : toutes les API internes et publiques sont versionnées (`/api/v1/`, `/api/v2/`). Politique de dépréciation : minimum 12 mois de notice avant suppression d'une version. Notifications par email aux développeurs enregistrés.

### 20.5 Reprise après sinistre (Disaster Recovery)

- **DR-01 :** RPO (Recovery Point Objective) : 1 heure maximum. Sauvegardes PostgreSQL toutes les heures (WAL streaming + snapshots). Réplication Redis en mode AOF (Append Only File) avec fsync toutes les secondes.
- **DR-02 :** RTO (Recovery Time Objective) : 4 heures maximum. Procédure de bascule documentée et testée semestriellement. Infrastructure secondaire en mode warm standby dans une région géographique distincte.
- **DR-03 :** Scénarios de tests de charge documentés : pic de fin d'année (Noël, Aïd, Pâques) → simulation de 3× le trafic moyen pendant 2 heures. En cas de dépassement de capacité : mode dégradé activé automatiquement (file d'attente de requêtes, message d'information à l'utilisateur, limitation du nombre de recherches simultanées).
- **DR-04 :** Politique de rétention des données : logs applicatifs 90 jours, données GPS agrégées 1 an, données GPS brutes 90 jours, données de navigation anonymisées 2 ans, données transactionnelles 10 ans (obligation légale comptable).

---

## 21. Modèle de données

### 21.1 Entités principales (v2.0 — modèle relationnel normalisé)

| Entité | Attributs clés | Relations |
|---|---|---|
| `User` | `userId` UUID PK, `email`, `phone`, `passwordHash`, `role` ENUM(voyageur/admin/agent_support/agent_operateur), `status`, `twoFactorEnabled`, `twoFactorSecret`, `createdAt`, `guestToken` | 1→N Bookings, 1→N PaymentMethods, 1→1 LoyaltyAccount, 1→N Sessions |
| `Session` | `sessionId`, `userId` FK, `deviceInfo`, `ipAddress`, `createdAt`, `lastActiveAt`, `revokedAt` | N→1 User |
| `Operator` | `operatorId`, `companyName`, `licenseNumber`, `commissionRate`, `status`, `bankAccountDetails` (chiffré) | 1→N Routes, 1→N Buses, 1→N Drivers, 1→N Agencies |
| `Agency` | `agencyId`, `operatorId` FK, `name`, `city`, `status` | N→1 Operator, 1→N AgencyUsers |
| `Driver` | `driverId`, `operatorId` FK, `firstName`, `lastName`, `licenseNumber`, `licenseExpiry`, `phone`, `status` | N→1 Operator, 1→N TripAssignments |
| `Bus` | `busId`, `operatorId` FK, `plateNumber`, `capacity`, `seatLayoutJson`, `amenities` JSONB, `status`, `nextMaintenanceDate`, `nextMaintenanceKm` | N→1 Operator, 1→N Trips |
| `Stop` | `stopId`, `name`, `nameAliases` ARRAY, `city`, `country`, `latitude`, `longitude`, `facilities` JSONB, `accessiblePMR` | N→N Routes via RouteStop |
| `Route` | `routeId`, `operatorId` FK, `routeName`, `distanceKm`, `scheduleType` ENUM(weekly/calendar) | N→N Stops via RouteStop, 1→N Trips |
| `RouteStop` | `routeStopId`, `routeId` FK, `stopId` FK, `sequenceOrder`, `scheduledOffset` (minutes depuis départ) | Liaison Route↔Stop |
| `Trip` | `tripId`, `routeId` FK, `busId` FK, `driverId` FK, `departureTime` (UTC), `arrivalTime` (UTC), `timezone`, `basePrice`, `status` ENUM(scheduled/departed/arrived/cancelled) | 1→N TripSeats, 1→N Bookings |
| `TripSeat` | `seatId`, `tripId` FK, `seatNumber`, `type` ENUM(window/aisle/middle), `class`, `priceModifier`, `status` ENUM(available/locked/booked/unavailable), `lockUserId`, `lockToken`, `lockExpiresAt` | N→1 Trip, 1→1 BookingPassenger |
| `Booking` | `bookingId`, `userId` FK (nullable si guest), `guestEmail`, `guestPhone`, `tripId` FK, `totalAmount`, `currency`, `serviceFee`, `discountAmount`, `couponCode`, `status` ENUM(voir section 4.3), `paymentId` FK, `idempotencyKey`, `createdAt` | N→1 User/Guest, N→1 Trip, 1→N BookingPassengers |
| `BookingPassenger` | `passengerId`, `bookingId` FK, `seatId` FK, `firstName`, `lastName`, `category` ENUM(adult/child/senior/student), `unitPrice`, `baggageKg`, `baggageFee` | N→1 Booking, 1→1 TripSeat |
| `Payment` | `paymentId`, `bookingId` FK, `amount`, `currency`, `method` ENUM(stripe/orange_money/wave/mtn_momo/moov/bank_transfer), `gatewayRef`, `gatewayPaymentLink`, `status`, `paidAt`, `reconciledAt` | 1→1 Booking |
| `Ticket` | `ticketId`, `bookingPassengerId` FK, `qrCodeData` (chiffré), `qrExpiresAt`, `pdfUrl`, `status` ENUM(valid/used/cancelled/transferred/expired), `transferredToUserId` | N→1 BookingPassenger |
| `Review` | `reviewId`, `ticketId` FK, `userId` FK, `globalRating` (1-5), `punctualityRating`, `comfortRating`, `cleanlinessRating`, `comment`, `operatorResponse`, `publishedAt`, `moderationStatus` | N→1 User, N→1 Ticket |
| `WaitlistEntry` | `waitlistId`, `tripId` FK, `userId` FK, `seatsWanted`, `seatPreference`, `joinedAt`, `priorityScore`, `expiresAt`, `status` ENUM(active/notified/expired/converted) | N→1 Trip, N→1 User |
| `SupportTicket` | `ticketId`, `userId` FK, `bookingId` FK (nullable), `category`, `description`, `status`, `assignedAgentId`, `createdAt`, `resolvedAt`, `csatScore` | N→1 User |
| `LoyaltyAccount` | `loyaltyId`, `userId` FK, `points`, `status` ENUM(bronze/silver/gold), `pointsExpireAt` | 1→1 User, 1→N LoyaltyTransactions |
| `ReferralCode` | `referralId`, `ownerId` FK, `code`, `rewardAmount`, `usageCount`, `maxUsage` | N→1 User, 1→N ReferralUses |
| `CorporateAccount` | `corporateId`, `companyName`, `rccm`, `balance`, `creditLimit`, `commissionRate`, `invoicingDay` | 1→N CorporateEmployees |
| `CouponCode` | `couponId`, `code` (unique), `type` ENUM(fixed/percent), `value`, `maxUsages`, `usageCount`, `validFrom`, `validUntil`, `operatorId` FK (nullable = global), `routeId` FK (nullable = toutes routes), `minAmount`, `status` | N→1 Operator (optionnel), N→N Bookings via BookingCoupon |
| `PriceAlert` | `alertId`, `userId` FK, `departureStopId` FK, `arrivalStopId` FK, `targetPrice`, `expiresAt`, `status` | N→1 User |

### 21.2 Index critiques pour la performance

- `TripSeat(tripId, status)` — disponibilité des sièges par trajet
- `Booking(userId, status, createdAt)` — historique utilisateur
- `Trip(departureTime, status, routeId)` — recherche par date et route
- `Review(operatorId, publishedAt)` — calcul de note opérateur
- `WaitlistEntry(tripId, status, priorityScore, joinedAt)` — gestion de la file
- `Stop(latitude, longitude)` — recherche géospatiale (index GIN PostGIS)

---

## 22. Interfaces et intégrations externes

| Système externe | Rôle | Interface et données échangées |
|---|---|---|
| **Stripe** | Paiement carte | API REST Stripe v3. Flux : création PaymentIntent → confirmation 3DS v2 → webhook `PAYMENT_SUCCEEDED/FAILED/DISPUTE_CREATED`. Tokenisation côté Stripe exclusivement. |
| **Orange Money Business** | Paiement mobile | OAuth2 client_credentials. Initiation paiement `POST /payments` → IPN webhook confirmation. Délai : 1-5 min. Remboursement via `POST /refunds`. |
| **Wave** | Paiement mobile | API Wave B2C. Génération lien de paiement. Notification IPN sur `statusUrl`. Remboursement via API Wave Refund. |
| **MTN Mobile Money** | Paiement mobile | API MoMo Collections. Authentification API Key + UUID. Requête vers MSISDN. Callback sur `statusUrl`. |
| **Moov Money** | Paiement mobile (Bénin) | API Moov Business. Authentification bearer token. Flux similaire à Orange Money. |
| **HashiCorp Vault** | Gestion des secrets | Secrets Engine KV v2 + Transit Encryption. Rotation automatique des credentials. Agent Vault sidecar en Kubernetes. |
| **Fournisseur GPS** | Localisation bus | API REST position initiale + WebSocket temps réel. Données : lat, lng, speed, heading, timestamp. SLA 99,5 %. Contrat de données avec confidentialité voyageur. |
| **OSRM / OpenStreetMap** | Calcul d'itinéraire | Self-hosted OSRM pour calcul de routes et ETA. Données OSM sous licence ODbL. Aucune dépendance Google Maps. |
| **ElasticSearch 8.x** | Recherche full-text | Index : stops (avec aliases), routes, operators. BM25 pour scoring. Mises à jour via CDC (Debezium) depuis PostgreSQL. |
| **Apache Kafka** | Bus d'événements | Topics : `booking-events`, `payment-events`, `notification-events`, `fraud-scoring`, `ml-feedback`. Rétention 7 jours. |
| **SendGrid** | Email | API v3. Templates HTML transactionnels + marketing. Webhook tracking d'ouverture et de clic. Domaine d'envoi authentifié (DKIM/SPF). |
| **Twilio** | SMS et OTP | API SMS transactionnels. Numéros locaux par pays. Gestion des opérateurs locaux (GSMA) pour la livraison optimale. |
| **WhatsApp Business API** | Notifications WhatsApp | API Meta Cloud. Templates validés par Meta pour chaque type de message. Opt-in explicite requis. Webhook entrant pour les réponses voyageurs. |
| **Opérateurs télécom (MTN, Orange, Moov)** | USSD | Accord de code court (`*345*BUS#`). Intégration via passerelle USSD (ex : Africa's Talking). Zéro-rating de la session pour l'utilisateur. |
| **Africa's Talking** | Passerelle USSD/SMS | API USSD et SMS pour les marchés d'Afrique subsaharienne. Gestion de la facturation et des shortcodes. |
| **InfluxDB** | Time-series GPS | Stockage des positions GPS horodatées. Requêtes de trajet historique. Rétention 90 jours (données brutes) + 1 an (données agrégées). |
| **MLflow** | Pipeline ML | Suivi des expériences de pricing et de détection de fraude. Registre des modèles. Déclenchement des réentraînements hebdomadaires. |
| **PagerDuty** | Alerting ops | Escalades d'alerte depuis Prometheus/Grafana vers les équipes on-call. Règles de routing par service et par horaire. |

---

## 23. Plan de livraison — Priorités

### 23.1 Corrections préalables (avant Sprint 1)

Incohérences à résoudre dans les specs avant tout développement :

- ✅ Module Avis et notation ajouté (Section 10) → alimente désormais SF-RCH-06
- ✅ Module Liste d'attente spécifié (Section 11) → référencé par SF-RCH-05
- ✅ SF-RCH-08 (aller-retour) conservé en MVP (MUST)
- ✅ SEC-06 corrigé : PCI-DSS SAQ A correctement défini
- ✅ Politique de versioning d'API ajoutée (SCA-06)
- ✅ Entité Stop normalisée avec table RouteStop (Section 21)
- ✅ Machine d'états complète avec DISPUTED, PARTIALLY_CANCELLED, PARTIALLY_REFUNDED
- ✅ SF-LDA-02 : bonus fidélité conditionné à la Phase 2 (programme fidélité non disponible en MVP)
- ✅ SF-B2B-01 : acteur clarifié (Entreprise cliente + Admin)
- ✅ SF-REF-04 : délai de détection fraude referral précisé (temps réel + batch quotidien)

**Contraintes de planning à initier dès J+0 :**
- **WhatsApp Business API (SF-GPS-06) :** La validation des templates WhatsApp par Meta dure 4 à 8 semaines. Le dossier de validation doit être soumis dès le premier jour du projet pour être disponible au lancement MVP.
- **Code court USSD *345*BUS# (SF-USS-01) :** La réservation d'un code court USSD auprès des opérateurs télécom locaux (MTN, Orange, Moov) prend 2 à 6 mois selon les pays. Cette démarche administrative doit être lancée immédiatement, en parallèle du développement, pour que le canal USSD soit disponible en Phase 2 (J+90).

### 23.2 MVP — Phase 1 (J+0 à J+90)

Fonctionnalités indispensables au lancement commercial :

**Recherche et réservation :**
- Recherche de trajets directs avec tarifs différenciés par catégorie (SF-RCH-01 à SF-RCH-06, SF-RCH-08, SF-RCH-11, SF-RCH-13)
- Sélection de siège avec Redlock (SF-SIE-01 à SF-SIE-05)
- Paiement : carte + Mobile Money + guest checkout (SF-PAY-01 à SF-PAY-11)
- Job de réconciliation webhooks (SF-PAY-07)

**Billets et embarquement :**
- Génération billet PDF + QR Code anti-clone (SF-TKT-01 à SF-TKT-03)
- Annulation et remboursement total (SF-TKT-05)
- Remboursement partiel groupe (SF-PAY-12)

**Compte voyageur :**
- Inscription, authentification + 2FA (SF-USR-01, SF-USR-02)
- Profil, historique, gestion des sessions (SF-USR-03, SF-USR-04, SF-USR-05)
- Notifications multi-canaux dont WhatsApp (SF-USR-08, SF-GPS-06)

**Portail opérateur :**
- Gestion des lignes, arrêts (entité Stop), flotte, conducteurs, tarifs (SF-OPR-01 à SF-OPR-04)
- Gestion des incidents et annulations (SF-OPR-06, SF-OPR-07)
- Manifeste des passagers (SF-OPR-08)
- Application de scan billet (SF-OPR-12)

**Finances et administration :**
- Module réconciliation financière opérateur complet (SF-REC-01 à SF-REC-06)
- Gestion des bagages basique (SF-BAG-01, SF-BAG-02)
- Module avis et notation (SF-AVS-01, SF-AVS-02, SF-AVS-04, SF-AVS-05)
- Module liste d'attente (SF-LDA-01 à SF-LDA-04)
- Support client basique : FAQ + ticket (SF-SUP-01, SF-SUP-02, SF-SUP-03)
- Administration et sécurité (SF-ADM-01 à SF-ADM-09)

### 23.3 Phase 2 — Post-MVP (J+90 à J+180)

- Suivi GPS temps réel + ETA adaptatif (SF-GPS-01 à SF-GPS-04)
- Alertes retard adaptatives (SF-GPS-03 révisé)
- Recherche avec correspondances A* (SF-RCH-04)
- Alertes de prix (SF-RCH-12)
- Abonnements trajet récurrent (SF-RCH-14)
- Tarification dynamique ML — niveau 2
- Programme de fidélité + statuts (SF-USR-07)
- Transfert de billet (SF-USR-09)
- Portail opérateur : multi-agences + promotions (SF-OPR-10, SF-OPR-11)
- Module parrainage (SF-REF-01 à SF-REF-04)
- Canal USSD/SMS basique (SF-USS-01 à SF-USS-05)
- Comptes entreprise et B2B — phase 1 (SF-B2B-01, SF-B2B-02, SF-B2B-04)
- Agent support + chatbot niveau 1 (SF-SUP-04, SF-SUP-05)
- Analytics avancés avec feedback ML fraude (SF-ADM-04, SF-ADM-05 révisé)
- Réponses opérateur aux avis (SF-AVS-03)

### 23.4 Phase 3 — Évolutions (J+180+)

- Recommandations personnalisées (filtrage collaboratif SVD)
- Feedback loop ML fraude + réentraînement automatique
- Mode hors-ligne avancé PWA (SF-RCH-10)
- Programme de fidélité avancé et gamification
- Intermodalité et dernier kilomètre (SF-INT-01 à SF-INT-03)
- API publique partenaires complète (SF-API-01 à SF-API-04)
- Comptes entreprise avancés : politique voyage, tableau RH (SF-B2B-03, SF-B2B-05, SF-B2B-06)
- Tableau de bord empreinte carbone voyageur
- Paiement fractionné 2x/3x (SF-PAY-14)
- Assistant IA conversationnel (LLM API) pour réservation en langage naturel
- Abonnements trajet récurrent (SF-RCH-14) — si non livré en Phase 2

---

*BusExpress — Spécifications Fonctionnelles v2.0 — Avril 2026*  
*Ce document incorpore l'audit complet v1.0 : 18 lacunes critiques résolues, 27 améliorations intégrées, 12 nouveaux modules ajoutés, 6 incohérences internes corrigées.*
