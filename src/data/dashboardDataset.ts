import { RoleId, type RoleIdType } from '../services/auth'

export type DashboardLogLevel = 'high' | 'medium' | 'low'

export interface DashboardLogEntry {
  id: string
  time: string
  level: DashboardLogLevel
  /** Matches pie chart / filter labels */
  type: string
  loc: string
  msg: string
}

export interface DashboardKpi {
  warningsToday: number
  /** vs yesterday; positive = increase (bad for warnings) */
  warningDeltaPct: number
  devicesOnline: number
  devicesTotal: number
  deviceSubtitle: string
  hotArea: string
  hotAreaHint: string
  latencyMs: number
  latencyHint: string
}

/** Normalized axis-aligned box in **0–1** space (relative to frame width/height). */
export interface YoloBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export type YoloSeverity = 'critical' | 'high' | 'medium' | 'low'

/** Model class slug — maps to label files / post-processing rules in deployment. */
export type YoloClassLabel =
  | 'climbing'
  | 'falling_down'
  | 'wandering_in_danger_zone'
  | 'pushing_shoving'
  | 'running_unsafe'

/** Single inference result suitable for alert pipeline & audit trail. */
export interface YoloDetection {
  id: string
  /** ISO 8601 with offset (e.g. +08:00) for cross-system correlation. */
  timestamp: string
  classLabel: YoloClassLabel
  /** Softmax / calibrated score in [0, 1]. */
  confidence: number
  severity: YoloSeverity
  bbox: YoloBoundingBox
}

/** Edge / NPU runtime telemetry — one snapshot of “live” algorithm health. */
export interface AiAlgorithmStats {
  /** Effective throughput after pipeline sync. */
  fps: number
  /** End-to-end: capture → preprocess → infer → post (ms). */
  latencyMs: number
  /** Active letterbox / letterpad target, e.g. model export resolution. */
  resolution: string
  /** Fraction of frames dropped by scheduler (0 = none, 1 = all). */
  dropFrameRate: number
}

export interface DashboardDataset {
  kpi: DashboardKpi
  trendLabels: string[]
  trendValues: number[]
  pieLabels: string[]
  pieValues: number[]
  logs: DashboardLogEntry[]
  snapshotCams: { id: string; name: string; imageUrl: string }[]
  yoloAlertHistory: YoloDetection[]
  algorithmPerformance: AiAlgorithmStats
}

function cloneYoloDetection(d: YoloDetection): YoloDetection {
  return { ...d, bbox: { ...d.bbox } }
}

