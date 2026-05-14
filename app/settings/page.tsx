'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TERMS = [
  'Term 1 2026', 'Term 2 2026', 'Term 3 2026',
  'Term 1 2027', 'Term 2 2027', 'Term 3 2027',
]

const PLAN_DETAILS: Record<string, { name: string; maxStudents: number | null; monthly: number; setup: number }> = {
  Starter: { name: 'Starter', maxStudents: 300, monthly: 4500, setup: 15000 },
  Growth: { name: 'Growth', maxStudents: 600, monthly: 6500, setup: 20000 },
  Premium: { name: 'Premium', maxStudents: 1000, monthly: 9000, setup: 25000 },
  Enterprise: { name: 'Enterprise', maxStudents: null, monthly: 15000, setup: 35000 },
}

const PLAN_UPGRADES: Record<string, Array<{ name: string; maxStudents: number | null; monthly: number }>> = {
  Starter: [
    { name: 'Growth', maxStudents: 600, monthly: 6500 },
    { name: 'Premium', maxStudents: 1000, monthly: 9000 },
  ],
  Growth: [
    { name: 'Premium', maxStudents: 1000, monthly: 9000 },
  ],
  Premium: [
    { name: 'Enterprise', maxStudents: null, monthly: 15000 },
  ],
  Enterprise: [],
}

