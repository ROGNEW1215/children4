import { onBeforeUnmount, ref } from 'vue'
import {
  createMockRealtimeLog,
  type DashboardLogEntry,
} from '../data/dashboardDataset'

export interface UseDashboardRealtimeOptions {
  /** 'org' | 'parent' — affects mock log copy */
  scope: 'org' | 'parent'
  /** Called when a non-page-refresh log line is simulated */
  onAppendLog: (entry: DashboardLogEntry) => void
  /** Interval between mock pushes (ms) */
  intervalMs?: number
}

/**
 * Mock realtime channel. Replace internals with WebSocket when backend is ready.
 */
export function useDashboardRealtime() {
  const timerId = ref<ReturnType<typeof setInterval> | null>(null)

  function disconnect() {
    if (timerId.value != null) {
      clearInterval(timerId.value)
      timerId.value = null
    }
  }

  function connect(opts: UseDashboardRealtimeOptions) {
    disconnect()
    const ms = opts.intervalMs ?? 12000
    timerId.value = setInterval(() => {
      opts.onAppendLog(createMockRealtimeLog(opts.scope))
    }, ms)
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
  }
}
