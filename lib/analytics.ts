declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

export function trackEvent(eventName: string, props?: Record<string, string | number>) {
  if (typeof window === 'undefined') return
  if (!window.plausible) return
  window.plausible(eventName, { props })
}

export const AnalyticsEvents = {
  STUDENT_UPLOADED: 'Student Uploaded',
  STATEMENT_UPLOADED: 'Statement Uploaded',
  INVOICE_SENT: 'Invoice Sent',
  REMINDER_SENT: 'Reminder Sent',
  CERTIFICATE_DOWNLOADED: 'Certificate Downloaded',
  REPORT_DOWNLOADED: 'Report Downloaded',
  PLAN_UPGRADE_REQUESTED: 'Plan Upgrade Requested',
} as const
