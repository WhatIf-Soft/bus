export default function AccessibilitePage() {
  return (
    <>
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Engagement WCAG 2.1 — niveau AA
        </p>
        <h1 className="display mt-2 text-4xl font-medium leading-[1.05] tracking-tight">
          Accessibilité <span className="italic">numérique</span>
        </h1>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-text-muted)]">
          BusExpress s&apos;engage à rendre ses services accessibles au plus grand nombre,
          notamment aux personnes en situation de handicap. Conformité cible : WCAG 2.1 niveau AA.
        </p>
      </header>

      <Section id="etat-conformite" title="1. État de conformité">
        <p>
          Au 1er avril 2026, la plateforme BusExpress est <strong>partiellement conforme</strong>{' '}
          avec le référentiel général d&apos;amélioration de l&apos;accessibilité (RGAA) et WCAG
          2.1 AA. Un audit externe a été mené en mars 2026 par le cabinet Access42. Le taux de
          conformité global est de <strong>87 %</strong>.
        </p>
      </Section>

      <Section id="non-conformites" title="2. Non-conformités identifiées">
        <p>Des travaux sont en cours pour résoudre les points suivants avant le 1er juillet 2026 :</p>
        <ul>
          <li>
            Certains composants de calendrier (sélection de date) ne respectent pas entièrement
            les attentes de navigation clavier sur Safari iOS 14.
          </li>
          <li>
            Les cartes de suivi GPS en temps réel n&apos;offrent pas d&apos;alternative textuelle
            équivalente aux indicateurs visuels.
          </li>
          <li>
            Les PDF de billets téléchargés ne sont pas tous balisés pour une navigation
            assistive (correction prévue Q2 2026).
          </li>
        </ul>
      </Section>

      <Section id="technologies" title="3. Technologies compatibles">
        <ul>
          <li>Lecteurs d&apos;écran : NVDA 2023+, JAWS 2023+, VoiceOver (macOS 13+, iOS 15+), TalkBack Android 13+</li>
          <li>Navigateurs : Chrome 110+, Firefox 110+, Safari 16+, Samsung Internet 23+, UC Browser 13.5+</li>
          <li>Grossisseurs : ZoomText 2023, Magnifier Windows</li>
          <li>Accès par commande vocale : Dragon 16+</li>
        </ul>
      </Section>

      <Section id="signaler" title="4. Signaler un problème">
        <p>
          Si vous rencontrez un défaut d&apos;accessibilité, écrivez-nous à{' '}
          <a
            href="mailto:accessibilite@busexpress.africa"
            className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline"
          >
            accessibilite@busexpress.africa
          </a>
          . Nous nous engageons à répondre dans un délai de 7 jours ouvrés. Indiquez l&apos;URL
          concernée, le navigateur et la technologie d&apos;assistance utilisés.
        </p>
      </Section>

      <Section id="droits" title="5. Vos recours">
        <p>
          En cas de réponse non satisfaisante, vous pouvez contacter le Défenseur des droits
          (France) ou l&apos;Autorité de Régulation des Télécommunications de Côte d&apos;Ivoire
          (ARTCI) pour une médiation.
        </p>
      </Section>

      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        Cette déclaration a été établie le 1er avril 2026 et sera mise à jour au moins une fois
        par an.
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
