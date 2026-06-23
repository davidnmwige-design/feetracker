import Link from 'next/link'

export default function Privacy() {
  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <div style={{background: '#0a1f4e', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
        <span style={{fontSize: '18px', fontWeight: 700, fontFamily: 'Georgia, serif'}}><span style={{color: '#fff'}}>Elimu</span><span style={{color: '#c8a84b'}}> Pay</span></span>
        <Link href="/signup" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '7px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
          Get started
        </Link>
      </div>

      <div style={{maxWidth: '720px', margin: '0 auto', padding: '48px 16px'}}>
        <div style={{marginBottom: '32px'}}>
          <div style={{fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#c8a84b', marginBottom: '8px'}}>Legal</div>
          <h1 style={{fontSize: '28px', fontWeight: 700, color: '#0f172a', fontFamily: 'Georgia, serif', marginBottom: '8px'}}>Privacy Policy</h1>
          <p style={{fontSize: '13px', color: '#94a3b8'}}>Last updated: May 2026 · Effective immediately upon signup</p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>1. Who We Are</h2>
            <p style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              Elimu Pay is a school fee management platform built for private schools in Kenya. We help school administrators upload MPESA statements, automatically match fee payments to students, and communicate with parents via WhatsApp. Our platform is operated by Elimu Pay Kenya. For any questions about this policy, contact us at <a href="mailto:support@elimupay.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@elimupay.co.ke</a>.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>2. Data We Collect</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>We collect the following categories of data when you use Elimu Pay:</p>
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
                This data is extracted for the sole purpose of matching transactions to student records. It is stored securely in your school's database partition and is not shared with any third party. You remain the data controller of all student and payment data you upload. Elimu Pay acts as a data processor on your behalf.
              </p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>4. WhatsApp Notifications</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>
                Elimu Pay generates WhatsApp message links addressed to parents when payments are matched or when fee reminders are triggered. These messages are sent <strong>by you, the school administrator</strong>, through your own WhatsApp account. Elimu Pay does not have access to your WhatsApp account, does not store message delivery receipts, and does not contact parents on its own initiative.
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
                <li>Parent email addresses are encrypted at rest using AES-256-GCM authenticated field-level encryption</li>
                <li>All data is transmitted over HTTPS/TLS with HTTP Strict Transport Security (HSTS) enforced</li>
                <li>Authentication uses secure JWT session tokens with a 24-hour expiry</li>
                <li>Session invalidation: you can sign out all devices at once from Settings</li>
                <li>Each school's data is logically isolated — users can only access data belonging to their school</li>
                <li>Security headers are enforced on all pages (CSP, X-Frame-Options, X-Content-Type-Options)</li>
                <li>All sensitive actions are recorded in a tamper-evident audit log</li>
                <li>Access to the production database is restricted to authorised engineers only</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>6. Audit Logging</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>Elimu Pay records an audit log of sensitive actions performed within your account. Logged events include:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Login successes and failures</li>
                <li>Student imports and M-Pesa statement uploads</li>
                <li>Invoice dispatch and clearance certificate generation</li>
                <li>Plan upgrade requests and data exports</li>
                <li>Account deletion</li>
              </ul>
              <p style={{marginTop: '12px'}}>Audit logs are visible to Elimu Pay platform administrators and may be used to investigate security incidents or support requests.</p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>7. Data Retention and Deletion</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>Your data is retained for as long as your school account is active. You can permanently delete your account and all associated data at any time from <strong>Settings → Danger zone → Delete my account</strong>. Deletion is immediate and irreversible — all students, payments, invoices, and your user account are removed from our systems.</p>
              <p>Certain financial records may be retained for up to 7 years as required by Kenyan tax and financial regulations.</p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>8. Your Rights</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>As a user of Elimu Pay, you have the right to:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Access the personal data we hold about your school and account</li>
                <li>Request correction of inaccurate data</li>
                <li><strong>Delete your account and all data instantly</strong> from Settings — no need to contact us</li>
                <li><strong>Export all your data</strong> (students, payments, invoices) as an Excel file from Settings at any time</li>
                <li>Sign out of all devices at once from Settings → Session security</li>
              </ul>
              <p style={{marginTop: '12px'}}>For other data rights requests, contact us at <a href="mailto:support@elimupay.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@elimupay.co.ke</a>.</p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>9. Lawful Basis for Processing (Kenya DPA 2019)</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>We process personal data under the following lawful bases as defined by the <strong>Kenya Data Protection Act 2019</strong>:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li><strong>Contract:</strong> Processing school administrator data is necessary to provide our services under our Terms of Service.</li>
                <li><strong>Consent:</strong> We process parent contact information with the consent of the school, which acts as the data controller for their students and parents.</li>
                <li><strong>Legitimate interests:</strong> We process usage data to improve our services and maintain platform security.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>10. Data Subject Rights (Kenya DPA 2019)</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>Under the Kenya Data Protection Act 2019, you have the right to:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data (right to erasure)</li>
                <li>Object to processing</li>
                <li>Data portability</li>
              </ul>
              <p style={{marginTop: '12px'}}>To exercise these rights, contact us at <a href="mailto:support@elimupay.co.ke" style={{color: '#8d7022', fontWeight: 600, textDecoration: 'none'}}>support@elimupay.co.ke</a></p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>11. ODPC Complaint Procedure</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>If you believe we have violated your data protection rights, you may lodge a complaint with the Office of the Data Protection Commissioner (ODPC):</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Website: <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" style={{color: '#8d7022', fontWeight: 600, textDecoration: 'none'}}>www.odpc.go.ke</a></li>
                <li>Email: <a href="mailto:info@odpc.go.ke" style={{color: '#8d7022', fontWeight: 600, textDecoration: 'none'}}>info@odpc.go.ke</a></li>
                <li>Address: Upper Hill, Nairobi, Kenya</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>12. Third-Party Processors</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p style={{marginBottom: '12px'}}>We share data with the following third-party processors:</p>
              <ul style={{paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>Neon (database hosting) — neon.tech</li>
                <li>Vercel (application hosting) — vercel.com</li>
                <li>Resend (transactional email delivery) — resend.com</li>
                <li>Safaricom (MPESA payment notifications) — safaricom.co.ke</li>
                <li>WhatsApp (parent notifications via deep links) — whatsapp.com</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>13. Data Retention Policy</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p>We retain your data for the duration of your subscription plus 30 days after cancellation, during which you may export your data. After this period, all data is permanently deleted. Certain financial records may be retained for up to 7 years as required by Kenyan tax and financial regulations.</p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>14. Data Protection Officer</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p>Our Data Protection Officer can be contacted at: <a href="mailto:support@elimupay.co.ke" style={{color: '#8d7022', fontWeight: 600, textDecoration: 'none'}}>support@elimupay.co.ke</a></p>
            </div>
          </section>

          <section>
            <h2 style={{fontSize: '16px', fontWeight: 700, color: '#0a1f4e', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #c8a84b', display: 'inline-block'}}>15. Contact Us</h2>
            <div style={{fontSize: '13px', color: '#475569', lineHeight: '1.8'}}>
              <p>If you have any questions about this Privacy Policy or how your data is handled, please reach us at:</p>
              <div style={{marginTop: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px'}}>
                <p style={{margin: 0, fontWeight: 600, color: '#0f172a'}}>Elimu Pay Kenya</p>
                <p style={{margin: '4px 0 0'}}>Email: <a href="mailto:support@elimupay.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@elimupay.co.ke</a></p>
                <p style={{margin: '4px 0 0'}}>WhatsApp: <a href="https://wa.me/254746353411" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">+254 746 353 411</a></p>
                <p style={{margin: '4px 0 0'}}>Location: Nairobi, Kenya</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div style={{background: '#0a1f4e', padding: '16px 32px', textAlign: 'center', marginTop: '48px'}}>
        <p style={{fontSize: '11px', color: '#475569', margin: 0}}>Elimu Pay · Smart fee management for Kenyan schools</p>
      </div>
    </div>
  )
}
