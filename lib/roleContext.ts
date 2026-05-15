export type UserRole = 'owner' | 'admin' | 'accountant' | 'principal' | 'viewer'

export const ROLE_PERMISSIONS: Record<UserRole, {
  pages: string[]
  canManageTeam: boolean
  canChangeSettings: boolean
  canUpload: boolean
  canSendReminders: boolean
  canViewReports: boolean
  canManageStudents: boolean
  canManageInvoices: boolean
}> = {
  owner: {
    pages: ['dashboard', 'students', 'upload', 'reminders', 'invoices', 'reports', 'settings', 'unmatched'],
    canManageTeam: true,
    canChangeSettings: true,
    canUpload: true,
    canSendReminders: true,
    canViewReports: true,
    canManageStudents: true,
    canManageInvoices: true,
  },
  admin: {
    pages: ['dashboard', 'students', 'upload', 'reminders', 'invoices', 'reports', 'settings', 'unmatched'],
    canManageTeam: true,
    canChangeSettings: true,
    canUpload: true,
    canSendReminders: true,
    canViewReports: true,
    canManageStudents: true,
    canManageInvoices: true,
  },
  accountant: {
    pages: ['dashboard', 'students', 'upload', 'reminders', 'invoices', 'reports', 'unmatched'],
    canManageTeam: false,
    canChangeSettings: false,
    canUpload: true,
    canSendReminders: true,
    canViewReports: true,
    canManageStudents: true,
    canManageInvoices: true,
  },
  principal: {
    pages: ['dashboard', 'reports'],
    canManageTeam: false,
    canChangeSettings: false,
    canUpload: false,
    canSendReminders: false,
    canViewReports: true,
    canManageStudents: false,
    canManageInvoices: false,
  },
  viewer: {
    pages: ['dashboard'],
    canManageTeam: false,
    canChangeSettings: false,
    canUpload: false,
    canSendReminders: false,
    canViewReports: false,
    canManageStudents: false,
    canManageInvoices: false,
  },
}
