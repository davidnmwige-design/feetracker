/**
 * Universal Kenyan bank statement parser.
 *
 * Handles any bank format (Absa, Equity, KCB, Co-op, NCBA, Stanbic, etc.)
 * through automatic column detection and multi-pattern description analysis.
 * Designed to scale to 10,000-row statements without memory issues.
 */

import { distance } from 'fastest-levenshtein'

// =============================================================================
// SECTION 1: Types and interfaces
// =============================================================================

/** The type of payment detected from the transaction description */
export type PaymentType =
  | 'admission_number'  // matched by admission number — highest confidence
  | 'mpesa_wallet'      // MPESA via bank wallet (semicolon-separated format)
  | 'kits_name'         // KITS bank transfer with an identifiable name
  | 'kits_activity'     // KITS bank transfer for an activity (not a student)
  | 'multiple_students' // payment covers multiple students and needs splitting
  | 'unclear'           // cannot determine the individual student
  | 'unknown'           // completely unrecognized format

export type MatchConfidence = 'high' | 'medium' | 'low' | 'unmatched'

/** Result of analysing a single payment description */
export interface DescriptionAnalysis {
  type: PaymentType
  /** Single extracted name (student or parent) */
  extractedName?: string
  /** Multiple names (for multi-student payments) */
  extractedNames?: string[]
  /** Extracted admission number */
  extractedAdmNo?: string
  /** Transaction reference extracted from description */
  extractedRef?: string
  /** Human-readable activity label (for kits_activity type) */
  activityDescription?: string
  /** Confidence before student matching — updated by the matching engine */
  confidence: MatchConfidence
}

/** Semantic mapping of column indices for a detected statement format */
export interface ColumnMap {
  dateCol: number
  descCol: number
  creditCol: number
  debitCol: number | null
  refCol: number | null
  balanceCol: number | null
  /** Secondary narration column (e.g. Absa has both "Description" and "Narration") */
  narrationCol: number | null
}

export interface ParsedTransaction {
  date: string
  /** Human-readable display name or description */
  description: string
  /** Raw text from the description column */
  rawDescription: string
  reference: string
  amount: number
  /** Extracted name for display and legacy matching (kept for API compat) */
  senderName: string
  /** Extracted admission number (kept for API compat) */
  admissionNumber: string
  confidence: MatchConfidence
  /** Rich analysis result from the description engine */
  analysis: DescriptionAnalysis
  matchedStudentId?: number
  matchedStudentName?: string
  suggestedStudentId?: number
  suggestedStudentName?: string
  /** Pre-computed suggestions for the unmatched review UI */
  suggestedStudents?: Array<{
    studentId: number
    studentName: string
    similarity: number
    matchedBy: string
  }>
  /** Human-readable note for the review UI */
  notes?: string
  bankRowIndex: number
}

export interface StudentRecord {
  id: number
  name: string
  admNo: string
  parentName: string | null
  parent2Name: string | null
  parentPhone: string | null
  class?: string
}

export interface MatchResult {
  student: StudentRecord | null
  confidence: MatchConfidence
  matchedBy: string
  similarityScore?: number
  suggestedStudents?: Array<{
    student: StudentRecord
    similarity: number
    matchedBy: string
  }>
}

export interface ParseResult {
  formatDetected: string
  totalRows: number
  skippedRows: number
  processedRows: number
  /** Confidence and type breakdown — only populated after matchTransactions() */
  results: {
    highConfidence: number
    mediumConfidence: number
    lowConfidence: number
    multipleStudents: number
    activityPayments: number
    unmatched: number
  }
  transactions: ParsedTransaction[]
}

// =============================================================================
// SECTION 2: Constants
// =============================================================================

const DATE_KEYWORDS = [
  'transaction date', 'trans date', 'date', 'txn date', 'posting date', 'value date',
] as const

const CREDIT_KEYWORDS = [
  'credit amount', 'credit', 'cr amount', 'money in', 'paid in',
  'deposits', 'cr', 'amount credited', 'received',
] as const

const DEBIT_KEYWORDS = [
  'debit amount', 'debit', 'dr amount', 'money out', 'withdrawals', 'dr', 'amount debited',
] as const

