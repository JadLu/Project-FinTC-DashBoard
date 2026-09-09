// src/pages/Dossiers.tsx — every hr_case, searchable, opening the detail view.
import { useMemo, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { ListCard, PageHeader, RiskBadge, StatusBadge, type ListCardRow } from '../components/ui'
import { formatDate, journeyLabel } from '../lib/format'
import type { Case, Step } from '../types'

type Filter = 'all' | 'OPEN' | 'BLOCKED' | 'CLOSED'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'OPEN', label: 'Ouverts' },
  { key: 'BLOCKED', label: 'Bloqués' },
  { key: 'CLOSED', label: 'Clôturés' },
]

export default function Dossiers({ cases, steps, onOpen }: { cases: Case[]; steps: Step[]; onOpen: (caseId: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = useMemo(() => (filter === 'all' ? cases : cases.filter(item => item.status === filter)), [cases, filter])

  const rows: ListCardRow[] = visible.map(item => {
    const caseSteps = steps.filter(step => step.case_id === item.case_id)
    const done = caseSteps.filter(step => step.status === 'VALIDATED').length
    return {
      key: item.case_id,
      icon: <FolderOpen size={17} />,
      tone: item.status === 'BLOCKED' ? 'red' : item.status === 'CLOSED' ? 'green' : '',
      title: item.subject?.full_name || item.case_id,
      subtitle: `${journeyLabel(item.journey_type)} · ${item.case_id} · ${done}/${caseSteps.length} étapes validées · Fin ${formatDate(item.contract_end_date)}`,
      search: `${item.case_id} ${item.status} ${item.risk_level}`,
      aside: <><RiskBadge risk={item.risk_level} /><StatusBadge status={item.status} /></>,
      onClick: () => onOpen(item.case_id),
    }
  })

  return (
    <>
      <PageHeader
        title="Dossiers"
        subtitle="Tous les parcours RH suivis par smartRH."
        action={
          <div className="segmented">
            {FILTERS.map(item => (
              <button key={item.key} className={filter === item.key ? 'active' : undefined} onClick={() => setFilter(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        }
      />
      <ListCard rows={rows} caption="Recherche et consultation" emptyText="Aucun dossier pour ce filtre" />
    </>
  )
}
