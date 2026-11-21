'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';
import SignupButton from '@/components/SignupButton';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { NEW_NDA_HREF } from '@/lib/newNdaHref';
import { faqs } from '@/app/faq/faq-data';

/* Shared landing wiring, used by every option so the CTAs, FAQ and disclaimer behave the same. */

/** Primary CTA. Signed out: SignupButton (request access while sign-up is closed). Signed in: new NDA. */
export function PrimaryCta({
  label = 'Send your NDA now',
  size = 'lg',
  className,
}: {
  label?: string;
  size?: 'default' | 'lg';
  className?: string;
}) {
  const { userId } = useAuth();
  if (userId) {
    return (
      <Button asChild shape="crisp" size={size} className={className}>
        <Link href={NEW_NDA_HREF}>
          {label}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    );
  }
  return (
    <SignupButton>
      <Button shape="crisp" size={size} className={className}>
        {label}
        <ArrowRight aria-hidden="true" />
      </Button>
    </SignupButton>
  );
}

export function SecondaryCta({
  href = '/standard-nda',
  label = 'Read the standard NDA',
  size = 'lg',
}: {
  href?: string;
  label?: string;
  size?: 'default' | 'lg';
}) {
  return (
    <Button asChild shape="crisp" size={size} variant="outline" className="shadow-none">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

/** The beta microcopy line under CTAs. */
export function BetaNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm text-muted-ink ${className}`}>
      Free beta. The other side never needs an account.
    </p>
  );
}

/** FAQ teaser: the four questions the copy deck picked (receiver delivery, fields, signer, law firm). */
export const TEASER_FAQ_INDEXES = [1, 6, 9, 12] as const;

export function FaqList({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <Accordion type="single" collapsible className="divide-y divide-line border-y border-line">
        {TEASER_FAQ_INDEXES.map((i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-0">
            <AccordionTrigger className="py-5 text-left text-base font-semibold text-ink hover:no-underline">
              {faqs[i].question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-base leading-relaxed text-muted-ink">
              {faqs[i].answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Link
        href="/faq"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 transition-colors hover:text-teal-700"
      >
        See all questions
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return <LegalDisclaimer variant="compact" className={className} />;
}
