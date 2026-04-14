# BusExpress — Constitution pour le Developpement IA

> Ce document est la source de verite pour tous les agents Claude travaillant sur le projet BusExpress.
> Il est derive des specifications fonctionnelles v2.0 (127 specs, 23 sections, 19 modules).

---

## 1. Vision Projet

BusExpress est une plateforme marketplace de reservation de bus en ligne pour l'Afrique de l'Ouest.
Marche cible : connectivite variable (2G/3G), 40-50% sans smartphone, paiements Mobile Money majoritaires, francophone avec langues locales.

### Objectifs Techniques Non-Negociables

| Metrique | Cible |
|----------|-------|
| Disponibilite | 99,9% |
| Recherche P95 | < 800 ms |
| Reservation P95 | < 500 ms |
| LCP sur 3G | < 2,5 s |
| Bundle JS gzip | <= 200 KB |
| Zero double-booking | Garanti (Redlock 3 instances) |
| RPO | 1 heure |
| RTO | 4 heures |
| Couverture tests | >= 80% |

---

## 2. Architecture

### Stack Technique

- **Frontend** : PWA mobile-first, React Native (app scan controleur/chauffeur)
- **Backend** : Microservices containerises (Docker + Kubernetes)
- **Base de donnees** : PostgreSQL (relationnel) + PostGIS (geospatial)
- **Cache / Verrous** : Redis (3 instances independantes pour Redlock)
- **Recherche** : ElasticSearch 8.x (BM25, CDC via Debezium)
- **Evenements** : Apache Kafka (topics: booking-events, payment-events, notification-events, fraud-scoring, ml-feedback)
- **Time-series** : InfluxDB (donnees GPS)
- **Secrets** : HashiCorp Vault (KV v2 + Transit Encryption)
- **Feature Flags** : Unleash (ou LaunchDarkly)
- **ML** : MLflow (pricing dynamique, detection fraude)
- **Monitoring** : Prometheus + Grafana + PagerDuty
- **Calcul itineraire** : OSRM self-hosted (zero dependance Google Maps)
- **Cartes** : OpenStreetMap uniquement

### Microservices Principaux

```
search-service        — Recherche trajets, autocomplete, filtres
booking-service       — Reservation, machine d'etats, verrous Redlock
payment-service       — Orchestration paiement multi-passerelle
ticket-service        — Generation PDF/QR, validation embarquement
user-service          — Auth, profils, sessions, 2FA
notification-service  — Email (SendGrid), SMS (Twilio), WhatsApp (Meta), Push
gps-service           — Suivi temps reel, ETA dynamique
operator-service      — Portail operateur, flotte, conducteurs
admin-service         — Back-office, analytics, fraude
review-service        — Avis, notation, moderation
waitlist-service      — File d'attente, notifications de disponibilite
support-service       — Tickets, FAQ, chatbot
reconciliation-service — Finances operateur, versements
ussd-service          — Canal USSD/SMS via Africa's Talking
api-gateway           — Rate limiting (Token Bucket), auth, routing
```

### Communication Inter-Services

- **Synchrone** : REST JSON entre services (via API Gateway)
- **Asynchrone** : Kafka pour les evenements (booking, payment, notification, fraud)
- **Temps reel** : WebSocket pour GPS et disponibilite sieges
- **Fallback WebSocket** : Polling HTTP toutes les 10 secondes si connexion perdue

---

## 3. Security by Design (CRITIQUE)

### 3.1 Principes Fondamentaux

Chaque ligne de code doit etre ecrite avec la securite comme contrainte de design, pas comme couche ajoutee apres coup.

### 3.2 Authentification et Autorisation

- **JWT RS256** : Access token 15 min, Refresh token 30 jours avec rotation a chaque usage
- **Rotation des cles** : Cles JWT rotees tous les 30 jours via Vault
- **2FA obligatoire** : Tous les comptes admin, agent support, admin operateur
- **2FA optionnel** : Comptes voyageurs (TOTP ou SMS OTP)
- **Mot de passe** : bcrypt cost 12, JAMAIS en clair ou MD5/SHA
- **Sessions** : Liste des appareils connectes, revocation individuelle ou globale
- **OAuth2** : Google, Facebook, Apple pour l'inscription voyageur

