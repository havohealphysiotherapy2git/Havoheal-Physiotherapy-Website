# Local SEO guide — Birmingham and the West Midlands

How to build genuine local visibility for Havoheal Physiotherapy UK LTD.

> **The constraint that shapes everything here:** the company is registered at
> 124–128 City Road, London EC1V 2NX, and its service area is Birmingham and the
> surrounding towns. There is **no Birmingham premises**. Local SEO must be built
> as a *service-area business*. Listing a Birmingham address you do not occupy —
> including a virtual office or a mailbox — breaches Google's guidelines, risks
> suspension of the profile, and is a misrepresentation to patients.

---

## 1. Google Business Profile

The single highest-impact local asset. Do this first.

### Setting it up

1. Go to <https://business.google.com> and create a profile for
   **Havoheal Physiotherapy UK LTD**.
2. When asked *"Do you want to add a location customers can visit?"* answer
   **No**. This creates a service-area business and hides the address.
3. Enter the service areas. Google allows up to 20; use the towns with the most
   search demand:

   > Birmingham, Solihull, Sutton Coldfield, West Bromwich, Walsall,
   > Wolverhampton, Dudley, Halesowen, Stourbridge, Oldbury, Smethwick,
   > Brierley Hill, Kingswinford, Cannock, Lichfield, Brownhills, Aldridge,
   > Knowle, Dorridge, Alvechurch

4. Add the phone number **+44 7469 334067** — exactly as it appears on the site.
5. Add the website: `https://havohealphysiotherapy.co.uk` with UTM tracking:
   ```
   https://havohealphysiotherapy.co.uk/?utm_source=google&utm_medium=organic&utm_campaign=gbp
   ```
   Use the appointment link field for:
   ```
   https://havohealphysiotherapy.co.uk/book-appointment?utm_source=google&utm_medium=organic&utm_campaign=gbp_booking
   ```
6. Complete verification. For service-area businesses this is usually video
   verification — be ready to show branded materials, equipment and any
   documentation.

### Categories

