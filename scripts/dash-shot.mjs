import { chromium } from 'playwright'
const BASE = 'http://localhost:3000'
;(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true })
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForTimeout(3000)
  await p.fill('#email', 'staff@stress.local')
  await p.fill('#password', 'StressTest1A')
  await p.waitForTimeout(400)
  await p.click('button:has-text("Sign in")', { timeout: 15000 })
  await p.waitForTimeout(4000)
  await p.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await p.waitForTimeout(2000)
  const errs = []
  p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 90)))
  await p.screenshot({ path: 'docs/stress-shots/dashboard-redesigned.png', fullPage: true })
  const nodes = await p.evaluate(() => document.querySelectorAll('*').length)
  console.log('dashboard nodes=', nodes, 'screenshot saved')
  await b.close()
})().catch(e => { console.log('ERR', e.message); process.exit(1) })
