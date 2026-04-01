export interface SiteMapItem {
  title: string
  path: string
  name: string
}

export interface SiteMapSection {
  id: string
  title: string
  items: SiteMapItem[]
}

/** 主应用侧边栏站点地图（认证入口不在此列，见 PRD SecureGuard） */
export const siteMapSections: SiteMapSection[] = [
  {
    id: 'core',
    title: '核心工作台',
    items: [
      { title: '概览数据大屏', path: '/dashboard', name: 'dashboard' },
      { title: '实时监控中心', path: '/live-monitoring', name: 'live-monitoring' },
      { title: '预警事件与回放', path: '/alerts', name: 'alerts' },
    ],
  },
  {
    id: 'management',
    title: '系统与设备管理',
    items: [
      { title: '设备与节点状态', path: '/devices', name: 'devices' },
      { title: '环境感知配置', path: '/environment', name: 'environment' },
    ],
  },
  {
    id: 'settings',
    title: '隐私与系统设置',
    items: [
      { title: '隐私与授权控制', path: '/settings/privacy', name: 'settings-privacy' },
      { title: '系统与账户设置', path: '/settings/system', name: 'settings-system' },
    ],
  },
]

export function findSiteMapItemByPath(path: string): SiteMapItem | undefined {
  for (const section of siteMapSections) {
    const hit = section.items.find((i) => i.path === path)
    if (hit) return hit
  }
  return undefined
}
