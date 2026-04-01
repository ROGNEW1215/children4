import type {
  AiSettings,
  NotificationSettings,
  ProfileSettings,
  SettingsBundle,
} from '../types/settings'

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

const mockSettings: SettingsBundle = {
  profile: {
    avatarUrl: 'https://ui-avatars.com/api/?name=%E5%BC%A0&background=EBF4FF&color=2563EB&size=120',
    displayName: '张老师',
    roleLabel: '系统管理员',
    maskedPhone: '138****5678',
    maskedEmail: 'zhang****@secureguard.cn',
  },
  securityLogs: [
    { id: 'log-1', device: 'Windows / Chrome', ipMasked: '114.114.*.*', loginAt: '2026-04-01 08:42:10' },
    { id: 'log-2', device: 'iOS / App', ipMasked: '112.123.*.*', loginAt: '2026-03-31 21:18:03' },
  ],
  notification: {
    webPushEnabled: true,
    soundAlertEnabled: true,
    appPushEnabled: true,
    dndEnabled: false,
    dndStart: '22:00',
    dndEnd: '07:00',
    soundType: 'voice',
    volume: 80,
  },
  ai: {
    fallConfidence: 80,
    climbConfidence: 75,
    lowLightAdaptive: true,
    debounceSeconds: 1.5,
  },
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

export async function getSettings(): Promise<SettingsBundle> {
  await delay(350)
  return clone(mockSettings)
}

export async function saveProfile(payload: ProfileSettings): Promise<{ ok: true }> {
  await delay(600)
  mockSettings.profile = clone(payload)
  return { ok: true }
}

export async function saveNotification(payload: NotificationSettings): Promise<{ ok: true }> {
  await delay(700)
  mockSettings.notification = clone(payload)
  return { ok: true }
}

export async function saveAiThresholds(payload: AiSettings): Promise<{ ok: true }> {
  await delay(800)
  mockSettings.ai = clone(payload)
  return { ok: true }
}
