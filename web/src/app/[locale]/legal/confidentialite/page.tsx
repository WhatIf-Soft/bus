export default function ConfidentialitePage() {
  return (
    <>
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Conforme RGPD · Loi ivoirienne n° 2013-450
        </p>
        <h1 className="display mt-2 text-4xl font-medium leading-[1.05] tracking-tight">
          Politique de <span className="italic">confidentialité</span>
        </h1>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-text-muted)]">
          Cette page décrit précisément quelles données nous collectons, pourquoi, combien de temps
          nous les conservons, avec qui nous les partageons, et comment vous pouvez exercer vos
          droits.
        </p>
      </header>

      <Section id="responsable" title="1. Responsable du traitement">
        <p>
          BusExpress SAS, société au capital de 10 000 000 FCFA, immatriculée au RCCM
          d&apos;Abidjan sous le numéro RCCM-ABJ-2024-B-07421. Siège : Cocody Riviera 2, Abidjan,
          Côte d&apos;Ivoire. Délégué à la protection des données (DPO) :{' '}
          <a href="mailto:dpo@busexpress.africa" className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline">
            dpo@busexpress.africa
          </a>
          .
        </p>
      </Section>

      <Section id="donnees-collectees" title="2. Données collectées">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              <th className="py-2 pr-4 font-semibold">Catégorie</th>
              <th className="py-2 pr-4 font-semibold">Finalité</th>
              <th className="py-2 font-semibold">Durée</th>
            </tr>
          </thead>
          <tbody>
            <Row
              cat="Identité"
              purpose="Nom, prénom, date de naissance, pièce d'identité"
              dur="10 ans (obligation légale)"
            />
            <Row cat="Contact" purpose="Email, numéro de téléphone, adresse" dur="Compte actif + 3 ans" />
            <Row cat="Réservations" purpose="Historique de trajets, tickets, remboursements" dur="10 ans" />
            <Row cat="Paiements" purpose="Tokens (PAN jamais stocké), transactions" dur="10 ans" />
            <Row cat="Navigation" purpose="Logs, cookies techniques, IP" dur="13 mois" />
            <Row cat="Localisation GPS" purpose="Suivi trajet en temps réel" dur="90 jours puis anonymisée" />
            <Row cat="Communications" purpose="Emails, SMS, WhatsApp envoyés" dur="3 ans" />
          </tbody>
        </table>
      </Section>

      <Section id="bases-legales" title="3. Bases légales">
        <ul>
          <li>
            <strong>Exécution du contrat</strong> : toutes les données nécessaires pour réserver,
            payer, recevoir et utiliser votre billet.
          </li>
          <li>
            <strong>Obligation légale</strong> : données transactionnelles et comptables
            conservées 10 ans.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : sécurité des paiements, prévention de la fraude,
            amélioration du service.
          </li>
          <li>
            <strong>Consentement</strong> : marketing, newsletters, personnalisation avancée — toujours avec possibilité de retrait.
          </li>
        </ul>
      </Section>

      <Section id="destinataires" title="4. Destinataires et sous-traitants">
        <p>
          Nous partageons vos données uniquement avec des sous-traitants strictement nécessaires
          au service, liés par contrat de traitement (Art. 28 RGPD) et situés dans des pays
          offrant un niveau de protection adéquat ou bénéficiant de clauses contractuelles types.
        </p>
        <ul>
          <li>Stripe (paiements cartes, Irlande)</li>
          <li>Orange Money, MTN MoMo, Wave, Moov (Mobile Money, UEMOA)</li>
          <li>SendGrid (emails transactionnels, USA + SCC)</li>
          <li>Twilio (SMS, USA + SCC)</li>
          <li>Meta WhatsApp Business (notifications, Irlande)</li>
          <li>Hébergeur cloud Scaleway (France, certifié HDS)</li>
        </ul>
      </Section>

      <Section id="droits" title="5. Vos droits">
        <p>
          Vous pouvez à tout moment exercer les droits suivants en écrivant à{' '}
          <a href="mailto:dpo@busexpress.africa" className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline">
            dpo@busexpress.africa
          </a>{' '}
          ou depuis votre compte :
        </p>
        <ul>
          <li>Accès à vos données (Art. 15)</li>
          <li>Rectification (Art. 16)</li>
          <li>Effacement / « droit à l&apos;oubli » (Art. 17) — anonymisation sous 30 jours</li>
          <li>Limitation du traitement (Art. 18)</li>
          <li>Portabilité — export JSON/CSV fourni sous 72 h (Art. 20)</li>
          <li>Opposition (Art. 21)</li>
          <li>Retrait du consentement à tout moment</li>
        </ul>
      </Section>

      <Section id="securite" title="6. Sécurité">
        <p>
          Toutes les données sensibles (pièces d&apos;identité, coordonnées bancaires tokenisées,
          tokens de paiement) sont chiffrées en base avec AES-256-GCM. Les échanges réseau
          utilisent TLS 1.3. Les journaux d&apos;audit sont immuables, chiffrés et signés.
          Audits de sécurité externes semestriels.
        </p>
      </Section>

      <Section id="reclamation" title="7. Réclamation">
        <p>
          En cas de désaccord persistant, vous pouvez saisir l&apos;Autorité de Régulation des
          Télécommunications de Côte d&apos;Ivoire (ARTCI) ou la CNIL (pour les résidents européens).
        </p>
      </Section>

      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        Dernière mise à jour : 15 février 2026 · Version 3.0
      </p>
    </>
  );
}

function Row({
  cat,
  purpose,
  dur,
}: {
  readonly cat: string;
  readonly purpose: string;
  readonly dur: string;
}) {
  return (
    <tr className="border-b border-black/5 last:border-b-0">
      <td className="py-3 pr-4 align-top">
        <span className="inline-block rounded-[var(--radius-full)] bg-[var(--color-accent-warm)]/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-warm-ink)]">
          {cat}
        </span>
      </td>
      <td className="py-3 pr-4 align-top text-[var(--color-text)]">{purpose}</td>
      <td className="py-3 align-top text-[var(--color-text-muted)]">{dur}</td>
    </tr>
  );
}

function Section({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="display text-2xl font-medium leading-tight tracking-tight">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-[var(--color-text)] [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
