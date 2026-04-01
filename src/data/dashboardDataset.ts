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

export interface DashboardDataset {
  kpi: DashboardKpi
  trendLabels: string[]
  trendValues: number[]
  pieLabels: string[]
  pieValues: number[]
  logs: DashboardLogEntry[]
  snapshotCams: { id: string; name: string; imageUrl: string }[]
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
}

export function getDashboardDataset(roleId: RoleIdType | null): DashboardDataset {
  if (roleId === RoleId.parent) {
    return {
      ...PARENT_DATA,
      logs: PARENT_DATA.logs.map((l) => ({ ...l })),
    }
  }
  return {
    ...ORG_DATA,
    logs: ORG_DATA.logs.map((l) => ({ ...l })),
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
