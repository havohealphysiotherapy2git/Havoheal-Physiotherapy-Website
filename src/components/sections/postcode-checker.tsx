'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, MessageCircle, Phone, Search, CheckCircle2, HelpCircle } from 'lucide-react';

import { checkPostcodeCoverage, type PostcodeCheckResult } from '@/config/areas';
import { company, telHref, whatsappHref } from '@/config/site';
import { Button } from '@/components/ui/button';
import { FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { track } from '@/lib/analytics';

/**
 * Indicative postcode coverage check.
 *
 * Deliberately honest about what it can and cannot tell you: it matches the
 * postcode area against the areas we serve, which is a useful first filter, but
 * it is never presented as a confirmation. Every outcome — including a match —
 * ends by asking the visitor to confirm with us, because appointment
 * availability is what actually decides it.
 *
 * Runs entirely in the browser: no postcode is transmitted anywhere.
 */
export function PostcodeChecker({ id = 'postcode-checker' }: { id?: string }) {
  const [value, setValue] = React.useState('');
  const [result, setResult] = React.useState<PostcodeCheckResult | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  const inputId = `${id}-input`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const outcome = checkPostcodeCoverage(value);
    setResult(outcome);
    // Only the coarse outcome is recorded — never the postcode itself.
    track('select_date', { postcode_check: outcome });
    window.setTimeout(() => resultRef.current?.focus(), 60);
  };

  return (
    <div
      id={id}
      className="scroll-mt-28 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8"
    >
      <h3 className="flex items-center gap-2 text-xl text-ink sm:text-2xl">
        <MapPin className="size-5 shrink-0 text-brand-700" aria-hidden="true" />
        Check your postcode
      </h3>

      <form onSubmit={handleSubmit} className="mt-4" noValidate>
        <FieldLabel htmlFor={inputId}>Your postcode</FieldLabel>
        <FieldHint id={hintId}>
          We will tell you whether your postcode looks like it falls inside the area we travel to.
          Nothing is sent anywhere — this check runs in your browser.
        </FieldHint>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id={inputId}
            name="postcode"
            type="text"
            inputMode="text"
            autoComplete="postal-code"
            autoCapitalize="characters"
            placeholder="B15 2TT"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (result) setResult(null);
            }}
            aria-describedby={result === 'invalid' ? `${hintId} ${errorId}` : hintId}
            aria-invalid={result === 'invalid' ? true : undefined}
            className="block min-h-[48px] w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-ink uppercase shadow-sm transition placeholder:normal-case placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-600 sm:max-w-[14rem]"
          />
          <Button type="submit" size="md">
            <Search aria-hidden="true" />
            Check postcode
          </Button>
        </div>

        {result === 'invalid' && (
          <FieldError id={errorId}>
            That does not look like a UK postcode. Enter it in full, for example B15 2TT.
          </FieldError>
        )}
      </form>

      {result && result !== 'invalid' && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className={
            result === 'likely-covered'
              ? 'mt-5 rounded-2xl border-2 border-brand-300 bg-white p-5'
              : 'mt-5 rounded-2xl border-2 border-sand-300 bg-sand-50 p-5'
          }
        >
          {result === 'likely-covered' ? (
            <>
              <p className="flex items-start gap-2 font-semibold text-brand-900">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                That postcode looks like it is in the area we travel to.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                This is an indication, not a confirmation — the visit also depends on appointment
                availability on the day you want. Submit a booking request and we will confirm,
                or ask us first.
              </p>
            </>
          ) : (
            <>
              <p className="flex items-start gap-2 font-semibold text-sand-900">
                <HelpCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                We are not sure about that postcode.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-sand-900/90">
                It sits outside the postcode areas we usually cover, but that does not
                automatically rule it out. Send it to us and we will give you a straight answer.
              </p>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {result === 'likely-covered' && (
              <Button asChild size="sm">
                <Link href="/book-appointment">Book a home visit</Link>
              </Button>
            )}
            <Button asChild size="sm" variant="whatsapp">
              <a
                href={whatsappHref(
                  `Hello Havoheal Physiotherapy, I would like to enquire about booking a home physiotherapy visit. My postcode is: ${value.toUpperCase()}`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('click_to_whatsapp', { location: 'postcode_checker' })}
              >
                <MessageCircle aria-hidden="true" />
                Confirm on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a
                href={telHref}
                onClick={() => track('click_to_call', { location: 'postcode_checker' })}
              >
                <Phone aria-hidden="true" />
                Call {company.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
