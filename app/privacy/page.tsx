import Link from 'next/link'

export default function Privacy() {
  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <div style={{background: '#0a1f4e', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontSize: '18px', fontWeight: 700, color: '#c8a84b', fontFamily: 'Georgia, serif'}}>FeeTracker</span>
        <Link href="/signup" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '7px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
          Get started
        </Link>
      </div>

      <div style={{maxWidth: '720px', margin: '0 auto', padding: '48px 32px'}}>
        <div style={{marginBottom: '32px'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#c8a84b', marginBottom: '8px'}}>Legal</div>
          <h1 style={{fontSize: '28px', fontWeight: 700, color: '#0f172a', fontFamily: 'Georgia, serif', marginBottom: '8px'}}>Privacy Policy</h1>
          <p style={{fontSize: '13px', color: '#94a3b8'}}>Last updated: May 2026 · Effective immediately upon signup</p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>1. Who We Are</h2>
            <p style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              FeeTracker is a school fee management platform built for private schools in Kenya. We help school administrators upload MPESA statements, automatically match fee payments to students, and communicate with parents via WhatsApp. Our platform is operated by FeeTracker Kenya. For any questions about this policy, contact us at <a href="mailto:support@feetracker.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@feetracker.co.ke</a>.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>2. Data We Collect</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>We collect the following categories of data when you use FeeTracker:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <li><strong>Account information:</strong> Your name, email address, and password (stored as a one-way hash). This identifies you as an authorised user of your school's account.</li>
                <li><strong>School information:</strong> School name, MPESA paybill or till number, and current academic term. This is required to configure your fee collection setup.</li>
                <li><strong>Student records:</strong> Student names, admission numbers, class, stream, fee amounts, and parent contact information (name and phone number). This data is provided by you and is used solely for fee tracking purposes.</li>
                <li><strong>Payment records:</strong> Transaction amounts, MPESA reference numbers, sender names, and sender phone numbers extracted from uploaded statements. This data is used to match payments to student records.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>3. MPESA Statement Data</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>When you upload an MPESA statement, we extract and store the following from each transaction row:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Transaction reference number (e.g. PBC12345678)</li>
                <li>Payer name and phone number</li>
                <li>Amount paid</li>
                <li>Transaction date and time</li>
              </ul>
              <p style={{marginTop: '12px'}}>
                This data is extracted for the sole purpose of matching transactions to student records. It is stored securely in your school's database partition and is not shared with any third party. You remain the data controller of all student and payment data you upload. FeeTracker acts as a data processor on your behalf.
              </p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>4. WhatsApp Notifications</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>
                FeeTracker generates WhatsApp message links addressed to parents when payments are matched or when fee reminders are triggered. These messages are sent <strong>by you, the school administrator</strong>, through your own WhatsApp account. FeeTracker does not have access to your WhatsApp account, does not store message delivery receipts, and does not contact parents on its own initiative.
              </p>
              <p>
                Parent phone numbers stored in the system are used only to generate these WhatsApp links. They are not sold, rented, or shared with any party outside of your school's use of the platform.
              </p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>5. Data Storage and Security</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>All data is stored in a PostgreSQL database hosted on Vercel's infrastructure within secure data centres. We apply the following security measures:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Passwords are hashed using bcrypt before storage — we never store plaintext passwords</li>
                <li>All data is transmitted over HTTPS/TLS encryption</li>
                <li>Authentication uses secure JWT session tokens</li>
                <li>Each school's data is logically isolated — users can only access data belonging to their school</li>
                <li>Access to the production database is restricted to authorised engineers only</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>6. Data Retention</h2>
            <p style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              Your data is retained for as long as your school account is active. If you wish to delete your account and all associated data, contact us at <a href="mailto:support@feetracker.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@feetracker.co.ke</a>. We will process deletion requests within 14 business days. Certain financial records may be retained for up to 7 years as required by Kenyan tax and financial regulations.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>7. Your Rights</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>As a user of FeeTracker, you have the right to:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Access the personal data we hold about your school and account</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your student and payment data at any time from the Reports page</li>
              </ul>
              <p style={{marginTop: '12px'}}>To exercise any of these rights, contact us at <a href="mailto:support@feetracker.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@feetracker.co.ke</a>.</p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>8. Contact Us</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p>If you have any questions about this Privacy Policy or how your data is handled, please reach us at:</p>
              <div style={{marginTop: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px'}}>
                <p style={{margin: 0, fontWeight: 600, color: '#0f172a'}}>FeeTracker Kenya</p>
                <p style={{margin: '4px 0 0'}}>Email: <a href="mailto:support@feetracker.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@feetracker.co.ke</a></p>
                <p style={{margin: '4px 0 0'}}>WhatsApp: <a href="https://wa.me/254746353411" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">+254 746 353 411</a></p>
                <p style={{margin: '4px 0 0'}}>Location: Nairobi, Kenya</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div style={{background: '#0a1f4e', padding: '16px 32px', textAlign: 'center', marginTop: '48px'}}>
        <p style={{fontSize: '11px', color: '#475569', margin: 0}}>FeeTracker · Built for private schools in Nairobi, Kenya</p>
      </div>
    </div>
  )
}
