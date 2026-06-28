// Renders the client status report + go-live setup guide into one branded Datacare PDF.
// Run: node scripts/render-client-pdf.mjs
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function inline(s) {
  s = esc(s)
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, c) => `<strong>${c}</strong>`)
  s = s.replace(/\*([^*]+)\*/g, (_, c) => `<em>${c}</em>`)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
  return s
}
function renderBlocks(src) {
  const lines = src.replace(/\r/g, '').split('\n')
  let html = ''
  let i = 0
  while (i < lines.length) {
    let line = lines[i]
    if (!line.trim()) { i++; continue }
    let m = line.match(/^(#{1,4})\s+(.*)$/)
    if (m) { const lvl = m[1].length; html += `<h${lvl}>${inline(m[2])}</h${lvl}>\n`; i++; continue }
    if (/^---+$/.test(line.trim())) { html += '<hr>\n'; i++; continue }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]+$/.test(lines[i + 1])) {
      const rows = []
      while (i < lines.length && lines[i].includes('|')) { rows.push(lines[i]); i++ }
      const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim())
      const head = cells(rows[0]); const body = rows.slice(2)
      html += '<table class="grid"><thead><tr>' + head.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>'
      for (const r of body) html += '<tr>' + cells(r).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'
      html += '</tbody></table>\n'; continue
    }
    if (line.startsWith('>')) {
      const inner = []
      while (i < lines.length && lines[i].startsWith('>')) { inner.push(lines[i].replace(/^>\s?/, '')); i++ }
      html += `<div class="callout">${renderBlocks(inner.join('\n'))}</div>\n`; continue
    }
    if (/^\d+\.\s/.test(line)) {
      html += '<ol>'
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        let item = lines[i].replace(/^\d+\.\s/, ''); i++
        let sub = ''
        while (i < lines.length && /^\s{2,}-\s/.test(lines[i])) { sub += `<li>${inline(lines[i].replace(/^\s*-\s/, ''))}</li>`; i++ }
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s{2,}-\s/.test(lines[i])) { item += ' ' + lines[i].trim(); i++ }
        html += `<li>${inline(item)}${sub ? `<ul>${sub}</ul>` : ''}</li>`
      }
      html += '</ol>\n'; continue
    }
    if (/^[-*]\s/.test(line)) {
      html += '<ul>'
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { html += `<li>${inline(lines[i].replace(/^[-*]\s/, ''))}</li>`; i++ }
      html += '</ul>\n'; continue
    }
    const para = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\d+\.\s|[-*]\s|---+$)/.test(lines[i]) && !lines[i].includes('|')) { para.push(lines[i]); i++ }
    if (para.length) html += `<p>${inline(para.join(' '))}</p>\n`; else i++
  }
  return html
}

const status = renderBlocks(readFileSync('docs/status-report-2026-06-17.md', 'utf8'))
const guide = renderBlocks(readFileSync('docs/production-setup-guide.md', 'utf8'))

const masthead = `<div class="masthead">
    <div class="brand">
      <div class="wordmark">datacare<span>.</span> limited</div>
      <div class="tagline">Security &middot; Engineering &middot; Assurance</div>
    </div>
    <div class="contact">
      <div><span class="label">Web</span><br><a href="https://www.datacare.co.ke">www.datacare.co.ke</a></div>
      <div><span class="label">Email</span><br><a href="mailto:info@datacare.co.ke">info@datacare.co.ke</a></div>
      <div><span class="label">Phone</span><br>0722 155 752</div>
    </div>
  </div>`

const pageDoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Elimu Pay — Status Report &amp; Go-Live Setup Guide</title>
<style>
  @page { size: A4; margin: 16mm 15mm 18mm 15mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.55; margin: 0; }
  .masthead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0d5c63; padding-bottom: 14px; margin-bottom: 20px; }
  .brand .wordmark { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #0d5c63; }
  .brand .wordmark span { color: #c9a227; }
  .brand .tagline { font-size: 9.5px; letter-spacing: 2.5px; text-transform: uppercase; color: #6b7280; margin-top: 2px; }
  .contact { text-align: right; font-size: 10px; color: #374151; line-height: 1.7; }
  .contact a { color: #0d5c63; text-decoration: none; }
  .contact .label { color: #9ca3af; font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; }
  h1 { font-size: 21px; color: #0f172a; margin: 0 0 14px; }
  h2 { font-size: 14px; color: #0d5c63; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin: 20px 0 9px; break-after: avoid; }
  h3 { font-size: 12px; color: #0f172a; margin: 12px 0 4px; }
  p { margin: 0 0 8px; }
  ul, ol { margin: 4px 0 10px; padding-left: 20px; }
  li { margin-bottom: 3px; }
  strong { color: #0f172a; }
  em { color: #6b7280; font-style: italic; }
  code { background: #f1f5f9; color: #0d5c63; border-radius: 3px; padding: 0.5px 4px; font-family: "Consolas", Menlo, monospace; font-size: 9.5px; }
  a { color: #0d5c63; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 10px; margin: 8px 0 12px; break-inside: avoid; }
  table.grid th { background: #0d5c63; color: #fff; text-align: left; padding: 6px 9px; font-weight: 600; }
  table.grid td { padding: 6px 9px; border-bottom: 1px solid #eef2f7; vertical-align: top; }
  table.grid tr:nth-child(even) td { background: #f8fafc; }
  .callout { background: #f8fafc; border-left: 3px solid #c9a227; border-radius: 4px; padding: 9px 14px; margin: 10px 0; break-inside: avoid; }
  .callout p:last-child { margin-bottom: 0; }
  .callout ol, .callout ul { margin-bottom: 0; }
  .docnote { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #c9a227; font-weight: 700; margin-bottom: 4px; }
  .pagebreak { break-before: page; }
</style></head><body>
  ${masthead}
  <div class="docnote">Document 1 of 2 — Progress Report</div>
  ${status}
  <div class="pagebreak"></div>
  ${masthead}
  <div class="docnote">Document 2 of 2 — Go-Live Setup Guide</div>
  ${guide}
</body></html>`

writeFileSync('docs/elimupay-status-and-setup-guide.html', pageDoc)

const b = await chromium.launch({ channel: 'msedge', headless: true })
const pg = await (await b.newContext()).newPage()
await pg.goto('file://' + process.cwd().replace(/\\/g, '/') + '/docs/elimupay-status-and-setup-guide.html', { waitUntil: 'networkidle' })
await pg.pdf({ path: 'docs/elimupay-status-and-setup-guide.pdf', format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' } })
await b.close()
console.log('OK wrote docs/elimupay-status-and-setup-guide.pdf')
