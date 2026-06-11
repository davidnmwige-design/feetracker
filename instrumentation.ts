import * as Sentry from '@sentry/nextjs'

// Runs once when the server process starts (Node and Edge runtimes).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Fail fast on a misconfigured environment before serving any request.
    const { assertServerEnv } = await import('./lib/env')
    assertServerEnv()
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Forwards Route Handler / Server Component errors to Sentry.
export const onRequestError = Sentry.captureRequestError
