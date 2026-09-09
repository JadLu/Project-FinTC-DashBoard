// src/lib/format.ts — shared formatting + small domain helpers used across pages.
import type { Step } from '../types'

export const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value)) : '—'

export const formatLongDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value)) : '—'

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

export const journeyLabel = (value: string) =>
  ({ probation: "Période d'essai", renewal: 'Renouvellement', offboarding: 'Départ' } as Record<string, string>)[value] || value

/** personnes.role → the French job title shown next to a name. */
export const roleLabel = (role?: string) =>
  ({
    manager: 'Manager',
    rh: 'Responsable RH',
    encadrant: 'Encadrant',
    it: 'IT',
    paie: 'Paie',
    moyens_generaux: 'Moyens généraux',
    stagiaire: 'Stagiaire',
  } as Record<string, string>)[role || ''] || 'Collaborateur'

export const initials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()

/** Urgent = overdue or due within 7 days; everything else is "À venir". */
export const isUrgent = (dueDate: string) => {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

export const groupStepsByCase = (steps: Step[]): [string, Step[]][] => {
  const grouped: Record<string, Step[]> = {}
  for (const step of steps) {
    if (!grouped[step.case_id]) grouped[step.case_id] = []
    grouped[step.case_id].push(step)
  }
  return Object.entries(grouped)
}

export const TERMINAL_DECISIONS = ['EXTEND', 'TERMINATE', 'CONFIRM', 'RENEW', 'OFFBOARD']
