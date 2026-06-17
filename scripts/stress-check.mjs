// Focused stress check — LOCAL ONLY. Drives the running dev server (:3000) against the
// large seeded DB. Validates: (1) sequential invoice-number atomicity under concurrency,
// (2) heavy-endpoint latency/payload, (3) SMS route graceful-degrade, (4) UI smoke + console errors.
// Run: node scripts/stress-check.mjs
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'

const BASE = 'http://localhost:3000'
const prisma = new PrismaClient()
const out = []
const log = (s) => { console.log(s); out.push(s) }
const ok = (b) => (b ? 'PASS' : 'FAIL')

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
  const api = ctx.request

  // ---- 1. Login ----
  log('\n=== LOGIN ===')
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.fill('input[name=email]', 'staff@stress.local')
  await page.fill('input[name=password]', 'StressTest1A')
  // Wait until React enables the submit button (it is disabled until both fields have state).
  await page.waitForSelector('button:has-text("Sign in"):not([disabled])', { timeout: 10000 })
  await page.click('button:has-text("Sign in")')
  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 })
  } catch {
    const errText = await page.locator('body').innerText().catch(() => '')
    log(`login did not reach /dashboard; url=${page.url()}; page hint="${errText.replace(/\s+/g, ' ').slice(0, 120)}"`)
  }
  await page.waitForTimeout(1500)
  const probe = await api.get(BASE + '/api/students?page=1&limit=1')
  log(`login session -> /api/students status ${probe.status()} [${ok(probe.status() === 200)}]`)
  if (probe.status() !== 200) { log('ABORT: not authenticated'); await browser.close(); await prisma.$disconnect(); printReport(); return }

  // ---- 2. Heavy-endpoint latency + payload (5k students seeded) ----
  log('\n=== ENDPOINT LATENCY (full dataset) ===')
  async function timeGet(path) {
    const t = Date.now()
    const r = await api.get(BASE + path)
    const ms = Date.now() - t
    const kb = Math.round((await r.body()).length / 1024)
    log(`GET ${path.padEnd(34)} ${String(r.status()).padEnd(4)} ${String(ms).padStart(6)} ms  ${String(kb).padStart(6)} KB`)
    return { path, ms, kb, status: r.status() }
  }
  await timeGet('/api/students')
  await timeGet('/api/students?page=1&limit=50')
  await timeGet('/api/invoices')
  await timeGet('/api/unmatched')
  await timeGet('/api/payments')

  // ---- 3. Sequential invoice numbering under concurrency (NEW feature) ----
  log('\n=== INVOICE NUMBERING ATOMICITY ===')
  const school = await prisma.school.findFirst({ where: { name: 'Stress Test Academy' } })
  const term = school.currentTerm
  const withInv = await prisma.invoice.findMany({ where: { schoolId: school.id, term }, select: { studentId: true } })
  const taken = withInv.map((i) => i.studentId)
  const N = 75
  const candidates = await prisma.student.findMany({
    where: { schoolId: school.id, id: { notIn: taken } }, take: N, select: { id: true },
  })
  const before = school.nextInvoiceNumber
  log(`school counter before: ${before}; issuing ${candidates.length} invoices concurrently...`)
  const t = Date.now()
  const results = await Promise.all(candidates.map((s) =>
    api.post(BASE + '/api/invoices', { data: { studentId: s.id, status: 'draft', amount: 1500, breakdown: {} } })
      .then((r) => r.json()).catch((e) => ({ error: String(e) }))))
  const ms = Date.now() - t
  const nums = results.map((r) => r && r.invoiceNumber).filter((n) => n != null).sort((a, b) => a - b)
  const uniqueCount = new Set(nums).size
  const allNumbered = nums.length === candidates.length
  const unique = uniqueCount === nums.length
  const contiguous = nums.length > 0 && nums[nums.length - 1] - nums[0] === nums.length - 1 && nums[0] === before
  const after = (await prisma.school.findUnique({ where: { id: school.id }, select: { nextInvoiceNumber: true } })).nextInvoiceNumber
  const counterOk = after === before + candidates.length
  log(`issued ${candidates.length} in ${ms} ms`)
  log(`all got a number:     ${allNumbered} [${ok(allNumbered)}]  (${nums.length}/${candidates.length})`)
  log(`numbers unique:       ${unique} [${ok(unique)}]  (${uniqueCount} distinct)`)
  log(`gap-free from ${before}: ${contiguous} [${ok(contiguous)}]  (range ${nums[0]}..${nums[nums.length - 1]})`)
  log(`counter advanced ok:  ${counterOk} [${ok(counterOk)}]  (after=${after})`)
  // re-POST one (re-send) must NOT change its number
  if (candidates.length > 0) {
    const sid = candidates[0].id
    const first = results.find((r) => r && r.studentId === sid)
    const re = await api.post(BASE + '/api/invoices', { data: { studentId: sid, status: 'sent', amount: 1500, breakdown: {} } }).then((r) => r.json())
    const stable = first && re && first.invoiceNumber === re.invoiceNumber
    log(`re-send keeps number: ${stable} [${ok(stable)}]  (${first && first.invoiceNumber} == ${re && re.invoiceNumber})`)
  }

  // ---- 4. SMS route degrades gracefully when unconfigured ----
  log('\n=== SMS ROUTE (unconfigured) ===')
  const sms = await api.post(BASE + '/api/reminders/send-sms', { data: {} })
  const body = await sms.json().catch(() => ({}))
  const graceful = sms.status() === 400 && /config/i.test(body.error || '')
  log(`POST /api/reminders/send-sms -> ${sms.status()} "${body.error || ''}" [${ok(graceful)}]`)

  // ---- 5. UI smoke + render + console errors ----
  log('\n=== UI SMOKE (render time, rows, console errors) ===')
  async function loadPage(path, rowSel) {
    const t0 = Date.now()
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const ms = Date.now() - t0
    let rows = 0
    try { rows = await page.locator(rowSel).count() } catch {}
    const nodes = await page.evaluate(() => document.querySelectorAll('*').length)
    log(`${path.padEnd(14)} ${String(ms).padStart(6)} ms  rows=${String(rows).padStart(4)}  domNodes=${String(nodes).padStart(6)}`)
  }
  await loadPage('/dashboard', '[class*=card]')
  await loadPage('/students', 'tbody tr')
  await loadPage('/invoices', 'tbody tr')
  await loadPage('/unmatched', 'tbody tr')
  await loadPage('/reminders', 'tbody tr')

  log('\n=== CONSOLE ERRORS ===')
  if (consoleErrors.length === 0) log('none [PASS]')
  else { log(`${consoleErrors.length} error(s):`); [...new Set(consoleErrors)].slice(0, 12).forEach((e) => log('  - ' + e.slice(0, 180))) }

  await browser.close()
  await prisma.$disconnect()
  printReport()
}

function printReport() {
  console.log('\n========== END ==========')
}

main().catch(async (e) => { console.error('HARNESS ERROR:', e); await prisma.$disconnect(); process.exit(1) })
