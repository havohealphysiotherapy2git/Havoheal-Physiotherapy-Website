import { test, expect, type Page } from '@playwright/test';

/**
 * Critical path: requesting an appointment.
 *
 * Requires a reachable database (DATABASE_URL) with migrations applied, because
 * availability and the double-booking guard are enforced there.
 */

const CUSTOMER = {
  fullName: 'Playwright Test User',
  phone: '07123456789',
  email: 'playwright.test@example.com',
  postcode: 'B15 2TT',
  address: '1 Test Street, Edgbaston',
  flat: 'Flat 2',
  access: 'Automated test — buzzer 2.',
  parking: 'Automated test — driveway.',
  message: 'Automated end-to-end test submission. Please ignore.',
};

async function chooseFirstAvailableSlot(page: Page): Promise<string | null> {
  // Slots that are taken or too soon are rendered disabled.
  const available = page.locator('input[name="booking-startTime-input"]:not([disabled])');
  await expect(available.first()).toBeAttached({ timeout: 15_000 });

  const count = await available.count();
  for (let index = 0; index < count; index += 1) {
    const input = available.nth(index);
    const value = await input.getAttribute('value');
    if (!value) continue;
    // The visible control is the label; the input itself is visually hidden.
    await page.locator(`label[for="booking-startTime-input-${value.replace(':', '')}"]`).click();
    return value;
  }
  return null;
}

