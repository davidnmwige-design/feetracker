import Link from 'next/link'
import type { Metadata } from 'next'
import PricingSection from '@/components/PricingSection'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker.co.ke'

export const metadata: Metadata = {
  title: 'Elimu Pay - School Fee Management',
  description: 'Elimu Pay - Smart school fee management. Automate fee collection, match payments automatically, and notify parents in real time.',
  openGraph: {
    title: 'Elimu Pay - School Fee Management',
    description: 'Elimu Pay - Smart school fee management. Automate fee collection, match payments automatically, and notify parents in real time.',
    url: APP_URL,
    siteName: 'Elimu Pay',
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: 'Elimu Pay' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elimu Pay - School Fee Management',
    description: 'Elimu Pay - Smart school fee management. Automate fee collection, match payments automatically, and notify parents in real time.',
    images: [`${APP_URL}/og-image.png`],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Elimu Pay',
  description: 'Smart fee management for schools',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '200',
    priceCurrency: 'KES',
    description: 'KES 200 per student per year',
  },
  provider: {
    '@type': 'Organization',
    name: 'Elimu Pay',
    email: 'support@elimupay.co.ke',
    url: APP_URL,
  },
}

export default function Home() {
  return (
    <main style={{fontFamily: 'Arial, sans-serif', background: '#fff', color: '#0f172a', overflowX: 'hidden'}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        @media (max-width: 768px) {
          .land-nav { flex-wrap: wrap !important; gap: 12px !important; padding: 12px 16px !important; }
          .land-hero { padding: 40px 16px !important; }
          .land-hero h1 { font-size: 26px !important; }
          .land-stats { grid-template-columns: 1fr !important; }
          .land-section { padding: 32px 16px !important; }
          .land-grid-3 { grid-template-columns: 1fr !important; }
          .land-grid-2 { grid-template-columns: 1fr !important; }
          .land-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .land-cta { padding: 40px 16px !important; }
          .land-cta h2 { font-size: 22px !important; }
          .land-footer { padding: 16px !important; }
        }
        @media (max-width: 480px) {
          .land-grid-4 { grid-template-columns: 1fr !important; }
          .land-hero h1 { font-size: 22px !important; }
        }
      `}</style>

      <nav className="land-nav" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #e2e8f0'}}>
        <span style={{fontSize: '18px', fontWeight: 700, fontFamily: 'Georgia, serif'}}>
          <span style={{color: '#0a1f4e'}}>Elimu</span><span style={{color: '#c8a84b'}}> Pay</span>
        </span>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <Link href="/demo" style={{color: '#0a1f4e', fontSize: '13px', fontWeight: 600, textDecoration: 'none', padding: '8px 14px', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
            Demo
          </Link>
          <Link href="/signup" style={{background: '#0a1f4e', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none'}}>
            Get started free
          </Link>
        </div>
      </nav>

      <div className="land-hero" style={{background: '#0a1f4e', color: '#fff', padding: '56px 32px', textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: 'rgba(200,168,75,0.15)', color: '#c8a84b', border: '1px solid rgba(200,168,75,0.3)', fontSize: '10px', padding: '5px 14px', borderRadius: '4px', marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase' as const}}>
          Smart fee management for schools
        </div>
        <h1 style={{fontSize: '36px', fontWeight: 700, lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-1px', fontFamily: 'Georgia, serif', color: '#fff', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto'}}>
          Stop chasing fee payments.
        </h1>
        <p style={{fontSize: '15px', color: '#94a3c8', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.7}}>
          Elimu Pay matches every payment to the right student automatically. Parents get notified instantly. Your bursar saves hours every term.
        </p>
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' as const}}>
          <Link href="/signup" style={{background: '#c8a84b', color: '#0a1f4e', padding: '12px 28px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none'}}>
            Set up your school free
          </Link>
          <Link href="/demo" style={{background: 'rgba(200,168,75,0.15)', color: '#c8a84b', padding: '12px 28px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: '1px solid rgba(200,168,75,0.4)', textDecoration: 'none'}}>
            View demo →
          </Link>
          <Link href="/login" style={{background: 'transparent', color: '#fff', padding: '12px 28px', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none'}}>
            Sign in
          </Link>
        </div>
      </div>

      <div className="land-stats" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#0d2660', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
        {[['80hrs', 'Saved per term'], ['100%', 'Payment visibility'], ['5min', 'Setup time']].map(([num, label]) => (
          <div key={label} style={{padding: '20px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize: '26px', fontWeight: 700, color: '#c8a84b', marginBottom: '4px'}}>{num}</div>
            <div style={{fontSize: '11px', color: '#94a3c8', letterSpacing: '0.5px'}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="land-section" style={{padding: '48px 32px', background: '#f8f9fc'}}>
        <div style={{maxWidth: '860px', margin: '0 auto'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px'}}>The problem</div>
          <h2 style={{fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '28px', fontFamily: 'Georgia, serif'}}>Does this sound familiar?</h2>
          <div className="land-grid-3" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
            {[
              ['Parents calling all day', 'Your bursar spends hours answering "Did you receive my payment?" instead of doing real work.'],
              ['Manual MPESA checking', 'Scrolling through hundreds of MPESA messages and updating Excel sheets by hand every single day.'],
              ['No real-time visibility', 'The principal has no idea how much has been collected until the bursar prepares a report manually.'],
            ].map(([title, desc]) => (
              <div key={title} style={{background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0'}}>
                <div style={{width: '36px', height: '36px', background: '#0a1f4e', borderRadius: '6px', marginBottom: '12px'}} />
                <h3 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px'}}>{title}</h3>
                <p style={{fontSize: '12px', color: '#64748b', lineHeight: 1.6}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="land-section" style={{padding: '48px 32px', background: '#fff'}}>
        <div style={{maxWidth: '860px', margin: '0 auto'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px'}}>The solution</div>
          <h2 style={{fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '28px', fontFamily: 'Georgia, serif'}}>Everything your bursar needs</h2>
          <div className="land-grid-2" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'}}>
            {[
              ['1', 'Automatic MPESA matching', 'Upload your statement and every payment is instantly matched to the right student.'],
              ['2', 'Instant WhatsApp notifications', 'Parents receive a confirmation the moment their payment is recorded. No more calls.'],
              ['3', 'Automated fee reminders', 'Parents with outstanding balances get professional WhatsApp reminders automatically.'],
              ['4', 'Fee clearance certificates', 'Generate professional PDF certificates for fully paid students in one click.'],
              ['5', 'Live collection dashboard', 'The principal sees real-time figures from any phone or laptop, anytime.'],
              ['6', 'Excel student upload', 'Upload your full student list from Excel in seconds. No manual data entry needed.'],
            ].map(([num, title, desc]) => (
              <div key={title} style={{display: 'flex', gap: '14px', alignItems: 'flex-start'}}>
                <div style={{width: '28px', height: '28px', background: '#0a1f4e', color: '#c8a84b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0}}>
                  {num}
                </div>
                <div>
                  <h3 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '3px'}}>{title}</h3>
                  <p style={{fontSize: '12px', color: '#64748b', lineHeight: 1.6}}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PricingSection />

      {/* FAQ */}
      <div className="land-section" style={{padding: '48px 32px', background: '#f8f9fc'}}>
        <div style={{maxWidth: '680px', margin: '0 auto'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px'}}>FAQ</div>
          <h2 style={{fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '28px', fontFamily: 'Georgia, serif'}}>Common questions</h2>
          <div style={{display: 'flex', flexDirection: 'column' as const, gap: '0'}}>
            {[
              {
                q: 'Do I need to install anything?',
                a: 'No. Elimu Pay is entirely web-based. You open it in any browser — desktop or phone — and everything works instantly. There is nothing to download or install.',
              },
              {
                q: 'How does the MPESA matching work?',
                a: 'You download your MPESA statement (a CSV or Excel file) from your Safaricom portal and upload it to Elimu Pay. The system reads each transaction, looks up the sender\'s phone number or reference, and posts the payment to the matching student record automatically.',
              },
              {
                q: 'Can parents see their own payment history?',
                a: 'Yes. Each time a payment is recorded, the parent receives a WhatsApp confirmation with the amount and running balance. You can also generate and share a PDF fee clearance certificate for students who are fully paid.',
              },
              {
                q: 'Is my school\'s data secure?',
                a: 'All data is encrypted in transit and at rest. Each school\'s data is completely isolated — no other school can see your records. We never sell or share your data with third parties.',
              },
              {
                q: 'What if I need help getting started?',
                a: 'We offer hands-on onboarding for every new school. Once you sign up, reach us on WhatsApp at +254 746 353 411 or email support@elimupay.co.ke and we will walk you through setup step by step.',
              },
            ].map((item, i, arr) => (
              <div key={item.q} style={{padding: '20px 0', borderBottom: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none'}}>
                <h3 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px'}}>{item.q}</h3>
                <p style={{fontSize: '12px', color: '#64748b', lineHeight: 1.7, margin: 0}}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="land-cta" style={{padding: '60px 32px', background: '#fff', textAlign: 'center' as const}}>
        <h2 style={{fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', fontFamily: 'Georgia, serif'}}>
          Ready to save your bursar 80 hours this term?
        </h2>
        <p style={{fontSize: '13px', color: '#64748b', marginBottom: '24px'}}>
          Set up your school in under 5 minutes. No technical knowledge needed.
        </p>
        <Link href="/signup" style={{background: '#0a1f4e', color: '#fff', padding: '14px 36px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, textDecoration: 'none'}}>
          Set up your school free
        </Link>
      </div>

      <div className="land-footer" style={{background: '#0a1f4e', padding: '28px 32px', textAlign: 'center' as const}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' as const, marginBottom: '14px'}}>
          <Link href="/demo" style={{fontSize: '12px', color: '#94a3c8', textDecoration: 'none'}}>Demo</Link>
          <a href="mailto:support@elimupay.co.ke" style={{fontSize: '12px', color: '#94a3c8', textDecoration: 'none'}}>support@elimupay.co.ke</a>
          <a href="https://wa.me/254746353411" style={{fontSize: '12px', color: '#94a3c8', textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">WhatsApp +254 746 353 411</a>
          <Link href="/privacy" style={{fontSize: '12px', color: '#94a3c8', textDecoration: 'none'}}>Privacy Policy</Link>
        </div>
        <p style={{fontSize: '11px', color: '#334155', margin: 0}}>
          © 2026 Elimu Pay. All rights reserved.
        </p>
      </div>

    </main>
  )
}