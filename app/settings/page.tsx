'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getAnnualTotal, getBillingAmount, getDiscountedAnnual,
  getAnnualSavings, getSetupFee, getPlanName, BILLING_DISCOUNTS,
} from '@/lib/pricing'
import RoleGuard from '@/components/RoleGuard'

const TERMS = [
  'Term 1 2026', 'Term 2 2026', 'Term 3 2026',
  'Term 1 2027', 'Term 2 2027', 'Term 3 2027',
]

export default function Settings() {
  useEffect(() => {
    fetch('/api/auth/check-2fa').then(r => r.json()).then(d => { if (!d.verified) window.location.href = '/verify-2fa' })
  }, [])
  const router = useRouter()
  const [terms, setTerms] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('')

  // School details edit state
  const [editingSchool, setEditingSchool] = useState(false)
  const [editSchool, setEditSchool] = useState({ name: '', paybill: '', accountNumberFormat: '', currentTerm: '', whatsappNumber: '', replyToEmail: '', emailSignature: '' })
  const [schoolSaving, setSchoolSaving] = useState(false)
  const [schoolSaveSuccess, setSchoolSaveSuccess] = useState(false)
  const [schoolSaveError, setSchoolSaveError] = useState('')

  const [acctFmt, setAcctFmt] = useState('')
  const [acctFmtSaving, setAcctFmtSaving] = useState(false)
  const [acctFmtSaved, setAcctFmtSaved] = useState(false)

  const [replyToEmail, setReplyToEmail] = useState('')
  const [emailSignature, setEmailSignature] = useState('')
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false)
  const [emailSettingsSaved, setEmailSettingsSaved] = useState(false)

  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappSaving, setWhatsappSaving] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)

  const [penaltyEnabled, setPenaltyEnabled] = useState(false)
  const [penaltyType, setPenaltyType] = useState('fixed')
  const [penaltyAmount, setPenaltyAmount] = useState(0)
  const [penaltyDueDate, setPenaltyDueDate] = useState(15)
  const [penaltySaving, setPenaltySaving] = useState(false)
  const [penaltySaved, setPenaltySaved] = useState(false)

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [requestedPlan, setRequestedPlan] = useState('')
  const [upgradeNotes, setUpgradeNotes] = useState('')
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [upgradeEmail, setUpgradeEmail] = useState('')

  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('accountant')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState<{
    name: string; email: string; role: string; tempPassword: string | null; emailSent: boolean
  } | null>(null)

  const [exporting, setExporting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFACodeSent, setTwoFACodeSent] = useState(false)
  const [twoFAMaskedEmail, setTwoFAMaskedEmail] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAError, setTwoFAError] = useState('')
  const [twoFASuccess, setTwoFASuccess] = useState('')
  const [twoFADisablePass, setTwoFADisablePass] = useState('')
  const [twoFADisabling, setTwoFADisabling] = useState(false)
  const [showDisableForm, setShowDisableForm] = useState(false)

  // Daraja state
  const [darajaRegistering, setDarajaRegistering] = useState(false)
  const [darajaResult, setDarajaResult] = useState<{ success?: boolean; error?: string; msg?: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Academic year state
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [acYearLoading, setAcYearLoading] = useState(true)
  const [showAcYearForm, setShowAcYearForm] = useState(false)
  const [acYearForm, setAcYearForm] = useState({ year: new Date().getFullYear() + 1, isActive: false, term1Start: '', term1End: '', term2Start: '', term2End: '', term3Start: '', term3End: '' })
  const [acYearSaving, setAcYearSaving] = useState(false)
  const [acYearError, setAcYearError] = useState('')

  // Exam fee state
  const [examFees, setExamFees] = useState<any[]>([])
  const [examFeeLoading, setExamFeeLoading] = useState(true)
  const [showExamFeeForm, setShowExamFeeForm] = useState(false)
  const [examFeeForm, setExamFeeForm] = useState({ name: '', examType: 'KCSE', amount: '', targetClass: '', dueDate: '' })
  const [examFeeSaving, setExamFeeSaving] = useState(false)
  const [examFeeError, setExamFeeError] = useState('')
  const [examFeeAssigning, setExamFeeAssigning] = useState<number | null>(null)

  // Branding state
  const [brandColor, setBrandColor] = useState('#c8a84b')
  const [schoolMotto, setSchoolMotto] = useState('')
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingSaved, setBrandingSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState('')

  // Discount state
  const [discounts, setDiscounts] = useState<any[]>([])
  const [discountsLoading, setDiscountsLoading] = useState(true)
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [discountForm, setDiscountForm] = useState({ name: '', description: '', discountType: 'percentage', discountValue: '', isSiblingDiscount: false })
  const [discountSaving, setDiscountSaving] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [siblingGroups, setSiblingGroups] = useState<any[]>([])
  const [detectingGroups, setDetectingGroups] = useState(false)
  const [applyingSiblingDiscountId, setApplyingSiblingDiscountId] = useState<Record<string, string>>({})
  const [siblingApplyResult, setSiblingApplyResult] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setTeamLoading(true)
    const [schoolRes, termsRes, studentsRes, meRes] = await Promise.all([
      fetch('/api/school'),
      fetch('/api/terms'),
      fetch('/api/students'),
      fetch('/api/account'),
    ])
    fetch('/api/discounts').then(r => r.json()).then(d => { setDiscounts(Array.isArray(d) ? d : []); setDiscountsLoading(false) }).catch(() => setDiscountsLoading(false))
    fetch('/api/academic-years').then(r => r.json()).then(d => { setAcademicYears(Array.isArray(d) ? d : []); setAcYearLoading(false) }).catch(() => setAcYearLoading(false))
    fetch('/api/exam-fees').then(r => r.json()).then(d => { setExamFees(Array.isArray(d) ? d : []); setExamFeeLoading(false) }).catch(() => setExamFeeLoading(false))
    fetch('/api/team').then(r => r.json()).then(d => { setTeamMembers(Array.isArray(d) ? d : []); setTeamLoading(false) })
    const schoolData = await schoolRes.json()
    const termsData = await termsRes.json()
    const studentsData = await studentsRes.json()
    setSchool(schoolData)
    setAcctFmt(schoolData?.accountNumberFormat || '')
    setReplyToEmail(schoolData?.replyToEmail || '')
    setEmailSignature(schoolData?.emailSignature || '')
    setWhatsappNumber(schoolData?.whatsappNumber || '')
    setPenaltyEnabled(schoolData?.penaltyEnabled || false)
    setPenaltyType(schoolData?.penaltyType || 'fixed')
    setPenaltyAmount(schoolData?.penaltyAmount || 0)
    setPenaltyDueDate(schoolData?.penaltyDueDate || 15)
    setBrandColor(schoolData?.brandColor || '#c8a84b')
    setSchoolMotto(schoolData?.schoolMotto || '')
    setLogoUrl(schoolData?.logoUrl || null)
    setTerms(termsData)
    setStudentCount(Array.isArray(studentsData) ? studentsData.length : 0)
    const meData = await meRes.json().catch(() => ({}))
    setTwoFAEnabled(meData?.twoFactorEnabled ?? false)
    setUserEmail(meData?.email || '')
    setLoading(false)
  }

  function startEditSchool() {
    setEditSchool({
      name: school?.name || '',
      paybill: school?.paybill || '',
      accountNumberFormat: school?.accountNumberFormat || '',
      currentTerm: school?.currentTerm || '',
      whatsappNumber: school?.whatsappNumber || '',
      replyToEmail: school?.replyToEmail || '',
      emailSignature: school?.emailSignature || '',
    })
    setSchoolSaveError('')
    setEditingSchool(true)
  }

  async function saveSchoolDetails() {
    if (schoolSaving) return
    setSchoolSaving(true)
    setSchoolSaveError('')
    try {
      const res = await fetch('/api/school', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSchool),
      })
      const data = await res.json()
      if (!res.ok) {
        setSchoolSaveError(data.error || 'Failed to save changes')
      } else {
        setSchool((prev: any) => prev ? { ...prev, ...editSchool } : prev)
        setAcctFmt(editSchool.accountNumberFormat)
        setWhatsappNumber(editSchool.whatsappNumber)
        setReplyToEmail(editSchool.replyToEmail)
        setEmailSignature(editSchool.emailSignature)
        setEditingSchool(false)
        setSchoolSaveSuccess(true)
        setTimeout(() => setSchoolSaveSuccess(false), 4000)
      }
    } catch {
      setSchoolSaveError('Something went wrong. Please try again.')
    }
    setSchoolSaving(false)
  }

  async function saveAcctFmt() {
    setAcctFmtSaving(true)
    setAcctFmtSaved(false)
    try {
      await fetch('/api/school', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumberFormat: acctFmt }),
      })
      setSchool((prev: any) => prev ? { ...prev, accountNumberFormat: acctFmt } : prev)
      setAcctFmtSaved(true)
      setTimeout(() => setAcctFmtSaved(false), 3000)
    } finally {
      setAcctFmtSaving(false)
    }
  }

  async function inviteMember() {
    if (!inviteName.trim() || !inviteEmail.trim() || inviting) return
    setInviting(true); setInviteError(''); setInviteSuccess('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error || 'Failed to invite')
      } else {
        setTeamMembers(prev => [...prev, data])
        setShowInviteForm(false)
        setInviteResult({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          tempPassword: data.tempPassword ?? null,
          emailSent: data.emailSent ?? false,
        })
        setInviteName(''); setInviteEmail(''); setInviteRole('accountant')
      }
    } catch { setInviteError('Something went wrong') }
    setInviting(false)
  }

  async function removeMember(memberId: number) {
    if (!confirm('Remove this team member?')) return
    await fetch('/api/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId }) })
    setTeamMembers(prev => prev.filter(m => m.id !== memberId))
  }

  async function saveWhatsapp() {
    setWhatsappSaving(true); setWhatsappSaved(false)
    try {
      await fetch('/api/school', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsappNumber }) })
      setSchool((prev: any) => prev ? { ...prev, whatsappNumber } : prev)
      setWhatsappSaved(true); setTimeout(() => setWhatsappSaved(false), 3000)
    } finally { setWhatsappSaving(false) }
  }

  async function savePenalty() {
    setPenaltySaving(true); setPenaltySaved(false)
    try {
      await fetch('/api/school', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ penaltyEnabled, penaltyType, penaltyAmount, penaltyDueDate }) })
      setSchool((prev: any) => prev ? { ...prev, penaltyEnabled, penaltyType, penaltyAmount, penaltyDueDate } : prev)
      setPenaltySaved(true); setTimeout(() => setPenaltySaved(false), 3000)
    } finally { setPenaltySaving(false) }
  }

  async function saveEmailSettings() {
    setEmailSettingsSaving(true)
    setEmailSettingsSaved(false)
    try {
      await fetch('/api/school', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyToEmail, emailSignature }),
      })
      setSchool((prev: any) => prev ? { ...prev, replyToEmail, emailSignature } : prev)
      setEmailSettingsSaved(true)
      setTimeout(() => setEmailSettingsSaved(false), 3000)
    } finally {
      setEmailSettingsSaving(false)
    }
  }

  async function startNewTerm() {
    if (!selectedTerm) return
    setStarting(true)
    await fetch('/api/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termName: selectedTerm })
    })
    await fetchData()
    setSelectedTerm('')
    setStarting(false)
  }

  async function submitUpgrade() {
    if (!requestedPlan || upgradeLoading) return
    setUpgradeLoading(true)
    setUpgradeError('')
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedPlan, notes: upgradeNotes })
      })
      const data = await res.json()
      if (!res.ok) {
        setUpgradeError(data.error || 'Something went wrong')
      } else {
        setUpgradeEmail(data.adminEmail || '')
        setUpgradeSuccess(true)
      }
    } catch {
      setUpgradeError('Something went wrong')
    } finally {
      setUpgradeLoading(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) { setExporting(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'elimupay-export.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleSignOutAll() {
    setSigningOut(true)
    try {
      await fetch('/api/sign-out-all', { method: 'POST' })
      await signOut({ callbackUrl: '/login' })
    } finally {
      setSigningOut(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setDeleteError(data.error || 'Something went wrong')
        setDeleting(false)
        return
      }
      await signOut({ redirect: false })
      router.push('/?deleted=1')
    } catch {
      setDeleteError('Something went wrong')
      setDeleting(false)
    }
  }

  function maskEmail(email: string): string {
    if (!email) return ''
    const [local, domain] = email.split('@')
    return local[0] + '***@' + domain
  }

  async function start2FAEmailSetup() {
    setTwoFALoading(true); setTwoFAError(''); setTwoFASuccess('')
    try {
      const res = await fetch('/api/auth/2fa/send-otp', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setTwoFACodeSent(true)
        setTwoFAMaskedEmail(data.maskedEmail || maskEmail(userEmail))
      } else {
        setTwoFAError(data.error || 'Failed to send code. Please try again.')
      }
    } catch { setTwoFAError('Something went wrong') }
    setTwoFALoading(false)
  }

  async function verify2FASetup() {
    if (!twoFACode.trim() || twoFALoading) return
    setTwoFALoading(true); setTwoFAError('')
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAEnabled(true); setTwoFACodeSent(false); setTwoFACode('')
        setTwoFASuccess('Two-Factor Authentication is now enabled. You will receive a code by email each time you sign in.')
        setTimeout(() => setTwoFASuccess(''), 5000)
      } else {
        setTwoFAError(data.error || 'Invalid code')
      }
    } catch { setTwoFAError('Something went wrong') }
    setTwoFALoading(false)
  }

  async function disable2FA() {
    if (!twoFADisablePass.trim() || twoFADisabling) return
    setTwoFADisabling(true); setTwoFAError('')
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: twoFADisablePass }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAEnabled(false); setShowDisableForm(false); setTwoFADisablePass('')
        setTwoFASuccess('2FA has been disabled.')
        setTimeout(() => setTwoFASuccess(''), 4000)
      } else {
        setTwoFAError(data.error || 'Failed to disable 2FA')
      }
    } catch { setTwoFAError('Something went wrong') }
    setTwoFADisabling(false)
  }

  async function saveAcademicYear() {
    if (acYearSaving) return
    setAcYearError('')
    const d = acYearForm
    for (const [label, start, end] of [['Term 1', d.term1Start, d.term1End], ['Term 2', d.term2Start, d.term2End], ['Term 3', d.term3Start, d.term3End]] as const) {
      if (start && end && new Date(start) > new Date(end)) { setAcYearError(`${label} end date must be on or after its start date.`); return }
    }
    const seq = [d.term1Start, d.term1End, d.term2Start, d.term2End, d.term3Start, d.term3End].filter(Boolean)
    for (let i = 1; i < seq.length; i++) {
      if (new Date(seq[i - 1]) > new Date(seq[i])) { setAcYearError('Term dates must be in chronological order.'); return }
    }
    if (d.year < 2020 || d.year > 2035) { setAcYearError('Year must be between 2020 and 2035.'); return }
    setAcYearSaving(true)
    try {
      const res = await fetch('/api/academic-years', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(acYearForm) })
      const d = await res.json()
      if (!res.ok) { setAcYearError(d.error || 'Failed to save') }
      else { setAcademicYears(prev => acYearForm.isActive ? [...prev.map(y => ({...y, isActive: false})), d] : [...prev, d]); setShowAcYearForm(false) }
    } catch { setAcYearError('Something went wrong') }
    setAcYearSaving(false)
  }

  async function activateAcademicYear(id: number) {
    const res = await fetch(`/api/academic-years/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activate: true }) })
    if (res.ok) setAcademicYears(prev => prev.map(y => ({ ...y, isActive: y.id === id })))
  }

  async function deleteAcademicYear(id: number) {
    const res = await fetch(`/api/academic-years/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) { alert(d.error || 'Cannot delete'); return }
    setAcademicYears(prev => prev.filter(y => y.id !== id))
  }

  async function saveExamFee() {
    if (examFeeSaving) return
    setExamFeeError('')
    const amt = Number(examFeeForm.amount)
    if (!examFeeForm.name.trim()) { setExamFeeError('Name is required.'); return }
    if (!(amt > 0) || amt > 10000000) { setExamFeeError('Enter an amount between 1 and 10,000,000.'); return }
    setExamFeeSaving(true)
    try {
      const res = await fetch('/api/exam-fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examFeeForm) })
      const d = await res.json()
      if (!res.ok) { setExamFeeError(d.error || 'Failed to save') }
      else { setExamFees(prev => [...prev, d]); setShowExamFeeForm(false); setExamFeeForm({ name: '', examType: 'KCSE', amount: '', targetClass: '', dueDate: '' }) }
    } catch { setExamFeeError('Something went wrong') }
    setExamFeeSaving(false)
  }

  async function assignExamFeeToClass(id: number) {
    setExamFeeAssigning(id)
    const res = await fetch(`/api/exam-fees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assign: true }) })
    const d = await res.json()
    if (res.ok) alert(`Assigned to ${d.assigned} students`)
    setExamFeeAssigning(null)
  }

  async function deleteExamFee(id: number) {
    if (!confirm('Delete this exam fee? This removes all student assignments.')) return
    const res = await fetch(`/api/exam-fees/${id}`, { method: 'DELETE' })
    if (res.ok) setExamFees(prev => prev.filter(f => f.id !== id))
  }

  async function saveBranding() {
    setBrandingSaving(true); setBrandingSaved(false)
    try {
      await fetch('/api/school', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandColor, schoolMotto }) })
      setSchool((prev: any) => prev ? { ...prev, brandColor, schoolMotto } : prev)
      setBrandingSaved(true); setTimeout(() => setBrandingSaved(false), 3000)
    } finally { setBrandingSaving(false) }
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    if (file.size > 2 * 1024 * 1024) { setLogoError('File must be smaller than 2MB'); return }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { setLogoError('Only JPG, PNG, GIF, or WebP files are allowed'); return }
    setLogoUploading(true)
    try {
      const form = new FormData(); form.append('logo', file)
      const res = await fetch('/api/school/logo', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) { setLogoUrl(data.logoUrl); setSchool((prev: any) => prev ? { ...prev, logoUrl: data.logoUrl } : prev) }
      else setLogoError(data.error || 'Upload failed')
    } catch { setLogoError('Upload failed') }
    setLogoUploading(false)
    e.target.value = ''
  }

  async function removeLogo() {
    setLogoUploading(true)
    await fetch('/api/school/logo', { method: 'DELETE' })
    setLogoUrl(null); setSchool((prev: any) => prev ? { ...prev, logoUrl: null } : prev)
    setLogoUploading(false)
  }

  async function saveDiscount() {
    if (!discountForm.name.trim() || !discountForm.discountValue || discountSaving) return
    setDiscountError('')
    const val = parseFloat(discountForm.discountValue)
    if (discountForm.discountType === 'percentage' && (!(val > 0) || val > 100)) { setDiscountError('Percentage must be between 1 and 100.'); return }
    if (discountForm.discountType === 'fixed' && (!(val > 0) || val > 10000000)) { setDiscountError('Amount must be between 1 and 10,000,000.'); return }
    setDiscountSaving(true)
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...discountForm, discountValue: parseFloat(discountForm.discountValue) }),
      })
      const data = await res.json()
      if (!res.ok) { setDiscountError(data.error || 'Failed to save') }
      else {
        setDiscounts(prev => [...prev, data])
        setShowDiscountForm(false)
        setDiscountForm({ name: '', description: '', discountType: 'percentage', discountValue: '', isSiblingDiscount: false })
      }
    } catch { setDiscountError('Something went wrong') }
    setDiscountSaving(false)
  }

  async function toggleDiscountActive(id: number, active: boolean) {
    const res = await fetch(`/api/discounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
    if (res.ok) setDiscounts(prev => prev.map(d => d.id === id ? { ...d, active: !active } : d))
  }

  async function deleteDiscount(id: number) {
    if (!confirm('Delete this discount? It will be removed from all students.')) return
    const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
    if (res.ok) setDiscounts(prev => prev.filter(d => d.id !== id))
  }

  async function detectSiblingGroups() {
    setDetectingGroups(true); setSiblingGroups([])
    try {
      const res = await fetch('/api/discounts/detect-siblings', { method: 'POST' })
      const data = await res.json()
      setSiblingGroups(data.siblingGroups || [])
    } catch { }
    setDetectingGroups(false)
  }

  async function applySiblingDiscount(parentPhone: string, discountId: string) {
    if (!discountId) return
    const res = await fetch('/api/discounts/apply-sibling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentPhone, discountId: parseInt(discountId) }),
    })
    const data = await res.json()
    if (res.ok) setSiblingApplyResult(prev => ({ ...prev, [parentPhone]: `Discount applied to ${data.applied} student(s).` }))
  }

  async function registerDaraja() {
    setDarajaRegistering(true); setDarajaResult(null)
    try {
      const res = await fetch('/api/daraja/register')
      const data = await res.json()
      if (res.ok) setDarajaResult({ success: true, msg: 'Real-time MPESA notifications are now active.' })
      else setDarajaResult({ error: data.error || 'Registration failed' })
    } catch { setDarajaResult({ error: 'Something went wrong' }) }
    setDarajaRegistering(false)
  }

  function closeUpgradeModal() {
    setShowUpgradeModal(false)
    setRequestedPlan('')
    setUpgradeNotes('')
    setUpgradeError('')
    setUpgradeSuccess(false)
    setUpgradeEmail('')
  }

  async function downloadInvoice() {
    if (!school) return
    const { jsPDF } = await import('jspdf')
    const invPlanName = getPlanName(studentCount)
    const invAnnualTotal = getAnnualTotal(studentCount)
    const invBillingAmt = getBillingAmount(studentCount, selectedCycle)
    const invSetupFee = getSetupFee(studentCount)
    const cycleLabel = selectedCycle === 'monthly' ? 'monthly' : selectedCycle === 'term' ? 'per term' : 'annual'
    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const invoiceNum = 'FT-' + school.id + '-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0')
    const isFirstInvoice = terms.length <= 1

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = 210

    doc.setFillColor(10, 31, 78)
    doc.rect(0, 0, w, 40, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text('Elimu', 20, 18)
    doc.setTextColor(200, 168, 75)
    doc.text('Pay', 20 + doc.getTextWidth('Elimu') + 2, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 190, 210)
    doc.text('Fee management platform for Kenyan schools', 20, 26)
    doc.text('support@elimupay.co.ke', 20, 32)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text('INVOICE', w - 20, 22, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 190, 210)
    doc.text(invoiceNum, w - 20, 30, { align: 'right' })

    const metaY = 54
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Invoice date', 20, metaY)
    doc.text('Due date', 80, metaY)
    doc.text('Plan', 140, metaY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(today.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), 20, metaY + 6)
    doc.text(dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), 80, metaY + 6)
    doc.text(invPlanName, 140, metaY + 6)

    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(20, metaY + 14, w - 20, metaY + 14)

    const billY = metaY + 22
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('BILL TO', 20, billY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(school.name, 20, billY + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Current term: ' + school.currentTerm, 20, billY + 14)
    doc.text('Students enrolled: ' + studentCount, 20, billY + 20)

    const tableY = billY + 34
    doc.setFillColor(248, 249, 252)
    doc.rect(20, tableY, w - 40, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('DESCRIPTION', 24, tableY + 5.5)
    doc.text('AMOUNT', w - 24, tableY + 5.5, { align: 'right' })

    const items: [string, number][] = [
      [invPlanName + ' Plan — ' + cycleLabel + ' subscription (' + studentCount + ' students x KES 200/yr)', invBillingAmt],
    ]
    if (isFirstInvoice) {
      items.push(['One-time platform setup fee', invSetupFee])
    }

    let itemY = tableY + 16
    items.forEach(([desc, amount], i) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text(desc, 24, itemY)
      doc.setFont('helvetica', 'bold')
      doc.text('KES ' + amount.toLocaleString(), w - 24, itemY, { align: 'right' })
      if (i < items.length - 1) {
        doc.setDrawColor(241, 245, 249)
        doc.setLineWidth(0.2)
        doc.line(20, itemY + 5, w - 20, itemY + 5)
      }
      itemY += 14
    })

    const total = items.reduce((s, [, a]) => s + a, 0)
    doc.setFillColor(10, 31, 78)
    doc.rect(20, itemY, w - 40, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(200, 168, 75)
    doc.text('TOTAL DUE', 24, itemY + 8)
    doc.setTextColor(255, 255, 255)
    doc.text('KES ' + total.toLocaleString(), w - 24, itemY + 8, { align: 'right' })

    const instrY = itemY + 24
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 31, 78)
    doc.text('Payment Instructions', 20, instrY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text('Pay via M-Pesa Paybill:', 20, instrY + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text('Paybill: 400200 | Account: ' + invoiceNum, 20, instrY + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Payment due by: ' + dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), 20, instrY + 24)
    doc.text('Questions? Email support@elimupay.co.ke or WhatsApp +254 700 000 000', 20, instrY + 32)

    doc.setFillColor(10, 31, 78)
    doc.rect(0, 275, w, 22, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Elimu Pay · Nairobi, Kenya · support@elimupay.co.ke', w / 2, 284, { align: 'center' })
    doc.text('Thank you for choosing Elimu Pay to manage your school fees.', w / 2, 290, { align: 'center' })

    doc.save('EllimuPay_Invoice_' + invoiceNum + '.pdf')
    return { invoiceNum, invPlanName, total, isFirstInvoice, today, dueDate }
  }

  function sendInvoiceWhatsApp() {
    if (!school) return
    const waPlanName = getPlanName(studentCount)
    const waBillingAmt = getBillingAmount(studentCount, selectedCycle)
    const waSetupFee = getSetupFee(studentCount)
    const waCycleLabel = selectedCycle === 'monthly' ? 'monthly subscription' : selectedCycle === 'term' ? 'per-term subscription' : 'annual subscription'
    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const invoiceNum = 'FT-' + school.id + '-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0')
    const isFirstInvoice = terms.length <= 1
    const total = waBillingAmt + (isFirstInvoice ? waSetupFee : 0)

    const msg = `*Elimu Pay Invoice*\n\nInvoice: ${invoiceNum}\nDate: ${today.toLocaleDateString('en-KE')}\nDue: ${dueDate.toLocaleDateString('en-KE')}\n\nBill to: ${school.name}\nPlan: ${waPlanName} (${studentCount} students x KES 200/yr)\n\n*Breakdown:*\n- ${waCycleLabel}: KES ${waBillingAmt.toLocaleString()}${isFirstInvoice ? `\n- One-time setup fee: KES ${waSetupFee.toLocaleString()}` : ''}\n\n*Total due: KES ${total.toLocaleString()}*\n\n*Pay via M-Pesa:*\nPaybill: 400200\nAccount: ${invoiceNum}\n\nQuestions? Reply to this message or email support@elimupay.co.ke`
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
  }

  const currentPlanName = getPlanName(studentCount)
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'term' | 'annual'>((school?.billingCycle as any) || 'monthly')
  const annualTotal = getAnnualTotal(studentCount)
  const billingAmount = getBillingAmount(studentCount, selectedCycle)
  const discountedAnnual = getDiscountedAnnual(studentCount, selectedCycle)
  const annualSavings = getAnnualSavings(studentCount, selectedCycle)
  const monthlyAmount = getBillingAmount(studentCount, 'monthly')
  const setupFee = getSetupFee(studentCount)
  const [savingCycle, setSavingCycle] = useState(false)
  const [cycleSaved, setCycleSaved] = useState(false)

  async function saveBillingCycle() {
    setSavingCycle(true)
    await fetch('/api/school', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingCycle: selectedCycle }),
    })
    setSavingCycle(false)
    setCycleSaved(true)
    setTimeout(() => setCycleSaved(false), 2000)
  }

  return (
    <RoleGuard requiredPermission="canChangeSettings">
    <main style={{background: 'var(--ep-bg-secondary)', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
      <style>{`
        @media (max-width: 640px) {
          .set-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .set-content { padding: 16px !important; max-width: 100% !important; }
          .set-term-row { flex-direction: column !important; }
          .set-invoice-row { flex-direction: column !important; }
          .set-plan-cards { flex-direction: column !important; }
        }
      `}</style>

      <div className="set-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Settings</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>{school?.name || 'School settings'}</p>
        </div>
        <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
          ← Dashboard
        </Link>
      </div>

      <div className="set-content" style={{padding: '24px 32px', maxWidth: '640px'}}>
        {loading ? (
          <div style={{textAlign: 'center', color: 'var(--ep-text-tertiary)', padding: '48px'}}>Loading...</div>
        ) : (
          <>
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: 0}}>School details</h2>
                {!editingSchool && (
                  <button onClick={startEditSchool}
                    style={{background: '#c8a84b', color: 'var(--ep-text-primary)', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    Edit
                  </button>
                )}
              </div>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>Your school information</p>

              {schoolSaveSuccess && (
                <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '14px'}}>
                  School details updated successfully.
                </div>
              )}

              {!editingSchool ? (
                <div>
                  {[
                    {label: 'School name', value: school?.name},
                    {label: 'MPESA Paybill / Till', value: school?.paybill || '—'},
                    {label: 'Account number format', value: school?.accountNumberFormat || '—'},
                    {label: 'Current term', value: school?.currentTerm},
                    {label: 'WhatsApp number', value: school?.whatsappNumber || '—'},
                    {label: 'Reply-to email', value: school?.replyToEmail || '—'},
                    {label: 'Plan', value: `${currentPlanName} (${studentCount} students)`},
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--ep-border)' : 'none'}}>
                      <span style={{fontSize: '13px', color: 'var(--ep-text-secondary)'}}>{row.label}</span>
                      <span style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)', textAlign: 'right', maxWidth: '60%'}}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  {schoolSaveError && (
                    <div style={{background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '13px', padding: '10px 12px', borderRadius: '6px'}}>
                      {schoolSaveError}
                    </div>
                  )}
                  {([
                    {label: 'School name', key: 'name', type: 'text', placeholder: "e.g. St. Mary's Academy"},
                    {label: 'MPESA Paybill / Till number', key: 'paybill', type: 'text', placeholder: 'e.g. 123456'},
                    {label: 'Account number format', key: 'accountNumberFormat', type: 'text', placeholder: "e.g. Your child's admission number e.g. ADM1234"},
                    {label: 'School WhatsApp number', key: 'whatsappNumber', type: 'tel', placeholder: 'e.g. 0722000000'},
                    {label: 'School email address (reply-to)', key: 'replyToEmail', type: 'email', placeholder: 'e.g. info@stmarys.ac.ke'},
                  ] as {label: string; key: keyof typeof editSchool; type: string; placeholder: string}[]).map(field => (
                    <div key={field.key}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '5px'}}>{field.label}</label>
                      <input
                        type={field.type}
                        value={editSchool[field.key]}
                        onChange={e => setEditSchool(prev => ({...prev, [field.key]: e.target.value}))}
                        placeholder={field.placeholder}
                        style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '5px'}}>Current term</label>
                    <select
                      value={editSchool.currentTerm}
                      onChange={e => setEditSchool(prev => ({...prev, currentTerm: e.target.value}))}
                      style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)', boxSizing: 'border-box' as const}}
                    >
                      {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '5px'}}>Email signature</label>
                    <textarea
                      value={editSchool.emailSignature}
                      onChange={e => setEditSchool(prev => ({...prev, emailSignature: e.target.value}))}
                      placeholder="e.g. Bursary Office | St. Mary's Academy | Tel: 0712 345 678"
                      rows={2}
                      style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const}}
                    />
                  </div>
                  <div style={{display: 'flex', gap: '8px', paddingTop: '4px'}}>
                    <button onClick={saveSchoolDetails} disabled={schoolSaving}
                      style={{background: schoolSaving ? '#94a3b8' : '#c8a84b', color: schoolSaving ? '#fff' : '#0a1f4e', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: schoolSaving ? 'not-allowed' : 'pointer'}}>
                      {schoolSaving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button onClick={() => { setEditingSchool(false); setSchoolSaveError('') }}
                      style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment settings */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Payment settings</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Tell parents how to pay when sending invoices and reminders
              </p>
              <label style={{fontSize: '13px', color: 'var(--ep-text-primary)', fontWeight: 600, display: 'block', marginBottom: '4px'}}>
                Payment Account Number Format
              </label>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '8px'}}>
                e.g. "ADM followed by your admission number" or "Your child's admission number e.g. ADM1234"
              </p>
              <div style={{display: 'flex', gap: '10px'}}>
                <input
                  type="text"
                  value={acctFmt}
                  onChange={e => setAcctFmt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveAcctFmt() }}
                  placeholder="Your child's admission number e.g. ADM1234"
                  style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none'}}
                />
                <button
                  onClick={saveAcctFmt}
                  disabled={acctFmtSaving}
                  style={{
                    background: acctFmtSaved ? '#0a7c3e' : '#c8a84b',
                    color: acctFmtSaved ? '#fff' : '#0a1f4e',
                    padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                    border: 'none', cursor: acctFmtSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const,
                  }}
                >
                  {acctFmtSaved ? 'Saved' : acctFmtSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* WhatsApp number */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>School WhatsApp number</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Your school's WhatsApp number used to send reminders and invoices to parents. Shown to staff on reminder pages.
              </p>
              <div style={{display: 'flex', gap: '10px'}}>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveWhatsapp() }}
                  placeholder="e.g. 0722000000"
                  style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none'}}
                />
                <button
                  onClick={saveWhatsapp}
                  disabled={whatsappSaving}
                  style={{background: whatsappSaved ? '#0a7c3e' : '#c8a84b', color: whatsappSaved ? '#fff' : '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: whatsappSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const}}
                >
                  {whatsappSaved ? 'Saved' : whatsappSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Late payment penalty */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Late payment penalty</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Automatically add a penalty to students who haven't paid by a specified date each month.
              </p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={penaltyEnabled} onChange={e => setPenaltyEnabled(e.target.checked)} style={{accentColor: '#0a1f4e', width: '16px', height: '16px'}} />
                  <span style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)'}}>Enable late payment penalties</span>
                </label>
                {penaltyEnabled && (
                  <>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap' as const}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ep-text-primary)'}}>
                        <input type="radio" name="penaltyType" value="fixed" checked={penaltyType === 'fixed'} onChange={() => setPenaltyType('fixed')} style={{accentColor: '#0a1f4e'}} />
                        Fixed amount (KES)
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ep-text-primary)'}}>
                        <input type="radio" name="penaltyType" value="percentage" checked={penaltyType === 'percentage'} onChange={() => setPenaltyType('percentage')} style={{accentColor: '#0a1f4e'}} />
                        Percentage of balance (%)
                      </label>
                    </div>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap' as const}}>
                      <div style={{flex: 1, minWidth: '140px'}}>
                        <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>
                          {penaltyType === 'fixed' ? 'Penalty amount (KES)' : 'Penalty percentage (%)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={penaltyAmount}
                          onChange={e => setPenaltyAmount(Number(e.target.value))}
                          style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
                        />
                      </div>
                      <div style={{flex: 1, minWidth: '140px'}}>
                        <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>Penalty applies after day</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={penaltyDueDate}
                          onChange={e => setPenaltyDueDate(Number(e.target.value))}
                          placeholder="e.g. 15"
                          style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
                        />
                        <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '4px 0 0'}}>Penalty applies after the {penaltyDueDate}th of each month</p>
                      </div>
                    </div>
                  </>
                )}
                <button
                  onClick={savePenalty}
                  disabled={penaltySaving}
                  style={{background: penaltySaved ? '#0a7c3e' : '#c8a84b', color: penaltySaved ? '#fff' : '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: penaltySaving ? 'not-allowed' : 'pointer', width: 'fit-content'}}
                >
                  {penaltySaved ? 'Saved' : penaltySaving ? 'Saving…' : 'Save penalty settings'}
                </button>
              </div>
            </div>

            {/* Email settings */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Email Settings</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>Control how emails appear to parents</p>
              <div style={{background: 'var(--ep-bg-tertiary)', border: '1px solid #d4ddf0', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--ep-text-secondary)'}}>
                <strong>From:</strong> {school?.name || 'Your school'} via Elimu Pay
                {replyToEmail && <><br /><strong>Reply-To:</strong> {replyToEmail}</>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>School email address (reply-to)</label>
                  <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 6px'}}>Parents will see this as the reply-to address</p>
                  <input
                    type="email"
                    value={replyToEmail}
                    onChange={e => setReplyToEmail(e.target.value)}
                    placeholder="e.g. info@stmarys.ac.ke"
                    style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box'}}
                  />
                </div>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Email signature</label>
                  <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 6px'}}>Appears at the bottom of all emails</p>
                  <textarea
                    value={emailSignature}
                    onChange={e => setEmailSignature(e.target.value)}
                    placeholder="e.g. Bursary Office | St. Mary's Academy | Tel: 0712 345 678"
                    rows={2}
                    style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', width: '100%', outline: 'none', resize: 'vertical', boxSizing: 'border-box'}}
                  />
                </div>
                <button
                  onClick={saveEmailSettings}
                  disabled={emailSettingsSaving}
                  style={{
                    background: emailSettingsSaved ? '#0a7c3e' : '#c8a84b',
                    color: emailSettingsSaved ? '#fff' : '#0a1f4e',
                    padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                    border: 'none', cursor: emailSettingsSaving ? 'not-allowed' : 'pointer', width: 'fit-content',
                  }}
                >
                  {emailSettingsSaved ? 'Saved' : emailSettingsSaving ? 'Saving…' : 'Save email settings'}
                </button>
              </div>
            </div>

            {/* Your Plan */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Subscription</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>KES 200 per student per year</p>

              {/* Pricing breakdown */}
              <div style={{background: 'var(--ep-bg-secondary)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                  <span style={{color: 'var(--ep-text-secondary)'}}>Students enrolled</span>
                  <span style={{fontWeight: 700, color: 'var(--ep-text-primary)'}}>{studentCount}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                  <span style={{color: 'var(--ep-text-secondary)'}}>Annual rate (KES 200 x {studentCount})</span>
                  <span style={{fontWeight: 700, color: 'var(--ep-text-primary)'}}>KES {annualTotal.toLocaleString()}/year</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                  <span style={{color: 'var(--ep-text-secondary)'}}>Plan tier</span>
                  <span style={{fontWeight: 700, color: 'var(--ep-text-primary)'}}>{currentPlanName}</span>
                </div>
                <div style={{borderTop: '1px solid var(--ep-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--ep-text-secondary)'}}>Setup fee (one-time)</span>
                  <span style={{fontWeight: 700, color: 'var(--ep-text-primary)'}}>KES {setupFee.toLocaleString()}</span>
                </div>
              </div>

              {/* Billing cycle selector */}
              <p style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', marginBottom: '10px'}}>Billing cycle</p>
              <div style={{display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap'}}>
                {(['monthly', 'term', 'annual'] as const).map(c => {
                  const amt = getBillingAmount(studentCount, c)
                  const savings = getAnnualSavings(studentCount, c)
                  const suffix = c === 'monthly' ? '/month' : c === 'term' ? '/term' : '/year'
                  return (
                    <button key={c} onClick={() => setSelectedCycle(c)} style={{
                      flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                      border: selectedCycle === c ? '2px solid #0a1f4e' : '1px solid #e2e8f0',
                      background: selectedCycle === c ? '#f0f4ff' : '#fff', cursor: 'pointer',
                    }}>
                      <div style={{fontSize: '12px', fontWeight: 700, color: 'var(--ep-text-primary)', textTransform: 'capitalize'}}>{c === 'term' ? 'Per Term' : c.charAt(0).toUpperCase() + c.slice(1)}</div>
                      <div style={{fontSize: '15px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: '2px 0'}}>KES {amt.toLocaleString()}<span style={{fontSize: '11px', fontWeight: 400, color: 'var(--ep-text-tertiary)'}}>{suffix}</span></div>
                      {savings > 0
                        ? <div style={{fontSize: '10px', color: '#16a34a', fontWeight: 600}}>Save KES {savings.toLocaleString()}/year</div>
                        : <div style={{fontSize: '10px', color: 'var(--ep-text-tertiary)'}}>No discount</div>
                      }
                    </button>
                  )
                })}
              </div>

              {annualSavings > 0 && (
                <p style={{fontSize: '12px', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px'}}>
                  By paying {selectedCycle === 'term' ? 'per term' : 'annually'} you save KES {annualSavings.toLocaleString()} per year vs monthly billing.
                </p>
              )}

              <button
                onClick={saveBillingCycle}
                disabled={savingCycle}
                style={{background: cycleSaved ? '#16a34a' : '#0a1f4e', color: '#fff', padding: '9px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: savingCycle ? 'not-allowed' : 'pointer'}}
              >
                {cycleSaved ? 'Saved' : savingCycle ? 'Saving…' : 'Change billing cycle'}
              </button>
            </div>

            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Start a new term</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                This will archive the current term and start fresh. All students stay in the system but payments reset for the new term.
              </p>
              <div className="set-term-row" style={{display: 'flex', gap: '10px'}}>
                <select
                  style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--ep-text-primary)', background: 'var(--ep-card-bg)', outline: 'none'}}
                  value={selectedTerm}
                  onChange={e => setSelectedTerm(e.target.value)}
                >
                  <option value="">Select new term...</option>
                  {TERMS.filter(t => t !== school?.currentTerm).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={startNewTerm}
                  disabled={!selectedTerm || starting}
                  style={{
                    background: (!selectedTerm || starting) ? '#94a3b8' : '#c8a84b',
                    color: (!selectedTerm || starting) ? '#fff' : '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                    border: 'none', cursor: (!selectedTerm || starting) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {starting ? 'Starting...' : 'Start new term'}
                </button>
              </div>
            </div>

            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Subscription invoice</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Generate your Elimu Pay subscription invoice for {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })}.
                Plan: <strong>{currentPlanName}</strong> — KES {billingAmount.toLocaleString()} {selectedCycle === 'monthly' ? '/month' : selectedCycle === 'term' ? '/term' : '/year'}.
              </p>
              <div className="set-invoice-row" style={{display: 'flex', gap: '10px'}}>
                <button
                  onClick={downloadInvoice}
                  style={{flex: 1, background: '#c8a84b', color: 'var(--ep-text-primary)', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
                >
                  Download Invoice PDF
                </button>
                <button
                  onClick={sendInvoiceWhatsApp}
                  style={{flex: 1, background: '#25D366', color: '#fff', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
                >
                  Send via WhatsApp
                </button>
              </div>
            </div>

            {/* Export data */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Export your data</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Download all your school data — students, payments, and invoices — as an Excel file.
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{background: exporting ? '#94a3b8' : '#0a1f4e', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: exporting ? 'not-allowed' : 'pointer'}}
              >
                {exporting ? 'Exporting...' : 'Export all data (.xlsx)'}
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Two-Factor Authentication</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Two-Factor Authentication adds an extra layer of security. When enabled, you will receive a verification code by email each time you log in.
              </p>
              {twoFASuccess && <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px'}}>{twoFASuccess}</div>}
              {twoFAError && !twoFACodeSent && <div style={{background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px'}}>{twoFAError}</div>}

              {twoFAEnabled ? (
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                    <span style={{background: '#e1f5ee', color: '#166534', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px'}}>Enabled</span>
                    <span style={{fontSize: '13px', color: 'var(--ep-text-primary)', fontWeight: 600}}>Two-Factor Authentication is active</span>
                  </div>
                  <p style={{fontSize: '13px', color: 'var(--ep-text-secondary)', marginBottom: '16px'}}>
                    Verification codes are sent to {maskEmail(userEmail)}
                  </p>
                  {!showDisableForm ? (
                    <button onClick={() => { setShowDisableForm(true); setTwoFAError('') }}
                      style={{background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}}>
                      Disable 2FA
                    </button>
                  ) : (
                    <div>
                      <p style={{fontSize: '12px', color: 'var(--ep-text-secondary)', marginBottom: '8px'}}>Enter your current password to disable 2FA:</p>
                      {twoFAError && <div style={{background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px'}}>{twoFAError}</div>}
                      <div style={{display: 'flex', gap: '8px'}}>
                        <input type="password" value={twoFADisablePass} onChange={e => setTwoFADisablePass(e.target.value)}
                          placeholder="Current password"
                          onKeyDown={e => e.key === 'Enter' && disable2FA()}
                          style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none'}} />
                        <button onClick={disable2FA} disabled={!twoFADisablePass.trim() || twoFADisabling}
                          style={{background: twoFADisabling ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: twoFADisabling ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const}}>
                          {twoFADisabling ? 'Disabling…' : 'Confirm disable'}
                        </button>
                        <button onClick={() => { setShowDisableForm(false); setTwoFADisablePass(''); setTwoFAError('') }}
                          style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !twoFACodeSent ? (
                <div>
                  <p style={{fontSize: '13px', color: 'var(--ep-text-secondary)', marginBottom: '12px'}}>Two-Factor Authentication is not enabled.</p>
                  <button onClick={start2FAEmailSetup} disabled={twoFALoading}
                    style={{background: twoFALoading ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: twoFALoading ? 'not-allowed' : 'pointer'}}>
                    {twoFALoading ? 'Sending code…' : 'Enable 2FA'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{fontSize: '13px', color: 'var(--ep-text-primary)', marginBottom: '12px'}}>
                    We sent a 6-digit code to <strong>{twoFAMaskedEmail}</strong>. Enter it below to enable 2FA.
                  </p>
                  {twoFAError && <div style={{background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px'}}>{twoFAError}</div>}
                  <div style={{display: 'flex', gap: '8px'}}>
                    <input type="text" inputMode="numeric" maxLength={6} value={twoFACode}
                      onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && verify2FASetup()}
                      placeholder="000000" autoFocus
                      style={{flex: 1, border: '2px solid #0a1f4e', borderRadius: '6px', padding: '9px 12px', fontSize: '18px', letterSpacing: '0.4em', textAlign: 'center', outline: 'none'}} />
                    <button onClick={verify2FASetup} disabled={twoFACode.length !== 6 || twoFALoading}
                      style={{background: (twoFACode.length !== 6 || twoFALoading) ? '#94a3b8' : '#c8a84b', color: (twoFACode.length !== 6 || twoFALoading) ? '#fff' : '#0a1f4e', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: (twoFACode.length !== 6 || twoFALoading) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const}}>
                      {twoFALoading ? 'Verifying…' : 'Verify and enable'}
                    </button>
                    <button onClick={() => { setTwoFACodeSent(false); setTwoFACode(''); setTwoFAError('') }}
                      style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '9px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time MPESA Notifications */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Real-time MPESA Notifications</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Receive instant payment notifications via the Safaricom Daraja API. Payments are recorded automatically the moment a parent pays.
              </p>

              {!school?.paybill ? (
                <div style={{background: '#fef9ec', border: '1px solid #f0d878', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: '#92681a'}}>
                  No paybill number configured. Add your MPESA Paybill number to school settings first.
                </div>
              ) : !process.env.NEXT_PUBLIC_DARAJA_ENABLED && typeof window !== 'undefined' ? (
                <div style={{background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '14px', fontSize: '13px', color: 'var(--ep-text-secondary)'}}>
                  Contact Elimu Pay support to enable real-time MPESA notifications. When enabled, payments will be recorded automatically the moment a parent pays.
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--ep-border)'}}>
                    <span style={{fontSize: '13px', color: 'var(--ep-text-secondary)'}}>Paybill number</span>
                    <span style={{fontSize: '13px', fontWeight: 700, color: 'var(--ep-text-primary)'}}>{school?.paybill}</span>
                  </div>

                  {darajaResult?.success ? (
                    <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: '#166534', fontWeight: 600}}>
                      Real-time MPESA notifications are active. Payments will now be recorded automatically.
                    </div>
                  ) : darajaResult?.error ? (
                    <div style={{background: '#fcebeb', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: '#a32d2d'}}>
                      {darajaResult.error}
                    </div>
                  ) : null}

                  <button onClick={registerDaraja} disabled={darajaRegistering}
                    style={{background: darajaRegistering ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: darajaRegistering ? 'not-allowed' : 'pointer', width: 'fit-content'}}>
                    {darajaRegistering ? 'Activating…' : darajaResult?.success ? 'Re-register URLs' : 'Activate real-time notifications'}
                  </button>

                  <div style={{background: 'var(--ep-bg-tertiary)', border: '1px solid #d4ddf0', borderRadius: '6px', padding: '12px 14px', fontSize: '12px', color: 'var(--ep-text-secondary)'}}>
                    <strong>Instructions for parents:</strong> Tell parents to use their child&apos;s admission number as the account number when paying.<br />
                    Example: Paybill <strong>{school?.paybill}</strong>, Account: <strong>ADM1234</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Session security */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Session security</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Sign out of all devices immediately. Any browser or device with an active session will be logged out.
              </p>
              <button
                onClick={handleSignOutAll}
                disabled={signingOut}
                style={{background: signingOut ? '#94a3b8' : '#c8a84b', color: signingOut ? '#fff' : '#0a1f4e', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: signingOut ? 'not-allowed' : 'pointer'}}
              >
                {signingOut ? 'Signing out...' : 'Sign out of all devices'}
              </button>
            </div>

            {/* Academic Year */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px'}}>
                <div>
                  <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Academic Year</h2>
                  <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: '0 0 16px'}}>Track term dates and set the active academic year</p>
                </div>
                {!showAcYearForm && (
                  <button onClick={() => { setShowAcYearForm(true); setAcYearError('') }}
                    style={{background: '#0a1f4e', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0}}>
                    + Add year
                  </button>
                )}
              </div>

              {/* Active year badge */}
              {academicYears.find(y => y.isActive) && (
                <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 14px', marginBottom: '14px', fontSize: '13px', color: '#0a7c3e', fontWeight: 600}}>
                  Active: {academicYears.find(y => y.isActive)?.year}
                </div>
              )}

              {showAcYearForm && (
                <div style={{background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px'}}>
                  <p style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)', marginBottom: '12px'}}>New academic year</p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                      <div style={{flex: 1}}>
                        <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>Year</label>
                        <input type="number" value={acYearForm.year} onChange={e => setAcYearForm(f => ({...f, year: parseInt(e.target.value)}))}
                          style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}} />
                      </div>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', marginTop: '14px'}}>
                        <input type="checkbox" checked={acYearForm.isActive} onChange={e => setAcYearForm(f => ({...f, isActive: e.target.checked}))} style={{accentColor: '#0a1f4e'}} />
                        Set as active
                      </label>
                    </div>
                    {(['term1', 'term2', 'term3'] as const).map(t => (
                      <div key={t} style={{display: 'flex', gap: '10px'}}>
                        <div style={{flex: 1}}>
                          <label style={{fontSize: '12px', color: 'var(--ep-text-secondary)', display: 'block', marginBottom: '4px'}}>{t === 'term1' ? 'Term 1' : t === 'term2' ? 'Term 2' : 'Term 3'} Start</label>
                          <input type="date" value={(acYearForm as any)[t + 'Start']} onChange={e => setAcYearForm(f => ({...f, [t + 'Start']: e.target.value}))}
                            style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}} />
                        </div>
                        <div style={{flex: 1}}>
                          <label style={{fontSize: '12px', color: 'var(--ep-text-secondary)', display: 'block', marginBottom: '4px'}}>End</label>
                          <input type="date" value={(acYearForm as any)[t + 'End']} onChange={e => setAcYearForm(f => ({...f, [t + 'End']: e.target.value}))}
                            style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {acYearError && <p style={{color: '#e24b4a', fontSize: '12px', margin: '8px 0 0'}}>{acYearError}</p>}
                  <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                    <button onClick={saveAcademicYear} disabled={acYearSaving}
                      style={{background: acYearSaving ? '#94a3b8' : '#c8a84b', color: acYearSaving ? '#fff' : '#0a1f4e', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}>
                      {acYearSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setShowAcYearForm(false)}
                      style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {acYearLoading ? <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>Loading...</p> : academicYears.length === 0 ? (
                <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>No academic years configured yet.</p>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {academicYears.map(y => (
                    <div key={y.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '10px 14px', gap: '8px'}}>
                      <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <span style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)'}}>{y.year}</span>
                          {y.isActive && <span style={{fontSize: '10px', background: '#c8a84b', color: 'var(--ep-text-primary)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700}}>Active</span>}
                        </div>
                        {y.term1Start && <p style={{fontSize: '11px', color: 'var(--ep-text-secondary)', margin: '2px 0 0'}}>T1: {new Date(y.term1Start).toLocaleDateString('en-KE', {month:'short',day:'numeric'})} – {y.term1End ? new Date(y.term1End).toLocaleDateString('en-KE', {month:'short',day:'numeric'}) : '?'}</p>}
                      </div>
                      <div style={{display: 'flex', gap: '6px'}}>
                        {!y.isActive && <button onClick={() => activateAcademicYear(y.id)}
                          style={{fontSize: '11px', color: '#0a7c3e', background: 'none', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer'}}>Activate</button>}
                        {!y.isActive && <button onClick={() => deleteAcademicYear(y.id)}
                          style={{fontSize: '11px', color: '#e24b4a', background: 'none', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer'}}>Delete</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Fees */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px'}}>
                <div>
                  <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Exam Fees</h2>
                  <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: '0 0 16px'}}>Track KCSE, KCPE, and mock exam fees separately from regular school fees</p>
                </div>
                {!showExamFeeForm && (
                  <button onClick={() => { setShowExamFeeForm(true); setExamFeeError('') }}
                    style={{background: '#0a1f4e', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0}}>
                    + Add exam fee
                  </button>
                )}
              </div>

              {showExamFeeForm && (
                <div style={{background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px'}}>
                  <p style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)', marginBottom: '12px'}}>New exam fee</p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <input type="text" placeholder="Name (e.g. KCSE Registration 2026)" value={examFeeForm.name} onChange={e => setExamFeeForm(f => ({...f, name: e.target.value}))}
                      style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%'}} />
                    <div style={{display: 'flex', gap: '10px'}}>
                      <select value={examFeeForm.examType} onChange={e => setExamFeeForm(f => ({...f, examType: e.target.value}))}
                        style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', background: 'var(--ep-card-bg)', outline: 'none'}}>
                        <option value="KCSE">KCSE</option>
                        <option value="KCPE">KCPE</option>
                        <option value="Mock Exam">Mock Exam</option>
                        <option value="Cambridge">Cambridge</option>
                        <option value="Other">Other</option>
                      </select>
                      <input type="number" placeholder="Amount (KES)" value={examFeeForm.amount} onChange={e => setExamFeeForm(f => ({...f, amount: e.target.value}))}
                        style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}} />
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <input type="text" placeholder="Target class (e.g. Form 4)" value={examFeeForm.targetClass} onChange={e => setExamFeeForm(f => ({...f, targetClass: e.target.value}))}
                        style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}} />
                      <div style={{flex: 1}}>
                        <label style={{fontSize: '11px', color: 'var(--ep-text-secondary)', display: 'block', marginBottom: '4px'}}>Due date (optional)</label>
                        <input type="date" value={examFeeForm.dueDate} onChange={e => setExamFeeForm(f => ({...f, dueDate: e.target.value}))}
                          style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}} />
                      </div>
                    </div>
                  </div>
                  {examFeeError && <p style={{color: '#e24b4a', fontSize: '12px', margin: '8px 0 0'}}>{examFeeError}</p>}
                  <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                    <button onClick={saveExamFee} disabled={examFeeSaving}
                      style={{background: examFeeSaving ? '#94a3b8' : '#c8a84b', color: examFeeSaving ? '#fff' : '#0a1f4e', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}>
                      {examFeeSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setShowExamFeeForm(false)}
                      style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {examFeeLoading ? <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>Loading...</p> : examFees.length === 0 ? (
                <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>No exam fees configured yet.</p>
              ) : (
                <div style={{border: '1px solid var(--ep-border)', borderRadius: '8px', overflow: 'hidden'}}>
                  {examFees.map((f, i) => (
                    <div key={f.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < examFees.length - 1 ? '1px solid var(--ep-border)' : 'none', gap: '8px'}}>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)'}}>{f.name}</div>
                        <p style={{fontSize: '12px', color: 'var(--ep-text-secondary)', margin: '2px 0 0'}}>
                          {f.examType} · KES {f.amount.toLocaleString()} · {f.targetClass}
                          {f.dueDate ? ` · Due: ${new Date(f.dueDate).toLocaleDateString('en-KE')}` : ''}
                        </p>
                      </div>
                      <div style={{display: 'flex', gap: '6px', flexShrink: 0}}>
                        <button onClick={() => assignExamFeeToClass(f.id)} disabled={examFeeAssigning === f.id}
                          style={{fontSize: '11px', color: 'var(--ep-text-primary)', background: 'none', border: '1px solid #0a1f4e', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                          {examFeeAssigning === f.id ? 'Assigning...' : 'Assign to class'}
                        </button>
                        <button onClick={() => deleteExamFee(f.id)}
                          style={{fontSize: '11px', color: '#e24b4a', background: 'none', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* School Branding */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>School Branding</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '20px'}}>Your logo and brand colour appear on certificates, invoices, and emails</p>

              {/* Logo */}
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '8px'}}>School logo</label>
                {logoUrl ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                    <img src={logoUrl} alt="School logo" style={{maxHeight: '64px', maxWidth: '160px', objectFit: 'contain', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '4px'}} />
                    <button onClick={removeLogo} disabled={logoUploading}
                      style={{fontSize: '12px', color: '#e24b4a', background: 'none', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer'}}>
                      Remove logo
                    </button>
                  </div>
                ) : (
                  <div style={{width: '64px', height: '64px', background: '#0a1f4e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
                    <span style={{color: '#fff', fontSize: '18px', fontWeight: 700}}>{school?.name?.substring(0, 2)?.toUpperCase() || 'EP'}</span>
                  </div>
                )}
                {logoError && <p style={{fontSize: '12px', color: '#e24b4a', margin: '4px 0'}}>{logoError}</p>}
                <label style={{display: 'inline-block', background: logoUploading ? '#94a3b8' : '#0a1f4e', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: logoUploading ? 'not-allowed' : 'pointer'}}>
                  {logoUploading ? 'Uploading...' : 'Upload logo'}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadLogo} style={{display: 'none'}} disabled={logoUploading} />
                </label>
                <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', marginTop: '4px'}}>JPG, PNG, or WebP · Max 2MB</p>
              </div>

              {/* Brand colour */}
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '8px'}}>Brand accent colour</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    style={{width: '44px', height: '36px', padding: '2px', border: '1px solid var(--ep-border)', borderRadius: '6px', cursor: 'pointer', background: 'var(--ep-card-bg)'}}
                  />
                  <span style={{fontSize: '13px', fontFamily: 'monospace', color: 'var(--ep-text-primary)'}}>{brandColor}</span>
                  <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                    <span style={{background: brandColor, color: '#fff', padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 700}}>Button</span>
                    <span style={{background: brandColor, color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700}}>Badge</span>
                  </div>
                  <button onClick={() => setBrandColor('#c8a84b')} style={{fontSize: '11px', color: 'var(--ep-text-secondary)', background: 'none', border: '1px solid var(--ep-border)', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer'}}>
                    Reset to default
                  </button>
                </div>
                <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', marginTop: '4px'}}>This replaces the gold (#c8a84b) accent throughout your school's interface</p>
              </div>

              {/* School motto */}
              <div style={{marginBottom: '20px'}}>
                <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>School motto (optional)</label>
                <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 6px'}}>Appears on fee clearance certificates</p>
                <input
                  type="text"
                  value={schoolMotto}
                  onChange={e => setSchoolMotto(e.target.value.slice(0, 120))}
                  placeholder="e.g. Excellence in Education"
                  maxLength={120}
                  style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box'}}
                />
                <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', marginTop: '2px'}}>{schoolMotto.length}/120</p>
              </div>

              <button
                onClick={saveBranding}
                disabled={brandingSaving}
                style={{background: brandingSaved ? '#0a7c3e' : '#c8a84b', color: brandingSaved ? '#fff' : '#0a1f4e', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: brandingSaving ? 'not-allowed' : 'pointer'}}
              >
                {brandingSaved ? 'Saved' : brandingSaving ? 'Saving...' : 'Save branding'}
              </button>
            </div>

            {/* Student Discounts */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px'}}>
                <div>
                  <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Student Discounts</h2>
                  <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: '0 0 16px'}}>Manage sibling, group, and individual discounts for your school</p>
                </div>
                {!showDiscountForm && (
                  <button onClick={() => { setShowDiscountForm(true); setDiscountError('') }}
                    style={{background: '#0a1f4e', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0}}>
                    + Add discount
                  </button>
                )}
              </div>

              {showDiscountForm && (
                <div style={{background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px'}}>
                  <p style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)', marginBottom: '12px'}}>New discount</p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <input
                      type="text"
                      placeholder="Discount name (e.g. Sibling discount, Staff child)"
                      value={discountForm.name}
                      onChange={e => setDiscountForm(f => ({...f, name: e.target.value}))}
                      style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%'}}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={discountForm.description}
                      onChange={e => setDiscountForm(f => ({...f, description: e.target.value}))}
                      style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%'}}
                    />
                    <div style={{display: 'flex', gap: '10px'}}>
                      <select
                        value={discountForm.discountType}
                        onChange={e => setDiscountForm(f => ({...f, discountType: e.target.value}))}
                        style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', background: 'var(--ep-card-bg)', outline: 'none'}}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed amount (KES)</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder={discountForm.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                        value={discountForm.discountValue}
                        onChange={e => setDiscountForm(f => ({...f, discountValue: e.target.value}))}
                        style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'}}
                      />
                    </div>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ep-text-primary)', cursor: 'pointer'}}>
                      <input type="checkbox" checked={discountForm.isSiblingDiscount} onChange={e => setDiscountForm(f => ({...f, isSiblingDiscount: e.target.checked}))} style={{accentColor: '#0a1f4e'}} />
                      This is a sibling discount
                    </label>
                  </div>
                  {discountError && <p style={{color: '#e24b4a', fontSize: '12px', margin: '8px 0 0'}}>{discountError}</p>}
                  <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                    <button onClick={saveDiscount} disabled={discountSaving || !discountForm.name.trim() || !discountForm.discountValue}
                      style={{background: (discountSaving || !discountForm.name.trim() || !discountForm.discountValue) ? '#94a3b8' : '#c8a84b', color: (discountSaving || !discountForm.name.trim() || !discountForm.discountValue) ? '#fff' : '#0a1f4e', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}>
                      {discountSaving ? 'Saving...' : 'Save discount'}
                    </button>
                    <button onClick={() => { setShowDiscountForm(false); setDiscountError('') }}
                      style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {discountsLoading ? (
                <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>Loading...</p>
              ) : discounts.length === 0 ? (
                <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>No discounts configured yet.</p>
              ) : (
                <div style={{border: '1px solid var(--ep-border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px'}}>
                  {discounts.map((d, i) => (
                    <div key={d.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < discounts.length - 1 ? '1px solid var(--ep-border)' : 'none', gap: '8px'}}>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)'}}>{d.name}</span>
                          {d.isSiblingDiscount && <span style={{fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: 600}}>Sibling</span>}
                          {!d.active && <span style={{fontSize: '10px', background: 'var(--ep-bg-tertiary)', color: 'var(--ep-text-tertiary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600}}>Inactive</span>}
                        </div>
                        <p style={{fontSize: '12px', color: 'var(--ep-text-secondary)', margin: '2px 0 0'}}>
                          {d.discountType === 'percentage' ? `${d.discountValue}% off` : `KES ${d.discountValue.toLocaleString()} off`}
                          {d.description ? ` — ${d.description}` : ''}
                        </p>
                      </div>
                      <div style={{display: 'flex', gap: '6px', flexShrink: 0}}>
                        <button onClick={() => toggleDiscountActive(d.id, d.active)}
                          style={{fontSize: '11px', color: d.active ? '#64748b' : '#0a7c3e', background: 'none', border: '1px solid var(--ep-border)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                          {d.active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => deleteDiscount(d.id)}
                          style={{fontSize: '11px', color: '#e24b4a', background: 'none', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sibling discount detector */}
              <div style={{borderTop: '1px solid var(--ep-border)', paddingTop: '16px', marginTop: '4px'}}>
                <h3 style={{fontSize: '13px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Sibling discount detector</h3>
                <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '10px'}}>Find students who share a parent phone number and apply a sibling discount to the whole group.</p>
                <button onClick={detectSiblingGroups} disabled={detectingGroups}
                  style={{background: detectingGroups ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: detectingGroups ? 'not-allowed' : 'pointer', marginBottom: '12px'}}>
                  {detectingGroups ? 'Detecting...' : 'Detect sibling groups'}
                </button>
                {siblingGroups.length > 0 && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <p style={{fontSize: '12px', color: '#0a7c3e', fontWeight: 600}}>{siblingGroups.length} sibling group(s) found.</p>
                    {siblingGroups.map((group, gi) => (
                      <div key={gi} style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '12px 14px', background: 'var(--ep-bg-secondary)'}}>
                        <p style={{fontSize: '12px', color: 'var(--ep-text-secondary)', marginBottom: '4px'}}>
                          {group.students.length} students share parent phone <strong>{group.parentPhone}</strong>:
                        </p>
                        <p style={{fontSize: '13px', color: 'var(--ep-text-primary)', fontWeight: 600, marginBottom: '8px'}}>
                          {group.students.map((s: any) => s.name).join(', ')}
                        </p>
                        {siblingApplyResult[group.parentPhone] ? (
                          <p style={{fontSize: '12px', color: '#0a7c3e', fontWeight: 600}}>{siblingApplyResult[group.parentPhone]}</p>
                        ) : (
                          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                            <select
                              value={applyingSiblingDiscountId[group.parentPhone] || ''}
                              onChange={e => setApplyingSiblingDiscountId(prev => ({...prev, [group.parentPhone]: e.target.value}))}
                              style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', background: 'var(--ep-card-bg)', outline: 'none'}}
                            >
                              <option value="">Select discount...</option>
                              {discounts.filter(d => d.active).map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name} ({d.discountType === 'percentage' ? `${d.discountValue}%` : `KES ${d.discountValue.toLocaleString()}`})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => applySiblingDiscount(group.parentPhone, applyingSiblingDiscountId[group.parentPhone] || '')}
                              disabled={!applyingSiblingDiscountId[group.parentPhone]}
                              style={{background: applyingSiblingDiscountId[group.parentPhone] ? '#c8a84b' : '#94a3b8', color: applyingSiblingDiscountId[group.parentPhone] ? '#0a1f4e' : '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: applyingSiblingDiscountId[group.parentPhone] ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap'}}>
                              Apply to all
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!detectingGroups && siblingGroups.length === 0 && (
                  <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)'}}>Click the button above to detect sibling groups from parent phone numbers.</p>
                )}
              </div>
            </div>

            {/* Team members */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
                <div>
                  <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Team members</h2>
                  <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: 0}}>Staff with access to this school account</p>
                </div>
                {!showInviteForm && (
                  <button
                    onClick={() => { setShowInviteForm(true); setInviteError(''); setInviteSuccess('') }}
                    style={{background: '#0a1f4e', color: '#fff', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'}}
                  >
                    Invite member
                  </button>
                )}
              </div>

              {inviteSuccess && (
                <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#166534'}}>
                  {inviteSuccess}
                </div>
              )}

              {teamLoading ? (
                <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>Loading…</p>
              ) : (
                <>
                  {teamMembers.length === 0 && !showInviteForm && (
                    <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>No team members yet. Invite a colleague to get started.</p>
                  )}
                  {teamMembers.length > 0 && (
                    <div style={{marginBottom: '16px', border: '1px solid var(--ep-border)', borderRadius: '8px', overflow: 'hidden'}}>
                      {teamMembers.map((m, i) => {
                        const roleStyles: Record<string, { bg: string; color: string; label: string }> = {
                          admin:       { bg: '#c8a84b', color: 'var(--ep-text-primary)', label: 'Admin'       },
                          accountant:  { bg: '#dbeafe', color: '#1e40af', label: 'Accountant'  },
                          principal:   { bg: '#fef3c7', color: '#92400e', label: 'Principal'   },
                          viewer:      { bg: '#f1f5f9', color: 'var(--ep-text-secondary)', label: 'Viewer'      },
                        }
                        const roleDesc: Record<string, string> = {
                          admin:      'Full access — manage students, upload statements, invite team',
                          accountant: 'Can upload statements, send reminders and invoices',
                          principal:  'Can view dashboard, students and reports',
                          viewer:     'Read-only access to the dashboard',
                        }
                        const rs = roleStyles[m.role] || roleStyles.viewer
                        return (
                          <div key={m.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: i < teamMembers.length - 1 ? '1px solid var(--ep-border)' : 'none', gap: '12px'}}>
                            <div style={{flex: 1, minWidth: 0}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px'}}>
                                <span style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)'}}>{m.user?.name}</span>
                                <span style={{background: rs.bg, color: rs.color, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap'}}>{rs.label}</span>
                              </div>
                              <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 2px'}}>{m.user?.email}</p>
                              <p style={{fontSize: '11px', color: 'var(--ep-text-secondary)', margin: 0}}>{roleDesc[m.role] || ''}</p>
                            </div>
                            <button
                              onClick={() => removeMember(m.id)}
                              style={{fontSize: '11px', color: '#e24b4a', background: 'none', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0}}
                            >
                              Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {showInviteForm && (
                    <div style={{border: '1px solid var(--ep-border)', borderRadius: '8px', padding: '16px'}}>
                      <p style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)', marginBottom: '12px'}}>Invite a team member</p>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <input
                          type="text"
                          value={inviteName}
                          onChange={e => setInviteName(e.target.value)}
                          placeholder="Full name"
                          style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box'}}
                        />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="Email address"
                          style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box'}}
                        />
                        <select
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value)}
                          style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)'}}
                        >
                          <option value="admin">Admin — full access</option>
                          <option value="accountant">Accountant — upload + send reminders</option>
                          <option value="principal">Principal — view dashboard + reports</option>
                          <option value="viewer">Viewer — read-only</option>
                        </select>
                        {inviteError && <p style={{fontSize: '12px', color: '#e24b4a', margin: 0}}>{inviteError}</p>}
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button
                            onClick={inviteMember}
                            disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
                            style={{background: (inviting || !inviteName.trim() || !inviteEmail.trim()) ? '#94a3b8' : '#0a1f4e', color: '#fff', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: (inviting || !inviteName.trim() || !inviteEmail.trim()) ? 'not-allowed' : 'pointer'}}
                          >
                            {inviting ? 'Sending…' : 'Send invitation'}
                          </button>
                          <button
                            onClick={() => { setShowInviteForm(false); setInviteError(''); setInviteName(''); setInviteEmail('') }}
                            style={{background: 'var(--ep-bg-secondary)', color: 'var(--ep-text-secondary)', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--ep-border)', cursor: 'pointer'}}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Danger zone */}
            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '2px solid #fecaca', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '4px'}}>Danger zone</h2>
              <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
                Permanently delete your account and all school data. This cannot be undone.
              </p>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
                style={{background: '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
              >
                Delete my account
              </button>
            </div>

            <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '24px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '16px'}}>Term history</h2>
              {terms.length === 0 ? (
                <p style={{fontSize: '13px', color: 'var(--ep-text-tertiary)'}}>No terms created yet.</p>
              ) : (
                terms.map((term, i) => (
                  <div key={term.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < terms.length - 1 ? '1px solid var(--ep-border)' : 'none'}}>
                    <span style={{fontSize: '13px', fontWeight: 600, color: 'var(--ep-text-primary)'}}>{term.name}</span>
                    <span style={{fontSize: '11px', color: 'var(--ep-text-tertiary)'}}>
                      {new Date(term.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Invite result modal — shown once after successful invite */}
      {inviteResult && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
          <div style={{background: 'var(--ep-card-bg)', borderRadius: '12px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <div style={{width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '22px'}}>
                +
              </div>
              <h3 style={{fontSize: '18px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: '0 0 4px'}}>Team member added!</h3>
              <p style={{fontSize: '13px', color: 'var(--ep-text-secondary)', margin: 0}}>{inviteResult.name} has been added as <strong style={{textTransform: 'capitalize'}}>{inviteResult.role}</strong></p>
            </div>

            {inviteResult.emailSent ? (
              <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#166534'}}>
                Invitation email sent to {inviteResult.email}
              </div>
            ) : (
              <div style={{background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#92400e'}}>
                Email could not be sent automatically. Share the login details below manually.
              </div>
            )}

            {inviteResult.tempPassword ? (
              <>
                <p style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', marginBottom: '10px'}}>Share these login details with {inviteResult.name}:</p>
                <div style={{background: 'var(--ep-bg-secondary)', border: '1px solid var(--ep-border)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px'}}>
                    <span style={{color: 'var(--ep-text-secondary)'}}>Email</span>
                    <span style={{fontWeight: 600, color: 'var(--ep-text-primary)'}}>{inviteResult.email}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}>
                    <span style={{color: 'var(--ep-text-secondary)'}}>Temporary password</span>
                    <span style={{fontWeight: 700, color: 'var(--ep-text-primary)', fontFamily: 'monospace', letterSpacing: '1px'}}>{inviteResult.tempPassword}</span>
                  </div>
                  <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '10px 0 0'}}>
                    Sign in at: {process.env.NEXT_PUBLIC_APP_URL || 'https://elimupay.co.ke'}/login
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = `Elimu Pay login details for ${inviteResult.name}:\nEmail: ${inviteResult.email}\nTemporary password: ${inviteResult.tempPassword}\nSign in at: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\n\nPlease change your password immediately after signing in.`
                    navigator.clipboard?.writeText(text).catch(() => {})
                  }}
                  style={{width: '100%', background: '#0a1f4e', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '8px'}}
                >
                  Copy login details
                </button>
              </>
            ) : (
              <p style={{fontSize: '13px', color: 'var(--ep-text-secondary)', marginBottom: '16px'}}>
                {inviteResult.name} already has an Elimu Pay account. They should sign in with their existing password at {typeof window !== 'undefined' ? window.location.origin : ''}/login.
              </p>
            )}

            <button
              onClick={() => setInviteResult(null)}
              style={{width: '100%', background: 'var(--ep-bg-secondary)', color: 'var(--ep-text-secondary)', padding: '10px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--ep-border)', cursor: 'pointer'}}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
          <div style={{background: 'var(--ep-card-bg)', borderRadius: '12px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
            {upgradeSuccess ? (
              <>
                <div style={{textAlign: 'center', padding: '8px 0 16px'}}>
                  <div style={{width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '22px'}}>Done</div>
                  <h3 style={{fontSize: '16px', fontWeight: 700, color: '#0a7c3e', marginBottom: '8px'}}>Request Submitted!</h3>
                  <p style={{fontSize: '13px', color: 'var(--ep-text-secondary)', lineHeight: 1.6}}>
                    {requestedPlan === 'Enterprise'
                      ? 'Our team will contact you within 24 hours to discuss your Enterprise plan and complete the setup.'
                      : <>Your upgrade request has been submitted. We will contact you at <strong>{upgradeEmail}</strong> or via WhatsApp <strong>+254 746 353 411</strong> to complete the upgrade.</>
                    }
                  </p>
                </div>
                <button
                  onClick={closeUpgradeModal}
                  style={{width: '100%', background: '#0a1f4e', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 style={{fontSize: '16px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Request Tier Change</h3>
                <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '12px'}}>Pricing is KES 200 per student per year — your bill adjusts automatically as you add students. Select a tier to move to:</p>

                <div style={{background: 'var(--ep-bg-secondary)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--ep-text-secondary)'}}>
                  <div style={{marginBottom: '4px'}}><strong style={{color: 'var(--ep-text-primary)'}}>Your current tier:</strong> {currentPlanName} ({studentCount} students)</div>
                  <div><strong style={{color: 'var(--ep-text-primary)'}}>Annual subscription:</strong> KES {annualTotal.toLocaleString()}/year</div>
                </div>

                {(['Growth', 'Professional', 'Premium', 'Enterprise'] as const).map(tier => (
                  <div
                    key={tier}
                    onClick={() => setRequestedPlan(tier)}
                    style={{
                      border: requestedPlan === tier ? '2px solid #0a1f4e' : '1px solid #e2e8f0',
                      borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer',
                      background: requestedPlan === tier ? '#f0f4ff' : '#fff'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <p style={{fontSize: '13px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: 0}}>{tier}</p>
                        <p style={{fontSize: '11px', color: 'var(--ep-text-secondary)', margin: '2px 0 0'}}>
                          {tier === 'Growth' ? 'Up to 400 students' : tier === 'Professional' ? 'Up to 700 students' : tier === 'Premium' ? 'Up to 1,000 students' : '1,000+ students'}
                        </p>
                      </div>
                      <div style={{textAlign: 'right', fontSize: '11px', color: 'var(--ep-text-secondary)'}}>KES 200/student/yr</div>
                    </div>
                  </div>
                ))}

                <textarea
                  placeholder="Any notes or questions? (optional)"
                  value={upgradeNotes}
                  onChange={e => setUpgradeNotes(e.target.value)}
                  style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', resize: 'vertical', minHeight: '72px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none'}}
                />

                {upgradeError && (
                  <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '12px'}}>{upgradeError}</p>
                )}

                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={closeUpgradeModal}
                    style={{flex: 1, background: 'var(--ep-bg-tertiary)', color: 'var(--ep-text-secondary)', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'}}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitUpgrade}
                    disabled={!requestedPlan || upgradeLoading}
                    style={{
                      flex: 2, background: (!requestedPlan || upgradeLoading) ? '#94a3b8' : '#0a1f4e',
                      color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                      border: 'none', cursor: (!requestedPlan || upgradeLoading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {upgradeLoading ? 'Submitting...' : 'Request Upgrade'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
          <div style={{background: 'var(--ep-card-bg)', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
            <h3 style={{fontSize: '16px', fontWeight: 700, color: '#dc2626', marginBottom: '12px'}}>Delete account</h3>
            <p style={{fontSize: '13px', color: 'var(--ep-text-secondary)', lineHeight: 1.6, marginBottom: '16px'}}>
              This will permanently delete all your school data including students, payments, and invoices. <strong>This cannot be undone.</strong>
            </p>
            <p style={{fontSize: '13px', color: 'var(--ep-text-primary)', marginBottom: '8px', fontWeight: 600}}>Type DELETE to confirm</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box'}}
            />
            {deleteError && <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '12px'}}>{deleteError}</p>}
            <div style={{display: 'flex', gap: '10px'}}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{flex: 1, background: 'var(--ep-bg-tertiary)', color: 'var(--ep-text-secondary)', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'}}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                style={{
                  flex: 2, background: deleteConfirmText !== 'DELETE' || deleting ? '#94a3b8' : '#dc2626',
                  color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: deleteConfirmText !== 'DELETE' || deleting ? 'not-allowed' : 'pointer'
                }}
              >
                {deleting ? 'Deleting...' : 'Permanently delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </RoleGuard>
  )
}
