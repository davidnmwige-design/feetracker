import { z } from 'zod'

// ============================================================
// PRIMITIVE SCHEMAS — reusable building blocks
// ============================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email address is too long')
  .email('Invalid email address format')
  .transform(val => val.trim().toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')

export const nameSchema = (fieldName = 'Name', max = 120) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} must not exceed ${max} characters`)
    .transform(val =>
      val
        .trim()
        .replace(/^[=+\-@\t\r]+/, '')
        .replace(/[\n\r\x00-\x1F\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )

export const optionalNameSchema = (fieldName = 'Name', max = 120) =>
  z
    .string()
    .max(max, `${fieldName} must not exceed ${max} characters`)
    .transform(val =>
      val
        .trim()
        .replace(/^[=+\-@\t\r]+/, '')
        .replace(/[\n\r\x00-\x1F\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .optional()
    .nullable()

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)\+]{9,20}$/, 'Invalid phone number format')
  .transform(val => val.trim())
  .optional()
  .nullable()

export const paybillSchema = z
  .string()
  .regex(/^\d{5,7}$/, 'Paybill must be 5 to 7 digits')
  .optional()
  .nullable()

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color like #0a1f4e')
  .optional()
  .nullable()

export const amountSchema = (fieldName = 'Amount') =>
  z
    .number({ error: `${fieldName} must be a number` })
    .min(0, `${fieldName} cannot be negative`)
    .max(10_000_000, `${fieldName} exceeds maximum allowed value`)

export const optionalAmountSchema = (fieldName = 'Amount') =>
  z
    .number({ error: `${fieldName} must be a number` })
    .min(0, `${fieldName} cannot be negative`)
    .max(10_000_000, `${fieldName} exceeds maximum allowed value`)
    .optional()
    .nullable()

export const positiveIntSchema = (fieldName = 'Value', min = 1, max = 999_999) =>
  z
    .number({ error: `${fieldName} must be a number` })
    .int(`${fieldName} must be a whole number`)
    .min(min, `${fieldName} must be at least ${min}`)
    .max(max, `${fieldName} must not exceed ${max}`)

export const textSchema = (fieldName = 'Text', max = 500) =>
  z
    .string()
    .max(max, `${fieldName} must not exceed ${max} characters`)
    .transform(val => val.trim().replace(/<[^>]*>/g, ''))
    .optional()
    .nullable()

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    val => val.startsWith('http://') || val.startsWith('https://'),
    'URL must use http or https'
  )
  .optional()
  .nullable()

export const booleanSchema = z.boolean().optional()

export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .optional()
  .nullable()

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const signupSchema = z
  .object({
    name: nameSchema('Name'),
    email: emailSchema,
    password: passwordSchema,
    schoolName: nameSchema('School name'),
    paybill: paybillSchema,
    term: z.string().min(1, 'Current term is required').max(50, 'Invalid term'),
  })
  .strict()

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128, 'Invalid password'),
  })
  .strict()

export const forgotPasswordSchema = z
  .object({ email: emailSchema })
  .strict()

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required').max(200, 'Invalid token'),
    newPassword: passwordSchema,
  })
  .strict()

export const verify2FASchema = z
  .object({
    code: z
      .string()
      .length(6, 'Code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Code must contain only digits'),
  })
  .strict()

export const verifyAndLoginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    code: z
      .string()
      .length(6, 'Code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Code must contain only digits'),
  })
  .strict()

export const send2FAOTPSchema = z
  .object({ email: emailSchema.optional() })
  .strict()

// ============================================================
// SCHOOL SCHEMAS
// ============================================================

export const updateSchoolSchema = z
  .object({
    name: nameSchema('School name').optional(),
    paybill: paybillSchema,
    currentTerm: z.string().max(50, 'Invalid term').optional().nullable(),
    accountNumberFormat: textSchema('Account number format', 200),
    whatsappNumber: phoneSchema,
    replyToEmail: emailSchema.optional().nullable(),
    emailSignature: textSchema('Email signature', 500),
    brandColor: hexColorSchema,
    schoolMotto: textSchema('School motto', 120),
    billingCycle: z.enum(['monthly', 'term', 'annual']).optional().nullable(),
    penaltyEnabled: booleanSchema,
    penaltyType: z.enum(['fixed', 'percentage']).optional().nullable(),
    penaltyAmount: optionalAmountSchema('Penalty amount'),
    penaltyDueDate: z.number().int().min(1).max(31).optional().nullable(),
  })
  .strict()

// ============================================================
// STUDENT SCHEMAS
// ============================================================

export const createStudentSchema = z
  .object({
    name: nameSchema('Student name'),
    admNo: nameSchema('Admission number', 20),
    studentClass: nameSchema('Class', 20),
    stream: optionalNameSchema('Stream', 20),
    parentName: nameSchema('Parent name'),
    parentPhone: phoneSchema,
    parentEmail: emailSchema.optional().nullable(),
    parent2Name: optionalNameSchema('Parent 2 name'),
    parent2Phone: phoneSchema,
    parent2Email: emailSchema.optional().nullable(),
    categories: z
      .array(
        z.object({
          name: nameSchema('Fee category name', 80),
          amount: amountSchema('Fee amount'),
        })
      )
      .optional(),
  })
  .strict()

export const updateStudentSchema = z
  .object({
    name: nameSchema('Student name').optional(),
    admNo: nameSchema('Admission number', 20).optional(),
    studentClass: nameSchema('Class', 20).optional(),
    stream: optionalNameSchema('Stream', 20),
    parentName: optionalNameSchema('Parent name'),
    parentPhone: phoneSchema,
    parentEmail: emailSchema.optional().nullable(),
    parent2Name: optionalNameSchema('Parent 2 name'),
    parent2Phone: phoneSchema,
    parent2Email: emailSchema.optional().nullable(),
  })
  .strict()

// ============================================================
// TEAM SCHEMAS
// ============================================================

export const inviteTeamMemberSchema = z
  .object({
    name: nameSchema('Name'),
    email: emailSchema,
    role: z.enum(['admin', 'accountant', 'principal', 'viewer'], {
      error: 'Role must be admin, accountant, principal, or viewer',
    }),
  })
  .strict()

// ============================================================
// DISCOUNT SCHEMAS
// ============================================================

export const createDiscountSchema = z
  .object({
    name: nameSchema('Discount name', 80),
    description: textSchema('Description', 200),
    discountType: z.enum(['percentage', 'fixed'], {
      error: 'Discount type must be percentage or fixed',
    }),
    discountValue: amountSchema('Discount value'),
    active: booleanSchema,
    isSiblingDiscount: booleanSchema,
  })
  .strict()

export const updateDiscountSchema = createDiscountSchema.partial().strict()

export const applyDiscountSchema = z
  .object({
    discountId: positiveIntSchema('Discount ID'),
    studentIds: z
      .array(positiveIntSchema('Student ID'))
      .min(1, 'At least one student is required'),
  })
  .strict()

export const applySiblingDiscountSchema = z
  .object({
    discountId: positiveIntSchema('Discount ID'),
    parentPhone: z
      .string()
      .min(1, 'Parent phone is required')
      .max(20, 'Invalid phone number'),
  })
  .strict()

// ============================================================
// BURSARY SCHEMAS
// ============================================================

export const createBursarySchema = z
  .object({
    studentId: positiveIntSchema('Student ID'),
    type: z.enum(['full', 'partial', 'scholarship', 'staff_child', 'other']),
    description: textSchema('Description', 200),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: amountSchema('Discount value'),
    approvedBy: optionalNameSchema('Approved by', 120),
    endDate: dateSchema,
    active: booleanSchema,
  })
  .strict()

export const updateBursarySchema = z
  .object({
    type: z.enum(['full', 'partial', 'scholarship', 'staff_child', 'other']).optional(),
    description: textSchema('Description', 200),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: optionalAmountSchema('Discount value'),
    approvedBy: optionalNameSchema('Approved by', 120),
    endDate: dateSchema,
    active: booleanSchema,
  })
  .strict()

// ============================================================
// EXAM FEE SCHEMAS
// ============================================================

export const createExamFeeSchema = z
  .object({
    name: nameSchema('Exam fee name', 120),
    examType: z.enum(['KCSE', 'KCPE', 'Mock', 'Cambridge', 'Other']),
    amount: amountSchema('Amount'),
    targetClass: nameSchema('Target class', 20),
    academicYear: positiveIntSchema('Academic year', 2020, 2035).optional().nullable(),
    dueDate: dateSchema,
    active: booleanSchema,
  })
  .strict()

export const updateExamFeeSchema = z
  .object({
    name: nameSchema('Exam fee name', 120).optional(),
    examType: z.enum(['KCSE', 'KCPE', 'Mock', 'Cambridge', 'Other']).optional(),
    amount: optionalAmountSchema('Amount'),
    targetClass: nameSchema('Target class', 20).optional(),
    active: booleanSchema,
    assign: z.literal(true).optional(),
  })
  .strict()

// ============================================================
// ACADEMIC YEAR SCHEMAS
// ============================================================

export const createAcademicYearSchema = z
  .object({
    year: positiveIntSchema('Year', 2020, 2035),
    isActive: booleanSchema,
    term1Start: dateSchema,
    term1End: dateSchema,
    term2Start: dateSchema,
    term2End: dateSchema,
    term3Start: dateSchema,
    term3End: dateSchema,
  })
  .strict()

export const updateAcademicYearSchema = z
  .object({
    activate: z.literal(true).optional(),
    term1Start: dateSchema,
    term1End: dateSchema,
    term2Start: dateSchema,
    term2End: dateSchema,
    term3Start: dateSchema,
    term3End: dateSchema,
  })
  .strict()

// ============================================================
// FEE CATEGORY SCHEMAS
// ============================================================

export const createFeeCategorySchema = z
  .object({
    studentId: positiveIntSchema('Student ID'),
    categories: z
      .array(
        z.object({
          name: nameSchema('Category name', 80),
          amount: amountSchema('Amount'),
        })
      )
      .min(1, 'At least one category is required'),
  })
  .strict()

export const bulkFeeCategorySchema = z
  .object({
    mode: z.enum(['update', 'add']),
    className: z.string().max(50, 'Class name too long').optional().nullable(),
    categoryName: nameSchema('Category name', 80),
    newAmount: amountSchema('Amount'),
  })
  .strict()

// ============================================================
// REMINDERS SCHEMAS
// ============================================================

export const reminderScheduleSchema = z
  .object({
    enabled: z.boolean(),
    frequency: z.enum(['weekly', 'monthly']).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
      .optional(),
  })
  .strict()

// ============================================================
// EMAIL SCHEMAS
// ============================================================

export const sendEmailSchema = z
  .object({
    to: emailSchema,
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    html: z
      .string()
      .min(1, 'Email body is required')
      .max(102_400, 'Email body too large (max 100KB)'),
    pdfBase64: z.string().max(10_485_760, 'PDF too large').optional(),
    pdfFilename: z.string().max(200, 'Filename too long').optional(),
    schoolName: optionalNameSchema('School name', 120),
    replyTo: emailSchema.optional().nullable(),
    fromName: optionalNameSchema('From name', 200),
  })
  .strict()

// ============================================================
// ADMIN SCHEMAS
// ============================================================

export const adminSetupSchema = z
  .object({
    name: nameSchema('Name'),
    email: emailSchema,
    password: passwordSchema,
    secretKey: z
      .string()
      .min(1, 'Secret key is required')
      .max(200, 'Invalid secret key'),
  })
  .strict()

export const announcementSchema = z
  .object({
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
    recipientType: z
      .string()
      .max(50, 'Invalid recipient type')
      .optional()
      .nullable(),
  })
  .strict()

export const testimonialSubmitSchema = z.object({
  schoolId: z.coerce.number().int().positive('Invalid school ID'),
  token: z.string().min(1, 'Invalid token').max(200, 'Invalid token'),
  authorName: nameSchema('Your name', 120),
  authorTitle: optionalNameSchema('Your title', 120),
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  quote: z
    .string()
    .min(20, 'Please write at least 20 characters')
    .max(1000, 'Testimonial too long'),
})
// No .strict() here — submitted from external form, extra fields should be silently ignored

// ============================================================
// HELPER — use in every API route
// ============================================================

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const first = result.error.issues[0]
    const field = first.path.length > 0 ? `${first.path.join('.')}: ` : ''
    return { success: false, error: `${field}${first.message}` }
  }
  return { success: true, data: result.data }
}
