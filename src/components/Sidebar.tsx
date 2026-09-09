// src/components/Sidebar.tsx
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, LogOut } from 'lucide-react'
import logo from './Logo.jpeg'
import { NAV, isEntryActive } from '../lib/nav'
import { initials, roleLabel } from '../lib/format'
import type { Person } from '../types'

export interface SidebarProps {
  path: string
  navigate: (path: string) => void
  counts: { cases: number; tasks: number; alerts: number }
  actorPerson?: Person
  people: Person[]
  setActor: (personRef: string) => void
  onLogout: () => void
  connected: boolean
  open: boolean
}

const ACTOR_ROLES = ['manager', 'encadrant', 'rh', 'paie', 'it', 'moyens_generaux']

export default function Sidebar({ path, navigate, counts, actorPerson, people, setActor, onLogout, connected, open }: SidebarProps) {
  // Auto-open the "Parcours RH" submenu whenever one of its pages is showing.
  const [expanded, setExpanded] = useState<string | null>(path.startsWith('/parcours') ? '/parcours' : null)
  const [userMenu, setUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (path.startsWith('/parcours')) setExpanded('/parcours')
  }, [path])

  useEffect(() => {
    if (!userMenu) return
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [userMenu])

  const actors = people.filter(person => ACTOR_ROLES.includes(person.role))

  return (
    <aside className={open ? 'sidebar open' : 'sidebar'}>
      <div className="brand">
        <img src={logo} alt="smartRH — Intelligent HR Tracking System" className="brand-logo" />
      </div>

      <div className="sidebar-scroll">
        <nav>
          {NAV.map(entry => {
            const Icon = entry.icon
            const active = isEntryActive(entry, path)
            const isOpen = expanded === entry.path
            return (
              <div key={entry.path}>
                <button
                  className={active ? 'nav-item active' : 'nav-item'}
                  onClick={() => {
                    if (entry.children) setExpanded(isOpen ? null : entry.path)
                    navigate(entry.path)
                  }}
                >
                  <Icon size={17} />
                  <span className="nav-label">{entry.label}</span>
                  {entry.badge && <span className="nav-count">{counts[entry.badge]}</span>}
                  {entry.children && <ChevronRight size={15} className={isOpen ? 'nav-chevron open' : 'nav-chevron'} />}
                </button>
                {entry.children && isOpen && (
                  <div className="nav-sub">
                    {entry.children.map(child => (
                      <button
                        key={child.path}
                        className={path === child.path ? 'active' : undefined}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-foot">
        <div className="sidebar-divider" />
        <div className="menu-anchor" ref={menuRef}>
          <button className="sidebar-user" onClick={() => setUserMenu(value => !value)}>
            <span className="avatar">{initials(actorPerson?.full_name || '?')}</span>
            <span className="sidebar-user-text">
              <strong>{actorPerson?.full_name || 'Sélectionner un profil'}</strong>
              <span>{roleLabel(actorPerson?.role)}</span>
            </span>
            <ChevronRight size={15} />
          </button>
          {userMenu && (
            <div className="menu up">
              <div className="menu-label">Agir en tant que</div>
              {actors.map(person => (
                <button
                  key={person.person_ref}
                  className={person.person_ref === actorPerson?.person_ref ? 'menu-item active' : 'menu-item'}
                  onClick={() => { setActor(person.person_ref); setUserMenu(false) }}
                >
                  <span className="avatar">{initials(person.full_name)}</span>
                  <span className="menu-item-text">
                    <strong>{person.full_name}</strong>
                    <span>{roleLabel(person.role)} · {person.person_ref}</span>
                  </span>
                  {person.person_ref === actorPerson?.person_ref && <Check size={15} className="check" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={onLogout}><LogOut size={14} /> Déconnexion</button>
        <div className="sidebar-status">
          <span><span className="sync-dot" />{connected ? 'Supabase connecté' : 'Mode démonstration'}</span>
          <small>smartRH · HR Operations</small>
        </div>
      </div>
    </aside>
  )
}
