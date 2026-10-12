/**
 * Tracks API requests that are taking unusually long, so the UI can explain that the
 * server is waking up (the free Azure plan sleeps when nobody has used it for a while).
 */
const SLOW_AFTER_MS = 5000

type Listener = () => void

const listeners = new Set<Listener>()
let slowRequests = 0

function emit() {
  listeners.forEach((listener) => listener())
}

export const serverStatus = {
  isSlow: () => slowRequests > 0,

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Call when a request starts. Returns a function to call when it finishes. */
  track(): () => void {
    let slow = false
    const timer = setTimeout(() => {
      slow = true
      slowRequests++
      emit()
    }, SLOW_AFTER_MS)

    return () => {
      clearTimeout(timer)
      if (slow) {
        slowRequests--
        emit()
      }
    }
  },
}

/** Starts waking the API and its database as soon as someone opens the site. */
export function wakeServer(baseUrl: string) {
  fetch(`${baseUrl}/api/health/db`).catch(() => {
    // Only a warm-up: real requests show their own errors.
  })
}
