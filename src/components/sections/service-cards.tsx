import Link from 'next/link';
import {
  Activity,
  Move,
  Dumbbell,
  ScanLine,
  Trophy,
  HeartPulse,
  Check,
  ArrowRight,
} from 'lucide-react';
import { services, type IconName } from '@/config/services';
import { Card, CardBody, CardTitle, IconChip } from '@/components/ui/card';

const icons: Record<IconName, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  move: Move,
  dumbbell: Dumbbell,
  scan: ScanLine,
  trophy: Trophy,
  'heart-pulse': HeartPulse,
};

const tones = ['brand', 'ocean', 'violet', 'coral', 'sand', 'brand'] as const;

/** Service cards. `detailed` adds the "what typically happens" list. */
export function ServiceCards({ detailed = false }: { detailed?: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, index) => {
        const Icon = icons[service.icon];
        return (
          <li key={service.slug} id={service.slug} className="scroll-mt-28">
            <Card as="article" className="flex h-full flex-col card-hover">
              <IconChip tone={tones[index % tones.length]}>
                <Icon className="size-6" />
              </IconChip>
              <CardTitle className="mt-5">{service.title}</CardTitle>
              <CardBody>{service.summary}</CardBody>

              {detailed && (
                <>
                  <p className="mt-4 leading-relaxed text-ink-soft">{service.detail}</p>
                  <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-brand-800">
                    What typically happens
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-brand-600"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {!detailed && (
                <p className="mt-auto pt-5">
                  <Link
                    href={`/physiotherapy#${service.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 transition hover:decoration-brand-700"
                  >
                    More about {service.title.toLowerCase()}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </p>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
