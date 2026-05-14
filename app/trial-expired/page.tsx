import Link from 'next/link'

export default function TrialExpired() {
  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '24px'}}>
      <div style={{maxWidth: '520px', width: '100%'}}>
        <div style={{background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
          <div style={{background: '#0a1f4e', padding: '28px 32px', textAlign: 'center'}}>
            <h1 style={{fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0}}><span style={{color: '#fff'}}>Elimu</span><span style={{color: '#c8a84b'}}> Pay</span></h1>
            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px'}}>Your free trial has ended</p>
          </div>

          <div style={{padding: '36px 32px', textAlign: 'center'}}>
            <div style={{width: '56px', height: '56px', background: '#fef9ec', border: '2px solid #c8a84b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px'}}>
              ⏳
            </div>

            <h2 style={{fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', fontFamily: 'Georgia, serif'}}>
              Your 14-day trial has expired
            </h2>

            <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.7', marginBottom: '24px'}}>
              Thank you for trying Elimu Pay. Your school's data is safe and has not been deleted — you just need to subscribe to continue using the platform.
            </p>

            <div style={{background: '#f8f9fc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '28px', textAlign: 'left'}}>
              <p style={{fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Choose a plan to continue</p>
              {[
                {name: 'Starter', sub: 'Up to 300 students', price: '4,500'},
                {name: 'Growth', sub: '300 – 600 students', price: '6,500'},
                {name: 'Premium', sub: '600 – 1,000 students', price: '9,000'},
              ].map((plan, i) => (
                <div key={plan.name} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none'}}>
                  <div>
                    <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{plan.name}</span>
                    <span style={{fontSize: '12px', color: '#94a3b8', marginLeft: '8px'}}>{plan.sub}</span>
                  </div>
                  <span style={{fontSize: '13px', fontWeight: 700, color: '#c8a84b'}}>KES {plan.price}/mo</span>
                </div>
              ))}
            </div>

            <p style={{fontSize: '13px', color: '#64748b', marginBottom: '20px'}}>
              To subscribe, contact us and we'll get you set up within the hour:
            </p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <a
                href="https://wa.me/254746353411?text=Hi%2C%20I%27d%20like%20to%20subscribe%20to%20Elimu%20Pay%20for%20my%20school."
                target="_blank"
                rel="noopener noreferrer"
                style={{display: 'block', background: '#25D366', color: '#fff', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center'}}
              >
                WhatsApp us to subscribe
              </a>
              <a
                href="mailto:support@elimupay.co.ke?subject=Elimu%20Pay%20Subscription"
                style={{display: 'block', background: '#0a1f4e', color: '#fff', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center'}}
              >
                Email us at support@elimupay.co.ke
              </a>
              <Link
                href="/login"
                style={{display: 'block', background: '#f8f9fc', color: '#64748b', padding: '10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', textAlign: 'center', border: '1px solid #e2e8f0'}}
              >
                Sign out and return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
