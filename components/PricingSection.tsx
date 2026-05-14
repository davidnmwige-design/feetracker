'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  getAnnualTotal, getBillingAmount, getDiscountedAnnual,
  getAnnualSavings, getSetupFee, BILLING_DISCOUNTS,
} from '@/lib/pricing'

type Cycle = 'monthly' | 'term' | 'annual'

const EXAMPLE_PLANS = [
  { name: 'Starter',      students: 150, range: 'Up to 200 students',   featured: false },
  { name: 'Growth',       students: 300, range: '201–400 students',      featured: true  },
  { name: 'Professional', students: 550, range: '401–700 students',      featured: false },
]

const CYCLE_LABELS: Record<Cycle, string> = {
  monthly: 'Monthly',
  term:    'Per Term',
  annual:  'Annual',
}

const CYCLE_SUFFIX: Record<Cycle, string> = {
  monthly: '/month',
  term:    '/term',
  annual:  '/year',
}

export default function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>('monthly')

  return (
    <div className="land-section" style={{ padding: '48px 32px', background: '#0a1f4e' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px' }}>Pricing</div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px', fontFamily: 'Georgia, serif' }}>Simple, honest pricing</h2>
        <p style={{ fontSize: '12px', color: '#94a3c8', marginBottom: '20px' }}>KES 200 per student per year. Pay monthly, per term, or annually.</p>

        {/* Billing cycle toggle */}
        <div style={{ display: 'inline-flex', background: '#0d2660', borderRadius: '8px', padding: '3px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['monthly', 'term', 'annual'] as Cycle[]).map(c => (
            <button key={c} onClick={() => setCycle(c)} style={{
              padding: '7px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              background: cycle === c ? '#c8a84b' : 'transparent',
              color: cycle === c ? '#0a1f4e' : '#94a3c8',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {CYCLE_LABELS[c]}
              {c === 'term'   && <span style={{ marginLeft: '4px', fontSize: '10px' }}>−2.5%</span>}
              {c === 'annual' && <span style={{ marginLeft: '4px', fontSize: '10px' }}>−5%</span>}
            </button>
          ))}
        </div>

        <div className="land-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {EXAMPLE_PLANS.map(plan => {
            const amount   = getBillingAmount(plan.students, cycle)
            const savings  = getAnnualSavings(plan.students, cycle)
            const setupFee = getSetupFee(plan.students)
            const isFeatured = plan.featured

            return (
              <div key={plan.name} style={{
                background: isFeatured ? '#fff' : '#0d2660',
                border: isFeatured ? '2px solid #c8a84b' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '22px', position: 'relative',
              }}>
                {isFeatured && (
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#c8a84b', color: '#0a1f4e', fontSize: '10px', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Most popular
                  </div>
                )}

                <div style={{ fontSize: '14px', fontWeight: 700, color: isFeatured ? '#0a1f4e' : '#fff', marginBottom: '2px' }}>{plan.name}</div>
                <div style={{ fontSize: '11px', color: isFeatured ? '#64748b' : '#94a3c8', marginBottom: '14px' }}>{plan.range}</div>

                <div style={{ fontSize: '22px', fontWeight: 700, color: isFeatured ? '#0a1f4e' : '#c8a84b' }}>KES {amount.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: isFeatured ? '#64748b' : '#94a3c8' }}>{CYCLE_SUFFIX[cycle]}</div>
                <div style={{ fontSize: '10px', color: isFeatured ? '#94a3b8' : 'rgba(148,163,200,0.7)', margin: '4px 0 2px' }}>
                  KES 200 × {plan.students} students/year
                </div>

                {savings > 0 ? (
                  <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '2px 7px', borderRadius: '4px', display: 'inline-block', marginBottom: '14px' }}>
                    Save KES {savings.toLocaleString()}/year
                  </div>
                ) : (
                  <div style={{ height: '14px', marginBottom: '14px' }} />
                )}

                <div style={{ fontSize: '11px', color: isFeatured ? '#94a3b8' : 'rgba(148,163,200,0.6)', marginBottom: '14px' }}>
                  + KES {setupFee.toLocaleString()} setup fee (once)
                </div>

                <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '9px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, background: isFeatured ? '#0a1f4e' : '#c8a84b', color: isFeatured ? '#fff' : '#0a1f4e', textDecoration: 'none' }}>
                  Get started
                </Link>
                <div style={{ fontSize: '10px', color: isFeatured ? '#94a3b8' : 'rgba(148,163,200,0.7)', textAlign: 'center', marginTop: '8px' }}>30-day free trial included</div>
              </div>
            )
          })}

          {/* Enterprise card */}
          <div style={{ background: '#0a1f4e', border: '2px solid rgba(200,168,75,0.5)', borderRadius: '8px', padding: '22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#c8a84b', color: '#0a1f4e', fontSize: '10px', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Top tier
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#c8a84b', marginBottom: '2px' }}>Enterprise</div>
            <div style={{ fontSize: '11px', color: 'rgba(200,168,75,0.7)', marginBottom: '14px' }}>1,000+ students</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#c8a84b', marginBottom: '4px' }}>Contact us</div>
            <div style={{ fontSize: '11px', color: 'rgba(200,168,75,0.7)', marginBottom: '4px' }}>for custom pricing</div>
            <div style={{ fontSize: '10px', color: 'rgba(200,168,75,0.5)', marginBottom: '14px' }}>+ KES 100,000 setup fee</div>
            <div style={{ fontSize: '11px', color: '#94a3c8', marginBottom: '14px' }}>Priority support + dedicated onboarding</div>
            <a href="https://wa.me/254746353411?text=Hi%2C%20I%27d%20like%20to%20discuss%20Enterprise%20pricing%20for%20my%20school." target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', padding: '9px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, background: '#c8a84b', color: '#0a1f4e', textDecoration: 'none' }}>
              WhatsApp us
            </a>
            <div style={{ fontSize: '10px', color: 'rgba(148,163,200,0.6)', textAlign: 'center', marginTop: '8px' }}>30-day free trial included</div>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: '11px', color: 'rgba(148,163,200,0.7)', marginTop: '16px', textAlign: 'center' }}>
          Price is KES 200 per student per year. Discounts apply to the total bill, not the per-student rate. Minimum annual subscription KES 20,000.
        </p>
      </div>
    </div>
  )
}
