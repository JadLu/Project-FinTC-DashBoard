// src/components/Topbar.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check, ChevronRight, FileCheck2, FolderOpen, Menu, Moon, Search, Sun, UserRound } from 'lucide-react'
import { initials, journeyLabel, roleLabel } from '../lib/format'
import type { Case, Person, Step } from '../types'
import type { Theme } from '../hooks/useTheme'

interface Hit { key: string; group: string; icon: JSX.Element; title: string; subtitle: string; go: () => void }

export interface TopbarProps {
  cases: Case[]
  steps: Step[]
  people: Person[]
  actorPerson?: Person
  setActor: (personRef: string) => void
  navigate: (path: string) => void
  openCase: (caseId: string) => void
  alerts: number
  theme: Theme
  toggleTheme: () => void
  onMenu: () => void
}

const ACTOR_ROLES = ['manager', 'encadrant', 'rh', 'paie', 'it', 'moyens_generaux']
const MAX_PER_GROUP = 4

export default function Topbar({ cases, steps, people, actorPerson, setActor, navigate, openCase, alerts, theme, toggleTheme, onMenu }: TopbarProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // ⌘K / Ctrl+K focuses the global search, Escape closes it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setFocused(true)
      }
      if (event.key === 'Escape') { setFocused(false); inputRef.current?.blur() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setFocused(false)
      if (!menuRef.current?.contains(event.target as Node)) setUserMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const hits = useMemo<Hit[]>(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    const match = (...values: (string | undefined | null)[]) =>
      values.some(value => (value || '').toLowerCase().includes(needle))

    const caseHits: Hit[] = cases.filter(item => match(item.case_id, item.subject?.full_name, journeyLabel(item.journey_type)))
      .slice(0, MAX_PER_GROUP)
      .map(item => ({
        key: `case-${item.case_id}`, group: 'Dossiers', icon: <FolderOpen size={16} />,
        title: item.subject?.full_name || item.case_id,
        subtitle: `${journeyLabel(item.journey_type)} · ${item.case_id}`,
        go: () => openCase(item.case_id),
      }))

    const stepHits: Hit[] = steps.filter(step => match(step.step_name, step.case_id, step.owner?.full_name))
      .slice(0, MAX_PER_GROUP)
      .map(step => ({
        key: `step-${step.id}`, group: 'Étapes', icon: <FileCheck2 size={16} />,
        title: step.step_name,
        subtitle: `${step.case_id} · ${step.owner?.full_name || step.owner_role}`,
        go: () => openCase(step.case_id),
      }))

    const peopleHits: Hit[] = people.filter(person => match(person.full_name, person.person_ref, person.email))
      .slice(0, MAX_PER_GROUP)
      .map(person => ({
        key: `person-${person.person_ref}`, group: 'Collaborateurs', icon: <UserRound size={16} />,
        title: person.full_name,
        subtitle: `${roleLabel(person.role)} · ${person.person_ref}`,
        go: () => {
          const owned = cases.find(item => item.subject_person_id === person.id)
          if (owned) openCase(owned.case_id)
          else navigate('/dossiers')
        },
      }))

    return [...caseHits, ...stepHits, ...peopleHits]
  }, [query, cases, steps, people, openCase, navigate])

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>()
    for (const hit of hits) map.set(hit.group, [...(map.get(hit.group) || []), hit])
    return [...map.entries()]
  }, [hits])

  const run = (hit: Hit) => { hit.go(); setQuery(''); setFocused(false) }
  const actors = people.filter(person => ACTOR_ROLES.includes(person.role))

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Ouvrir le menu"><Menu size={20} /></button>

      <div className="global-search" ref={searchRef}>
        <div className="global-search-field">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={event => { setQuery(event.target.value); setFocused(true) }}
            onFocus={() => setFocused(true)}
            placeholder="Rechercher un collaborateur, un dossier, un document…"
            aria-label="Recherche globale"
          />
          <span className="kbd">⌘ K</span>
        </div>
        {focused && query.trim().length >= 2 && (
          <div className="search-results">
            {grouped.length ? grouped.map(([group, groupHits]) => (
              <div key={group}>
                <div className="search-group">{group}</div>
                {groupHits.map(hit => (
                  <button className="search-hit" key={hit.key} onClick={() => run(hit)}>
                    <span className="list-row-icon" style={{ width: 30, height: 30, borderRadius: 9 }}>{hit.icon}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong>{hit.title}</strong>
                      <span>{hit.subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
            )) : <div className="search-empty">Aucun résultat pour « {query} »</div>}
          </div>
        )}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <button className="icon-btn" onClick={() => navigate('/alertes')} aria-label="Alertes et notifications" title="Alertes & Notifications">
          <Bell size={19} />
          {alerts > 0 && <span className="dot-badge">{alerts}</span>}
        </button>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Changer de thème" title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}>
          {theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <div className="menu-anchor" ref={menuRef}>
          <button className="user-chip" onClick={() => setUserMenu(value => !value)}>
            <span className="avatar">{initials(actorPerson?.full_name || '?')}</span>
            <span className="user-chip-text">
              <strong>{actorPerson?.full_name || 'Profil'}</strong>
              <span>{roleLabel(actorPerson?.role)}</span>
            </span>
            <ChevronRight size={16} />
          </button>
          {userMenu && (
            <div className="menu">
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
      </div>
    </header>
  )
}