const BALANCE_KEYWORDS = [
  'running balance', 'balance', 'closing balance', 'available balance', 'ledger balance',
] as const

const REF_KEYWORDS = [
  'customer reference', 'transaction id', 'reference', 'ref no',
  'cheque no', 'cheque number', 'transaction reference', 'ref',
] as const

/** Keywords that identify activity payments (not individual students) */
const ACTIVITY_KEYWORDS = [
  'drum', 'tennis', 'golf', 'swimming', 'music', 'transport', 'lunch',
  'boarding', 'co-curricular', 'extracurricular', 'activities', 'sport',
  'club', 'tuition', 'school fees', 'library', 'uniform', 'books',
  'lamda', 'lambda', 'dance', 'art', 'choir', 'debate', 'science',
  'computer', 'ict', 'exam', 'trip', 'excursion', 'hostel', 'bus',
] as const

/** Keywords in descriptions that indicate a row should be skipped entirely */
const SKIP_KEYWORDS = [
  'opening balance', 'closing balance', 'balance b/f', 'balance c/f',
  'brought forward', 'carried forward', 'total', 'sub total', 'subtotal',
  'service charge', 'ledger fee', 'bank charges', 'interest charged',
  'reversal', 'reversed',
] as const

/** Debit-specific description keywords (skip regardless of amount columns) */
const DEBIT_DESC_KEYWORDS = [
  'transfer out', 'withdrawal', 'cash withdrawal', 'atm withdrawal',
  'standing order', 'direct debit', 'cheque clg', 'domestic funds transfer debit',
  'funds transfer debit', 'outward transfer', 'debit transfer',
] as const

/** Words that indicate the payment cannot be attributed to a single student */
const UNCLEAR_WORDS = [
  'children', 'child', 'kids', 'family', 'parents', 'guardian',
  'school fees', 'fees payment',
] as const

/** Minimum reference length to qualify as a KITS hex reference */
const MIN_REF_LENGTH_FOR_KITS = 15

/** Minimum Levenshtein similarity (0–1) to accept a fuzzy name match */
const FUZZY_MATCH_THRESHOLD = 0.80

/** Minimum recognized column keywords in a row to identify it as a header */
const MIN_HEADER_KEYWORD_MATCHES = 2

// =============================================================================
// SECTION 3: Column detection functions
// =============================================================================

function normalise(s: unknown): string {
  return String(s ?? '').toLowerCase().trim()
}

/**
 * Scans up to the first 30 rows to find the header row.
 * A header row contains at least MIN_HEADER_KEYWORD_MATCHES recognized column keywords.
 * Returns -1 if no header row is found.
 */
function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const joined = rows[i].map(normalise).join(' ')
    let matches = 0
    if (DATE_KEYWORDS.some(k => joined.includes(k))) matches++
    if (CREDIT_KEYWORDS.some(k => joined.includes(k))) matches++
    if (DEBIT_KEYWORDS.some(k => joined.includes(k))) matches++
    if (BALANCE_KEYWORDS.some(k => joined.includes(k))) matches++
    if (REF_KEYWORDS.some(k => joined.includes(k))) matches++
    if (matches >= MIN_HEADER_KEYWORD_MATCHES) return i
    if (joined.includes('date') && joined.includes('amount')) return i
  }
  return -1
}

/**
 * Finds the best-matching column index for a set of keywords.
 * Tries exact match first, then substring match.
 * Returns -1 if no match found.
 */
function findCol(headerRow: string[], keywords: readonly string[]): number {
  const normalised = headerRow.map(normalise)
  for (const kw of keywords) {
    const idx = normalised.findIndex(h => h === kw)
    if (idx >= 0) return idx
  }
  for (const kw of keywords) {
    const idx = normalised.findIndex(h => h.includes(kw))
    if (idx >= 0) return idx
  }
  return -1
}

/**
 * Finds a secondary narration column, explicitly excluding already-assigned column indices.
 * Handles banks like Absa that have both a "Description" and a "Narration" column.
 */
function findNarrationCol(headerRow: string[], excludeCols: number[]): number {
  const narrationKeys = [
    'narration', 'narrative', 'transaction narrative',
    'payment details', 'transaction details', 'details', 'remarks',
  ]
  const normalised = headerRow.map(normalise)
  for (const kw of narrationKeys) {
    const idx = normalised.findIndex((h, i) => !excludeCols.includes(i) && h.includes(kw))
    if (idx >= 0) return idx
  }
  return -1
}