test.describe('Booking flow', () => {
  test('a visitor can request a home visit in three steps', async ({ page }) => {
    await page.goto('/book-appointment');

    await expect(
      page.getByRole('heading', { level: 1, name: /Book a Home Physiotherapy Visit/i }),
    ).toBeVisible();

    // --- Step 1: date and time ------------------------------------------
    await expect(page.getByText('Step 1 of 3', { exact: true })).toBeVisible();
    await expect(page.getByText(/45-minute home visit — £75/i).first()).toBeVisible();

    const chosenSlot = await chooseFirstAvailableSlot(page);
    expect(chosenSlot, 'expected at least one bookable slot').not.toBeNull();

    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // --- Step 2: details and visit address ------------------------------
    await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible();

    await page.getByLabel('Full name').fill(CUSTOMER.fullName);
    await page.getByLabel('Phone number').fill(CUSTOMER.phone);
    await page.getByLabel('Email address').fill(CUSTOMER.email);
    await page.getByLabel(/Postcode for the appointment/i).fill(CUSTOMER.postcode);
    await page.getByLabel(/Home-visit address/i).fill(CUSTOMER.address);
    await page.getByLabel(/Flat or apartment number/i).fill(CUSTOMER.flat);
    await page.getByLabel(/Access instructions/i).fill(CUSTOMER.access);
    await page.getByLabel(/Parking information/i).fill(CUSTOMER.parking);
    await page.getByLabel(/Important message for your appointment/i).fill(CUSTOMER.message);

    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // --- Step 3: review and submit ---------------------------------------
    await expect(page.getByText('Step 3 of 3', { exact: true })).toBeVisible();
    // The review list is the authoritative summary; scope assertions to it so
    // the page header's own price/duration chips cannot satisfy them.
    const review = page.getByRole('region', { name: /Check your home-visit request/i });
    await expect(review.getByText(CUSTOMER.fullName)).toBeVisible();
    await expect(review.getByText(CUSTOMER.email)).toBeVisible();
    await expect(review.getByText('£75 fixed price')).toBeVisible();
    // The full assembled visit address is shown for checking.
    await expect(
      review.getByText(new RegExp(`${CUSTOMER.flat}.*${CUSTOMER.postcode}`)),
    ).toBeVisible();

    // The review step carries no tick-boxes: agreement is given by submitting,
    // and both policies are linked in the notice above the submit button.
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByText(/By submitting, you agree to our/i)).toBeVisible();
    await expect(review.getByRole('link', { name: /Privacy Policy/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Privacy Policy/i }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Booking and Cancellation Policy/i }).first(),
    ).toBeVisible();

    // Submitting goes straight through — no consent step to satisfy first.
    await page.getByRole('button', { name: /Submit Home-Visit Booking Request/i }).click();

    // --- Confirmation ----------------------------------------------------
    await page.waitForURL('**/booking-confirmed', { timeout: 30_000 });

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Thanks for booking your home physiotherapy visit/i,
      }),
    ).toBeVisible();

    // The "not confirmed until we confirm it" wording must be present.
    await expect(page.getByText(/not fully confirmed/i)).toBeVisible();
    await expect(page.getByText(/Havoheal Physiotherapy UK LTD/i).first()).toBeVisible();

    // The official email is offered for questions.
    await expect(
      page.locator('a[href^="mailto:bookings@havohealphysiotherapy.co.uk"]').first(),
    ).toBeVisible();

    // A reference is shown, and it is NOT in the URL.
    await expect(page.getByText(/^HH-[A-Z0-9]{6}$/)).toBeVisible();
    expect(page.url()).not.toMatch(/HH-/);
    expect(page.url()).not.toMatch(/\?/);
  });

  test('validation errors are announced and block progress', async ({ page }) => {
    await page.goto('/book-appointment');

    const slot = await chooseFirstAvailableSlot(page);
    expect(slot).not.toBeNull();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Move on with an empty form: the error summary must appear.
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    const summary = page.getByRole('alert').filter({ hasText: 'There is a problem' });
    await expect(summary).toBeVisible();
    await expect(summary.getByRole('link', { name: /Full name/i })).toBeVisible();
    await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible();

    // An invalid postcode is rejected with a specific message.
    await page.getByLabel('Full name').fill(CUSTOMER.fullName);
    await page.getByLabel('Phone number').fill(CUSTOMER.phone);
    await page.getByLabel('Email address').fill(CUSTOMER.email);
    // Short enough to pass the length rule, so the format rule is what fires.
    await page.getByLabel(/Postcode for the appointment/i).fill('INVALID');
    await page.getByLabel(/Home-visit address/i).fill(CUSTOMER.address);
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText(/Enter a valid UK postcode/i).first()).toBeVisible();
  });

  test('the optional home-visit fields are genuinely optional', async ({ page }) => {
    await page.goto('/book-appointment');

    const slot = await chooseFirstAvailableSlot(page);
    expect(slot).not.toBeNull();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Only the required fields — no flat, building, access or parking.
    await page.getByLabel('Full name').fill(CUSTOMER.fullName);
    await page.getByLabel('Phone number').fill(CUSTOMER.phone);
    await page.getByLabel('Email address').fill(CUSTOMER.email);
    await page.getByLabel(/Postcode for the appointment/i).fill(CUSTOMER.postcode);
    await page.getByLabel(/Home-visit address/i).fill(CUSTOMER.address);

    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Reaching step 3 proves nothing optional blocked progress.
    await expect(page.getByText('Step 3 of 3', { exact: true })).toBeVisible();
    await expect(page.getByText('None provided').first()).toBeVisible();
  });

  test('answers survive going back a step', async ({ page }) => {
    await page.goto('/book-appointment');

    const slot = await chooseFirstAvailableSlot(page);
    expect(slot).not.toBeNull();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await page.getByLabel('Full name').fill(CUSTOMER.fullName);
    await page.getByRole('button', { name: 'Back', exact: true }).click();

    await expect(page.getByText('Step 1 of 3', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByLabel('Full name')).toHaveValue(CUSTOMER.fullName);
  });

  test('the booking page offers phone, WhatsApp and email as alternatives', async ({ page }) => {
    await page.goto('/book-appointment');

    await expect(page.getByRole('link', { name: /\+44 7469 334067/ }).first()).toHaveAttribute(
      'href',
      'tel:+447469334067',
    );

    const whatsapp = page.getByRole('link', { name: /Book on WhatsApp/i }).first();
    const whatsappHref = await whatsapp.getAttribute('href');
    expect(whatsappHref).toContain('https://wa.me/447469334067');
    expect(whatsappHref).toContain('text=');
    // The prefilled message should ask for a postcode, since coverage decides it.
    expect(decodeURIComponent(whatsappHref ?? '')).toContain('postcode');

    const email = page
      .locator('a[href^="mailto:bookings@havohealphysiotherapy.co.uk"]')
      .first();
    await expect(email).toBeVisible();
  });
});
