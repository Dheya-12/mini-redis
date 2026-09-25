import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForTimeout(7000);
const assert = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
// hero card: brochure submit
await p.fill('#enquiry-name', 'Alex Example'); await p.fill('#enquiry-email', 'alex@example.com');
await p.click('[data-qa=enquiry-send]'); await p.waitForTimeout(3500);
const thanks = await p.evaluate(() => { const s = document.querySelector('.ink-card__success'); return { vis: getComputedStyle(s).display, text: s.innerText.replace(/\s+/g, ' ').slice(0, 140) }; });
assert(thanks.vis === 'block' && /Thank you, Alex/i.test(thanks.text) && /alex@example.com/.test(thanks.text), 'brochure thank-you: ' + thanks.text);
await p.screenshot({ path: 'e2e-thanks.png' });
// upsell call back
await p.fill('#enquiry-upsell-phone', '0400 000 000'); await p.click('.ink-card__upsell-form .ink-btn'); await p.waitForTimeout(2000);
assert(await p.evaluate(() => getComputedStyle(document.querySelector('.ink-card__upsell-done')).display === 'block'), 'upsell call-back confirmation shown');
// booking dialog
await p.click('.masthead__ctas button.pill-btn'); await p.waitForTimeout(700);
assert(await p.evaluate(() => document.querySelector('.booking').classList.contains('booking--open')), 'booking dialog opens');
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
assert(await p.evaluate(() => !document.querySelector('.booking').classList.contains('booking--open')), 'booking dialog closes on Escape');
// contact stepper
await p.click('.masthead__nav a[href="#contact"]'); await p.waitForTimeout(3000);
await p.click('.step-form__step--active [data-qa=contact-next]'); await p.waitForTimeout(400);
assert(await p.evaluate(() => document.querySelectorAll('.line-field--invalid').length === 1 && document.activeElement?.id === 'contact-name' && document.querySelector('.step-form__step--active')?.dataset.step === '0'), 'empty step 1 is blocked; first field focused, second marked invalid');
await p.fill('#contact-name', 'Alex Example'); await p.fill('#contact-email', 'alex@example.com');
await p.click('.step-form__step--active [data-qa=contact-next]'); await p.waitForTimeout(600);
await p.fill('#contact-phone', '0400 000 000'); await p.selectOption('#contact-preferred', 'Call');
await p.click('.step-form__step--active [data-qa=contact-next]'); await p.waitForTimeout(600);
assert(await p.evaluate(() => document.querySelector('.step-form__step--active')?.dataset.step === '2'), 'reached step 3');
await p.selectOption('#contact-enquiry', 'Floorplans'); await p.fill('#contact-message', 'Please send floorplans.');
await p.click('.step-form__step--active button[type=submit]'); await p.waitForTimeout(2500);
const done = await p.evaluate(() => { const s = document.querySelector('.contact__success'); return !s.hidden && s.innerText; });
assert(!!done && /Thank you, Alex\./.test(done), 'contact thank-you: ' + done);
await p.screenshot({ path: 'e2e-contact-thanks.png' });
// legal pages
for (const r of ['/privacy-policy', '/disclaimer']) { const res = await p.goto(BASE + r); assert(res.status() === 200 && (await p.title()).includes('Loam House'), r + ' renders: ' + await p.title()); }
assert(errs.length === 0, 'no page errors ' + errs.join('; '));
await b.close();
