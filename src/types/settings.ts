export type SettingsTabKey = 'profile' | 'notification' | 'ai'

export interface ProfileSettings {
  avatarUrl: string
  displayName: string
  roleLabel: string
  maskedPhone: string
  maskedEmail: string
}

export interface SecurityLogItem {
  id: string
  device: string
  ipMasked: string
  loginAt: string
}

export interface NotificationSettings {
  webPushEnabled: boolean
  soundAlertEnabled: boolean
  appPushEnabled: boolean
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
  soundType: 'voice' | 'siren' | 'ding'
  volume: number
}

export interface AiSettings {
  fallConfidence: number
  climbConfidence: number
  lowLightAdaptive: boolean
  debounceSeconds: number
}

export interface SettingsBundle {
  profile: ProfileSettings
  securityLogs: SecurityLogItem[]
  notification: NotificationSettings
  ai: AiSettings
}
