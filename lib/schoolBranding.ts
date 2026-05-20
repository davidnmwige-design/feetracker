export interface SchoolBranding {
  logoUrl: string | null
  brandColor: string
  schoolName: string
  schoolMotto: string | null
}

export function getBrandColor(branding: SchoolBranding): string {
  return branding.brandColor || '#c8a84b'
}

export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#0a1f4e' : '#ffffff'
}
