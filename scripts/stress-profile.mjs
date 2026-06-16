// UI stress profiler — LOCAL ONLY. Drives the app under the seeded 5k-student load.
// Run: DATABASE_URL=... node scripts/stress-profile.mjs
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const SHOTS = 'docs/stress-shots'
fs.mkdirSync(SHOTS, { recursive: true })
const prisma = new PrismaClient()

const results = []

async function profile(page, label, path, interact) {
  const errors = []
  const onConsole = m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) }
  const onPageErr = e => errors.push('PAGEERROR: ' + String(e).slice(0, 200))
  page.on('console', onConsole); page.on('pageerror', onPageErr)
  const rec = { label, path, gotoMs: null, settleMs: null, nodes: null, rows: null, heapMB: null, errors: 0, note: '' }
  try {
    let t = Date.now()
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 })
    rec.gotoMs = Date.now() - t
    t = Date.now()
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => { rec.note += 'networkidle-timeout; ' })
    rec.settleMs = Date.now() - t
    const m = await page.evaluate(() => ({
      nodes: document.querySelectorAll('*').length,
      rows: document.querySelectorAll('tbody tr').length,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    }))
    Object.assign(rec, m)
    if (interact) rec.note += (await interact(page)) || ''
    await page.screenshot({ path: `${SHOTS}/${label}.png`, fullPage: false }).catch(() => {})
  } catch (e) {
    rec.note += 'ERROR: ' + String(e.message || e).slice(0, 160)
  }
  rec.errors = errors.length
  rec.sampleError = errors[0] || ''
  page.off('console', onConsole); page.off('pageerror', onPageErr)
  results.push(rec)
  console.log(`${label.padEnd(22)} goto=${String(rec.gotoMs).padStart(6)}ms settle=${String(rec.settleMs).padStart(6)}ms nodes=${String(rec.nodes).padStart(6)} rows=${String(rec.rows).padStart(5)} heap=${rec.heapMB}MB err=${rec.errors} ${rec.note}`)
}

async function login(page, email, password) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button:has-text("Sign in")')
  await page.waitForTimeout(3500) // let signIn set the session cookie (client router.push is unreliable here)
  return page.url()
}

async function main() {
  const firstStudent = await prisma.student.findFirst({ where: { school: { name: 'Stress Test Academy' } }, select: { id: true }, orderBy: { id: 'asc' } })
  const demoSchool = await prisma.school.findFirst({ where: { name: { startsWith: 'Demo School' } }, select: { id: true } })

  const browser = await chromium.launch({ channel: 'msedge', headless: true })

  // ---- Staff session ----
  const staff = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const sp = await staff.newPage()
  const staffUrl = await login(sp, 'staff@stress.local', 'StressTest1A')
  console.log('STAFF login ->', staffUrl)

  const searchInteract = async (page) => {
    const box = page.locator('input[type="text"], input[placeholder*="earch" i]').first()
    if (await box.count() === 0) return 'no-search-box; '
    const t = Date.now()
    await box.fill('Student 4999').catch(() => {})
    await page.waitForTimeout(600)
    const rowsAfter = await page.evaluate(() => document.querySelectorAll('tbody tr').length)
    return `search:${Date.now() - t}ms->${rowsAfter}rows; `
  }

  await profile(sp, 'staff-dashboard', '/dashboard')
  await profile(sp, 'staff-students', '/students', searchInteract)
  if (firstStudent) await profile(sp, 'staff-student-detail', `/students/${firstStudent.id}`)
  await profile(sp, 'staff-upload', '/upload')
  await profile(sp, 'staff-unmatched', '/unmatched', searchInteract)
  await profile(sp, 'staff-invoices', '/invoices', searchInteract)
  await profile(sp, 'staff-reports', '/reports')
  await profile(sp, 'staff-reminders', '/reminders')
  await profile(sp, 'staff-settings', '/settings')
  await profile(sp, 'staff-setup', '/setup')
  await staff.close()

  // ---- Admin session ----
  const admin = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const ap = await admin.newPage()
  const adminUrl = await login(ap, 'admin@stress.local', 'StressTest1A')
  console.log('ADMIN login ->', adminUrl)

  for (const [label, path] of [
    ['admin-dashboard', '/admin/dashboard'],
    ['admin-schools', '/admin/schools'],
    ['admin-school-detail', demoSchool ? `/admin/schools/${demoSchool.id}` : '/admin/schools'],
    ['admin-audit', '/admin/audit'],
    ['admin-analytics', '/admin/analytics'],
    ['admin-billing', '/admin/billing'],
    ['admin-communications', '/admin/communications'],
    ['admin-onboarding', '/admin/onboarding'],
    ['admin-settings', '/admin/settings'],
    ['admin-forecast', '/admin/forecast'],
    ['admin-testimonials', '/admin/testimonials'],
    ['admin-flags', '/admin/flags'],
    ['admin-activity', '/admin/activity'],
  ]) await profile(ap, label, path)
  await admin.close()

  await browser.close()
  fs.writeFileSync(`${SHOTS}/metrics.json`, JSON.stringify(results, null, 2))
  console.log('\nWrote', `${SHOTS}/metrics.json`, 'and', results.length, 'screenshots')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
