import { onBeforeUnmount } from 'vue'
import type { DeviceStatus } from '../data/deviceDataset'

interface DeviceRealtimePayload {
  deviceId: string
  status?: DeviceStatus
  upRate?: string
  downRate?: string
}

interface ConnectOptions {
  onMessage: (payload: DeviceRealtimePayload) => void
  intervalMs?: number
}

export function useDeviceRealtime() {
  let timer: ReturnType<typeof setInterval> | null = null

  const candidates: DeviceRealtimePayload[] = [
    { deviceId: 'cam-01', status: 'online', upRate: '2.3 Mbps', downRate: '125 Kbps' },
    { deviceId: 'cam-02', status: 'alert', upRate: '2.8 Mbps', downRate: '140 Kbps' },
    { deviceId: 'cam-03', status: 'offline', upRate: '0 Kbps', downRate: '0 Kbps' },
    { deviceId: 'cam-03', status: 'online', upRate: '1.9 Mbps', downRate: '95 Kbps' },
  ]

  function connect(options: ConnectOptions) {
    disconnect()
    const intervalMs = options.intervalMs ?? 6000
    timer = setInterval(() => {
      const item = candidates[Math.floor(Math.random() * candidates.length)]
      options.onMessage(item)
    }, intervalMs)
  }

  function disconnect() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return { connect, disconnect }
}
