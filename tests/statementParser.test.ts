import { describe, it, expect } from 'vitest'
import {
  extractSenderName,
  extractAdmissionNumber,
  parseTable,
  matchTransactions,
  type ParsedTransaction,
  type StudentRecord,
} from '../lib/statementParser'

describe('extractSenderName', () => {
  it('parses the Absa semicolon format', () => {
    const r = extractSenderName('4131707;Jason Nkuranga;TEC7EHP6JV')
    expect(r.name).toBe('Jason Nkuranga')
    expect(r.reference).toBe('TEC7EHP6JV')
  })

  it('parses "From: Name Ref: X"', () => {
    const r = extractSenderName('From: John Kamau Ref: ABC123')
    expect(r.name).toBe('John Kamau')
    expect(r.reference).toBe('ABC123')
  })

  it('parses the slash-separated format', () => {
    const r = extractSenderName('JOHN KAMAU/ADM1234/FEES')
    expect(r.name).toBe('JOHN KAMAU')
    expect(r.reference).toBe('ADM1234')
  })

  it('parses a trailing transaction reference', () => {
    const r = extractSenderName('JANE WANJIKU TEC7EHP6JV')
    expect(r.name).toBe('JANE WANJIKU')
    expect(r.reference).toBe('TEC7EHP6JV')
  })

  it('flags non-name activity lines instead of inventing a sender', () => {
    const r = extractSenderName('AIRTIME PURCHASE 100')
    expect(r.isActivity).toBe(true)
    expect(r.name).toBe('')
  })
})

describe('extractAdmissionNumber', () => {
  it('extracts an ADM-prefixed number', () => {
    expect(extractAdmissionNumber('ADM 1234', '')).toBe('ADM1234')
  })

  it('extracts a bare numeric reference', () => {
    expect(extractAdmissionNumber('0234', '')).toBe('0234')
  })

  it('returns empty when no admission number is present', () => {
    expect(extractAdmissionNumber('', 'random narration')).toBe('')
  })
})

describe('parseTable', () => {
  it('keeps credits and skips balance/debit rows', () => {
    const rows = [
      ['Receipt No', 'Completion Time', 'Details', 'Paid In', 'Withdrawn', 'Balance'],
      ['TEC1', '2026-01-01', 'JANE WANJIKU ADM100', '5000', '', '5000'],
      ['TEC2', '2026-01-02', 'Opening Balance', '', '', '5000'],
      ['TEC3', '2026-01-03', 'AIRTIME', '', '100', '4900'],
    ]
    const r = parseTable(rows)
    expect(r.formatDetected).toBe('MPESA Statement')
    expect(r.processedRows).toBe(1)
    expect(r.transactions[0].amount).toBe(5000)
    expect(r.transactions[0].admissionNumber).toBe('ADM100')
  })
})

describe('matchTransactions', () => {
  const students: StudentRecord[] = [
    { id: 1, name: 'Mary Wanjiku', admNo: 'ADM100', parentName: 'Jane Wanjiku', parent2Name: null, parentPhone: '0722000000' },
    { id: 2, name: 'Peter Otieno', admNo: 'ADM200', parentName: 'Paul Otieno', parent2Name: null, parentPhone: null },
  ]
  const tx = (p: Partial<ParsedTransaction>): ParsedTransaction => ({
    date: '', description: '', rawDescription: '', reference: '', amount: 1000,
    senderName: '', admissionNumber: '', confidence: 'unmatched', bankRowIndex: 0, ...p,
  })

  it('matches an exact admission number with high confidence', () => {
    const [m] = matchTransactions([tx({ admissionNumber: 'ADM100' })], students)
    expect(m.confidence).toBe('high')
    expect(m.matchedStudentId).toBe(1)
  })

  it('matches an exact parent name with medium confidence', () => {
    const [m] = matchTransactions([tx({ senderName: 'Jane Wanjiku' })], students)
    expect(m.confidence).toBe('medium')
    expect(m.matchedStudentId).toBe(1)
  })

  it('does NOT mis-assign a payment with an unknown admission number', () => {
    const [m] = matchTransactions([tx({ admissionNumber: 'ADM999' })], students)
    expect(m.confidence).toBe('unmatched')
    expect(m.matchedStudentId).toBeUndefined()
  })

  it('only suggests (low confidence) on a first+last name partial match', () => {
    const [m] = matchTransactions([tx({ senderName: 'Jane Akinyi Wanjiku' })], students)
    expect(m.confidence).toBe('low')
    expect(m.suggestedStudentId).toBe(1)
    expect(m.matchedStudentId).toBeUndefined()
  })
})
