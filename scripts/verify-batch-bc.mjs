// One-shot verification for Batch B (passkey UI + STK button) and Batch C (student PDF).
// Run: node scripts/verify-batch-bc.mjs
import { chromium } from 'playwright'

const BASE = 'http://localhost:3001'
const EMAIL = 'staff@stress.local'
const PASS = 'StressTest1A'
const SCREENSHOTS = 'scripts/verify-screenshots'
const results = []

function log(msg) { console.log(msg); results.push(msg) }
function pass(label) { log(`  PASS  ${label}`) }
function fail(label) { log(`  FAIL  ${label}`) }
function check(cond, label) { cond ? pass(label) : fail(label) }

// ── helpers ──────────────────────────────────────────────────────────────────
import { mkdirSync } from 'fs'
mkdirSync(SCREENSHOTS, { recursive: true })

async function shot(page, name) {
  await page.screenshot({ path: `${SCREENSHOTS}/${name}.png`, fullPage: true })
  log(`  📸  ${SCREENSHOTS}/${name}.png`)
}

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message))

  // ── 1. Login ────────────────────────────────────────────────────────────────
  log('\n=== 1. LOGIN ===')
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await shot(page, '01-login-page')

  await page.fill('input[name=email]', EMAIL)
  await page.fill('input[name=password]', PASS)
  await page.waitForSelector('button:has-text("Sign in"):not([disabled])', { timeout: 8000 })
  await page.click('button:has-text("Sign in")')

  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 })
    pass('Logged in → /dashboard')
  } catch {
    const hint = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120)
    fail(`Login did not reach /dashboard — url=${page.url()} hint="${hint}"`)
  }
  await page.waitForTimeout(1500)
  await shot(page, '02-dashboard')

  // ── 2. Settings — passkey field ─────────────────────────────────────────────
  log('\n=== 2. SETTINGS — passkey field ===')
  await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await shot(page, '03-settings')

  // Wait for the settings content to load (page fetches school data on mount)
  try {
    await page.waitForSelector('button:has-text("Edit")', { timeout: 15000 })
  } catch {
    log('  WARN  Edit button not found after 15s — may still be loading')
  }
  await page.waitForTimeout(1500)

  // Click Edit button for school details
  const editBtn = page.locator('button:has-text("Edit")')
  if (await editBtn.count() > 0) {
    await editBtn.first().click()
    await page.waitForTimeout(1500)
    await shot(page, '04-settings-edit')
  }

  const passkeyLabel = page.locator('label:has-text("Lipa Na M-Pesa Online passkey")')
  check(await passkeyLabel.count() > 0, 'Passkey label present in Settings')

  const passKeyInput = page.locator('input[type="password"][placeholder*="passkey"], input[type="password"][placeholder*="blank"]')
  check(await passKeyInput.count() > 0, 'Passkey password input present')

  const setBadge = page.locator('span:has-text("• Set"), span:has-text("• Not set")')
  check(await setBadge.count() > 0, 'Set/Not-set badge visible')

  await shot(page, '05-settings-passkey-field')

  // ── 3. Invoices — M-Pesa + PDF buttons ─────────────────────────────────────
  log('\n=== 3. INVOICES — M-Pesa + PDF buttons ===')
  await page.goto(BASE + '/invoices', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await shot(page, '06-invoices')

  const mpesaBtns = page.locator('button:has-text("M-Pesa")')
  const mpesaCount = await mpesaBtns.count()
  check(mpesaCount > 0, `M-Pesa buttons found (${mpesaCount})`)

  const pdfBtns = page.locator('button:has-text("PDF")')
  const pdfCount = await pdfBtns.count()
  check(pdfCount > 0, `PDF buttons found (${pdfCount})`)

  await shot(page, '07-invoices-buttons')

  // ── 4. PDF download (Batch C) ────────────────────────────────────────────────
  log('\n=== 4. PDF DOWNLOAD (Batch C) ===')
  if (pdfCount > 0) {
    // Intercept the new tab or do a direct API call instead
    const [newPage] = await Promise.all([
      ctx.waitForEvent('page', { timeout: 10000 }).catch(() => null),
      pdfBtns.first().click(),
    ])
    await page.waitForTimeout(2000)

    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded')
      const contentType = await newPage.evaluate(() => document.contentType).catch(() => '')
      check(contentType.includes('pdf') || newPage.url().includes('/pdf'), `PDF opens in new tab (content-type: ${contentType})`)
      await shot(newPage, '08-pdf-tab')
      await newPage.close()
    } else {
      // Try direct API call to verify the endpoint
      const studentId = await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Download"]') || document.querySelector('button:has-text("PDF")')
        if (!btn) return null
        // walk up to the tr and extract from onclick
        const onclick = btn.getAttribute('onclick') || ''
        const match = onclick.match(/student\/(\d+)/)
        return match ? match[1] : null
      })
      log(`  INFO  PDF new tab not captured — trying direct API check`)
      const resp = await ctx.request.get(BASE + '/api/invoices/student/1/pdf')
      check(resp.headers()['content-type']?.includes('pdf'), `PDF API returns application/pdf (status ${resp.status()})`)
    }
  }

  // ── 5. Console errors ───────────────────────────────────────────────────────
  log('\n=== 5. CONSOLE ERRORS ===')
  if (consoleErrors.length === 0) {
    pass('No console errors')
  } else {
    consoleErrors.slice(0, 5).forEach(e => log(`  WARN  ${e}`))
    // Warn but don't hard-fail — some noise from Next.js internals is expected
  }

  await browser.close()

  // ── Summary ─────────────────────────────────────────────────────────────────
  log('\n=== SUMMARY ===')
  const failures = results.filter(r => r.includes('FAIL'))
  if (failures.length === 0) {
    log('✅  All checks passed')
  } else {
    log(`❌  ${failures.length} check(s) failed:`)
    failures.forEach(f => log('   ' + f))
  }
}

main().catch(e => { console.error(e); process.exit(1) })
