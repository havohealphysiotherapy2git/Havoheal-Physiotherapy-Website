import { travelCostStatement } from '@/config/booking';

/**
 * FAQs. Rendered on /faqs and (a subset) on the homepage, and published as
 * FAQPage structured data.
 *
 * Answers must be plain text (no markup) so they remain valid inside JSON-LD.
 * Nothing here may claim an outcome, a credential or coverage of every postcode.
 */

export type Faq = {
  question: string;
  answer: string;
  /** Include in the homepage FAQ block. */
  featured?: boolean;
  category:
    | 'Home visits'
    | 'Appointments'
    | 'Booking'
    | 'Pricing'
    | 'Coverage'
    | 'Using this website';
};

export const faqs: Faq[] = [
  // ---------------------------------------------------------------- Home visits
  {
    category: 'Home visits',
    featured: true,
    question: 'Do you provide physiotherapy at home?',
    answer:
      'Yes. Havoheal Physiotherapy UK LTD is a home-visit service: a physiotherapy professional travels to the address you give us, so you do not need to travel to a clinic. Appointments last 45 minutes and cost a fixed £75.',
  },
  {
    category: 'Home visits',
    featured: true,
    question: 'What happens during a home physiotherapy appointment?',
    answer:
      'A typical visit starts with a conversation about what you have noticed and how it affects your daily life. Where appropriate, this is followed by a physical movement assessment. Because we are in your own home, we can look at the movements that matter to you where they actually happen, such as your stairs or your usual chair. The rest of the time is used to discuss options and practical next steps.',
  },
  {
    category: 'Home visits',
    featured: true,
    question: 'Do I need to prepare anything before the visit?',
    answer:
      'Very little. Clear a space large enough to move around in, and have a firm chair available. Wear comfortable clothing that allows movement and gives access to the area you want to discuss. It also helps to tell us in advance about parking, access, buzzers, stairs or pets when you book, so the visit starts on time.',
  },
  {
    category: 'Home visits',
    question: 'Do you operate from a Birmingham clinic?',
    answer:
      'No. There is no clinic to attend. Havoheal Physiotherapy UK LTD is registered at 124–128 City Road, London, EC1V 2NX, which is a registered office address and not a treatment location. All appointments are delivered at customers’ own homes across Birmingham and surrounding areas.',
  },
  {
    category: 'Home visits',
    question: 'How long does a home visit last?',
    answer:
      'Every home visit lasts 45 minutes. Appointment start times run through the working day from 8:00 AM, with the last appointment finishing by 7:00 PM.',
  },
  {
    category: 'Home visits',
    question: 'Can someone else be present during the appointment?',
    answer:
      'Yes. You are welcome to have a family member, friend or carer with you. Please mention it when you book so we know to expect them.',
  },

  // ---------------------------------------------------------------- Coverage
  {
    category: 'Coverage',
    featured: true,
    question: 'Which areas do you visit?',
    answer:
      'We visit Birmingham and surrounding areas, including the Black Country and towns such as Wolverhampton, Walsall, West Bromwich, Dudley, Stourbridge, Halesowen, Solihull, Lichfield and Cannock. Coverage is subject to postcode and appointment availability, so please send us your postcode by WhatsApp or call +44 7469 334067 to confirm before you rely on it.',
  },
  {
    category: 'Coverage',
    featured: true,
    question: 'How do I confirm whether my postcode is covered?',
    answer:
      'Use the postcode checker on our homepage for an indicative answer, then confirm with us directly. Send your postcode by WhatsApp or call +44 7469 334067, or email bookings@havohealphysiotherapy.co.uk. We will tell you honestly whether we can reach you.',
  },

  // ---------------------------------------------------------------- Pricing
  {
    category: 'Pricing',
    featured: true,
    question: 'How much does a home visit cost?',
    answer:
      'A 45-minute home physiotherapy visit is a fixed price of £75. There is no separate consultation fee. Any equipment, third-party referral costs, or reports requested for other organisations are not included and would be quoted separately.',
  },
  {
    category: 'Pricing',
    featured: true,
    question: 'Is travel included in the £75 price?',
    answer: travelCostStatement,
  },
  {
    category: 'Pricing',
    question: 'How and when do I pay?',
    answer:
      'Payment arrangements are confirmed with you when we contact you about your booking request. You are not asked for card details on this website, and this website does not take payments.',
  },

  // ---------------------------------------------------------------- Booking
  {
    category: 'Booking',
    featured: true,
    question: 'Is submitting the form a confirmed appointment?',
    answer:
      'No. Submitting the form creates a booking request, not a confirmed appointment. You will receive an acknowledgement email with your booking reference straight away. We then check availability and postcode coverage and contact you to confirm the visit or offer an alternative time. Your appointment is not fully confirmed until you receive that separate confirmation from Havoheal Physiotherapy UK LTD.',
  },
  {
    category: 'Booking',
    featured: true,
    question: 'Can I book by WhatsApp?',
    answer:
      'Yes. You can message +44 7469 334067 on WhatsApp, call the same number, email bookings@havohealphysiotherapy.co.uk, or use the online booking form. All four routes reach the same team, and the appointment and price are identical whichever you choose.',
  },
  {
    category: 'Booking',
    featured: true,
    question: 'How do I change or cancel a home visit?',
    answer:
      'Contact us by phone or WhatsApp on +44 7469 334067, or email bookings@havohealphysiotherapy.co.uk, quoting your booking reference. Please give as much notice as you can so the time can be offered to someone else. Full details are set out in our Booking and Cancellation Policy.',
  },
  {
    category: 'Booking',
    featured: true,
    question: 'What information should I provide when booking?',
    answer:
      'We ask for your full name, phone number, email address, and the full address and postcode for the visit, plus anything practical we need to know to reach you — for example a flat number, buzzer code, parking or access arrangements. Please do not send detailed medical histories, and never use the form to report an emergency.',
  },
  {
    category: 'Booking',
    question: 'How far in advance can I book?',
    answer:
      'The online booking form shows dates up to two months ahead. If you need a date beyond that, call or message us on +44 7469 334067 and we will see what we can arrange.',
  },
  {
    category: 'Booking',
    question: 'Can several people book the same time?',
    answer:
      'Yes. We can send more than one physiotherapist out at the same time, so choosing 10:00 on a particular day does not stop anyone else choosing it too. The time you pick is your preferred appointment time, and we confirm the arrangements with you afterwards.',
  },
  {
    category: 'Booking',
    question: 'What if you cannot make the time I asked for?',
    answer:
      'We will contact you and offer the nearest alternative rather than simply declining. Nothing is confirmed until you hear from us, so please do not rearrange your day around a requested time until we have confirmed it.',
  },

  // ---------------------------------------------------------------- Appointments
  {
    category: 'Appointments',
    featured: true,
    question: 'What times are appointments available?',
    answer:
      'Appointment start times run from 8:00 AM through the working day, with the last visit finishing by 7:00 PM. Available start times are shown in the online booking form, and only slots that are still free are offered.',
  },
  {
    category: 'Appointments',
    question: 'How should I get ready for my first appointment?',
    answer:
      'Wear comfortable clothing that allows you to move. It helps to think in advance about when your symptoms started, what makes them better or worse, and what you would most like to get back to doing. Bring a list of any questions you want to ask — 45 minutes goes quickly.',
  },

  // ---------------------------------------------------------------- Website
  {
    category: 'Using this website',
    featured: true,
    question: 'Does the information on this website replace medical advice?',
    answer:
      'No. Everything on this website is general information and is not a substitute for personalised medical advice, diagnosis or treatment. Always speak with a suitably qualified healthcare professional about your own circumstances. In an emergency call 999, or use NHS 111 when appropriate.',
  },
  {
    category: 'Using this website',
    question: 'What do you do with the details I submit?',
    answer:
      'We use your details to respond to your booking request, confirm or reschedule your visit and keep a record of the booking. Your address is used to reach you and to check coverage. We do not sell your data. Full details of how we handle personal information, how long we keep it and your rights are set out in our Privacy Policy.',
  },
  {
    category: 'Using this website',
    question: 'What should I do in an emergency?',
    answer:
      'Do not use this website or the booking form. Call 999 in an emergency, or use NHS 111 when urgent advice is needed but it is not an emergency. Booking requests submitted here are not monitored around the clock.',
  },
];

export const featuredFaqs = faqs.filter((faq) => faq.featured);

export const faqCategories = Array.from(new Set(faqs.map((faq) => faq.category)));
