export default function PlausibleAnalytics() {
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) return null

  return (
    <script
      defer
      data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
    />
  )
}