/**
 * Maps column indices to their semantic meaning based on header keywords.
 * Returns null if required columns (date + credit) cannot be identified.
 */
function detectColumns(headerRow: string[]): ColumnMap | null {
  const dateCol = findCol(headerRow, DATE_KEYWORDS)
  const creditCol = findCol(headerRow, CREDIT_KEYWORDS)
  if (dateCol < 0 || creditCol < 0) return null

  const debitCol = findCol(headerRow, DEBIT_KEYWORDS)
  const balanceCol = findCol(headerRow, BALANCE_KEYWORDS)
  const refCol = findCol(headerRow, REF_KEYWORDS)

  // Primary description column — prefer explicit "description"/"particulars" over "narration"
  const descPrimary = findCol(headerRow, ['description', 'particulars'])
  // Secondary narration column — only if different from primary
  const excludeSoFar = [dateCol, creditCol, debitCol, balanceCol, refCol, descPrimary].filter(c => c >= 0)
  const narrationCandidate = findNarrationCol(headerRow, excludeSoFar)

  // Determine effective desc and narration columns
  const hasNarrationKey = findCol(headerRow, ['narration', 'narrative', 'transaction narrative', 'payment details', 'transaction details', 'details', 'remarks'])
  const descCol = descPrimary >= 0
    ? descPrimary
    : (hasNarrationKey >= 0 ? hasNarrationKey : -1)

  const narrationCol = (descPrimary >= 0 && narrationCandidate >= 0 && narrationCandidate !== descPrimary)
    ? narrationCandidate
    : null

  if (descCol < 0) return null

  return {
    dateCol,
    descCol,
    creditCol,
    debitCol: debitCol >= 0 ? debitCol : null,
    refCol: refCol >= 0 ? refCol : null,
    balanceCol: balanceCol >= 0 ? balanceCol : null,
    narrationCol,
  }
}

// =============================================================================
// SECTION 4: Row filtering functions
// =============================================================================

/**
 * Parses an amount string to a number, handling commas and currency symbols.
 * Returns 0 if parsing fails or the value is empty/dash.
 */
