import Link from 'next/link';
import { Car, House, Clock, MapPin, ArrowDown } from 'lucide-react';

import { homeVisitBenefits } from '@/config/services';
import { company } from '@/config/site';
import { Card, CardBody, CardTitle, IconChip } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HomeVisitMotif, DotGrid } from '@/components/graphics/decor';

const icons = {
  car: Car,
  house: House,
  clock: Clock,
  map: MapPin,
} as const;

const tones = ['brand', 'ocean', 'violet', 'coral'] as const;

/**
 * The "we come to you" section. Sits directly after the trust strip so the
 * home-visit model is established before anyone scrolls into the services.
 */
export function WeComeToYou() {
  return (
    <section className="section bg-white" aria-labelledby="we-come-to-you-heading">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="eyebrow">
              <House className="size-3.5" aria-hidden="true" />
              We come to you
            </p>

            <h2 id="we-come-to-you-heading" className="mt-4 text-3xl sm:text-4xl">
              We bring physiotherapy to your doorstep
            </h2>

            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Avoid unnecessary travel and receive physiotherapy support in a familiar and
              convenient environment. {company.displayName} provides home-visit appointments
              throughout {company.primaryServiceArea}, subject to postcode availability.
            </p>

            <p className="mt-4 leading-relaxed text-ink-soft">
              It also makes the appointment more useful. Being in your own space means we can look
              at the stairs you actually climb, the chair you actually sit in and the doorway you
              actually struggle with — rather than a version of them described from memory.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="#postcode-checker">
                  <ArrowDown aria-hidden="true" />
                  Check Your Postcode
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/areas-we-cover">View our home-visit coverage area</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-4xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-ocean-50 p-6 sm:p-8">
              <DotGrid className="absolute inset-0 text-brand-200/40" />
              <HomeVisitMotif className="relative mx-auto w-full max-w-sm" />
            </div>
          </div>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {homeVisitBenefits.map((benefit, index) => {
            const Icon = icons[benefit.icon];
            return (
              <li key={benefit.title}>
                <Card as="article" className="h-full card-hover">
                  <IconChip tone={tones[index % tones.length]}>
                    <Icon className="size-6" />
                  </IconChip>
                  <CardTitle className="mt-5 text-lg">{benefit.title}</CardTitle>
                  <CardBody className="text-sm">{benefit.body}</CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
