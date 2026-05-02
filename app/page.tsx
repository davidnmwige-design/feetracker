import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100">
        <span className="font-semibold text-green-700 text-lg">FeeTracker</span>
        <Link href="/setup" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800">
          Get started free
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 py-20 text-center">
        <div className="inline-block bg-green-50 text-green-700 text-sm px-4 py-1 rounded-full mb-6 font-medium">
          Built for Nairobi schools
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Stop chasing fee payments.<br />Let FeeTracker do it.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Upload your MPESA statement. Every payment is matched to the right student automatically. Parents get notified instantly. Your bursar saves 80 hours every term.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/setup" className="bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 font-medium">
            Set up your school free
          </Link>
          <Link href="/dashboard" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 font-medium">
            View demo
          </Link>
        </div>
      </div>

      {/* Problem */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Does this sound familiar?
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Parents calling all day</h3>
              <p className="text-gray-500 text-sm">"Did you receive my payment?" Your bursar spends hours answering the same question every day.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Manual MPESA checking</h3>
              <p className="text-gray-500 text-sm">Scrolling through hundreds of MPESA messages and updating Excel sheets by hand. Every single day.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl mb-4">😰</div>
              <h3 className="font-semibold text-gray-900 mb-2">No real-time visibility</h3>
              <p className="text-gray-500 text-sm">The principal has no idea how much has been collected until the bursar prepares a manual report.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything your bursar needs
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Automatic MPESA matching</h3>
                <p className="text-gray-500 text-sm">Upload your MPESA statement and every payment is instantly matched to the right student.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Instant parent notifications</h3>
                <p className="text-gray-500 text-sm">Parents receive a WhatsApp message the moment their payment is recorded. No more calls.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Automated reminders</h3>
                <p className="text-gray-500 text-sm">Parents with outstanding balances get professional WhatsApp reminders automatically.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Fee clearance certificates</h3>
                <p className="text-gray-500 text-sm">Generate professional PDF clearance certificates for fully paid students in one click.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">5</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Live dashboard</h3>
                <p className="text-gray-500 text-sm">The principal sees real-time collection figures from any phone or laptop, anytime.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold shrink-0">6</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Student database</h3>
                <p className="text-gray-500 text-sm">Upload your student list from Excel in seconds. No manual data entry needed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-gray-500 text-center mb-12">Less than the cost of one hour of your bursar's time per day</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Starter</h3>
              <p className="text-gray-400 text-sm mb-4">Up to 300 students</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">KES 4,500<span className="text-base font-normal text-gray-400">/month</span></p>
              <p className="text-sm text-gray-400 mb-6">+ KES 15,000 setup fee</p>
              <Link href="/setup" className="block text-center bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700">
                Get started
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-green-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">Most popular</div>
              <h3 className="font-semibold text-gray-900 mb-1">Growth</h3>
              <p className="text-gray-400 text-sm mb-4">300 - 600 students</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">KES 6,500<span className="text-base font-normal text-gray-400">/month</span></p>
              <p className="text-sm text-gray-400 mb-6">+ KES 20,000 setup fee</p>
              <Link href="/setup" className="block text-center bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800">
                Get started
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Premium</h3>
              <p className="text-gray-400 text-sm mb-4">600 - 1,000 students</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">KES 9,000<span className="text-base font-normal text-gray-400">/month</span></p>
              <p className="text-sm text-gray-400 mb-6">+ KES 25,000 setup fee</p>
              <Link href="/setup" className="block text-center bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to save your bursar 80 hours this term?</h2>
        <p className="text-gray-500 mb-8">Set up your school in under 5 minutes. No technical knowledge needed.</p>
        <Link href="/setup" className="bg-navy-900 text-white px-8 py-3 rounded-lg font-medium text-lg inline-block" style={{backgroundColor: '#0a1f4e'}}>
  Set up your school free
</Link>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        FeeTracker · Built for private schools in Nairobi, Kenya
      </div>

    </div>
  )
}