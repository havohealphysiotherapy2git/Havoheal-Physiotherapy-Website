# Content strategy and editorial calendar

A scalable, honest content system for Havoheal Physiotherapy UK LTD.

---

## Medical content standards — read before writing anything

Every piece of health content published on this site must:

- ✅ **Avoid diagnosis.** Describe what people commonly experience; never tell a
  reader what they have.
- ✅ **Avoid personalised advice.** "Some people find…" not "you should…".
- ✅ **Avoid guaranteed outcomes.** No promises about recovery, timescales or
  results.
- ✅ **Include emergency signposting.** Every health article ends with the
  emergency notice (999 / NHS 111).
- ✅ **Encourage professional input.** Say plainly when someone should speak to a
  GP, physiotherapist or other professional.
- ✅ **Name an author and a reviewer**, with a review date.
- ✅ **Cite a source for any medical claim** — NHS, NICE, Cochrane, CSP or a
  peer-reviewed paper. If you cannot cite it, do not claim it.
- ❌ **Never publish thin AI-generated filler.** A short, genuinely useful page
  beats 1,500 words of padding, and readers can tell the difference.

### Required footer on every health article

```
Author: [NAME, ROLE]                       ← owner to supply
Clinically reviewed by: [NAME, HCPC no.]   ← owner to supply, or omit the line
Published: [DATE]   Last reviewed: [DATE]  Next review due: [DATE + 12 months]

This article is general information and is not a substitute for personalised
medical advice, diagnosis or treatment. Speak with a suitably qualified
healthcare professional about your own circumstances.

In an emergency call 999. For urgent advice that is not an emergency, use
NHS 111.

References:
1. [Source, title, URL, accessed date]
```

> If no clinically qualified reviewer is available yet, **omit the reviewer line
> entirely** rather than leaving a placeholder that implies review took place.

---

## How to add an article

The site has no blog section yet, and that is deliberate — an empty blog is worse
than no blog. When the first two articles are written:

1. Create `src/app/articles/[slug]/page.tsx` (or one route per article).
2. Add the entry to `pageRegistry` in `src/lib/seo.ts` with a unique title and
   description.
3. Use `metadataFor('/articles/your-slug')` and set `type: 'article'` with
   `publishedTime` and `modifiedTime`.
4. Add `Article` JSON-LD with the author, and link it to the Organization node.
5. Link to it from at least one relevant existing page, and link back from it.
6. Run `npm run seo:audit` — it will fail if the page is orphaned or duplicates
   metadata.

---

## Editorial calendar — first six months

Each entry lists the search intent it serves and which existing page it should
link to and from. Volume estimates are directional, not promises.

### Month 1

| # | Title | Intent | Internal links |
| --- | --- | --- | --- |
| 1 | **What to expect from a 45-minute physiotherapy appointment** | Informational, high commercial intent — people about to book | ← `/physiotherapy`, → `/book-appointment` |
| 2 | **How to prepare for your first physiotherapy appointment** | Informational, pre-appointment | ← `/physiotherapy`, → `/faqs` |

*Why these first:* both are read by people who are already close to booking, and
both reduce no-shows and awkward first appointments. They earn their place on
day one.

### Month 2

| # | Title | Intent | Internal links |
| --- | --- | --- | --- |
| 3 | **Physiotherapy pricing in Birmingham: what affects the cost?** | Commercial investigation | ← `/physiotherapy-pricing`, → `/book-appointment` |
| 4 | **When should you consider speaking to a physiotherapist?** | Informational, top of funnel | ← `/conditions-we-support` |

*Note on #3:* transparent pricing content is genuinely rare in this market and
tends to earn links. Compare honestly — including where others are cheaper.

### Month 3

| # | Title | Intent | Internal links |
| --- | --- | --- | --- |
| 5 | **Questions to ask before booking physiotherapy** | Commercial investigation | → `/faqs`, `/about` |
| 6 | **Movement and posture habits for desk workers** | Informational, broad reach | ← `/conditions-we-support` |

*Note on #5:* include questions that are uncomfortable for providers to answer
("are you HCPC registered?", "what happens if it doesn't help?"). Being the
provider willing to publish those questions is a differentiator.

### Month 4

| # | Title | Intent | Internal links |
| --- | --- | --- | --- |
| 7 | **General mobility tips for adults** | Informational, older demographic | ← `/conditions-we-support` |
| 8 | **How physiotherapy appointments are commonly structured** | Informational | ← `/physiotherapy` |

### Month 5

| # | Title | Intent | Internal links |
| --- | --- | --- | --- |
| 9 | **Choosing a physiotherapy provider in Birmingham** | Commercial investigation | ← `/birmingham-physiotherapy` |
| 10 | **Understanding the difference between an acknowledgement and a confirmed booking** | Support / trust | ← `/book-appointment`, `/booking-and-cancellation-policy` |

*Note on #9:* write it as genuine buyer guidance, including criteria on which
you might not be the best fit. It reads as credible precisely because it is.

### Month 6

| # | Title | Intent | Internal links |
| --- | --- | --- | --- |
| 11 | **Returning to exercise after a break: a sensible approach** | Informational, seasonal (January and September peaks) | ← `/conditions-we-support` |
| 12 | **Review and refresh** — update months 1–2 with what you have learned from real questions | Maintenance | — |

---

## Article structure that works

```
H1: The question the reader is actually asking
  Intro (2–3 sentences): answer it immediately. Do not make people scroll.
  H2: The main sections — one idea each
    Short paragraphs. Lists where they genuinely help.
  H2: When to seek professional input
    Specific, practical signposting.
  H2: How Havoheal can help          ← brief, honest, one paragraph
    45 minutes, £75, three ways to book. No hard sell.
  Emergency notice + medical disclaimer + author/reviewer/references
```

Length: 800–1,500 words. Long enough to be useful, short enough to be read.
Never pad to hit a word count.

---

## Tone of voice

| Do | Don't |
| --- | --- |
| "Many people find that…" | "This will fix your back pain" |
| "It may be worth discussing with a physiotherapist" | "You need physiotherapy" |
| "The evidence suggests…" (with a citation) | "Studies show…" (with none) |
| "We can't say without seeing you" | "We guarantee results" |
| Plain English, short sentences | Clinical jargon without explanation |
| British spelling throughout | American spelling |

Write as though explaining to someone in the waiting room: knowledgeable,
unhurried, and honest about uncertainty.

---

## Maintenance

- **Every 12 months:** review each article, update the review date, check that
  every reference still resolves and still says what you claimed.
- **Whenever the price or duration changes:** search the content for `£75` and
  `45-minute` and update every occurrence. The unit tests will catch config
  drift, but not prose in articles.
- **Whenever an FAQ changes:** check whether an article contradicts it.
- **Retire rather than leave stale:** an out-of-date health article is worse than
  no article. If you cannot keep it current, unpublish it and redirect.

---

## What to measure

| Metric | Where | What it tells you |
| --- | --- | --- |
| Impressions per article | Search Console | Whether it is being found at all |
| Average position | Search Console | Whether it is competitive |
| Click-through rate | Search Console | Whether the title and description work |
| Bookings from articles | Ask on the phone | The only measure that pays the bills |
| Time on page | Analytics (if enabled) | Whether it is genuinely being read |

If an article gets impressions but no clicks, rewrite the title and description.
If it gets clicks but no bookings, it is doing top-of-funnel work — that is fine,
but do not judge it on conversions.
