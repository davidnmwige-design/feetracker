'use client'
import { useState, useEffect } from 'react'

const PLAN_OPTIONS = ['Starter', 'Growth', 'Premium', 'Enterprise']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>{label}</label>
      {hint && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 6px' }}>{hint}</p>}
      {children}
    </div>
  )
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    trialDays: 14,
    defaultPlan: 'Starter',
    maintenanceMode: false,
    announcement: '',
    notifyNewSchool: true,
    notifyTrialExpiry: true,
    notifyUpgradeRequest: true,
    notifyAccountDeleted: true,
    companyName: 'Elimu Pay',
    adminName: 'David Njiru',
    companyAddress: '',
    kraPin: '',
    startingInvoiceNumber: 1000,
    invoiceDueDays: 30,
    lateInterestRate: 0,
    emailSignature: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [admins, setAdmins] = useState<any[]>([])
  const [meId, setMeId] = useState<number | null>(null)

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Add admin
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', secretKey: '' })
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [addAdminMsg, setAddAdminMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.ok ? r.json() : null).then(data => { if (data) setSettings(s => ({ ...s, ...data })) })
    fetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(data => { if (data) setMeId(data.id) })
    fetchAdmins()
  }, [])

  async function fetchAdmins() {
    const res = await fetch('/api/admin/admins')
    if (res.ok) setAdmins(await res.json())
  }

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: 'New passwords do not match' }); return }
    if (pwForm.next.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters' }); return }
    setPwSaving(true)
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: pwForm.current, next: pwForm.next }),
    })
    const data = await res.json()
    setPwMsg({ ok: res.ok, text: res.ok ? 'Password changed successfully' : (data.error || 'Failed') })
    if (res.ok) setPwForm({ current: '', next: '', confirm: '' })
    setPwSaving(false)
  }

  async function signOutAll() {
    if (!confirm('Sign out of all devices? You will need to log in again.')) return
    await fetch('/api/sign-out-all', { method: 'POST' })
    window.location.href = '/login'
  }

  async function addAdmin() {
    setAddingAdmin(true)
    setAddAdminMsg('')
    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdmin),
    })
    const data = await res.json()
    setAddAdminMsg(res.ok ? 'Admin added successfully' : (data.error || 'Failed'))
    if (res.ok) { setNewAdmin({ name: '', email: '', password: '', secretKey: '' }); fetchAdmins() }
    setAddingAdmin(false)
  }

  async function removeAdmin(id: number) {
    if (!confirm('Remove this admin?')) return
    await fetch('/api/admin/admins/' + id, { method: 'DELETE' })
    fetchAdmins()
  }

  async function exportAll() {
    window.open('/api/admin/export-all', '_blank')
  }

  async function clearTestData() {
    if (!confirm('This will permanently delete all schools with "test" in their name. Continue?')) return
    const res = await fetch('/api/admin/clear-test-data', { method: 'POST' })
    const data = await res.json()
    alert(res.ok ? `Deleted ${data.deleted} test school(s)` : 'Failed')
  }

  const inputStyle = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const,
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button onClick={() => onChange(!checked)} style={{
        width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        background: checked ? '#0a7c4e' : '#e2e8f0', position: 'relative', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
    )
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Admin Settings</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Platform configuration and admin management</p>
      </div>

      {/* Company details */}
      <Section title="Company Details">
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>These details appear on invoices sent to schools.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Field label="Your name">
            <input value={settings.adminName} onChange={e => setSettings(s => ({ ...s, adminName: e.target.value }))} style={inputStyle} placeholder="David Njiru" />
          </Field>
          <Field label="Company name">
            <input value={settings.companyName} onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))} style={inputStyle} placeholder="Elimu Pay" />
          </Field>
          <Field label="Physical address">
            <input value={settings.companyAddress} onChange={e => setSettings(s => ({ ...s, companyAddress: e.target.value }))} style={inputStyle} placeholder="Nairobi, Kenya" />
          </Field>
          <Field label="KRA PIN">
            <input value={settings.kraPin} onChange={e => setSettings(s => ({ ...s, kraPin: e.target.value }))} style={inputStyle} placeholder="A000000000Z" />
          </Field>
        </div>
        <button onClick={saveSettings} disabled={saving}
          style={{ background: saving ? '#94a3b8' : '#c8a84b', color: saving ? '#fff' : '#0a1f4e', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save company details'}
        </button>
      </Section>

      {/* Invoice settings */}
      <Section title="Invoice Settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Field label="Starting invoice number" hint="e.g. 1000 generates INV-2026-1000">
            <input type="number" value={settings.startingInvoiceNumber} onChange={e => setSettings(s => ({ ...s, startingInvoiceNumber: Number(e.target.value) }))} style={inputStyle} min={1} />
          </Field>
          <Field label="Invoice due days" hint="Days after invoice date until payment due">
            <input type="number" value={settings.invoiceDueDays} onChange={e => setSettings(s => ({ ...s, invoiceDueDays: Number(e.target.value) }))} style={inputStyle} min={1} max={365} />
          </Field>
          <Field label="Late payment interest (%)" hint="Annual rate added to overdue invoices">
            <input type="number" value={settings.lateInterestRate} onChange={e => setSettings(s => ({ ...s, lateInterestRate: Number(e.target.value) }))} style={inputStyle} min={0} max={100} step={0.5} />
          </Field>
        </div>
        <button onClick={saveSettings} disabled={saving}
          style={{ background: saving ? '#94a3b8' : '#c8a84b', color: saving ? '#fff' : '#0a1f4e', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save invoice settings'}
        </button>
      </Section>

      {/* Email signature */}
      <Section title="Admin Email Signature">
        <Field label="Personal signature" hint="Appears at the bottom of admin emails sent to schools">
          <textarea value={settings.emailSignature} onChange={e => setSettings(s => ({ ...s, emailSignature: e.target.value }))}
            placeholder={`David Njiru\nElimupay | +254 700 000 000`}
            rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
        <button onClick={saveSettings} disabled={saving}
          style={{ background: saving ? '#94a3b8' : '#c8a84b', color: saving ? '#fff' : '#0a1f4e', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save signature'}
        </button>
      </Section>

      {/* Account security */}
      <Section title="Account Security">
        <Field label="Change password">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '380px' }}>
            <input type="password" placeholder="Current password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} style={inputStyle} />
            <input type="password" placeholder="New password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} style={inputStyle} />
            <input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
            {pwMsg && <p style={{ fontSize: '12px', color: pwMsg.ok ? '#0a7c4e' : '#e24b4a', margin: 0 }}>{pwMsg.text}</p>}
            <button onClick={changePassword} disabled={pwSaving || !pwForm.current || !pwForm.next}
              style={{ background: '#0a1f4e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content', opacity: (!pwForm.current || !pwForm.next) ? 0.5 : 1 }}>
              {pwSaving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Sign out of all devices</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Invalidates all active sessions</p>
          </div>
          <button onClick={signOutAll} style={{ background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c6c6', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Sign out all
          </button>
        </div>
      </Section>

      {/* Platform settings */}
      <Section title="Platform Settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Field label="Default trial period (days)">
            <input type="number" value={settings.trialDays} onChange={e => setSettings(s => ({ ...s, trialDays: Number(e.target.value) }))} style={inputStyle} min={1} max={90} />
          </Field>
          <Field label="Default plan for new signups">
            <select value={settings.defaultPlan} onChange={e => setSettings(s => ({ ...s, defaultPlan: e.target.value }))} style={inputStyle}>
              {PLAN_OPTIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Maintenance mode</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Shows a maintenance banner to all school users</p>
          </div>
          <Toggle checked={settings.maintenanceMode} onChange={v => setSettings(s => ({ ...s, maintenanceMode: v }))} />
        </div>

        <Field label="Platform announcement" hint="Shown as a banner to all logged-in school users. Leave blank to hide.">
          <textarea
            value={settings.announcement}
            onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))}
            placeholder="e.g. We will be down for maintenance on Sunday 5am–7am."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <button onClick={saveSettings} disabled={saving}
          style={{ background: saving ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save settings'}
        </button>
      </Section>

      {/* Admin accounts */}
      <Section title="Admin Accounts">
        <div style={{ marginBottom: '16px' }}>
          {admins.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{a.name}</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{a.email}</p>
              </div>
              {a.id !== meId && (
                <button onClick={() => removeAdmin(a.id)} style={{ background: '#fcebeb', color: '#a32d2d', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  Remove
                </button>
              )}
              {a.id === meId && <span style={{ fontSize: '11px', color: '#94a3b8' }}>You</span>}
            </div>
          ))}
        </div>
        <details>
          <summary style={{ fontSize: '13px', fontWeight: 600, color: '#0a1f4e', cursor: 'pointer', marginBottom: '12px' }}>+ Add new admin</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '380px', paddingTop: '8px' }}>
            <input placeholder="Name" value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Email" type="email" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
            <input placeholder="Temporary password" type="password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} style={inputStyle} />
            <input placeholder="Admin secret key" type="password" value={newAdmin.secretKey} onChange={e => setNewAdmin(p => ({ ...p, secretKey: e.target.value }))} style={inputStyle} />
            {addAdminMsg && <p style={{ fontSize: '12px', color: addAdminMsg.includes('success') ? '#0a7c4e' : '#e24b4a', margin: 0 }}>{addAdminMsg}</p>}
            <button onClick={addAdmin} disabled={addingAdmin} style={{ background: '#0a1f4e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
              {addingAdmin ? 'Adding…' : 'Add admin'}
            </button>
          </div>
        </details>
      </Section>

      {/* Notification preferences */}
      <Section title="Notification Preferences">
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px' }}>All notifications go to <strong style={{ color: '#0f172a' }}>davidnmwige@gmail.com</strong></p>
        {[
          { key: 'notifyNewSchool',      label: 'New school signs up' },
          { key: 'notifyTrialExpiry',    label: "School's trial expires" },
          { key: 'notifyUpgradeRequest', label: 'School requests a plan upgrade' },
          { key: 'notifyAccountDeleted', label: 'School deletes their account' },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '13px', color: '#0f172a', margin: 0 }}>Email me when: <span style={{ fontWeight: 600 }}>{label}</span></p>
            <Toggle
              checked={(settings as any)[key]}
              onChange={v => { setSettings(s => ({ ...s, [key]: v })); saveSettings() }}
            />
          </div>
        ))}
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={exportAll} style={{ background: '#0a1f4e', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Export all platform data
          </button>
          <button onClick={clearTestData} style={{ background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c6c6', padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Clear test data
          </button>
        </div>
      </Section>
    </div>
  )
}