export default function Settings() {
  const router = useRouter()
  const [terms, setTerms] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('')

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
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('accountant')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

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
    setTerms(termsData)
    setStudentCount(Array.isArray(studentsData) ? studentsData.length : 0)
    const meData = await meRes.json().catch(() => ({}))
    setTwoFAEnabled(meData?.twoFactorEnabled ?? false)
    setUserEmail(meData?.email || '')
    setLoading(false)
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
      const res = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole }) })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error || 'Failed to invite'); } else {
        setTeamMembers(prev => [...prev, data])
        setInviteSuccess('Invitation sent! They will receive an email with login details.')
        setInviteName(''); setInviteEmail('')
        setTimeout(() => setInviteSuccess(''), 5000)
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
      a.download = 'feetracker-export.xlsx'
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
    const planName = school.currentPlan || 'Starter'
    const plan = PLAN_DETAILS[planName] || PLAN_DETAILS['Starter']
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
    doc.setTextColor(200, 168, 75)
    doc.text('FeeTracker', 20, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 190, 210)
    doc.text('Fee management platform for Kenyan schools', 20, 26)
    doc.text('support@feetracker.co.ke', 20, 32)

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
    doc.text(plan.name, 140, metaY + 6)

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

    const maxDesc = plan.maxStudents !== null ? `${plan.maxStudents} students max` : 'unlimited students'
    const items: [string, number][] = [
      [plan.name + ' Plan — monthly subscription (' + maxDesc + ')', plan.monthly],
    ]
    if (isFirstInvoice) {
      items.push(['One-time platform setup fee', plan.setup])
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
    doc.text('Questions? Email support@feetracker.co.ke or WhatsApp +254 700 000 000', 20, instrY + 32)

    doc.setFillColor(10, 31, 78)
    doc.rect(0, 275, w, 22, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('FeeTracker · Nairobi, Kenya · support@feetracker.co.ke', w / 2, 284, { align: 'center' })
    doc.text('Thank you for choosing FeeTracker to manage your school fees.', w / 2, 290, { align: 'center' })

    doc.save('FeeTracker_Invoice_' + invoiceNum + '.pdf')
    return { invoiceNum, plan, total, isFirstInvoice, today, dueDate }
  }

  function sendInvoiceWhatsApp() {
    if (!school) return
    const planName = school.currentPlan || 'Starter'
    const plan = PLAN_DETAILS[planName] || PLAN_DETAILS['Starter']
    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const invoiceNum = 'FT-' + school.id + '-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0')
    const isFirstInvoice = terms.length <= 1
    const total = plan.monthly + (isFirstInvoice ? plan.setup : 0)

    const planCapDesc = plan.maxStudents !== null ? `up to ${plan.maxStudents} students` : 'unlimited students'
    const msg = `*FeeTracker Invoice*\n\nInvoice: ${invoiceNum}\nDate: ${today.toLocaleDateString('en-KE')}\nDue: ${dueDate.toLocaleDateString('en-KE')}\n\nBill to: ${school.name}\nPlan: ${plan.name} (${planCapDesc})\n\n*Breakdown:*\n• ${plan.name} monthly subscription: KES ${plan.monthly.toLocaleString()}${isFirstInvoice ? `\n• One-time setup fee: KES ${plan.setup.toLocaleString()}` : ''}\n\n*Total due: KES ${total.toLocaleString()}*\n\n*Pay via M-Pesa:*\nPaybill: 400200\nAccount: ${invoiceNum}\n\nQuestions? Reply to this message or email support@feetracker.co.ke`
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
  }

  const currentPlan = school?.currentPlan || 'Starter'
  const planDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS['Starter']
  const availableUpgrades = PLAN_UPGRADES[currentPlan] || []
  const remaining = planDetails.maxStudents !== null ? planDetails.maxStudents - studentCount : Infinity
  const progressPct = planDetails.maxStudents !== null ? (studentCount / planDetails.maxStudents) * 100 : 0
  const nearLimit = planDetails.maxStudents !== null && remaining <= 20

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
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
          <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px'}}>Loading...</div>
        ) : (
          <>
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>School details</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>Your school information</p>
              {[
                {label: 'School name', value: school?.name},
                {label: 'MPESA Paybill', value: school?.paybill || '—'},
                {label: 'Current term', value: school?.currentTerm},
                {label: 'Plan', value: currentPlan + ' (' + studentCount + ' / ' + planDetails.maxStudents + ' students)'},
              ].map((row, i, arr) => (
                <div key={row.label} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                  <span style={{fontSize: '13px', color: '#64748b'}}>{row.label}</span>
                  <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Payment settings */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Payment settings</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Tell parents how to pay when sending invoices and reminders
              </p>
              <label style={{fontSize: '13px', color: '#0f172a', fontWeight: 600, display: 'block', marginBottom: '4px'}}>
                Payment Account Number Format
              </label>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '8px'}}>
                e.g. "ADM followed by your admission number" or "Your child's admission number e.g. ADM1234"
              </p>
              <div style={{display: 'flex', gap: '10px'}}>
                <input
                  type="text"
                  value={acctFmt}
                  onChange={e => setAcctFmt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveAcctFmt() }}
                  placeholder="Your child's admission number e.g. ADM1234"
                  style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none'}}
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
                  {acctFmtSaved ? '✓ Saved' : acctFmtSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* WhatsApp number */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>School WhatsApp number</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Your school's WhatsApp number used to send reminders and invoices to parents. Shown to staff on reminder pages.
              </p>
              <div style={{display: 'flex', gap: '10px'}}>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveWhatsapp() }}
                  placeholder="e.g. 0722000000"
                  style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none'}}
                />
                <button
                  onClick={saveWhatsapp}
                  disabled={whatsappSaving}
                  style={{background: whatsappSaved ? '#0a7c3e' : '#c8a84b', color: whatsappSaved ? '#fff' : '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: whatsappSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const}}
                >
                  {whatsappSaved ? '✓ Saved' : whatsappSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Late payment penalty */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Late payment penalty</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Automatically add a penalty to students who haven't paid by a specified date each month.
              </p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={penaltyEnabled} onChange={e => setPenaltyEnabled(e.target.checked)} style={{accentColor: '#0a1f4e', width: '16px', height: '16px'}} />
                  <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>Enable late payment penalties</span>
                </label>
                {penaltyEnabled && (
                  <>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap' as const}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a'}}>
                        <input type="radio" name="penaltyType" value="fixed" checked={penaltyType === 'fixed'} onChange={() => setPenaltyType('fixed')} style={{accentColor: '#0a1f4e'}} />
                        Fixed amount (KES)
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a'}}>
                        <input type="radio" name="penaltyType" value="percentage" checked={penaltyType === 'percentage'} onChange={() => setPenaltyType('percentage')} style={{accentColor: '#0a1f4e'}} />
                        Percentage of balance (%)
                      </label>
                    </div>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap' as const}}>
                      <div style={{flex: 1, minWidth: '140px'}}>
                        <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px'}}>
                          {penaltyType === 'fixed' ? 'Penalty amount (KES)' : 'Penalty percentage (%)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={penaltyAmount}
                          onChange={e => setPenaltyAmount(Number(e.target.value))}
                          style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
                        />
                      </div>
                      <div style={{flex: 1, minWidth: '140px'}}>
                        <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px'}}>Penalty applies after day</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={penaltyDueDate}
                          onChange={e => setPenaltyDueDate(Number(e.target.value))}
                          placeholder="e.g. 15"
                          style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
                        />
                        <p style={{fontSize: '11px', color: '#94a3b8', margin: '4px 0 0'}}>Penalty applies after the {penaltyDueDate}th of each month</p>
                      </div>
                    </div>
                  </>
                )}
                <button
                  onClick={savePenalty}
                  disabled={penaltySaving}
                  style={{background: penaltySaved ? '#0a7c3e' : '#c8a84b', color: penaltySaved ? '#fff' : '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: penaltySaving ? 'not-allowed' : 'pointer', width: 'fit-content'}}
                >
                  {penaltySaved ? '✓ Saved' : penaltySaving ? 'Saving…' : 'Save penalty settings'}
                </button>
              </div>
            </div>

            {/* Email settings */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Email Settings</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>Control how emails appear to parents</p>
              <div style={{background: '#f0f4f9', border: '1px solid #d4ddf0', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#475569'}}>
                <strong>From:</strong> {school?.name || 'Your school'} via FeeTracker
                {replyToEmail && <><br /><strong>Reply-To:</strong> {replyToEmail}</>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>School email address (reply-to)</label>
                  <p style={{fontSize: '11px', color: '#94a3b8', margin: '0 0 6px'}}>Parents will see this as the reply-to address</p>
                  <input
                    type="email"
                    value={replyToEmail}
                    onChange={e => setReplyToEmail(e.target.value)}
                    placeholder="e.g. info@stmarys.ac.ke"
                    style={{border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box'}}
                  />
                </div>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Email signature</label>
                  <p style={{fontSize: '11px', color: '#94a3b8', margin: '0 0 6px'}}>Appears at the bottom of all emails</p>
                  <textarea
                    value={emailSignature}
                    onChange={e => setEmailSignature(e.target.value)}
                    placeholder="e.g. Bursary Office | St. Mary's Academy | Tel: 0712 345 678"
                    rows={2}
                    style={{border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', width: '100%', outline: 'none', resize: 'vertical', boxSizing: 'border-box'}}
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
                  {emailSettingsSaved ? '✓ Saved' : emailSettingsSaving ? 'Saving…' : 'Save email settings'}
                </button>
              </div>
            </div>

            {/* Your Plan */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
                <div>
                  <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Your Plan</h2>
                  <p style={{fontSize: '12px', color: '#94a3b8'}}>Current plan and student usage</p>
                </div>
                {availableUpgrades.length > 0 && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    style={{background: '#c8a84b', color: '#0a1f4e', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'}}
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>

              <div className="set-plan-cards" style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
                <div style={{flex: 1, background: '#f8f9fc', borderRadius: '8px', padding: '14px'}}>
                  <p style={{fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', margin: '0 0 4px'}}>Plan</p>
                  <p style={{fontSize: '17px', fontWeight: 700, color: '#0a1f4e', margin: '0 0 2px'}}>{currentPlan}</p>
                  <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>KES {planDetails.monthly.toLocaleString()}/month</p>
                </div>
                <div style={{flex: 1, background: '#f8f9fc', borderRadius: '8px', padding: '14px'}}>
                  <p style={{fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px'}}>Students</p>
                  <p style={{fontSize: '17px', fontWeight: 700, color: '#0a1f4e', margin: '0 0 2px'}}>
                    {planDetails.maxStudents !== null ? `${studentCount} / ${planDetails.maxStudents}` : `${studentCount}`}
                  </p>
                  <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>{planDetails.maxStudents !== null ? 'enrolled' : 'enrolled (unlimited)'}</p>
                </div>
              </div>

              {planDetails.maxStudents !== null && (
                <>
                  <div style={{marginBottom: nearLimit ? '8px' : '0'}}>
                    <div style={{background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden'}}>
                      <div style={{
                        background: remaining <= 0 ? '#ef4444' : nearLimit ? '#f59e0b' : '#0a1f4e',
                        width: Math.min(progressPct, 100) + '%',
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  {nearLimit && remaining > 0 && (
                    <p style={{fontSize: '12px', color: '#d97706', margin: '8px 0 0'}}>
                      ⚠ Only {remaining} student slot{remaining === 1 ? '' : 's'} remaining. Consider upgrading your plan.
                    </p>
                  )}
                  {remaining <= 0 && (
                    <p style={{fontSize: '12px', color: '#ef4444', margin: '8px 0 0'}}>
                      Student limit reached. Upgrade your plan to add more students.
                    </p>
                  )}
                </>
              )}
            </div>

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Start a new term</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                This will archive the current term and start fresh. All students stay in the system but payments reset for the new term.
              </p>
              <div className="set-term-row" style={{display: 'flex', gap: '10px'}}>
                <select
                  style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none'}}
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

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Subscription invoice</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Generate your FeeTracker subscription invoice for {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })}.
                Plan: <strong>{planDetails.name}</strong> — KES {planDetails.monthly.toLocaleString()}/month.
              </p>
              <div className="set-invoice-row" style={{display: 'flex', gap: '10px'}}>
                <button
                  onClick={downloadInvoice}
                  style={{flex: 1, background: '#c8a84b', color: '#0a1f4e', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
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
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Export your data</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
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
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Two-Factor Authentication</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Two-Factor Authentication adds an extra layer of security. When enabled, you will receive a verification code by email each time you log in.
              </p>
              {twoFASuccess && <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px'}}>{twoFASuccess}</div>}
              {twoFAError && !twoFACodeSent && <div style={{background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px'}}>{twoFAError}</div>}

              {twoFAEnabled ? (
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                    <span style={{background: '#e1f5ee', color: '#166534', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px'}}>✓ Enabled</span>
                    <span style={{fontSize: '13px', color: '#0f172a', fontWeight: 600}}>Two-Factor Authentication is active</span>
                  </div>
                  <p style={{fontSize: '13px', color: '#64748b', marginBottom: '16px'}}>
                    Verification codes are sent to {maskEmail(userEmail)}
                  </p>
                  {!showDisableForm ? (
                    <button onClick={() => { setShowDisableForm(true); setTwoFAError('') }}
                      style={{background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}}>
                      Disable 2FA
                    </button>
                  ) : (
                    <div>
                      <p style={{fontSize: '12px', color: '#64748b', marginBottom: '8px'}}>Enter your current password to disable 2FA:</p>
                      {twoFAError && <div style={{background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px'}}>{twoFAError}</div>}
                      <div style={{display: 'flex', gap: '8px'}}>
                        <input type="password" value={twoFADisablePass} onChange={e => setTwoFADisablePass(e.target.value)}
                          placeholder="Current password"
                          onKeyDown={e => e.key === 'Enter' && disable2FA()}
                          style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none'}} />
                        <button onClick={disable2FA} disabled={!twoFADisablePass.trim() || twoFADisabling}
                          style={{background: twoFADisabling ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: twoFADisabling ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const}}>
                          {twoFADisabling ? 'Disabling…' : 'Confirm disable'}
                        </button>
                        <button onClick={() => { setShowDisableForm(false); setTwoFADisablePass(''); setTwoFAError('') }}
                          style={{background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !twoFACodeSent ? (
                <div>
                  <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Two-Factor Authentication is not enabled.</p>
                  <button onClick={start2FAEmailSetup} disabled={twoFALoading}
                    style={{background: twoFALoading ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: twoFALoading ? 'not-allowed' : 'pointer'}}>
                    {twoFALoading ? 'Sending code…' : 'Enable 2FA'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{fontSize: '13px', color: '#0f172a', marginBottom: '12px'}}>
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
                      style={{background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '9px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time MPESA Notifications */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Real-time MPESA Notifications</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Receive instant payment notifications via the Safaricom Daraja API. Payments are recorded automatically the moment a parent pays.
              </p>

              {!school?.paybill ? (
                <div style={{background: '#fef9ec', border: '1px solid #f0d878', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: '#92681a'}}>
                  No paybill number configured. Add your MPESA Paybill number to school settings first.
                </div>
              ) : !process.env.NEXT_PUBLIC_DARAJA_ENABLED && typeof window !== 'undefined' ? (
                <div style={{background: '#f8f9fc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', fontSize: '13px', color: '#64748b'}}>
                  Contact FeeTracker support to enable real-time MPESA notifications. When enabled, payments will be recorded automatically the moment a parent pays.
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                    <span style={{fontSize: '13px', color: '#64748b'}}>Paybill number</span>
                    <span style={{fontSize: '13px', fontWeight: 700, color: '#0f172a'}}>{school?.paybill}</span>
                  </div>

                  {darajaResult?.success ? (
                    <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px 14px', fontSize: '13px', color: '#166534', fontWeight: 600}}>
                      ✓ Real-time MPESA notifications are active. Payments will now be recorded automatically.
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

                  <div style={{background: '#f0f4f9', border: '1px solid #d4ddf0', borderRadius: '6px', padding: '12px 14px', fontSize: '12px', color: '#475569'}}>
                    <strong>Instructions for parents:</strong> Tell parents to use their child&apos;s admission number as the account number when paying.<br />
                    Example: Paybill <strong>{school?.paybill}</strong>, Account: <strong>ADM1234</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Session security */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Session security</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
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

            {/* Team members */}
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Team members</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Invite staff members to access this school account. Roles: Admin (full), Accountant (upload + reminders), Principal (view only), Viewer (read-only dashboard).
              </p>
              {teamLoading ? <p style={{fontSize: '13px', color: '#94a3b8'}}>Loading…</p> : (
                <>
                  {teamMembers.length > 0 && (
                    <div style={{marginBottom: '16px', border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden'}}>
                      {teamMembers.map((m, i) => (
                        <div key={m.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < teamMembers.length - 1 ? '1px solid #f1f5f9' : 'none', gap: '12px'}}>
                          <div>
                            <p style={{fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0}}>{m.user?.name}</p>
                            <p style={{fontSize: '11px', color: '#94a3b8', margin: '2px 0 0'}}>{m.user?.email} · <strong>{m.role}</strong></p>
                          </div>
                          <button onClick={() => removeMember(m.id)} style={{fontSize: '11px', color: '#e24b4a', background: 'none', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer'}}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '10px'}}>Invite a team member</p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" style={{border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' as const}} />
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" style={{border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' as const}} />
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', background: '#fff'}}>
                      <option value="admin">Admin — full access</option>
                      <option value="accountant">Accountant — upload + send reminders</option>
                      <option value="principal">Principal — view dashboard + reports</option>
                      <option value="viewer">Viewer — read-only</option>
                    </select>
                    {inviteError && <p style={{fontSize: '12px', color: '#e24b4a', margin: 0}}>{inviteError}</p>}
                    {inviteSuccess && <p style={{fontSize: '12px', color: '#0a7c3e', margin: 0}}>{inviteSuccess}</p>}
                    <button onClick={inviteMember} disabled={inviting || !inviteName.trim() || !inviteEmail.trim()} style={{background: inviting ? '#94a3b8' : '#0a1f4e', color: '#fff', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: inviting ? 'not-allowed' : 'pointer', width: 'fit-content'}}>
                      {inviting ? 'Sending invite…' : 'Send invitation'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Danger zone */}
            <div style={{background: '#fff', borderRadius: '8px', border: '2px solid #fecaca', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '4px'}}>Danger zone</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Permanently delete your account and all school data. This cannot be undone.
              </p>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
                style={{background: '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
              >
                Delete my account
              </button>
            </div>

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px'}}>Term history</h2>
              {terms.length === 0 ? (
                <p style={{fontSize: '13px', color: '#94a3b8'}}>No terms created yet.</p>
              ) : (
                terms.map((term, i) => (
                  <div key={term.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < terms.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                    <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{term.name}</span>
                    <span style={{fontSize: '11px', color: '#94a3b8'}}>
                      {new Date(term.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
          <div style={{background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
            {upgradeSuccess ? (
              <>
                <div style={{textAlign: 'center', padding: '8px 0 16px'}}>
                  <div style={{width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '22px'}}>✓</div>
                  <h3 style={{fontSize: '16px', fontWeight: 700, color: '#0a7c3e', marginBottom: '8px'}}>Request Submitted!</h3>
                  <p style={{fontSize: '13px', color: '#64748b', lineHeight: 1.6}}>
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
                <h3 style={{fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Upgrade Your Plan</h3>
                <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '20px'}}>Select a plan to upgrade to</p>

                {availableUpgrades.map(plan => (
                  <div
                    key={plan.name}
                    onClick={() => setRequestedPlan(plan.name)}
                    style={{
                      border: requestedPlan === plan.name ? '2px solid #0a1f4e' : '1px solid #e2e8f0',
                      borderRadius: '8px', padding: '14px 16px', marginBottom: '10px', cursor: 'pointer',
                      background: requestedPlan === plan.name ? '#f0f4ff' : '#fff'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <p style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0}}>{plan.name}</p>
                        <p style={{fontSize: '12px', color: '#64748b', margin: '2px 0 0'}}>
                    {plan.maxStudents !== null ? `Up to ${plan.maxStudents} students` : '1,000+ students (unlimited)'}
                  </p>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <p style={{fontSize: '14px', fontWeight: 700, color: '#0a1f4e', margin: 0}}>KES {plan.monthly.toLocaleString()}</p>
                        <p style={{fontSize: '11px', color: '#94a3b8', margin: '2px 0 0'}}>per month</p>
                      </div>
                    </div>
                  </div>
                ))}

                <textarea
                  placeholder="Any notes or questions? (optional)"
                  value={upgradeNotes}
                  onChange={e => setUpgradeNotes(e.target.value)}
                  style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', resize: 'vertical', minHeight: '72px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none'}}
                />

                {upgradeError && (
                  <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '12px'}}>{upgradeError}</p>
                )}

                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={closeUpgradeModal}
                    style={{flex: 1, background: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'}}
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
          <div style={{background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
            <h3 style={{fontSize: '16px', fontWeight: 700, color: '#dc2626', marginBottom: '12px'}}>Delete account</h3>
            <p style={{fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '16px'}}>
              This will permanently delete all your school data including students, payments, and invoices. <strong>This cannot be undone.</strong>
            </p>
            <p style={{fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: 600}}>Type DELETE to confirm</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box'}}
            />
            {deleteError && <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '12px'}}>{deleteError}</p>}
            <div style={{display: 'flex', gap: '10px'}}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{flex: 1, background: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'}}
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
    </div>
  )
}
