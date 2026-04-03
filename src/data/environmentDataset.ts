export type ZoneType = 'danger' | 'warning' | 'safe'
export type RuleCondition = 'enter' | 'leave' | 'stay'
export type DrawTool = 'select' | 'hand' | 'rect' | 'polygon'

export interface Point {
  x: number
  y: number
}

export interface ZoneRule {
  condition: RuleCondition
  target: 'allChildren' | 'ageGroup' | 'excludeTeacher'
}

export interface ZoneModel {
  id: string
  name: string
  type: ZoneType
  points: Point[]
  hidden: boolean
  rule: ZoneRule
}

export interface CameraOption {
  id: string
  label: string
  frameUrl: string
  sourceSize: { width: number; height: number }
}

export const zoneTypeOptions: Array<{ label: string; value: ZoneType }> = [
  { label: '高危禁区', value: 'danger' },
  { label: '提示区', value: 'warning' },
  { label: '安全区', value: 'safe' },
]

export const ruleConditionOptions: Array<{ label: string; value: RuleCondition }> = [
  { label: '进入该区域', value: 'enter' },
  { label: '离开该区域', value: 'leave' },
  { label: '停留超过 5 秒', value: 'stay' },
]

export const zoneTypeTheme: Record<
  ZoneType,
  { stroke: string; fill: string; chipClass: string; label: string }
> = {
  danger: {
    stroke: '#ef4444',
    fill: 'rgba(239,68,68,0.25)',
    chipClass: 'bg-red-50 text-red-700',
    label: '高危禁区',
  },
  warning: {
    stroke: '#f59e0b',
    fill: 'rgba(245,158,11,0.22)',
    chipClass: 'bg-amber-50 text-amber-700',
    label: '提示区',
  },
  safe: {
    stroke: '#10b981',
    fill: 'rgba(16,185,129,0.2)',
    chipClass: 'bg-emerald-50 text-emerald-700',
    label: '安全区',
  },
}

export const cameraOptions: CameraOption[] = [
  {
    id: 'cam-01',
    label: '大二班 - 主摄像头',
    frameUrl:
      'https://images.unsplash.com/photo-1694885146901-b1d05cb1f549?auto=format&fit=crop&w=1600&q=80',
    sourceSize: { width: 1920, height: 1080 },
  },
  {
    id: 'cam-02',
    label: '午睡区 - 盲区补充',
    frameUrl:
      'https://images.unsplash.com/photo-1567746455504-cb3213f8f5b8?auto=format&fit=crop&w=1600&q=80',
    sourceSize: { width: 1920, height: 1080 },
  },
]

export const initialZones: ZoneModel[] = [
  {
    id: 'zone-1',
    name: '活动安全区',
    type: 'safe',
    hidden: false,
    points: [
      { x: 95, y: 105 },
      { x: 555, y: 105 },
      { x: 555, y: 365 },
      { x: 95, y: 365 },
    ],
    rule: {
      condition: 'leave',
      target: 'allChildren',
    },
  },
]
