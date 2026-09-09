// src/pages/Documents.tsx
// There is no `hr_documents` table yet, so this page surfaces the only documentary
// trail the workflow currently stores: the structured `details` payloads attached to
// decisions. The banner says plainly what is still missing.
import { FileText, Info } from 'lucide-react'
import { ListCard, PageHeader, type ListCardRow } from '../components/ui'
import { formatTime } from '../lib/format'
import type { Case, Event } from '../types'

export default function Documents({ events, cases, onOpen }: { events: Event[]; cases: Case[]; onOpen: (caseId: string) => void }) {
  const documented = [...events]
    .filter(event => event.details && Object.keys(event.details).length > 0)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  const rows: ListCardRow[] = documented.map(event => {
    const caseItem = cases.find(item => item.case_id === event.case_id)
    const fields = Object.keys(event.details || {}).length
    return {
      key: String(event.id),
      icon: <FileText size={17} />,
      title: `${event.event_type} — ${event.case_id}`,
      subtitle: `${caseItem?.subject?.full_name || 'Dossier'} · ${fields} champ(s) renseigné(s) · ${formatTime(event.created_at)}`,
      search: `${event.actor} ${event.decision || ''}`,
      onClick: () => onOpen(event.case_id),
    }
  })

  return (
    <>
      <PageHeader title="Documents RH" subtitle="Pièces et justificatifs rattachés aux parcours." />
      <div className="note-banner">
        <Info size={17} />
        <span>
          <b>Module partiellement connecté</b>
          Aucune table de documents (contrats, attestations, fichiers) n'existe encore côté Supabase. Cette page
          affiche donc la seule trace documentaire disponible aujourd'hui : les justificatifs structurés saisis
          lors des décisions. Une table <code>hr_documents</code> + un bucket de stockage sont nécessaires pour
          gérer de vrais fichiers.
        </span>
      </div>
      <ListCard rows={rows} caption="Justificatifs de décision" emptyText="Aucun justificatif enregistré" />
    </>
  )
}
