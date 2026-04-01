export type DeviceStatus = 'online' | 'offline' | 'alert'
export type DeviceType = 'ipc' | 'nvr' | 'edge' | 'switch' | 'router'
export type ViewMode = 'topology' | 'list'

export interface DeviceKpi {
  totalDevices: number
  onlineDevices: number
  tamperAlerts: number
  edgeCpuLoad: number
  edgeGpuLoad: number
}

export interface DeviceRecord {
  id: string
  name: string
  sn: string
  ip: string
  ipMode: 'static' | 'dhcp'
  mac: string
  type: DeviceType
  status: DeviceStatus
  aiBinding: string
  firmware: string
  upRate: string
  downRate: string
}

export interface TopologyNode {
  id: string
  name: string
  category: DeviceType
  status: DeviceStatus
  ip: string
  x: number
  y: number
}

export interface TopologyLink {
  source: string
  target: string
  status: DeviceStatus
}

export interface DeviceDataset {
  kpi: DeviceKpi
  devices: DeviceRecord[]
  nodes: TopologyNode[]
  links: TopologyLink[]
}

export const deviceTypeOptions: Array<{ value: 'all' | DeviceType; label: string }> = [
  { value: 'all', label: '全部设备类型' },
  { value: 'ipc', label: 'IPC 摄像头' },
  { value: 'nvr', label: 'NVR' },
  { value: 'edge', label: 'AI 边缘盒子' },
  { value: 'switch', label: '交换机' },
  { value: 'router', label: '核心路由' },
]

export const deviceStatusOptions: Array<{ value: 'all' | DeviceStatus; label: string }> = [
  { value: 'all', label: '全部在线状态' },
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
  { value: 'alert', label: '告警中' },
]

const devices: DeviceRecord[] = [
  {
    id: 'rt-01',
    name: '核心网关',
    sn: 'RT-CORE-001',
    ip: '192.168.1.1',
    ipMode: 'static',
    mac: 'F0:1A:2B:AA:00:01',
    type: 'router',
    status: 'online',
    aiBinding: '网关服务',
    firmware: 'v3.6.1',
    upRate: '12.6 Mbps',
    downRate: '86.2 Mbps',
  },
  {
    id: 'sw-01',
    name: '核心交换机',
    sn: 'SW-CORE-089',
    ip: '192.168.1.2',
    ipMode: 'static',
    mac: 'F0:1A:2B:AA:00:02',
    type: 'switch',
    status: 'online',
    aiBinding: '核心链路',
    firmware: 'v2.1.9',
    upRate: '43.0 Mbps',
    downRate: '65.4 Mbps',
  },
  {
    id: 'edge-01',
    name: 'YOLOv11-Edge',
    sn: 'EDGE-AI-001',
    ip: '192.168.1.20',
    ipMode: 'static',
    mac: 'F0:1A:2B:AA:10:20',
    type: 'edge',
    status: 'online',
    aiBinding: '主推理节点',
    firmware: 'v1.9.3',
    upRate: '32.4 Mbps',
    downRate: '11.9 Mbps',
  },
  {
    id: 'cam-01',
    name: '大二班-主摄',
    sn: 'CAM-A2-9981',
    ip: '192.168.2.105',
    ipMode: 'static',
    mac: 'A8:5E:45:C2:11:0A',
    type: 'ipc',
    status: 'online',
    aiBinding: 'YOLOv11-Edge',
    firmware: 'v5.4.2',
    upRate: '2.4 Mbps',
    downRate: '120 Kbps',
  },
  {
    id: 'cam-02',
    name: '午睡区-防盲',
    sn: 'CAM-S1-4432',
    ip: '192.168.2.106',
    ipMode: 'dhcp',
    mac: 'A8:5E:45:B1:00:FF',
    type: 'ipc',
    status: 'alert',
    aiBinding: 'YOLOv11-Edge',
    firmware: 'v5.4.0',
    upRate: '2.1 Mbps',
    downRate: '90 Kbps',
  },
  {
    id: 'cam-03',
    name: '走廊盲区',
    sn: 'CAM-H3-2210',
    ip: '192.168.2.107',
    ipMode: 'dhcp',
    mac: 'A8:5E:45:BD:21:10',
    type: 'ipc',
    status: 'offline',
    aiBinding: 'YOLOv11-Edge',
    firmware: 'v5.1.6',
    upRate: '0 Kbps',
    downRate: '0 Kbps',
  },
]

const nodes: TopologyNode[] = [
  { id: 'rt-01', name: '核心路由', category: 'router', status: 'online', ip: '192.168.1.1', x: 60, y: 220 },
  { id: 'sw-01', name: '核心交换机', category: 'switch', status: 'online', ip: '192.168.1.2', x: 250, y: 220 },
  { id: 'edge-01', name: '边缘算力盒', category: 'edge', status: 'online', ip: '192.168.1.20', x: 470, y: 140 },
  { id: 'cam-01', name: '大二班-主摄', category: 'ipc', status: 'online', ip: '192.168.2.105', x: 700, y: 90 },
  { id: 'cam-02', name: '午睡区-防盲', category: 'ipc', status: 'alert', ip: '192.168.2.106', x: 700, y: 220 },
  { id: 'cam-03', name: '走廊盲区', category: 'ipc', status: 'offline', ip: '192.168.2.107', x: 700, y: 340 },
]

const links: TopologyLink[] = [
  { source: 'rt-01', target: 'sw-01', status: 'online' },
  { source: 'sw-01', target: 'edge-01', status: 'online' },
  { source: 'edge-01', target: 'cam-01', status: 'online' },
  { source: 'edge-01', target: 'cam-02', status: 'alert' },
  { source: 'edge-01', target: 'cam-03', status: 'offline' },
]

export function getDeviceDataset(): DeviceDataset {
  const onlineDevices = devices.filter((item) => item.status === 'online').length
  const tamperAlerts = devices.filter((item) => item.status === 'alert').length

  return {
    kpi: {
      totalDevices: devices.length,
      onlineDevices,
      tamperAlerts,
      edgeCpuLoad: 68,
      edgeGpuLoad: 82,
    },
    devices: devices.map((item) => ({ ...item })),
    nodes: nodes.map((item) => ({ ...item })),
    links: links.map((item) => ({ ...item })),
  }
}

export function filterDeviceRecords(
  source: DeviceRecord[],
  search: string,
  type: 'all' | DeviceType,
  status: 'all' | DeviceStatus,
): DeviceRecord[] {
  const token = search.trim().toLowerCase()

  return source.filter((item) => {
    const byType = type === 'all' || item.type === type
    const byStatus = status === 'all' || item.status === status
    const byKeyword =
      token.length === 0 ||
      [item.name, item.ip, item.mac, item.sn].some((field) => field.toLowerCase().includes(token))

    return byType && byStatus && byKeyword
  })
}