| | Category |
| --- | --- |
| Primary | **Physical therapist** *(Google's label for physiotherapist)* |
| Secondary | Physical therapy clinic — **only if** you later have premises |
| Secondary | Sports massage therapist — **only if** genuinely offered |

Do not add categories for services you do not provide. It dilutes relevance and
attracts enquiries you cannot fulfil.

### Profile content

- **Description (750 characters).** Use the real proposition: 45-minute
  appointments, fixed £75, serving Birmingham and surrounding areas, three ways
  to book. No superlatives, no unverifiable claims.
- **Hours.** Match `openingTime` and `closingTime` in `src/config/booking.ts`
  (currently 08:00–19:00) and the working days. If those change, change them
  here the same day.
- **Services.** Add each service from `src/config/services.ts` with its £75
  price. Consistent pricing across the site and the profile builds trust.
- **Photos.** *Owner to supply.* Real photos of the practitioner, equipment and
  materials. Do not use stock imagery — it is transparent to users and adds
  nothing. Add photos before requesting reviews; a profile with no images
  converts poorly.
- **Q&A.** Seed it yourself with the genuine questions from
  `src/config/faqs.ts` — Google allows the owner to ask and answer.
- **Posts.** One a month is enough: a new article, an availability update, a
  seasonal note.

---

## 2. Name, address and phone (NAP) consistency

Search engines corroborate a business by matching its details across the web.
Inconsistency is the most common reason a local profile underperforms.

**The canonical format — copy and paste this everywhere:**

```
Havoheal Physiotherapy UK LTD
124–128 City Road, London, England, EC1V 2NX
+44 7469 334067
https://havohealphysiotherapy.co.uk
Company number: 17089677
```

Rules:

- Always "Havoheal Physiotherapy UK LTD" — never "Havoheal", "Havoheal Physio" or
  "Havoheal Physiotherapy Ltd" unless that is the registered name.
- Always the same phone number format.
- Where a directory shows an address publicly and you would rather it did not,
  choose a service-area listing type or leave the address hidden. Never invent a
  Birmingham address to fill the field.

---

## 3. Other mapping and search platforms

| Platform | Priority | Notes |
| --- | --- | --- |
| **Bing Places** | High | <https://www.bingplaces.com> — import from Google to save time |
| **Apple Business Connect** | High | <https://businessconnect.apple.com> — covers Apple Maps and Siri |
| **Yell.com** | Medium | The most-used UK directory; free listing is adequate to start |
| **Yelp UK** | Medium | Lower UK usage but well indexed |
| **Thomson Local** | Medium | Free listing |
| **Scoot / Cylex / FreeIndex** | Low | Free, quick, small benefit — do them in one sitting |
| **Companies House** | Automatic | Already public; make sure the site matches it |

---

## 4. Healthcare and physiotherapy directories

**Only list where you genuinely meet the eligibility criteria.** Several of these
require HCPC registration or CSP membership. If those are not yet in place,
these are a to-do for later, not now.

| Directory | Requirement | Notes |
| --- | --- | --- |
| **Physio2u / Physio Directory** | Usually HCPC registration | Verify before applying |
| **CSP "Find a Physio"** | Chartered Society of Physiotherapy membership | High-authority; the single best directory link if eligible |
| **HCPC register** | HCPC registration | Public and authoritative |
| **Doctify** | Verified clinician credentials | Paid; strong for reviews |
| **Health Booking directories** | Varies | Check each one's terms |
| **Private Healthcare UK** | Varies | Check eligibility |

> ⚠️ Do not submit to a healthcare directory claiming a registration you do not
> hold. It is a professional-standards issue as well as an SEO one.

---

## 5. Local citations

Beyond directories, look for genuinely local mentions:

- **Birmingham Chamber of Commerce** — membership includes a directory listing.
- **Federation of Small Businesses** — same.
- **Birmingham Business Directory** and district-level equivalents.
- **Local Facebook community groups** — participate rather than advertise; most
  ban straight promotion.
- **Nextdoor Business** — well suited to a service-area business.

Aim for 15–20 consistent citations in the first three months. Quality beats
volume: five relevant local or healthcare listings are worth more than fifty
generic ones.

---

## 6. Reviews — the honest way

Reviews are the strongest local ranking factor you control, and the fastest way
to destroy credibility if handled badly.

### Rules, without exception

- **Never** write, buy, incentivise or exchange reviews.
- **Never** filter — asking only happy customers ("review gating") breaches
  Google's policy and, for healthcare, is straightforwardly dishonest.
- Ask **every** customer, the same way, every time.

### A process that works

1. **Ask at the right moment** — at the end of the appointment, in person, when
   the person has just had a good experience.
2. **Make it one tap.** Get the short review link from your Google Business
   Profile ("Ask for reviews") and put it in a follow-up message.
3. **Suggested wording:**

   > "Thanks for coming in today. If you found the appointment useful, a short
   > review would really help other people in [area] find us. It takes about a
   > minute: [link]. No problem at all if you would rather not."

4. **Respond to every review**, positive or negative, within a few days.
5. **Never discuss anyone's health in a reply.** Even confirming that someone was
   a patient can be a confidentiality breach. Use a neutral template:

   > "Thank you for taking the time to leave feedback. We take all comments
   > seriously and would welcome the chance to discuss this with you directly —
   > please call us on +44 7469 334067."

### Target

Ten genuine reviews in the first three months is a realistic and useful goal.
Steady accumulation beats a sudden burst, which looks manipulated.

---

## 7. Location-relevant content

Your `/birmingham-physiotherapy` page is the template. If you later add pages for
other towns, each one must earn its place:

- **Do:** write genuinely different content per town — local landmarks, transport,
  the specific communities served, real coverage detail.
- **Do not:** duplicate the Birmingham page and swap the town name. Doorway pages
  are a spam signal, and they read as such to visitors too.

Only add a town page when you have something specific to say about that town.
Three genuinely useful pages beat twenty templated ones.

---

## 8. Community and partnerships

The most durable local signals come from real relationships:

- **Local sports clubs** — running clubs, football, rugby, cycling, martial arts.
  Offer a free educational talk on warm-ups or managing training load.
- **Gyms and fitness studios** — a referral relationship benefits both parties.
- **Workplaces** — an office desk-posture session is genuinely useful and often
  produces a link from the company's news page.
- **Local charities** — supporting a Birmingham charity event is worth doing on
  its own terms, and usually earns a mention.
- **Community events** — parkrun, local 10Ks, community fairs.

Details and outreach templates are in
[`ethical-backlink-plan.md`](ethical-backlink-plan.md).

---

## 9. UTM tracking

Tag every external profile link so you can tell what actually brings people in:

| Source | URL |
| --- | --- |
| Google Business Profile | `?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| GBP appointment link | `/book-appointment?utm_source=google&utm_medium=organic&utm_campaign=gbp_booking` |
| Bing Places | `?utm_source=bing&utm_medium=organic&utm_campaign=bing_places` |
| Apple Business Connect | `?utm_source=apple&utm_medium=organic&utm_campaign=abc` |
| Yell | `?utm_source=yell&utm_medium=referral&utm_campaign=directory` |
| A specific club or partner | `?utm_source=<partner>&utm_medium=referral&utm_campaign=partnership` |

Note that analytics is **disabled by default** on this site. UTM parameters are
recorded only if you enable a provider and the visitor consents. The most
reliable attribution available to a small clinic remains asking on the phone:
*"How did you hear about us?"* Write the answer on the booking.

---

## 10. Ninety-day plan

**Month 1 — foundations**
- Google Business Profile created, verified, fully completed with real photos
- Bing Places and Apple Business Connect
- Five core UK directory citations with consistent NAP
- Search Console and Bing Webmaster Tools connected, sitemap submitted
- Review request process agreed and being used at every appointment

**Month 2 — depth**
- Ten more citations, including any healthcare directories you are eligible for
- First two articles published
- Two local partnership conversations started (a gym and a sports club)
- First GBP post published
- Five genuine reviews

**Month 3 — momentum**
- Two more articles
- First earned local links from partnerships
- Review Search Console data and adjust the weakest page
- Ten or more genuine reviews
- Decide whether a second town page is justified by real demand
