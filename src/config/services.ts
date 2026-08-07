/**
 * Physiotherapy service categories.
 *
 * COPY RULES — read before editing:
 *  - Every appointment is delivered at the customer's home. Nothing here should
 *    read as though the customer travels to a clinic.
 *  - Describe what an appointment involves, never a promised outcome.
 *  - No claims of cure, guaranteed recovery, or specific success rates.
 *  - No clinical qualifications or accreditations unless verified and supplied
 *    by the business owner.
 */

export type IconName =
  | 'activity'
  | 'move'
  | 'dumbbell'
  | 'scan'
  | 'trophy'
  | 'heart-pulse';

export type Service = {
  slug: string;
  title: string;
  summary: string;
  detail: string;
  /** What typically happens — descriptive, not a promise. */
  includes: string[];
  icon: IconName;
};

export const services: Service[] = [
  {
    slug: 'musculoskeletal-physiotherapy',
    title: 'Musculoskeletal physiotherapy',
    summary:
      'Appointments for muscle, joint and soft tissue concerns, delivered in your own home.',
    detail:
      'A 45-minute visit set aside to talk through your symptoms, look at how the affected area moves, and discuss options that may be appropriate for you. Any next steps are agreed with you rather than assumed.',
    includes: [
      'Discussion of your symptoms and how they affect daily life',
      'A physical movement assessment where appropriate',
      'A conversation about options that may suit your situation',
      'Written or verbal guidance you can keep',
    ],
    icon: 'activity',
  },
  {
    slug: 'mobility-support',
    title: 'Mobility support',
    summary:
      'Support for people who find walking, standing, bending or daily movement difficult — without having to travel anywhere.',
    detail:
      'Being seen at home means we can look at the movements you find hardest where they actually happen: your stairs, your chair, your doorstep. We discuss practical adjustments, pacing and activity ideas that fit your real surroundings.',
    includes: [
      'Review of the movements you find most difficult, in the place you do them',
      'Discussion of pacing and daily activity',
      'Ideas for gradual, self-managed progress',
      'Signposting to other services where that is more appropriate',
    ],
    icon: 'move',
  },
  {
    slug: 'exercise-and-rehabilitation-guidance',
    title: 'Exercise and rehabilitation guidance',
    summary:
      'Guidance on exercise approaches and progression, tailored to the space and equipment you actually have.',
    detail:
      'We can look at exercises you already do, discuss technique, and talk through how a programme might be structured using what is available where you live. Everything is discussed as guidance, not as a guaranteed result.',
    includes: [
      'Review of any exercises you are already doing',
      'Discussion of technique and progression',
      'Practical suggestions that fit your home setting',
      'Notes to help you remember what was discussed',
    ],
    icon: 'dumbbell',
  },
  {
    slug: 'postural-and-movement-assessment',
    title: 'Postural and movement assessment',
    summary:
      'A structured look at posture and movement patterns in the setting where they occur.',
    detail:
      'Particularly useful if you work from home or spend long periods in one position. Being in your own environment means we can look at your actual desk, chair or workspace rather than describing it from memory.',
    includes: [
      'Observation of posture and movement patterns',
      'A look at your real workspace or daily setup',
      'Suggestions for changes you can make straight away',
      'Time to ask questions about what you have noticed yourself',
    ],
    icon: 'scan',
  },
  {
    slug: 'sports-related-physical-support',
    title: 'Sports-related physical support',
    summary:
      'For active people who want to talk through a physical concern without fitting a clinic visit around training.',
    detail:
      'A conversation about your training, the demands of your sport and the concern you have noticed, followed by a movement assessment where appropriate — arranged around your schedule rather than ours.',
    includes: [
      'Discussion of your training and activity demands',
      'Assessment of the movements relevant to your sport',
      'Conversation about load, recovery and progression',
      'Advice on when further clinical input may be sensible',
    ],
    icon: 'trophy',
  },
  {
    slug: 'general-aches-and-movement-concerns',
    title: 'General aches and movement concerns',
    summary:
      'For everyday aches, stiffness or movement changes you would like to talk through, in a familiar setting.',
    detail:
      'Not every concern needs a label. If something does not feel right, a 45-minute visit gives you unhurried time to describe it properly and discuss sensible next steps — without a waiting room.',
    includes: [
      'Unhurried time to describe what you are noticing',
      'A movement assessment where it is appropriate',
      'Discussion of general self-management options',
      'Clear signposting if another service is a better fit',
    ],
    icon: 'heart-pulse',
  },
];

/** Trust strip — factual, verifiable statements only. */
export const trustPoints = [
  {
    title: 'Home-visit physiotherapy',
    body: 'We travel to you. There is no clinic to get to and no waiting room.',
    icon: 'house' as const,
  },
  {
    title: '45-minute appointments',
    body: 'Every visit is a full 45 minutes, so there is time to talk properly.',
    icon: 'clock' as const,
  },
  {
    title: 'Fixed £75 price',
    body: 'One price for a 45-minute home visit. No separate consultation fee.',
    icon: 'tag' as const,
  },
  {
    title: 'Birmingham-area coverage',
    body: 'We visit Birmingham, the Black Country and surrounding towns.',
    icon: 'map' as const,
  },
  {
    title: 'Online, phone and WhatsApp booking',
    body: 'Book whichever way suits you — the appointment and price are the same.',
    icon: 'message' as const,
  },
];

/** The "we come to you" benefit cards on the homepage. */
export const homeVisitBenefits = [
  {
    title: 'No clinic travel',
    body: 'No parking, no bus, no waiting room. Useful if travelling is part of what you find difficult.',
    icon: 'car' as const,
  },
  {
    title: 'Appointments in your own home',
    body: 'We assess movement where it matters — your stairs, your chair, your daily routine.',
    icon: 'house' as const,
  },
  {
    title: 'Convenient 45-minute visits',
    body: 'Start times through the working day, so a visit can fit around work or care commitments.',
    icon: 'clock' as const,
  },
  {
    title: 'Coverage across Birmingham and nearby areas',
    body: 'From Wolverhampton and Dudley to Solihull, Lichfield and Cannock — subject to postcode availability.',
    icon: 'map' as const,
  },
];

/**
 * What a £75 home visit includes.
 * PLACEHOLDER — the business owner must confirm each line before launch and
 * remove anything that is not accurate.
 */
export const pricingIncludes: string[] = [
  'A full 45 minutes of appointment time in your own home',
  'Time to discuss your symptoms and history relevant to the appointment',
  'A physical assessment where it is appropriate for your situation',
  'Discussion of options and practical next steps',
  'Guidance you can keep',
];

/** Things explicitly NOT included, so the fixed price is unambiguous. */
export const pricingExcludes: string[] = [
  'Any equipment, supports or products, which are not part of the visit fee',
  'Onward referral costs charged by other providers',
  'Reports or documentation requested for third parties, which are quoted separately',
];

export const bookingSteps = [
  {
    step: 1,
    title: 'Choose a date and 45-minute time',
    body: 'Pick from the available start times. Each home visit lasts 45 minutes and the price is a fixed £75.',
  },
  {
    step: 2,
    title: 'Tell us where to come',
    body: 'Give us your contact details and the full address for the visit, including anything we need to know to find you.',
  },
  {
    step: 3,
    title: 'Receive an acknowledgement while we review',
    body: 'You will get an acknowledgement with your booking reference. We check availability and coverage, then come back to confirm.',
  },
];