export function parseAmount(value: string | number | undefined): number {
  if (value == null || value === '' || value === '-' || value === '—') return 0
  const n = Number(String(value).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

/**
 * Determines if a row represents a valid incoming credit transaction.
 * Rejects debits, summary rows, bank charges, and reversals.
 */
function isValidCreditTransaction(row: string[], columns: ColumnMap): boolean {
  const desc = normalise(row[columns.descCol] ?? '')
  const narration = columns.narrationCol != null ? normalise(row[columns.narrationCol] ?? '') : ''
  const refText = columns.refCol != null ? normalise(row[columns.refCol] ?? '') : ''
  const combined = `${desc} ${narration} ${refText}`

  if (SKIP_KEYWORDS.some(k => combined.includes(k))) return false
  if (DEBIT_DESC_KEYWORDS.some(k => combined.includes(k))) return false

  const creditAmt = parseAmount(row[columns.creditCol])
  const debitAmt = columns.debitCol != null ? parseAmount(row[columns.debitCol]) : 0

  if (creditAmt <= 0) return false
  if (debitAmt > 0) return false

  return true
}

// =============================================================================
// SECTION 5: Description analysis engine
// =============================================================================

/**
 * Checks for an admission number pattern in the description or reference.
 * Matches ADM followed by digits, or a pure 3–6-digit standalone reference.
 */
function detectAdmissionNumber(description: string, ref: string): DescriptionAnalysis | null {
  const combined = `${description} ${ref}`.toUpperCase()
  const admMatch = combined.match(/\bADM\s*([0-9]{2,6})\b/i)
  if (admMatch) {
    return { type: 'admission_number', extractedAdmNo: `ADM${admMatch[1]}`, confidence: 'high' }
  }
  const numMatch = ref.trim().match(/^[0-9]{3,6}$/)
  if (numMatch) {
    return { type: 'admission_number', extractedAdmNo: numMatch[0], confidence: 'high' }
  }
  return null
}

/**
 * Parses MPESA wallet format: "accountId;name;transRef".
 * Handles the format both alone and embedded in a longer description.
 * Returns null if no semicolon-separated pattern is found.
 */
function detectMpesaWallet(description: string): DescriptionAnalysis | null {
  if (!description.includes(';')) return null

  // Locate the semicolon-separated segment (digits;text;alphanumeric)
  const semicolonMatch = description.match(/\d+;([^;]+);([A-Za-z0-9]+)/)
  if (!semicolonMatch) return null

  const rawName = semicolonMatch[1].trim()
  const extractedRef = semicolonMatch[2].trim()

  if (!rawName) return null

  // Multiple names indicated by commas in the name field
  if (rawName.includes(',')) {
    const names = rawName.split(',').map(n => n.trim()).filter(n => n.length > 0)
    return { type: 'multiple_students', extractedNames: names, extractedRef, confidence: 'unmatched' }
  }

  // Ambiguous payments that cannot be attributed to one student
  const lowerName = rawName.toLowerCase()
  if (UNCLEAR_WORDS.some(w => lowerName.includes(w))) {
    return { type: 'unclear', extractedName: rawName, extractedRef, confidence: 'unmatched' }
  }

  return { type: 'mpesa_wallet', extractedName: rawName, extractedRef, confidence: 'unmatched' }
}

/**
 * Parses KITS bank transfer format.
 * Identifies transfers where the customer reference is a long hex string,
 * then extracts any additional text (activity name or person name) that follows.
 */
function detectKitsTransfer(description: string, customerRef: string): DescriptionAnalysis | null {
  const isKitsDesc = /customer credit using kits/i.test(description)
  const hexPrefix = customerRef.replace(/\s.*/, '').trim()
  const isLongHexRef = hexPrefix.length >= MIN_REF_LENGTH_FOR_KITS && /^[0-9a-f]+$/i.test(hexPrefix)

  if (!isKitsDesc && !isLongHexRef) return null

  // Combine all text and strip the KITS label and any long hex sequences
  const allText = `${description} ${customerRef}`
  const extraText = allText
    .replace(/customer credit using kits/gi, '')
    .replace(/[0-9a-f]{15,}/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!extraText || extraText.length < 2) {
    return { type: 'kits_activity', activityDescription: 'KITS transfer', confidence: 'unmatched' }
  }

  const lowerExtra = extraText.toLowerCase()

  // Activity keywords take priority over name/multi-name detection
  if (ACTIVITY_KEYWORDS.some(k => lowerExtra.includes(k))) {
    return { type: 'kits_activity', activityDescription: extraText, confidence: 'unmatched' }
  }

  // Multiple students separated by & or "and"
  if (extraText.includes('&') || / and /i.test(extraText)) {
    const sep = extraText.includes('&') ? '&' : / and /i
    const names = extraText.split(sep instanceof RegExp ? sep : sep)
      .map(n => n.trim())
      .filter(n => n.length > 0)
    return { type: 'multiple_students', extractedNames: names, confidence: 'unmatched' }
  }

  // Comma-separated items — each must not be an activity to count as names
  if (extraText.includes(',')) {
    const parts = extraText.split(',').map(p => p.trim()).filter(p => p.length > 0)
    if (parts.some(p => ACTIVITY_KEYWORDS.some(k => p.toLowerCase().includes(k)))) {
      return { type: 'kits_activity', activityDescription: extraText, confidence: 'unmatched' }
    }
    return { type: 'multiple_students', extractedNames: parts, confidence: 'unmatched' }
  }

  // Ambiguous/generic description
  if (UNCLEAR_WORDS.some(w => lowerExtra.includes(w))) {
    return { type: 'unclear', extractedName: extraText, confidence: 'unmatched' }
  }

  return { type: 'kits_name', extractedName: extraText, confidence: 'unmatched' }
}

/**
 * Detects multiple names separated by commas, &, or "and" in a plain description.
 * Returns null if the text does not look like a list of names.
 */
function detectMultipleNames(description: string): DescriptionAnalysis | null {
  if (!description.includes(',') && !description.includes('&') && !/ and /i.test(description)) {
    return null
  }

  let parts: string[]
  if (description.includes('&')) {
    parts = description.split('&').map(p => p.trim())
  } else if (/ and /i.test(description)) {
    parts = description.split(/ and /i).map(p => p.trim())
  } else {
    parts = description.split(',').map(p => p.trim())
  }

  const nameLike = parts.filter(p => p.length > 1 && /^[A-Za-z\s'.]+$/.test(p))
  if (nameLike.length < 2) return null

  return { type: 'multiple_students', extractedNames: nameLike, confidence: 'unmatched' }
}

/**
 * Detects a single person's name in a description string.
 * Rejects anything that contains digits, is too short, or looks like a transaction code.
 */
function detectSingleName(description: string): DescriptionAnalysis | null {
  const trimmed = description.trim()
  if (!trimmed || trimmed.length < 3 || trimmed.length > 80) return null
  if (!/^[A-Za-z\s'.-]+$/.test(trimmed)) return null
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 1 && trimmed.length < 4) return null
  return { type: 'mpesa_wallet', extractedName: trimmed, confidence: 'unmatched' }
}

/**
 * Analyses a payment description to determine its type and extract identifying
 * information (name, admission number, activity label, etc.).
 *
 * Detection priority:
 * 1. Admission number (highest confidence)
 * 2. MPESA wallet semicolon format
 * 3. KITS transfer (long hex reference + optional extra text)
 * 4. Multiple names (commas / & / "and")
 * 5. Single clean name
 * 6. Unclear / unknown
 *
 * @param rawDescription - Combined text from description and narration columns
 * @param customerRef    - Text from the customer reference column
 */
export function analyseDescription(rawDescription: string, customerRef: string): DescriptionAnalysis {
  const admResult = detectAdmissionNumber(rawDescription, customerRef)
  if (admResult) return admResult

  // Check for semicolon wallet format across the combined text
  const combined = `${rawDescription} ${customerRef}`
  const walletResult = detectMpesaWallet(combined)
  if (walletResult) return walletResult

  const kitsResult = detectKitsTransfer(rawDescription, customerRef)
  if (kitsResult) return kitsResult

  const multiResult = detectMultipleNames(rawDescription)
  if (multiResult) return multiResult

  const singleResult = detectSingleName(rawDescription)
  if (singleResult) return singleResult

  return { type: 'unknown', confidence: 'unmatched' }
}

// =============================================================================
// SECTION 6: Matching engine
// =============================================================================

function cleanStr(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Calculates string similarity using Levenshtein distance.
 * Returns a score between 0 (completely different) and 1 (identical).
 *
 * @param a - First string
 * @param b - Second string
 */
export function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - distance(a.toLowerCase(), b.toLowerCase()) / maxLen
}

/**
 * Finds up to `limit` students most similar to the given name string.
 * Checks similarity against student name, parent 1 name, and parent 2 name.
 *
 * @param name     - The extracted name to search for
 * @param students - Student roster for the school
 * @param limit    - Maximum number of suggestions to return (default 3)
 */
export function findSuggestedStudents(
  name: string,
  students: StudentRecord[],
  limit = 3,
): Array<{ student: StudentRecord; similarity: number; matchedBy: string }> {
  if (!name || students.length === 0) return []
  const cleanName = cleanStr(name)

  return students
    .map(s => {
      const studentSim = calculateSimilarity(cleanName, cleanStr(s.name))
      const parent1Sim = calculateSimilarity(cleanName, cleanStr(s.parentName))
      const parent2Sim = calculateSimilarity(cleanName, cleanStr(s.parent2Name))
      const best = Math.max(studentSim, parent1Sim, parent2Sim)
      let matchedBy = 'student name'
      if (parent1Sim >= studentSim && parent1Sim >= parent2Sim) matchedBy = 'parent name'
      if (parent2Sim > Math.max(studentSim, parent1Sim)) matchedBy = 'parent 2 name'
      return { student: s, similarity: best, matchedBy }
    })
    .filter(r => r.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

/**
 * Attempts to match a transaction to a student record using a tiered strategy:
 * 1. Exact admission number match → HIGH confidence
 * 2. Exact name match against student / parent 1 / parent 2 → MEDIUM
 * 3. All words in the extracted name found in any name field → MEDIUM
 * 4. First + last word both found in any name field → LOW
 * 5. Fuzzy Levenshtein similarity ≥ FUZZY_MATCH_THRESHOLD → LOW
 * 6. No match → UNMATCHED (with up to 3 suggestions)
 *
 * Payments of type multiple_students, kits_activity, unclear, and unknown
 * are never auto-matched — they always return UNMATCHED with suggestions.
 *
 * @param analysis - Description analysis result for the transaction
 * @param students - Student roster for the school
 */
export function matchTransactionToStudent(
  analysis: DescriptionAnalysis,
  students: StudentRecord[],
): MatchResult {
  // Never auto-match these types
  if (
    analysis.type === 'multiple_students' ||
    analysis.type === 'kits_activity' ||
    analysis.type === 'unclear' ||
    analysis.type === 'unknown'
  ) {
    const nameForSuggestions = analysis.extractedNames?.[0] ?? analysis.extractedName ?? ''
    return {
      student: null,
      confidence: 'unmatched',
      matchedBy: 'none',
      suggestedStudents: nameForSuggestions
        ? findSuggestedStudents(nameForSuggestions, students)
        : [],
    }
  }

  // Level 1: Exact admission number
  if (analysis.extractedAdmNo) {
    const cleanAdm = analysis.extractedAdmNo.toUpperCase().replace(/^ADM/i, '')
    const exact = students.find(s => s.admNo.toUpperCase().replace(/^ADM/i, '') === cleanAdm)
    if (exact) return { student: exact, confidence: 'high', matchedBy: 'admission number' }
  }

  // Levels 2–5 require an extracted name
  const name = cleanStr(analysis.extractedName)
  if (!name || name.length < 2) {
    return { student: null, confidence: 'unmatched', matchedBy: 'none', suggestedStudents: [] }
  }

  // Level 2: Exact name match
  for (const s of students) {
    if (
      cleanStr(s.name) === name ||
      cleanStr(s.parentName) === name ||
      cleanStr(s.parent2Name) === name
    ) {
      return { student: s, confidence: 'medium', matchedBy: 'exact name match' }
    }
  }

  // Level 3: All words present in any name field
  const nameWords = name.split(' ').filter(w => w.length > 2)
  if (nameWords.length >= 2) {
    for (const s of students) {
      const target = `${cleanStr(s.name)} ${cleanStr(s.parentName)} ${cleanStr(s.parent2Name)}`
      if (nameWords.every(w => target.includes(w))) {
        return { student: s, confidence: 'medium', matchedBy: 'all name words matched' }
      }
    }

    // Level 4: First + last word both found
    const first = nameWords[0]
    const last = nameWords[nameWords.length - 1]
    for (const s of students) {
      const target = `${cleanStr(s.name)} ${cleanStr(s.parentName)} ${cleanStr(s.parent2Name)}`
      if (target.includes(first) && target.includes(last)) {
        const suggestions = findSuggestedStudents(name, students)
        return {
          student: s,
          confidence: 'low',
          matchedBy: 'first and last name matched',
          suggestedStudents: suggestions,
        }
      }
    }
  }

  // Level 5: Fuzzy similarity
  const suggestions = findSuggestedStudents(name, students)
  const best = suggestions[0]
  if (best && best.similarity >= FUZZY_MATCH_THRESHOLD) {
    return {
      student: best.student,
      confidence: 'low',
      matchedBy: `fuzzy match (${Math.round(best.similarity * 100)}% similarity)`,
      similarityScore: best.similarity,
      suggestedStudents: suggestions,
    }
  }

  return { student: null, confidence: 'unmatched', matchedBy: 'none', suggestedStudents: suggestions }
}

// =============================================================================
// SECTION 7: Bank format detection + table parsing
// =============================================================================

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

function buildEmptyResults() {
  return { highConfidence: 0, mediumConfidence: 0, lowConfidence: 0, multipleStudents: 0, activityPayments: 0, unmatched: 0 }
}

/**
 * Core table-parsing engine. Accepts a 2D array of rows (header included)
 * and returns unmatched ParsedTransactions. Matching is a separate step.
 * Processes rows one at a time — safe for very large statements.
 *
 * @param rows2d     - 2D array of cell values (strings)
 * @param formatHint - Optional override for the format detection label
 */
function parseTable(rows2d: string[][], formatHint?: string): ParseResult {
  const headerRowIdx = findHeaderRow(rows2d)
  const headerRow = (headerRowIdx >= 0 ? rows2d[headerRowIdx] : rows2d[0] ?? []).map(c => String(c ?? ''))
  const effectiveHeaderIdx = headerRowIdx >= 0 ? headerRowIdx : 0
  const formatDetected = formatHint ?? detectBankFormat(headerRow)
  const columns = detectColumns(headerRow)

  if (!columns) {
    return {
      formatDetected: `${formatDetected} (columns not detected)`,
      totalRows: 0, skippedRows: 0, processedRows: 0,
      results: buildEmptyResults(), transactions: [],
    }
  }

  const transactions: ParsedTransaction[] = []
  let skippedRows = 0
  let totalRows = 0

  for (let i = effectiveHeaderIdx + 1; i < rows2d.length; i++) {
    const row = rows2d[i]
    if (!row || row.every(c => !String(c ?? '').trim())) continue

    totalRows++

    const rawDate = String(row[columns.dateCol] ?? '').trim()
    if (!rawDate) { skippedRows++; continue }

    if (!isValidCreditTransaction(row.map(c => String(c ?? '')), columns)) {
      skippedRows++
      continue
    }

    const descText = String(row[columns.descCol] ?? '').trim()
    const narrationText = columns.narrationCol != null ? String(row[columns.narrationCol] ?? '').trim() : ''
    const refText = columns.refCol != null ? String(row[columns.refCol] ?? '').trim() : ''
    const creditAmt = parseAmount(row[columns.creditCol])

    // Combine description + narration for richer pattern matching
    const combinedDesc = [descText, narrationText].filter(Boolean).join(' ').trim()
    const analysis = analyseDescription(combinedDesc, refText)

    // Legacy-compat fields derived from analysis
    const senderName = analysis.extractedName ?? analysis.extractedNames?.[0] ?? ''
    const admissionNumber = analysis.extractedAdmNo ?? ''

    let displayDescription = senderName || descText
    if (analysis.type === 'kits_activity') displayDescription = analysis.activityDescription ?? descText
    if (analysis.type === 'multiple_students') displayDescription = analysis.extractedNames?.join(', ') ?? descText
    if (analysis.type === 'unclear') displayDescription = analysis.extractedName ?? descText

    transactions.push({
      date: rawDate,
      description: displayDescription,
      rawDescription: combinedDesc,
      reference: refText,
      amount: creditAmt,
      senderName,
      admissionNumber,
      confidence: 'unmatched',
      analysis,
      bankRowIndex: i,
    })
  }

  return {
    formatDetected,
    totalRows,
    skippedRows,
    processedRows: transactions.length,
    results: buildEmptyResults(),
    transactions,
  }
}

// =============================================================================
// SECTION 8: Public exports
// =============================================================================

/**
 * Matches a list of parsed transactions against student records.
 * Updates confidence, match fields, suggestedStudents, and notes on each transaction.
 *
 * @param transactions - Parsed transactions from parseTable/parseJsonRows/parseTextStatement
 * @param students     - Student roster for the school
 * @returns Updated transactions with confidence and match fields populated
 */
export function matchTransactions(
  transactions: ParsedTransaction[],
  students: StudentRecord[],
): ParsedTransaction[] {
  return transactions.map(tx => {
    const matchResult = matchTransactionToStudent(tx.analysis, students)

    const suggestedStudents = matchResult.suggestedStudents?.map(s => ({
      studentId: s.student.id,
      studentName: s.student.name,
      similarity: s.similarity,
      matchedBy: s.matchedBy,
    }))

    let notes: string | undefined
    if (tx.analysis.type === 'kits_activity') {
      notes = `Activity payment: ${tx.analysis.activityDescription ?? 'KITS transfer'}`
    } else if (tx.analysis.type === 'multiple_students') {
      notes = `May cover multiple students: ${tx.analysis.extractedNames?.join(', ')}`
    } else if (tx.analysis.type === 'unclear') {
      notes = 'Could not identify individual student'
    } else if (matchResult.confidence === 'low') {
      notes = `Matched by ${matchResult.matchedBy} — please verify`
    }

    return {
      ...tx,
      confidence: matchResult.confidence,
      matchedStudentId: matchResult.student?.id,
      matchedStudentName: matchResult.student?.name,
      suggestedStudentId: matchResult.suggestedStudents?.[0]?.student.id,
      suggestedStudentName: matchResult.suggestedStudents?.[0]?.student.name,
      suggestedStudents,
      notes,
    }
  })
}

/**
 * Parses Excel/CSV rows (objects with header keys) into a ParseResult.
 *
 * @param rows - Array of row objects where keys are the Excel column headers
 */
export function parseJsonRows(rows: Record<string, unknown>[]): ParseResult {
  if (!rows.length) {
    return { formatDetected: 'Empty file', totalRows: 0, skippedRows: 0, processedRows: 0, results: buildEmptyResults(), transactions: [] }
  }
  const keys = Object.keys(rows[0])
  const rows2d: string[][] = [
    keys,
    ...rows.map(r => keys.map(k => String(r[k] ?? ''))),
  ]
  return parseTable(rows2d)
}

/**
 * Parses PDF-extracted text by reconstructing a 2D table from
 * whitespace-aligned columns typical of PDF bank statements.
 *
 * @param text - Raw text extracted from a PDF bank statement
 */
export function parseTextStatement(text: string): ParseResult {
  const rows2d: string[][] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const cells = line.split(/\s{2,}/).map(c => c.trim()).filter(c => c)
    if (cells.length >= 2) rows2d.push(cells)
  }
  const result = parseTable(rows2d, 'Bank Statement (PDF)')
  if (!result.formatDetected.includes('Bank')) result.formatDetected = 'Bank Statement (PDF)'
  return result
}

/**
 * Extracts sender name from a description string.
 * Kept for backward compatibility — new code should use analyseDescription().
 *
 * @param description - Raw transaction description text
 */
export function extractSenderName(description: string): { name: string; reference: string; isActivity: boolean } {
  const analysis = analyseDescription(description, '')
  return {
    name: analysis.extractedName ?? analysis.extractedNames?.[0] ?? '',
    reference: analysis.extractedRef ?? '',
    isActivity: analysis.type === 'kits_activity' || analysis.type === 'unclear',
  }
}

/**
 * Extracts an admission number from a reference or description string.
 * Kept for backward compatibility — new code should use analyseDescription().
 *
 * @param ref  - Customer reference column value
 * @param desc - Description column value
 */
export function extractAdmissionNumber(ref: string, desc: string): string {
  return detectAdmissionNumber(desc, ref)?.extractedAdmNo ?? ''
}

/**
 * Parses a bank statement file buffer and matches each credit transaction to a
 * student in the provided school. Supports Excel (.xlsx/.xls), CSV, and PDF.
 *
 * Handles any Kenyan bank format through column auto-detection and
 * multi-pattern description analysis.
 *
 * @param fileBuffer - Raw file buffer
 * @param fileType   - File extension without dot ('xlsx', 'xls', 'csv', 'pdf')
 * @param students   - Student roster for the school (pre-fetched for performance)
 * @returns ParseResult with matched and unmatched transactions, plus a results summary
 */
export async function parseStatement(
  fileBuffer: Buffer,
  fileType: string,
  students: StudentRecord[],
): Promise<ParseResult> {
  let base: ParseResult

  if (fileType === 'pdf') {
    const pdfModule = await import('pdf-parse')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (pdfModule as any).default ?? pdfModule
    const pdfData = await pdfParse(fileBuffer) as { text: string }
    base = parseTextStatement(pdfData.text)
  } else {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellFormula: false, cellHTML: false })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
    base = parseJsonRows(rows)
  }

  const matched = matchTransactions(base.transactions, students)

  const results = buildEmptyResults()
  for (const tx of matched) {
    if (tx.analysis.type === 'multiple_students') results.multipleStudents++
    else if (tx.analysis.type === 'kits_activity') results.activityPayments++
    else if (tx.confidence === 'high') results.highConfidence++
    else if (tx.confidence === 'medium') results.mediumConfidence++
    else if (tx.confidence === 'low') results.lowConfidence++
    else results.unmatched++
  }

  return { ...base, processedRows: matched.length, results, transactions: matched }
}
