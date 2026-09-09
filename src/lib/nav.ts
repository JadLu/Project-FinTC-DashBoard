// src/lib/nav.ts — single source of truth for the sidebar, the breadcrumb and the router.
import {
  BarChart3, Bell, Check, ClipboardList, FileText, FolderOpen,
  LayoutDashboard, Network, ShieldAlert, type LucideIcon,
} from 'lucide-react'

export interface NavChild { path: string; label: string }
export interface NavEntry {
  path: string
  label: string
  icon: LucideIcon
  /** Which live counter feeds the orange pill, if any. */
  badge?: 'cases' | 'tasks' | 'alerts'
  children?: NavChild[]
}

export const NAV: NavEntry[] = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  {
    path: '/parcours', label: 'Parcours RH', icon: ClipboardList,
    children: [
      { path: '/parcours/probation', label: "Périodes d'essai" },
      { path: '/parcours/renewal', label: 'Renouvellements' },
      { path: '/parcours/offboarding', label: 'Départs' },
    ],
  },
  { path: '/dossiers', label: 'Dossiers', icon: FolderOpen, badge: 'cases' },
  { path: '/tasks', label: 'Tâches', icon: Check, badge: 'tasks' },
  { path: '/documents', label: 'Documents RH', icon: FileText },
  { path: '/alertes', label: 'Alertes & Notifications', icon: Bell, badge: 'alerts' },
  { path: '/analyse', label: 'Analyse IA', icon: Network },
  { path: '/conflits', label: 'Conflits', icon: ShieldAlert },
  { path: '/rapports', label: 'Rapports & KPI', icon: BarChart3 },
]

/** Page title used by the document title and the case-detail breadcrumb. */
export const titleForPath = (path: string): string => {
  if (path.startsWith('/case/')) return 'Détail dossier'
  if (path === '/apply') return 'Nouveau dossier'
  for (const entry of NAV) {
    if (entry.path === path) return entry.label
    const child = entry.children?.find(item => item.path === path)
    if (child) return child.label
  }
  return 'Tableau de bord'
}

/** A nav entry is active for its own path and for any of its children. */
export const isEntryActive = (entry: NavEntry, path: string) =>
  entry.path === path || Boolean(entry.children?.some(child => child.path === path)) ||
  (entry.path === '/dossiers' && path.startsWith('/case/'))
