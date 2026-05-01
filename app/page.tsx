import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">FeeTracker</h1>
        <p className="text-gray-500 mb-8">School fee management for Nairobi schools</p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800">
            Go to Dashboard
          </Link>
          <Link href="/setup" className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100">
            Setup School
          </Link>
        </div>
      </div>
    </div>
  )
}