/** Org-wide demo stream: dense history for dashboards & drill-down. */
const ORG_YOLO_ALERT_HISTORY: YoloDetection[] = [
  {
    id: 'yd-001',
    timestamp: '2026-04-04T08:03:11.204+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.88,
    severity: 'medium',
    bbox: { x: 0.21, y: 0.4, width: 0.14, height: 0.42 },
  },
  {
    id: 'yd-002',
    timestamp: '2026-04-04T08:17:44.551+08:00',
    classLabel: 'climbing',
    confidence: 0.91,
    severity: 'high',
    bbox: { x: 0.55, y: 0.12, width: 0.2, height: 0.38 },
  },
  {
    id: 'yd-003',
    timestamp: '2026-04-04T08:45:02.903+08:00',
    classLabel: 'running_unsafe',
    confidence: 0.76,
    severity: 'low',
    bbox: { x: 0.33, y: 0.48, width: 0.18, height: 0.35 },
  },
  {
    id: 'yd-004',
    timestamp: '2026-04-04T09:12:29.118+08:00',
    classLabel: 'pushing_shoving',
    confidence: 0.84,
    severity: 'medium',
    bbox: { x: 0.41, y: 0.36, width: 0.28, height: 0.44 },
  },
  {
    id: 'yd-005',
    timestamp: '2026-04-04T09:38:55.672+08:00',
    classLabel: 'falling_down',
    confidence: 0.93,
    severity: 'critical',
    bbox: { x: 0.47, y: 0.62, width: 0.22, height: 0.28 },
  },
  {
    id: 'yd-006',
    timestamp: '2026-04-04T10:05:18.339+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.81,
    severity: 'medium',
    bbox: { x: 0.12, y: 0.28, width: 0.16, height: 0.5 },
  },
  {
    id: 'yd-007',
    timestamp: '2026-04-04T10:22:41.887+08:00',
    classLabel: 'climbing',
    confidence: 0.89,
    severity: 'high',
    bbox: { x: 0.63, y: 0.08, width: 0.17, height: 0.4 },
  },
  {
    id: 'yd-008',
    timestamp: '2026-04-04T10:41:07.015+08:00',
    classLabel: 'climbing',
    confidence: 0.92,
    severity: 'high',
    bbox: { x: 0.58, y: 0.15, width: 0.19, height: 0.36 },
  },
  {
    id: 'yd-009',
    timestamp: '2026-04-04T11:08:33.441+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.79,
    severity: 'medium',
    bbox: { x: 0.25, y: 0.33, width: 0.15, height: 0.48 },
  },
  {
    id: 'yd-010',
    timestamp: '2026-04-04T11:29:56.228+08:00',
    classLabel: 'running_unsafe',
    confidence: 0.74,
    severity: 'low',
    bbox: { x: 0.38, y: 0.44, width: 0.2, height: 0.32 },
  },
  {
    id: 'yd-011',
    timestamp: '2026-04-04T11:52:14.662+08:00',
    classLabel: 'falling_down',
    confidence: 0.9,
    severity: 'critical',
    bbox: { x: 0.44, y: 0.58, width: 0.24, height: 0.3 },
  },
  {
    id: 'yd-012',
    timestamp: '2026-04-04T12:18:40.905+08:00',
    classLabel: 'pushing_shoving',
    confidence: 0.82,
    severity: 'medium',
    bbox: { x: 0.35, y: 0.39, width: 0.3, height: 0.41 },
  },
  {
    id: 'yd-013',
    timestamp: '2026-04-04T12:44:22.173+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.86,
    severity: 'medium',
    bbox: { x: 0.08, y: 0.31, width: 0.18, height: 0.52 },
  },
  {
    id: 'yd-014',
    timestamp: '2026-04-04T13:11:08.519+08:00',
    classLabel: 'climbing',
    confidence: 0.87,
    severity: 'high',
    bbox: { x: 0.61, y: 0.11, width: 0.16, height: 0.37 },
  },
  {
    id: 'yd-015',
    timestamp: '2026-04-04T13:35:47.784+08:00',
    classLabel: 'falling_down',
    confidence: 0.94,
    severity: 'critical',
    bbox: { x: 0.5, y: 0.65, width: 0.2, height: 0.25 },
  },
  {
    id: 'yd-016',
    timestamp: '2026-04-04T14:02:19.336+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.83,
    severity: 'medium',
    bbox: { x: 0.18, y: 0.27, width: 0.14, height: 0.46 },
  },
  {
    id: 'yd-017',
    timestamp: '2026-04-04T14:28:51.642+08:00',
    classLabel: 'pushing_shoving',
    confidence: 0.8,
    severity: 'medium',
    bbox: { x: 0.4, y: 0.35, width: 0.26, height: 0.43 },
  },
  {
    id: 'yd-018',
    timestamp: '2026-04-04T14:55:06.891+08:00',
    classLabel: 'climbing',
    confidence: 0.9,
    severity: 'high',
    bbox: { x: 0.57, y: 0.09, width: 0.21, height: 0.39 },
  },
  {
    id: 'yd-019',
    timestamp: '2026-04-04T15:21:38.447+08:00',
    classLabel: 'running_unsafe',
    confidence: 0.77,
    severity: 'low',
    bbox: { x: 0.29, y: 0.51, width: 0.19, height: 0.33 },
  },
  {
    id: 'yd-020',
    timestamp: '2026-04-04T15:47:12.105+08:00',
    classLabel: 'falling_down',
    confidence: 0.92,
    severity: 'critical',
    bbox: { x: 0.46, y: 0.6, width: 0.23, height: 0.29 },
  },
  {
    id: 'yd-021',
    timestamp: '2026-04-04T16:14:29.718+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.85,
    severity: 'medium',
    bbox: { x: 0.14, y: 0.34, width: 0.17, height: 0.49 },
  },
  {
    id: 'yd-022',
    timestamp: '2026-04-04T16:40:53.264+08:00',
    classLabel: 'climbing',
    confidence: 0.88,
    severity: 'high',
    bbox: { x: 0.6, y: 0.13, width: 0.18, height: 0.35 },
  },
]

const ORG_ALGORITHM_PERFORMANCE: AiAlgorithmStats = {
  fps: 30,
  latencyMs: 45,
  resolution: '1920x1080',
  dropFrameRate: 0.012,
}

const PARENT_YOLO_ALERT_HISTORY: YoloDetection[] = [
  {
    id: 'yd-p-001',
    timestamp: '2026-04-04T09:05:22.118+08:00',
    classLabel: 'climbing',
    confidence: 0.86,
    severity: 'medium',
    bbox: { x: 0.35, y: 0.22, width: 0.2, height: 0.4 },
  },
  {
    id: 'yd-p-002',
    timestamp: '2026-04-04T10:42:07.905+08:00',
    classLabel: 'wandering_in_danger_zone',
    confidence: 0.78,
    severity: 'low',
    bbox: { x: 0.28, y: 0.38, width: 0.15, height: 0.45 },
  },
  {
    id: 'yd-p-003',
    timestamp: '2026-04-04T13:18:44.332+08:00',
    classLabel: 'falling_down',
    confidence: 0.91,
    severity: 'high',
    bbox: { x: 0.42, y: 0.55, width: 0.22, height: 0.3 },
  },
  {
    id: 'yd-p-004',
    timestamp: '2026-04-04T15:03:19.671+08:00',
    classLabel: 'running_unsafe',
    confidence: 0.72,
    severity: 'low',
    bbox: { x: 0.31, y: 0.47, width: 0.18, height: 0.34 },
  },
]

const PARENT_ALGORITHM_PERFORMANCE: AiAlgorithmStats = {
  fps: 28,
  latencyMs: 52,
  resolution: '1920x1080',
  dropFrameRate: 0.028,
}

