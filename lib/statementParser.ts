// Intelligent Kenyan bank statement parser
// Handles any bank format: Absa, Equity, KCB, Co-op, NCBA, Stanbic, I&M, DTB, Family Bank etc.

export interface ParsedTransaction {
  date: string
  description: string
  rawDescription: string
  reference: string
  amount: number
  senderName: string
  admissionNumber: string
  confidence: 'high' | 'medium' | 'low' | 'unmatched'
  matchedStudentId?: number
  matchedStudentName?: string
  suggestedStudentId?: number
  suggestedStudentName?: string
  bankRowIndex: number
}

export interface ParseResult {
  formatDetected: string
  totalRows: number
  skippedRows: number
  processedRows: number
  transactions: ParsedTransaction[]
}

// ─── Column detection ──────────────────────────────────────────────────────

const DATE_KEYS = ['transaction date', 'trans date', 'date', 'txn date', 'posting date', 'value date']
const DESC_KEYS = ['description', 'narration', 'particulars', 'details', 'transaction details', 'payment details']
const REF_KEYS = ['customer reference', 'transaction id', 'reference', 'ref no', 'cheque no', 'cheque number', 'transaction reference', 'ref']
const CREDIT_KEYS = ['credit amount', 'credit', 'cr amount', 'money in', 'paid in', 'deposits', 'cr', 'amount credited', 'received']
const DEBIT_KEYS = ['debit amount', 'debit', 'dr amount', 'money out', 'withdrawals', 'dr', 'amount debited']
const BALANCE_KEYS = ['running balance', 'balance', 'closing balance', 'available balance']

function normalise(s: string): string {
  return String(s ?? '').toLowerCase().trim()
}

function isHeaderRow(row: string[]): boolean {
  const joined = row.map(normalise).join(' ')
  return DATE_KEYS.some(k => joined.includes(k)) ||
    CREDIT_KEYS.some(k => joined.includes(k)) ||
    (joined.includes('date') && joined.includes('amount'))
}

function findCol(header: string[], keywords: string[]): number {
  for (const kw of keywords) {
    const idx = header.findIndex(h => normalise(h) === kw)
    if (idx >= 0) return idx
  }
  for (const kw of keywords) {
    const idx = header.findIndex(h => normalise(h).includes(kw))
    if (idx >= 0) return idx
  }
  return -1
}

// ─── Amount cleaning ──────────────────────────────────────────────────────

