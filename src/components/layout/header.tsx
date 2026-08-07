'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Phone, MessageCircle, CalendarCheck } from 'lucide-react';
import { company, mainNav, telHref, whatsappHref } from '@/config/site';
import { priceLabel } from '@/config/booking';
import { Button } from '@/components/ui/button';
import { Logomark } from '@/components/graphics/decor';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/**
 * Sticky site header.
 *
 * The mobile navigation uses a Radix Dialog, which provides focus trapping,
 * focus restoration to the trigger on close, Escape handling and the correct
 * aria-modal semantics. Rebuilding that by hand is where drawers usually go
 * wrong for keyboard and screen-reader users.
 */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer whenever the route changes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors duration-300',
        scrolled
          ? 'border-slate-200 bg-white/92 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-white',
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-xl py-1"
          aria-label={`${company.displayName} — home`}
        >
          <Logomark className="size-10" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Havoheal
            </span>
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand-700">
              Physiotherapy
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    // `whitespace-nowrap` keeps each item on one line: a label
                    // breaking mid-phrase makes the whole row look ragged.
                    'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-medium transition',
                    isActive(item.href)
                      ? 'bg-brand-50 text-brand-900'
                      : 'text-ink-soft hover:bg-slate-50 hover:text-ink',
                  )}
                >
                  {item.shortLabel ?? item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={telHref}
            onClick={() => track('click_to_call', { location: 'header' })}
            className="hidden min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 lg:inline-flex"
          >
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            <span>{company.phoneDisplay}</span>
          </a>

          <Button asChild size="sm" className="hidden shrink-0 whitespace-nowrap sm:inline-flex">
            <Link href="/book-appointment" onClick={() => track('begin_booking', { location: 'header' })}>
              <CalendarCheck aria-hidden="true" />
              Book a Home Visit
            </Link>
          </Button>

          {/* Mobile menu */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="tap-target inline-flex items-center justify-center rounded-xl border-2 border-slate-200 text-ink transition hover:border-brand-300 hover:bg-brand-50 xl:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-6" aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm data-[state=open]:animate-fade-up" />
              <Dialog.Content
                className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(22rem,92vw)] flex-col overflow-y-auto bg-white shadow-lift focus:outline-none"
                aria-describedby={undefined}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <Dialog.Title className="font-display text-lg font-semibold">
                    Menu
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="tap-target inline-flex items-center justify-center rounded-xl border-2 border-slate-200 text-ink transition hover:bg-slate-50"
                      aria-label="Close menu"
                    >
                      <X className="size-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <nav aria-label="Mobile" className="flex-1 px-4 py-4">
                  <ul className="space-y-1">
                    {mainNav.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                          className={cn(
                            'block rounded-xl px-4 py-3 text-base font-medium transition',
                            isActive(item.href)
                              ? 'bg-brand-50 text-brand-900'
                              : 'text-ink-soft hover:bg-slate-50 hover:text-ink',
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="space-y-2.5 border-t border-slate-200 bg-slate-50/70 px-4 py-5">
                  <Button asChild block size="md">
                    <Link
                      href="/book-appointment"
                      onClick={() => track('begin_booking', { location: 'mobile_drawer' })}
                    >
                      <CalendarCheck aria-hidden="true" />
                      Book a {priceLabel} Home Visit
                    </Link>
                  </Button>
                  <Button asChild block size="md" variant="secondary">
                    <a href={telHref} onClick={() => track('click_to_call', { location: 'mobile_drawer' })}>
                      <Phone aria-hidden="true" />
                      Call {company.phoneDisplay}
                    </a>
                  </Button>
                  <Button asChild block size="md" variant="whatsapp">
                    <a
                      href={whatsappHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('click_to_whatsapp', { location: 'mobile_drawer' })}
                    >
                      <MessageCircle aria-hidden="true" />
                      Book on WhatsApp
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
