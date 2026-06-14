export function isAdminIpAllowed(ip: string): boolean {
  const allowed = process.env.ADMIN_ALLOWED_IPS
  if (!allowed || allowed.trim() === '') return true // No restriction
  return allowed.split(',').map(s => s.trim()).filter(Boolean).includes(ip)
}