function parseAmount(raw: string | number | undefined): number {
  if (raw == null || raw === '' || raw === '-' || raw === '—') return 0
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── Skip row detection ───────────────────────────────────────────────────

const SKIP_TERMS = [
  'opening balance', 'closing balance', 'balance b/f', 'balance c/f',
  'brought forward', 'carried forward', 'total', 'sub total', 'subtotal',
  'tax', 'charges', 'levy', 'service charge', 'ledger fee',
  'transfer out', 'withdrawal', 'cash withdrawal', 'atm withdrawal',
  'standing order', 'direct debit', 'bank charges', 'interest charged',
]

function shouldSkipRow(desc: string, debitAmt: number, creditAmt: number): boolean {
  const d = desc.toLowerCase()
  if (SKIP_TERMS.some(t => d.includes(t))) return true
  if (debitAmt > 0 && creditAmt <= 0) return true  // outgoing payment
  return false
}

// ─── Sender name extraction from description ─────────────────────────────

export function extractSenderName(description: string): { name: string; reference: string; isActivity: boolean } {
  const desc = description.trim()

  // Pattern A: semicolon-separated MPESA via bank (Absa): "4131707;Jason Nkuranga;TEC7EHP6JV"
  if (desc.includes(';')) {
    const parts = desc.split(';').map(p => p.trim())
    if (parts.length >= 3) {
      return { name: parts[1], reference: parts[parts.length - 1], isActivity: false }
    }
    if (parts.length === 2) {
      return { name: parts[0], reference: parts[1], isActivity: false }
    }
  }

  // Pattern E: "From: John Kamau Ref: ABC123"
  const fromMatch = desc.match(/from[:\s]+([A-Za-z\s]+?)(?:\s+ref[:\s]+([A-Z0-9]+))?$/i)
  if (fromMatch) {
    return { name: fromMatch[1].trim(), reference: fromMatch[2] || '', isActivity: false }
  }

  // Pattern F: slash-separated "JOHN KAMAU/ADM1234/FEES"
  if (desc.includes('/')) {
    const parts = desc.split('/').map(p => p.trim())
    if (parts[0] && /^[A-Z\s]+$/.test(parts[0]) && parts[0].length > 3) {
      return { name: parts[0], reference: parts[1] || '', isActivity: false }
    }
  }

  // Pattern G: dash-separated "FEES PAYMENT - JOHN KAMAU - 0722000000"
  if (desc.includes(' - ')) {
    const parts = desc.split(' - ').map(p => p.trim())
    const nameLike = parts.find(p => /^[A-Za-z\s]+$/.test(p) && p.split(' ').length >= 2)
    if (nameLike) return { name: nameLike, reference: '', isActivity: false }
  }

  // Pattern B: last word is a transaction reference (alphanumeric 8-12 chars)
  const words = desc.split(/\s+/)
  if (words.length >= 2) {
    const last = words[words.length - 1]
    if (/^[A-Z0-9]{8,14}$/.test(last) && !/^[0-9]+$/.test(last)) {
      const name = words.slice(0, -1).join(' ').trim()
      if (isLikelyName(name)) {
        return { name, reference: last, isActivity: false }
      }
    }
  }

  // Pattern C/D: full description — check if it looks like a name or an activity
  if (isLikelyName(desc)) {
    return { name: desc, reference: '', isActivity: false }
  }

  // Pattern D: activity/note
  return { name: '', reference: '', isActivity: true }
}

function isLikelyName(s: string): boolean {
  if (!s || s.length < 3 || s.length > 60) return false
  // Reject if it contains digits or special chars typical of activities/references
  if (/[0-9&,]/.test(s) && s.split(' ').length < 4) return false
  // Should look like a name: mostly letters and spaces
  return /^[A-Za-z\s'.,-]+$/.test(s) && s.split(' ').filter(Boolean).length >= 1
}

// ─── Admission number extraction ──────────────────────────────────────────

export function extractAdmissionNumber(ref: string, desc: string): string {
  const combined = `${ref} ${desc}`.toUpperCase()
  // ADM followed by numbers
  const admMatch = combined.match(/ADM\s*([0-9]+)/i)
  if (admMatch) return `ADM${admMatch[1]}`
  // Pure number that looks like an admission number (3-6 digits)
  const numMatch = ref.trim().match(/^[0-9]{3,6}$/)
  if (numMatch) return numMatch[0]
  return ''
}

// ─── Detect bank format ───────────────────────────────────────────────────

function detectBankFormat(headers: string[]): string {
  const h = headers.map(normalise).join(' ')
  if (h.includes('customer credit') || (h.includes('cheque') && h.includes('customer reference'))) return 'Absa Bank Statement'
  if (h.includes('transaction type') && h.includes('branch')) return 'Equity Bank Statement'
  if (h.includes('value date') && h.includes('cr amount')) return 'KCB Bank Statement'
  if (h.includes('particulars') || h.includes('cheque no')) return 'Co-op Bank Statement'
  if (h.includes('narration') && h.includes('transaction reference')) return 'NCBA Bank Statement'
  if (h.includes('receipt no') || h.includes('paid in') || h.includes('money in')) return 'MPESA Statement'
  return 'Generic Bank Statement'
}

// ─── Main table parser (operates on 2D string array) ─────────────────────

export function parseTable(rows2d: string[][]): ParseResult {
  let headerRowIdx = -1
  let headerRow: string[] = []

  // Find the header row
  for (let i = 0; i < Math.min(rows2d.length, 30); i++) {
    if (isHeaderRow(rows2d[i])) {
      headerRowIdx = i
      headerRow = rows2d[i].map(c => String(c ?? ''))
      break
    }
  }

  if (headerRowIdx < 0) {
    // Fall back: treat first non-empty row as header
    for (let i = 0; i < rows2d.length; i++) {
      if (rows2d[i].some(c => c?.trim())) { headerRowIdx = i; headerRow = rows2d[i].map(c => String(c ?? '')); break }
    }
  }

  const formatDetected = detectBankFormat(headerRow)

  const dateCol = findCol(headerRow, DATE_KEYS)
  const descCol = findCol(headerRow, DESC_KEYS)
  const refCol = findCol(headerRow, REF_KEYS)
  const creditCol = findCol(headerRow, CREDIT_KEYS)
  const debitCol = findCol(headerRow, DEBIT_KEYS)

  const transactions: ParsedTransaction[] = []
  let skippedRows = 0
  let totalRows = 0

  for (let i = headerRowIdx + 1; i < rows2d.length; i++) {
    const row = rows2d[i]
    if (!row || row.every(c => !c?.trim())) continue

    totalRows++

    const rawDesc = descCol >= 0 ? String(row[descCol] ?? '').trim() : ''
    const rawRef = refCol >= 0 ? String(row[refCol] ?? '').trim() : ''
    const rawDate = dateCol >= 0 ? String(row[dateCol] ?? '').trim() : ''
    const creditRaw = creditCol >= 0 ? row[creditCol] : ''
    const debitRaw = debitCol >= 0 ? row[debitCol] : ''

    const creditAmt = parseAmount(creditRaw)
    const debitAmt = parseAmount(debitRaw)

    if (shouldSkipRow(rawDesc, debitAmt, creditAmt)) { skippedRows++; continue }
    if (creditAmt <= 0) { skippedRows++; continue }

    const { name: senderName, reference: extractedRef } = extractSenderName(rawDesc)
    const admNo = extractAdmissionNumber(rawRef, rawDesc)
    const reference = rawRef || extractedRef

    transactions.push({
      date: rawDate,
      description: senderName || rawDesc,
      rawDescription: rawDesc,
      reference,
      amount: creditAmt,
      senderName,
      admissionNumber: admNo,
      confidence: 'unmatched',
      bankRowIndex: i,
    })
  }

  return {
    formatDetected,
    totalRows,
    skippedRows,
    processedRows: transactions.length,
    transactions,
  }
}

// ─── Student matching ─────────────────────────────────────────────────────

export interface StudentRecord {
  id: number
  name: string
  admNo: string
  parentName: string | null
  parent2Name: string | null
  parentPhone: string | null
}

export function matchTransactions(
  transactions: ParsedTransaction[],
  students: StudentRecord[]
): ParsedTransaction[] {
  return transactions.map(tx => {
    const result = matchSingle(tx, students)
    return { ...tx, ...result }
  })
}

function clean(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function cleanRef(s: string): string {
  return s.toUpperCase().replace(/\s+/g, '').replace(/^ADM/i, '')
}

function matchSingle(tx: ParsedTransaction, students: StudentRecord[]): Partial<ParsedTransaction> {
  const txRef = cleanRef(tx.reference)
  const txAdm = cleanRef(tx.admissionNumber)
  const txName = clean(tx.senderName)
  const txDesc = clean(tx.rawDescription)

  // LEVEL 1: Exact admission number match
  if (txAdm || txRef) {
    const probe = txAdm || txRef
    const exact = students.find(s => cleanRef(s.admNo) === probe)
    if (exact) return { confidence: 'high', matchedStudentId: exact.id, matchedStudentName: exact.name }
  }

  // LEVEL 2: Partial admission number match
  if (txAdm || txRef) {
    const probe = txAdm || txRef
    const partial = students.find(s => {
      const sAdm = cleanRef(s.admNo)
      return sAdm.includes(probe) || probe.includes(sAdm)
    })
    if (partial) return { confidence: 'medium', matchedStudentId: partial.id, matchedStudentName: partial.name }
  }

  // LEVEL 3: Exact name match against parent or student name
  if (txName) {
    const exactName = students.find(s =>
      clean(s.parentName) === txName ||
      clean(s.parent2Name) === txName ||
      clean(s.name) === txName
    )
    if (exactName) return { confidence: 'medium', matchedStudentId: exactName.id, matchedStudentName: exactName.name }
  }

  // Also try matching on full rawDescription as a name
  if (txDesc && txDesc.length > 3 && txDesc.length < 50) {
    const descExact = students.find(s =>
      clean(s.parentName) === txDesc ||
      clean(s.parent2Name) === txDesc ||
      clean(s.name) === txDesc
    )
    if (descExact) return { confidence: 'medium', matchedStudentId: descExact.id, matchedStudentName: descExact.name }
  }

  // LEVEL 4: All words of extracted name appear in parent/student name
  const nameWords = txName.split(' ').filter(w => w.length > 2)
  if (nameWords.length >= 2) {
    const allWords = students.find(s => {
      const target = `${clean(s.parentName)} ${clean(s.parent2Name)} ${clean(s.name)}`
      return nameWords.every(w => target.includes(w))
    })
    if (allWords) return { confidence: 'medium', matchedStudentId: allWords.id, matchedStudentName: allWords.name }

    // LEVEL 5: First and last word match (low confidence — needs review)
    const first = nameWords[0]
    const last = nameWords[nameWords.length - 1]
    const partial = students.find(s => {
      const target = `${clean(s.parentName)} ${clean(s.parent2Name)} ${clean(s.name)}`
      return target.includes(first) && target.includes(last)
    })
    if (partial) {
      return { confidence: 'low', suggestedStudentId: partial.id, suggestedStudentName: partial.name }
    }
  }

  // Try description words too
  const descWords = txDesc.split(' ').filter(w => w.length > 3)
  if (descWords.length >= 2) {
    const first = descWords[0]
    const last = descWords[descWords.length - 1]
    const fromDesc = students.find(s => {
      const target = `${clean(s.parentName)} ${clean(s.parent2Name)} ${clean(s.name)}`
      return target.includes(first) && target.includes(last)
    })
    if (fromDesc) {
      return { confidence: 'low', suggestedStudentId: fromDesc.id, suggestedStudentName: fromDesc.name }
    }
  }

  // LEVEL 6: Unmatched
  return { confidence: 'unmatched' }
}

// ─── Text-based parsing (for PDF extracted text) ──────────────────────────

export function parseTextStatement(text: string): ParseResult {
  // Split into lines, then try to reconstruct a 2D table
  const lines = text.split('\n').map(l => l.trimEnd())

  // Find lines that look like table rows (contain numbers and multiple columns)
  // Use whitespace alignment to split into columns
  const rows2d: string[][] = []

  for (const line of lines) {
    if (!line.trim()) continue
    // Split by 2+ consecutive spaces (common in PDF text extraction)
    const cells = line.split(/\s{2,}/).map(c => c.trim()).filter(c => c)
    if (cells.length >= 2) {
      rows2d.push(cells)
    }
  }

  return parseTable(rows2d)
}

// ─── Excel/CSV row parser ──────────────────────────────────────────────────

export function parseJsonRows(rows: Record<string, unknown>[]): ParseResult {
  if (!rows.length) return { formatDetected: 'Empty file', totalRows: 0, skippedRows: 0, processedRows: 0, transactions: [] }

  // Convert object rows to 2D array, preserving header
  const keys = Object.keys(rows[0])
  const rows2d: string[][] = [
    keys,
    ...rows.map(r => keys.map(k => String(r[k] ?? ''))),
  ]
  return parseTable(rows2d)
}
