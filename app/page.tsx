import Link from 'next/link'

export default function Home() {
  return (
    <div style={{fontFamily: 'Arial, sans-serif', background: '#fff', color: '#0f172a'}}>

      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #e2e8f0'}}>
        <span style={{fontSize: '18px', fontWeight: 700, color: '#0f2d6e', fontFamily: 'Georgia, serif'}}>
          Fee<span style={{color: '#c8a84b'}}>Tracker</span>
        </span>
        <Link href="/signup" style={{background: '#0a1f4e', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none'}}>
          Get started free
        </Link>
      </nav>

      <div style={{background: '#0a1f4e', color: '#fff', padding: '56px 32px', textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: 'rgba(200,168,75,0.15)', color: '#c8a84b', border: '1px solid rgba(200,168,75,0.3)', fontSize: '10px', padding: '5px 14px', borderRadius: '4px', marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase' as const}}>
          Built for Nairobi schools
        </div>
        <h1 style={{fontSize: '36px', fontWeight: 700, lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-1px', fontFamily: 'Georgia, serif', color: '#fff', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto'}}>
          Stop chasing fee payments.<br />
          <span style={{color: '#c8a84b'}}>Let FeeTracker do it.</span>
        </h1>
        <p style={{fontSize: '13px', color: '#94a3c8', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.7}}>
          Upload your MPESA statement. Every payment is matched automatically. Parents get notified instantly. Your bursar saves 80 hours every term.
        </p>
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
          <Link href="/signup" style={{background: '#c8a84b', color: '#0a1f4e', padding: '12px 28px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none'}}>
            Set up your school free
          </Link>
          <Link href="/login" style={{background: 'transparent', color: '#fff', padding: '12px 28px', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none'}}>
            Sign in
          </Link>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#0d2660', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
        {[['80hrs', 'Saved per term'], ['100%', 'Payment visibility'], ['5min', 'Setup time']].map(([num, label]) => (
          <div key={label} style={{padding: '20px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize: '26px', fontWeight: 700, color: '#c8a84b', marginBottom: '4px'}}>{num}</div>
            <div style={{fontSize: '11px', color: '#94a3c8', letterSpacing: '0.5px'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{padding: '48px 32px', background: '#f8f9fc'}}>
        <div style={{maxWidth: '860px', margin: '0 auto'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px'}}>The problem</div>
          <h2 style={{fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '28px', fontFamily: 'Georgia, serif'}}>Does this sound familiar?</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
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

      <div style={{padding: '48px 32px', background: '#fff'}}>
        <div style={{maxWidth: '860px', margin: '0 auto'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px'}}>The solution</div>
          <h2 style={{fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '28px', fontFamily: 'Georgia, serif'}}>Everything your bursar needs</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'}}>
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

      <div style={{padding: '48px 32px', background: '#0a1f4e'}}>
        <div style={{maxWidth: '860px', margin: '0 auto'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#c8a84b', marginBottom: '10px'}}>Pricing</div>
          <h2 style={{fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px', fontFamily: 'Georgia, serif'}}>Simple, honest pricing</h2>
          <p style={{fontSize: '12px', color: '#94a3c8', marginBottom: '28px'}}>Less than the cost of one hour of your bursar's time per day</p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
            {[
              {name: 'Starter', sub: 'Up to 300 students', price: '4,500', setup: '15,000', featured: false},
              {name: 'Growth', sub: '300 – 600 students', price: '6,500', setup: '20,000', featured: true},
              {name: 'Premium', sub: '600 – 1,000 students', price: '9,000', setup: '25,000', featured: false},
            ].map(plan => (
              <div key={plan.name} style={{background: plan.featured ? '#fff' : '#0d2660', border: plan.featured ? '2px solid #c8a84b' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '22px', position: 'relative' as const}}>
                {plan.featured && (
                  <div style={{position: 'absolute' as const, top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#c8a84b', color: '#0a1f4e', fontSize: '10px', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' as const}}>
                    Most popular
                  </div>
                )}
                <div style={{fontSize: '14px', fontWeight: 700, color: plan.featured ? '#0a1f4e' : '#fff', marginBottom: '3px'}}>{plan.name}</div>
                <div style={{fontSize: '11px', color: plan.featured ? '#64748b' : '#94a3c8', marginBottom: '16px'}}>{plan.sub}</div>
                <div style={{fontSize: '24px', fontWeight: 700, color: plan.featured ? '#0a1f4e' : '#c8a84b'}}>KES {plan.price}</div>
                <div style={{fontSize: '11px', color: plan.featured ? '#64748b' : '#94a3c8'}}>/month</div>
                <div style={{fontSize: '11px', color: '#64748b', marginBottom: '20px'}}>+ KES {plan.setup} setup fee</div>
                <Link href="/signup" style={{display: 'block', textAlign: 'center' as const, padding: '9px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, background: '#0a1f4e', color: '#fff', textDecoration: 'none'}}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding: '60px 32px', background: '#fff', textAlign: 'center' as const}}>
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

      <div style={{background: '#0a1f4e', padding: '16px 32px', textAlign: 'center' as const}}>
        <p style={{fontSize: '11px', color: '#475569'}}>
          FeeTracker · Built for private schools in Nairobi, Kenya
        </p>
      </div>

    </div>
  )
}