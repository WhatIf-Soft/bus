export default function CGUPage() {
  return (
    <>
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Version 2.1 — en vigueur depuis le 1er mars 2026
        </p>
        <h1 className="display mt-2 text-4xl font-medium leading-[1.05] tracking-tight">
          Conditions générales <span className="italic">d&apos;utilisation</span>
        </h1>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-text-muted)]">
          Les présentes conditions régissent l&apos;utilisation de la plateforme BusExpress. En
          créant un compte ou en effectuant une réservation, vous en acceptez les termes.
        </p>
      </header>

      <Section id="objet" title="1. Objet">
        <p>
          BusExpress (la « Plateforme ») est un service de mise en relation entre voyageurs et
          compagnies de transport de passagers (les « Opérateurs ») desservant l&apos;Afrique de
          l&apos;Ouest. La Plateforme permet la recherche, la réservation, le paiement et le suivi
          de trajets en autocar.
        </p>
      </Section>

      <Section id="compte" title="2. Création de compte">
        <p>
          L&apos;accès au service nécessite la création d&apos;un compte. Vous garantissez que
          les informations fournies sont exactes et vous engagez à les maintenir à jour.
          L&apos;inscription est réservée aux personnes majeures (≥ 18 ans) ou aux mineurs
          accompagnés d&apos;un représentant légal ayant validé leur inscription par email.
        </p>
      </Section>

      <Section id="reservation" title="3. Réservation et paiement">
        <ul>
          <li>Le prix affiché est toujours TTC et comprend les frais de service de la Plateforme.</li>
          <li>
            Une fois la réservation confirmée, un billet électronique avec QR code est envoyé par
            email, SMS et WhatsApp selon vos préférences de notification.
          </li>
          <li>
            Le siège est garanti pendant la durée du verrou (10 minutes). Passé ce délai, la
            réservation expire et les sièges sont relibérés.
          </li>
          <li>
            Les paiements Mobile Money peuvent nécessiter jusqu&apos;à 15 minutes pour être
            confirmés. En cas de dépassement, la transaction est automatiquement annulée et les
            sièges libérés.
          </li>
        </ul>
      </Section>

      <Section id="annulation" title="4. Annulation et remboursement">
        <p>
          Les conditions de remboursement dépendent du délai d&apos;annulation avant le départ et
          de la politique propre à chaque Opérateur. À défaut de stipulation spécifique, les règles
          par défaut suivantes s&apos;appliquent :
        </p>
        <ul>
          <li>Plus de 24 h avant : remboursement intégral (100 %).</li>
          <li>Entre 2 h et 24 h avant : remboursement partiel (50 %).</li>
          <li>Moins de 2 h avant ou no-show : aucun remboursement.</li>
        </ul>
        <p>
          Les remboursements sont effectués dans un délai de 72 h pour Mobile Money et 7 jours pour
          les cartes bancaires, sur le moyen de paiement initial.
        </p>
      </Section>

      <Section id="responsabilite" title="5. Responsabilité">
        <p>
          BusExpress est un intermédiaire technique. La responsabilité du transport incombe à
          l&apos;Opérateur exploitant. En cas d&apos;incident (retard, annulation, perte de
          bagage), les réclamations doivent être adressées à l&apos;Opérateur, BusExpress
          facilitant la médiation via son service Support.
        </p>
      </Section>

      <Section id="donnees" title="6. Données personnelles">
        <p>
          BusExpress traite vos données conformément au RGPD et à la loi ivoirienne n° 2013-450.
          Consultez notre{' '}
          <a
            href="/fr/legal/confidentialite"
            className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline"
          >
            politique de confidentialité
          </a>{' '}
          pour le détail.
        </p>
      </Section>

      <Section id="litiges" title="7. Litiges">
        <p>
          Les présentes conditions sont régies par le droit ivoirien. À défaut de règlement
          amiable, les tribunaux d&apos;Abidjan seront seuls compétents, sauf disposition légale
          contraire liée au domicile du consommateur.
        </p>
      </Section>

      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        Dernière mise à jour : 1er mars 2026 · Archives des versions précédentes disponibles sur
        simple demande à legal@busexpress.africa.
      </p>
    </>
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