### 3.3 Gestion des Secrets (Zero Trust)

```
REGLE ABSOLUE : Aucun secret dans le code source ou les variables d'environnement.
```

- Tous les secrets dans HashiCorp Vault
- Rotation automatique :
  - Cles API partenaires : 90 jours
  - Secrets JWT : 30 jours
  - Credentials DB : 180 jours
- Agent Vault sidecar en Kubernetes
- Chiffrement AES-256-GCM pour donnees sensibles au repos (pieces d'identite, donnees bancaires)
- Cles de chiffrement separees des donnees

### 3.4 Paiement (PCI-DSS SAQ A)

```
REGLE ABSOLUE : Aucune donnee de carte ne transite par les serveurs BusExpress.
```

- Formulaires de paiement heberges par Stripe (Stripe.js / Payment Element)
- Tokenisation cote Stripe exclusivement
- 3D Secure v2 obligatoire pour les cartes
- Zero stockage de PAN, CVV, ou piste magnetique
- Canal TLS 1.3 minimum

### 3.5 Protection OWASP Top 10

| Menace | Contre-mesure |
|--------|---------------|
| Injection SQL | ORM + requetes parametrees. JAMAIS de concatenation de strings dans les requetes |
| XSS | CSP headers stricts, echappement systematique des sorties |
| CSRF | Tokens SameSite + double submit cookie |
| Clickjacking | X-Frame-Options: DENY |
| Broken Auth | JWT RS256, 2FA, rate limiting sur login (5 tentatives/15 min) |
| Sensitive Data Exposure | AES-256-GCM au repos, TLS 1.3 en transit |
| Broken Access Control | RBAC strict par role (voyageur, operateur, agent, admin) |

### 3.6 Rate Limiting

- Utilisateur authentifie : 100 req/min
- Anonyme : 20 req/min
- API publique gratuit : 100 req/min par cle
- API publique certifie : 1000 req/min par cle
- Algorithme : Token Bucket cote API Gateway

### 3.7 Audit Log Immuable

- Journal append-only chiffre et signe
- Toutes les actions sensibles : connexions, modifications config, remboursements manuels, blocages compte, exports donnees
- Conservation 5 ans
- Non modifiable meme par les super-admins

### 3.8 Donnees Personnelles (RGPD)

- Anonymisation sous 30 jours apres demande de suppression
- Donnees transactionnelles conservees 10 ans (obligation legale)
- Export JSON/CSV de toutes les donnees personnelles sous 72 heures (Art. 20)
- Pieces d'identite chiffrees AES-256 en base

---

## 4. Modele de Donnees — Regles

### 4.1 Entites Principales

Les 21 entites du modele sont definies dans les specs (Section 21). Regles a respecter :

- **UUID** comme cle primaire partout (jamais d'auto-increment expose)
- **Timestamps UTC** : `departureTime` et `arrivalTime` stockes en UTC, convertis au fuseau local a l'affichage
- **ENUM types** : utiliser les enums PostgreSQL, pas des strings libres
- **JSONB** : pour `seatLayoutJson`, `amenities`, `facilities` — valider le schema en amont
- **Donnees sensibles** : chiffrees AES-256-GCM (bankAccountDetails, qrCodeData, pieces d'identite)
- **Soft delete** : preferer le marquage de statut a la suppression physique

### 4.2 Index Critiques

```sql
-- Performance obligatoire
CREATE INDEX idx_trip_seat_status ON TripSeat(tripId, status);
CREATE INDEX idx_booking_user ON Booking(userId, status, createdAt);
CREATE INDEX idx_trip_departure ON Trip(departureTime, status, routeId);
CREATE INDEX idx_review_operator ON Review(operatorId, publishedAt);
CREATE INDEX idx_waitlist ON WaitlistEntry(tripId, status, priorityScore, joinedAt);
CREATE INDEX idx_stop_geo ON Stop USING GIST(geography(point(longitude, latitude)));
```

### 4.3 Machine d'Etats de Reservation

```
PENDING_SEAT -> PENDING_PAYMENT -> CONFIRMED -> USED (final)
                                -> CANCELLED -> REFUNDED (final)
                                -> PARTIALLY_CANCELLED -> PARTIALLY_REFUNDED (final)
                                -> DISPUTED -> CONFIRMED (gagne) ou REFUNDED (perdu)
PENDING_SEAT -> EXPIRED (final)
PENDING_PAYMENT -> FAILED -> PENDING_SEAT (retry)
                -> EXPIRED (final)
```

Toute transition d'etat DOIT etre validee. Ne jamais permettre de transition invalide.

---

## 5. Algorithmes Critiques

### 5.1 Verrou Distribue Redlock (Zero Double-Booking)

```
3 instances Redis independantes (AZ differentes)
Quorum : 2/3
TTL : 600 secondes
Tolerance d'horloge : 50 ms

Acquisition :
  Pour chaque instance :
    SET seat:{tripId}:{seatId} {token} NX EX 600
  Si count(OK) >= 2 ET elapsed < 600s : verrou acquis
  Sinon : liberer tous les verrous, siège indisponible

Liberation (script Lua atomique) :
  if redis.call("GET", key) == token then
    return redis.call("DEL", key)
  else return 0
```

- Selection multiple (N sieges) : acquisition sequentielle, rollback atomique via PIPELINE si un verrou echoue
- Minuterie visible (10:00 -> 0:00), alerte a 2:00

### 5.2 Recherche et Scoring

- **Autocomplete** : Structure Trie en memoire, reponse < 200 ms des 2 caracteres
- **Recherche directe** : ElasticSearch BM25 + cache Redis TTL 60s
- **Correspondances** : Algorithme A* (max 1 correspondance)
- **Tri Recommande** : 40% prix + 30% duree + 20% note operateur + 10% ponctualite
- **Suggestions siege** : BFS sur le graphe des sieges

### 5.3 Idempotence des Transactions

- Chaque tentative de paiement = `idempotency_key` UUID genere cote client
- En cas de rejeu : le serveur retourne la reponse de la premiere tentative
- Cles stockees 24 heures

### 5.4 Reconciliation Webhooks

- Job Kafka Streams toutes les 5 minutes
- Detecte les paiements `PENDING_PAYMENT` > 15 minutes
- Interroge l'API de la passerelle pour le statut reel
- Alerte admin si > 10 cas/heure

---

## 6. Test-Driven Development (TDD)

### 6.1 Workflow Obligatoire

```
1. Ecrire le test (RED) — le test DOIT echouer
2. Executer le test — confirmer l'echec
3. Ecrire l'implementation minimale (GREEN)
4. Executer le test — confirmer le succes
5. Refactorer (IMPROVE)
6. Verifier couverture >= 80%
```

### 6.2 Types de Tests Requis

| Type | Couverture | Outils |
|------|-----------|--------|
| Unitaires | Fonctions, services, validations | Jest/Vitest + base isolee |
| Integration | API endpoints, DB, Kafka | Testcontainers (PostgreSQL, Redis, Kafka) |
| Contrat | Inter-microservices | Pact |
| E2E | Parcours critiques | Playwright |
| Charge | Performance SLA | k6 / JMeter |
| Securite | OWASP | Tests de penetration semestriels |

### 6.3 Parcours E2E Critiques (Playwright)

1. Recherche -> Selection siege -> Paiement carte -> Billet PDF
2. Recherche -> Paiement Mobile Money -> Attente confirmation -> Billet
3. Guest checkout complet
4. Annulation et remboursement
5. Scan QR Code a l'embarquement (mode online + offline)
6. Inscription operateur -> Creation ligne -> Publication
7. Liste d'attente -> Notification -> Confirmation
8. Parcours USSD basique

### 6.4 Tests de Securite Specifiques

- Double-booking : 100 requetes concurrentes sur le meme siege -> exactement 1 verrou acquis
- Idempotence : meme `idempotency_key` 10 fois -> 1 seule transaction creee
- Rate limiting : depasser la limite -> reponse 429
- JWT expire : requete avec token expire -> reponse 401
- Injection SQL : payloads OWASP sur tous les champs de saisie
- XSS : payloads dans les champs avis/commentaire

---

## 7. Regles Metier Cles

### 7.1 Tarification

- Prix TTC toujours (toutes taxes incluses)
- Reductions par categorie : enfant 2-11 (defaut 50%), senior 60+ (defaut 20%), etudiant (sur justificatif) — configurable par operateur
- Maximum 9 passagers par recherche
- Prix garanti pendant la duree du verrou (10 min)
- Frais de service affiches separement (transparence)
- Devise locale de l'operateur, conversion taux du jour

### 7.2 Annulation et Remboursement

- > 24h avant depart : 100%
- 2h-24h : 50%
- < 2h : 0%
- (Configurable par operateur)
- Remboursement partiel groupe au prorata
- Mobile Money : 72h, Carte bancaire : 7 jours

### 7.3 QR Code Anti-Clone

- Encode : bookingId, seatId, tripId, passengerName, expiresAt
- Signature HMAC-SHA256, cle rotative quotidiennement
- Validite : 24h avant depart -> 2h apres
- Marquage USED synchrone AVANT embarquement
- Double scan = alerte immediate au controleur
- Invalidation automatique si billet transfere

### 7.4 Mineurs

- < 16 ans non accompagnes : validation parentale par email obligatoire avant emission du billet

### 7.5 Liste d'Attente

- FIFO stricte en Phase 1 (pas de bonus fidelite)
- Bonus fidelite en Phase 2 (Or et > 10 voyages : +30 min d'avance)
- 15 minutes pour confirmer apres notification
- Expire 4h avant le depart
- Max 3 trajets en liste d'attente par compte

---

## 8. Integrations Externes

### 8.1 Paiement

| Passerelle | Protocole | Particularites |
|-----------|-----------|----------------|
| Stripe | REST v3 + webhooks | 3DS v2, PaymentIntent, Disputes API |
| Orange Money | OAuth2 + IPN webhook | Delai 1-5 min |
| Wave | API B2C + IPN | Lien de paiement |
| MTN MoMo | API Key + UUID | Callback MSISDN |
| Moov Money | Bearer token | Similaire Orange Money |

### 8.2 Notifications

| Canal | Fournisseur | Contrainte |
|-------|------------|------------|
| Email | SendGrid | DKIM/SPF, templates HTML |
| SMS | Twilio | Numeros locaux par pays |
| WhatsApp | Meta Cloud API | Templates valides par Meta (4-8 semaines), opt-in explicite |
| Push | FCM/APNS | Opt-in |
| USSD | Africa's Talking | Code court, zero-rating |

### 8.3 Delais de Notification

- Email de confirmation : < 60 secondes apres paiement
- SMS + WhatsApp : < 90 secondes
- Rappel : J-1 et H-2 avant depart
- Horaires silencieux : 22h00-07h00 locale

---

## 9. Accessibilite et Internationalisation

- **WCAG 2.1 AA** : contraste 4.5:1, navigation clavier, ARIA, textes alternatifs
- **Langues** : Francais (principal), Anglais, Arabe (RTL), extensible (fon, ewe, dioula, wolof)
- **Formats** : dates DD/MM/YYYY, nombres 1 000,50 FCFA, telephone E.164
- **PWA installable** : mode hors-ligne pour billets et derniere recherche
- **Breakpoints** : 320, 480, 768, 1024, 1440
- **Navigateurs** : Chrome >= 90, Firefox >= 88, Safari >= 14, Samsung Internet >= 14, UC Browser

---

## 10. Plan de Livraison

### Phase 1 — MVP (J+0 a J+90)

Modules MUST : Recherche, Selection siege, Paiement (carte + Mobile Money + guest), Billets/QR, Compte voyageur (auth + 2FA), Notifications (email/SMS/WhatsApp), Portail operateur (lignes/flotte/tarifs/incidents/manifeste/scan), Reconciliation financiere, Bagages basique, Avis/notation, Liste d'attente, Support (FAQ + tickets), Administration complete.

### Phase 2 — Post-MVP (J+90 a J+180)

GPS temps reel, correspondances A*, alertes prix, fidelite, transfert billet, multi-agences, parrainage, USSD/SMS, B2B phase 1, chatbot, analytics ML.

### Phase 3 — Evolutions (J+180+)

Recommandations ML, intermodalite, API publique, B2B avance, paiement fractionne, assistant IA conversationnel.

---

## 11. Conventions de Code

### 11.1 Structure du Projet

```
src/
  services/
    search/
    booking/
    payment/
    ticket/
    user/
    notification/
    gps/
    operator/
    admin/
    review/
    waitlist/
    support/
    reconciliation/
    ussd/
  shared/
    lib/
    types/
    middleware/
    validation/
  infrastructure/
    kafka/
    redis/
    database/
    vault/
```

### 11.2 Regles

- Fichiers < 800 lignes, fonctions < 50 lignes
- Immutabilite par defaut (pas de mutation d'objets)
- Gestion d'erreurs explicite a chaque niveau
- Validation des entrees a toutes les frontieres systeme
- Pas de hardcoded values — constantes ou configuration
- Nommage explicite et descriptif
- Pas de `any` en TypeScript
- Pas de `console.log` en production (utiliser un logger structure)

### 11.3 API Design

- Versioning : `/api/v1/`, `/api/v2/`
- Format reponse JSON enveloppe : `{ success, data, error, meta }`
- Codes HTTP semantiques
- Pagination sur toutes les listes
- Depreciation : 12 mois minimum de notice

### 11.4 Git

- Conventional commits : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`
- Branches : `feature/`, `fix/`, `refactor/`
- PR avec description complete et test plan

---

## 12. Checklist Avant Chaque Commit

- [ ] Tests ecrits AVANT l'implementation (TDD)
- [ ] Couverture >= 80%
- [ ] Aucun secret dans le code
- [ ] Toutes les entrees utilisateur validees
- [ ] Requetes SQL parametrees (pas de concatenation)
- [ ] Sorties echappees (XSS)
- [ ] Machine d'etats respectee (pas de transition invalide)
- [ ] Idempotence sur les operations de paiement
- [ ] Logs structures (pas de console.log)
- [ ] Performance : respecte les SLA (800ms recherche, 500ms reservation)
- [ ] Accessibilite : ARIA, contraste, clavier
- [ ] Mobile-first : teste sur 320px
- [ ] Pas de dependance Google Maps (OSM/OSRM uniquement)

---

## 13. Patterns Specifiques au Domaine

### 13.1 Stale-While-Revalidate (Recherche)

Les resultats de recherche sont servis depuis le cache Redis (TTL 60s). Le client affiche les donnees en cache immediatement et rafraichit silencieusement en arriere-plan. Un indicateur de fraicheur est toujours visible.

### 13.2 Gestion Mobile Money

Le paiement Mobile Money peut prendre 1-15 minutes. Le siege reste verrouille 20 minutes. L'ecran d'attente affiche le statut via polling toutes les 10 secondes. Notification multi-canal des confirmation/echec.

### 13.3 Mode Hors-Ligne

- Service Worker Cache First pour la derniere recherche
- Billets confirmes toujours accessibles hors-ligne
- Bandeau d'avertissement avec date de mise en cache
- Validation QR offline limitee (max 30, sync des que reseau revient, max 5s avant sync)

### 13.4 Multi-Tenant Operateur

- Chaque operateur configure ses propres : tarifs, conditions d'annulation, politique bagages, reductions par categorie, parametres de tarification dynamique
- Multi-agences : sous-comptes avec perimetre limite aux lignes assignees
- Roles : Admin operateur > Manager agence > Agent guichet (lecture + reservations guichet uniquement)

### 13.5 Detection de Fraude

- Referral : verification temps reel (appareil, IP, CB) + batch quotidien (patterns suspects)
- Chargeback : collecte automatique de preuves, transmission Stripe sous 48h
- ML scoring : seuil configurable, review dans un SLA de 4h pour score > 0.85
- Reentrainement hebdomadaire avec labels manuels (MLflow)
