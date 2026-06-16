import { chromium } from 'playwright'
const BASE = 'http://localhost:3000'

async function login(ctx, email) {
  const p = await ctx.newPage()
  await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForTimeout(3000) // allow React to hydrate so input onChange wires up (enables the button)
  await p.fill('#email', email)
  await p.fill('#password', 'StressTest1A')
  await p.waitForTimeout(400)
  await p.click('button:has-text("Sign in")', { timeout: 15000 })
  await p.waitForTimeout(4000)
  return p
}
async function prof(p, label, path, interact) {
  const errs = []
  p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 90)))
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await p.waitForTimeout(1500)
  let extra = ''
  if (interact) extra = await interact(p)
  const m = await p.evaluate(() => ({ nodes: document.querySelectorAll('*').length, rows: document.querySelectorAll('tbody tr').length }))
  console.log(label.padEnd(12), 'nodes=' + String(m.nodes).padStart(6), 'rows=' + String(m.rows).padStart(5), 'err=' + errs.length, extra)
  return errs
}
;(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true })
  const sc = await b.newContext()
  const sp = await login(sc, 'staff@stress.local')
  await prof(sp, 'students', '/students', async (p) => {
    const t = Date.now()
    await p.fill('input[placeholder*="Search" i]', 'Student 4999').catch(() => {})
    await p.waitForTimeout(700)
    const r = await p.evaluate(() => document.querySelectorAll('tbody tr').length)
    return 'search:' + (Date.now() - t) + 'ms->' + r + 'rows'
  })
  const e = await prof(sp, 'dashboard', '/dashboard')
  console.log('console errors:', JSON.stringify(e.slice(0, 3)))
  await b.close()
})().catch(e => { console.log('ERR', e.message); process.exit(1) })