const ORG_DATA: DashboardDataset = {
  kpi: {
    warningsToday: 128,
    warningDeltaPct: -15,
    devicesOnline: 42,
    devicesTotal: 45,
    deviceSubtitle: '3台设备离线检修中',
    hotArea: '二楼活动室',
    hotAreaHint: '集中在午休时段',
    latencyMs: 12,
    latencyHint: 'YOLOv11 推理延迟极低',
  },
  trendLabels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
  trendValues: [12, 19, 8, 45, 22, 5],
  pieLabels: ['攀爬高处', '异常跌倒', '接近危险区', '肢体冲突'],
  pieValues: [45, 25, 20, 10],
  logs: [
    {
      id: 'l1',
      time: '14:32:05',
      level: 'high',
      type: '攀爬高处',
      loc: '二楼活动室',
      msg: '幼儿 A 尝试攀爬储物柜',
    },
    {
      id: 'l2',
      time: '14:15:22',
      level: 'medium',
      type: '接近危险区',
      loc: '茶水间外',
      msg: '人员在开水间门口徘徊',
    },
    {
      id: 'l3',
      time: '13:50:11',
      level: 'high',
      type: '异常跌倒',
      loc: '室外操场',
      msg: '检测到人员快速倒地',
    },
    {
      id: 'l4',
      time: '12:30:00',
      level: 'low',
      type: '常规监控',
      loc: '午休室',
      msg: '画面正常，无异常行为',
    },
  ],
  snapshotCams: [
    {
      id: 'cam1',
      name: 'CAM_03 · 二楼活动室',
      imageUrl:
        'https://images.unsplash.com/photo-1595123550441-d377e017ea6c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'cam2',
      name: 'CAM_01 · 走廊东',
      imageUrl:
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80',
    },
  ],
  yoloAlertHistory: ORG_YOLO_ALERT_HISTORY,
  algorithmPerformance: ORG_ALGORITHM_PERFORMANCE,
}

const PARENT_DATA: DashboardDataset = {
  kpi: {
    warningsToday: 2,
    warningDeltaPct: 0,
    devicesOnline: 1,
    devicesTotal: 1,
    deviceSubtitle: '家庭监控在线',
    hotArea: '客厅',
    hotAreaHint: '绑定区域',
    latencyMs: 14,
    latencyHint: '边缘推理正常',
  },
  trendLabels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
  trendValues: [0, 1, 0, 2, 0, 0],
  pieLabels: ['攀爬高处', '异常跌倒', '接近危险区', '肢体冲突'],
  pieValues: [80, 20, 0, 0],
  logs: [
    {
      id: 'p1',
      time: '09:10:00',
      level: 'medium',
      type: '攀爬高处',
      loc: '客厅',
      msg: '幼儿靠近窗台，已推送提醒',
    },
    {
      id: 'p2',
      time: '08:02:11',
      level: 'low',
      type: '常规监控',
      loc: '客厅',
      msg: '画面正常',
    },
  ],
  snapshotCams: [
    {
      id: 'home1',
      name: '家庭 CAM · 客厅',
      imageUrl:
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    },
  ],
  yoloAlertHistory: PARENT_YOLO_ALERT_HISTORY,
  algorithmPerformance: PARENT_ALGORITHM_PERFORMANCE,
}

export function getDashboardDataset(roleId: RoleIdType | null): DashboardDataset {
  if (roleId === RoleId.parent) {
    return {
      ...PARENT_DATA,
      logs: PARENT_DATA.logs.map((l) => ({ ...l })),
      yoloAlertHistory: PARENT_DATA.yoloAlertHistory.map(cloneYoloDetection),
      algorithmPerformance: { ...PARENT_DATA.algorithmPerformance },
    }
  }
  return {
    ...ORG_DATA,
    logs: ORG_DATA.logs.map((l) => ({ ...l })),
    yoloAlertHistory: ORG_DATA.yoloAlertHistory.map(cloneYoloDetection),
    algorithmPerformance: { ...ORG_DATA.algorithmPerformance },
  }
}

let logSeq = 0

export function createMockRealtimeLog(scope: 'org' | 'parent'): DashboardLogEntry {
  logSeq += 1
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  if (scope === 'parent') {
    return {
      id: `rt-p-${logSeq}`,
      time,
      level: 'low',
      type: '常规监控',
      loc: '客厅',
      msg: '例行巡检：无新异常',
    }
  }

  const pool: Omit<DashboardLogEntry, 'id' | 'time'>[] = [
    {
      level: 'medium',
      type: '接近危险区',
      loc: '一楼大厅',
      msg: '人员靠近配电箱区域',
    },
    {
      level: 'low',
      type: '常规监控',
      loc: '绘本区',
      msg: '画面正常',
    },
    {
      level: 'medium',
      type: '肢体冲突',
      loc: '操场西侧',
      msg: '检测到追逐打闹，请留意',
    },
  ]
  const pick = pool[logSeq % pool.length]
  return {
    id: `rt-o-${logSeq}`,
    time,
    ...pick,
  }
}
