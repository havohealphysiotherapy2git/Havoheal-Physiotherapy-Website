/**
 * Home-visit coverage area. EDIT THIS FILE to add or remove areas.
 *
 * These are areas we TRAVEL TO in order to deliver appointments at customers'
 * homes. They are not clinic locations and must never be described as such.
 */

export type AreaGroup = {
  id: string;
  title: string;
  intro: string;
  areas: string[];
};

export const areaGroups: AreaGroup[] = [
  {
    id: 'birmingham',
    title: 'Birmingham and nearby districts',
    intro:
      'Home visits across Birmingham city centre and the surrounding residential districts.',
    areas: [
      'Birmingham City Centre',
      'Edgbaston',
      'Harborne',
      'Selly Oak',
      'Bournville',
      'Stirchley',
      'Kings Heath',
      'Moseley',
      'Hall Green',
      'Yardley',
      'Sheldon',
      'Acocks Green',
      'Sparkhill',
      'Sparkbrook',
      'Small Heath',
      'Bordesley Green',
      'Erdington',
      'Sutton Coldfield',
      'Perry Barr',
      'Handsworth',
      'Great Barr',
      'Northfield',
      'Longbridge',
      'Rubery',
    ],
  },
  {
    id: 'black-country',
    title: 'Black Country and western areas',
    intro:
      'Mobile physiotherapy for towns and communities west of Birmingham, across the Black Country.',
    areas: [
      'Wolverhampton',
      'Walsall',
      'West Bromwich',
      'Oldbury',
      'Smethwick',
      'Dudley',
      'Brierley Hill',
      'Kingswinford',
      'Stourbridge',
      'Halesowen',
      'Wombourne',
      'Brownhills',
      'Pelsall',
      'Aldridge',
    ],
  },
  {
    id: 'northern',
    title: 'Northern coverage',
    intro:
      'Home-visit appointments north of Birmingham, within the marked service boundary.',
    areas: ['Cannock', 'Hednesford', 'Norton Canes', 'Burntwood', 'Lichfield'],
  },
  {
    id: 'eastern',
    title: 'Eastern and south-eastern coverage',
    intro:
      'Physiotherapy at home for communities east and south-east of Birmingham, within the boundary.',
    areas: ['Marston Green', 'Solihull'],
  },
  {
    id: 'southern',
    title: 'Southern coverage',
    intro: 'Visits to areas south of Birmingham, within the marked boundary.',
    areas: ['Knowle', 'Dorridge', 'Alvechurch', 'Rubery'],
  },
];

/**
 * Natural, page-appropriate phrasing for the main towns. Used so location
 * headings and links vary instead of repeating one exact-match phrase.
 * Keep these human — they appear as visible copy, not hidden keywords.
 */
export const areaPhrases: Record<string, string> = {
  Birmingham: 'Home physiotherapy in Birmingham',
  Wolverhampton: 'Home physiotherapy in Wolverhampton',
  Walsall: 'Home-visit physiotherapy in Walsall',
  'West Bromwich': 'Physiotherapy at home in West Bromwich',
  Oldbury: 'Mobile physiotherapy in Oldbury',
  Dudley: 'Mobile physiotherapist serving Dudley',
  'Brierley Hill': 'Home visits in Brierley Hill',
  Kingswinford: 'Physiotherapy at home in Kingswinford',
  Stourbridge: 'Home physiotherapy in Stourbridge',
  Halesowen: 'Mobile physiotherapy in Halesowen',
  Wombourne: 'Home visits in Wombourne',
  Cannock: 'Home-visit physiotherapist in Cannock',
  Hednesford: 'Physiotherapy at home in Hednesford',
  'Norton Canes': 'Home visits in Norton Canes',
  Burntwood: 'Mobile physiotherapy in Burntwood',
  Lichfield: 'Physiotherapy at home in Lichfield',
  Brownhills: 'Home visits in Brownhills',
  Pelsall: 'Home physiotherapy in Pelsall',
  Aldridge: 'Mobile physiotherapy in Aldridge',
  'Marston Green': 'Home visits in Marston Green',
  Solihull: 'Physiotherapy at home in Solihull',
  Rubery: 'Home physiotherapy in Rubery',
  Alvechurch: 'Home visits in Alvechurch',
  Knowle: 'Mobile physiotherapy in Knowle',
  Dorridge: 'Physiotherapy at home in Dorridge',
};

/**
 * The principal towns visible inside the marked service boundary. Used for
 * structured data `areaServed` and for concise summaries.
 */
export const headlineAreas: string[] = [
  'Birmingham',
  'Wolverhampton',
  'Walsall',
  'West Bromwich',
  'Oldbury',
  'Dudley',
  'Brierley Hill',
  'Kingswinford',
  'Stourbridge',
  'Halesowen',
  'Wombourne',
  'Cannock',
  'Hednesford',
  'Norton Canes',
  'Burntwood',
  'Lichfield',
  'Brownhills',
  'Pelsall',
  'Aldridge',
  'Marston Green',
  'Solihull',
  'Rubery',
  'Alvechurch',
  'Knowle',
  'Dorridge',
];

export const coverageCallout = {
  heading: 'Not sure whether we visit your address?',
  body: 'Coverage is subject to postcode and appointment availability. Send us your postcode by WhatsApp or call +44 7469 334067 to confirm.',
};

/** The standard coverage caveat. Never promise every postcode. */
export const coverageCaveat =
  'Coverage is subject to postcode and appointment availability. Send us your postcode by WhatsApp or call +44 7469 334067 to confirm.';

/** Every distinct area name across all groups, de-duplicated and sorted. */
export const allAreas: string[] = Array.from(
  new Set(areaGroups.flatMap((group) => group.areas)),
).sort((a, b) => a.localeCompare(b, 'en-GB'));

/**
 * UK postcode areas (the leading letters) that fall inside the service
 * boundary: B = Birmingham, WV = Wolverhampton, WS = Walsall/Lichfield/Cannock,
 * DY = Dudley/Stourbridge.
 *
 * Used only to give an INDICATIVE answer in the postcode checker. A matching
 * postcode area is not a guarantee of coverage, and a non-matching one is not a
 * refusal — both outcomes ask the visitor to confirm with us.
 */
export const coveredPostcodeAreas = ['B', 'WV', 'WS', 'DY'] as const;

export type PostcodeCheckResult = 'invalid' | 'likely-covered' | 'check-with-us';

/**
 * Indicative postcode check. Deliberately conservative: it never says "yes, we
 * cover you", only that an address looks likely to be inside the area we serve.
 */
export function checkPostcodeCoverage(input: string): PostcodeCheckResult {
  const compact = input.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) return 'invalid';

  const area = compact.match(/^[A-Z]{1,2}/)?.[0] ?? '';
  return (coveredPostcodeAreas as readonly string[]).includes(area)
    ? 'likely-covered'
    : 'check-with-us';
}
