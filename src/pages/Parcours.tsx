// src/pages/Parcours.tsx — one journey type at a time (période d'essai / renouvellement / départ).
import { CalendarClock, FolderOpen } from 'lucide-react'
import { KpiCard, ListCard, PageHeader, RiskBadge, StatusBadge, type ListCardRow } from '../components/ui'
import { formatDate, journeyLabel } from '../lib/format'
import type { Case, JourneyType, Step } from '../types'

const SUBTITLES: Record<string, string> = {
  probation: "Suivi des périodes d'essai et de leurs évaluations.",
  renewal: 'Renouvellements de contrat à instruire et à décider.',
  offboarding: 'Départs en cours et restitutions à finaliser.',
}

export default function Parcours({ journey, cases, steps, onOpen }: {
  journey: JourneyType
  cases: Case[]
  steps: Step[]
  onOpen: (caseId: string) => void
}) {
  const scoped = cases.filter(item => item.journey_type === journey)
  const scopedIds = new Set(scoped.map(item => item.case_id))
  const scopedSteps = steps.filter(step => scopedIds.has(step.case_id))
  const pending = scopedSteps.filter(step => step.status === 'PENDING' || step.status === 'OVERDUE').length

  const rows: ListCardRow[] = scoped.map(item => {
    const caseSteps = scopedSteps.filter(step => step.case_id === item.case_id)
    const next = [...caseSteps]
      .filter(step => step.status === 'PENDING' || step.status === 'OVERDUE')
      .sort((a, b) => +new Date(a.due_date) - +new Date(b.due_date))[0]
    return {
      key: item.case_id,
      icon: <FolderOpen size={17} />,
      tone: item.status === 'BLOCKED' ? 'red' : item.status === 'CLOSED' ? 'green' : '',
      title: item.subject?.full_name || item.case_id,
      subtitle: next
        ? `Prochaine étape : ${next.step_name} · ${formatDate(next.due_date)}`
        : `${item.case_id} · aucune étape en attente`,
      search: `${item.case_id} ${item.status} ${item.risk_level}`,
      aside: <><RiskBadge risk={item.risk_level} /><StatusBadge status={item.status} /></>,
      onClick: () => onOpen(item.case_id),
    }
  })

  return (
    <>
      <PageHeader eyebrow="smartRH · Parcours RH" title={journeyLabel(journey)} subtitle={SUBTITLES[journey]} />
      <div className="stat-grid">
        <KpiCard label="Dossiers dans ce parcours" value={scoped.length} icon={FolderOpen} tone="blue" />
        <KpiCard label="Étapes à traiter" value={pending} icon={CalendarClock} tone="amber" />
        <KpiCard label="Dossiers bloqués" value={scoped.filter(item => item.status === 'BLOCKED').length} icon={FolderOpen} tone="coral" />
        <KpiCard label="Dossiers clôturés" value={scoped.filter(item => item.status === 'CLOSED').length} icon={FolderOpen} tone="mint" />
      </div>
      <ListCard rows={rows} emptyText={`Aucun dossier de type « ${journeyLabel(journey)} »`} />
    </>
  )
}
