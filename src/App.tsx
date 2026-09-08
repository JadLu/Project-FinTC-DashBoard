import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, Check, ChevronRight, CircleAlert, Clock3, FileCheck2, Gavel, LayoutDashboard, Menu, ShieldAlert, UserPlus, UserRound, X } from 'lucide-react'
import logo from './components/Logo.jpeg'
import { hasSupabaseConfig } from './supabase'
import { useCases, useConflicts, useEvents, useManagerTasks, usePeople, useSteps } from './hooks'
import Intake from './pages/Intake'
import StepRow from './components/StepRow'
import DecisionBadge from './components/DecisionBadge'
import DecisionPanel from './components/DecisionPanel'
import { DetailsList } from './components/DetailsFields'
import type { Case, Event, Person, Step } from './types'

const TERMINAL_DECISIONS = ['EXTEND', 'TERMINATE', 'CONFIRM', 'RENEW', 'OFFBOARD']

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value)) : '—'
const formatTime = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const journeyLabel = (value: string) => ({ probation: "Période d'essai", renewal: 'Renouvellement', offboarding: 'Départ' }[value] || value)
const initials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2)

// Urgent = overdue or due within 7 days; everything else is "À venir".
const isUrgent = (dueDate: string) => {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}
const groupStepsByCase = (steps: Step[]): [string, Step[]][] => {
  const grouped: Record<string, Step[]> = {}
  for (const step of steps) {
    if (!grouped[step.case_id]) grouped[step.case_id] = []
    grouped[step.case_id].push(step)
  }
  return Object.entries(grouped)
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status.toLowerCase()}`}><span className="badge-dot" />{status}</span>
}
function RiskBadge({ risk }: { risk: string }) { return <span className={`badge risk-${risk.toLowerCase()}`}>{risk}</span> }
function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Activity; tone: string }) {
  return <div className="kpi-card"><div className={`kpi-icon ${tone}`}><Icon size={18} /></div><div><div className="kpi-value">{value}</div><div className="kpi-label">{label}</div></div><ArrowUpRight className="kpi-arrow" size={16} /></div>
}
function SectionCard({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="section-card"><div className="section-head"><div><p className="eyebrow">{eyebrow || 'Suivi opérationnel'}</p><h2>{title}</h2></div>{action}</div>{children}</section>
}
function EmptyState({ text = 'Aucun élément à afficher' }: { text?: string }) { return <div className="empty-state"><Check size={17} />{text}</div> }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { return <div className="toast"><CircleAlert size={18} /><span>{message}</span><button onClick={onClose} aria-label="Fermer"><X size={15} /></button></div> }

function ActorSelect({ people, actor, setActor }: { people: Person[]; actor: string; setActor: (value: string) => void }) {
  return <label className="actor-select"><span className="actor-avatar"><UserRound size={15} /></span><span className="actor-label">I am</span><select value={actor} onChange={event => setActor(event.target.value)}>{people.filter(person => ['manager', 'encadrant', 'rh', 'paie', 'it', 'moyens_generaux'].includes(person.role)).map(person => <option key={person.person_ref} value={person.person_ref}>{person.full_name}</option>)}</select></label>
}

function Dashboard({ cases, steps, events, conflicts, onOpen }: { cases: Case[]; steps: Step[]; events: Event[]; conflicts: ReturnType<typeof useConflicts>['data']; onOpen: (caseId: string) => void }) {
  const today = new Date(); const in7 = new Date(today.getTime() + 7 * 86400000); const in14 = new Date(today.getTime() + 14 * 86400000)
  const deadlines = steps.filter(step => ['PENDING', 'OVERDUE'].includes(step.status) && new Date(step.due_date) <= in7).length
  const closureDays = cases.filter(item => item.status === 'CLOSED' && item.closed_at).map(item => (new Date(item.closed_at!).getTime() - new Date(item.created_at).getTime()) / 86400000)
  const average = closureDays.length ? `${(closureDays.reduce((a, b) => a + b, 0) / closureDays.length).toFixed(1)}j` : '—'
  const probation = cases.filter(item => item.journey_type === 'probation' && steps.some(step => step.case_id === item.case_id && step.status === 'PENDING' && new Date(step.due_date) <= in7))
  const evaluations = steps.filter(step => step.step_name.toLowerCase().includes('valuation') && step.status === 'PENDING')
  const departures = cases.filter(item => item.journey_type === 'offboarding' && item.status === 'OPEN')
  const contracts = cases.filter(item => item.contract_end_date && new Date(item.contract_end_date) >= today && new Date(item.contract_end_date) <= in14)
  const terminalDecisions = steps.filter(step => step.decision && TERMINAL_DECISIONS.includes(step.decision)).length
  const recentDecisions = [...events].filter(event => event.decision).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 10)
  const blockReasons = Object.entries(steps.filter(step => step.status === 'BLOCKED').reduce<Record<string, number>>((acc, step) => {
    const key = step.decision || 'Non précisé'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1])
  return <><div className="page-intro"><div><p className="eyebrow">Vue d'ensemble / 07 SEPT 2026</p><h1>Bonjour, Camille <span className="title-dot">•</span></h1><p className="subtle">Voici ce qui mérite votre attention aujourd'hui.</p></div><div className="live-indicator"><span /> Actualisé à l'instant</div></div><div className="kpi-grid"><KpiCard label="Processus suivis" value={cases.length} icon={BarChart3} tone="blue" /><KpiCard label="Échéances détectées" value={deadlines} icon={Clock3} tone="amber" /><KpiCard label="Rappels envoyés" value={events.filter(event => event.event_type === 'REMINDER_SENT').length} icon={Bell} tone="mint" /><KpiCard label="Escalades déclenchées" value={events.filter(event => event.event_type === 'ESCALATED').length} icon={AlertTriangle} tone="coral" /><KpiCard label="Dossiers bloqués" value={cases.filter(item => item.status === 'BLOCKED').length} icon={ShieldAlert} tone="violet" /><KpiCard label="Décisions terminales" value={terminalDecisions} icon={Gavel} tone="slate" /><KpiCard label="Clôture moyenne" value={average} icon={Activity} tone="slate" /></div><div className="section-grid"><SectionCard title="Périodes d'essai proches de l'échéance" eyebrow="À surveiller"><CaseList items={probation} onOpen={onOpen} /></SectionCard><SectionCard title="Évaluations en attente" eyebrow="Action requise"><StepList items={evaluations} /></SectionCard><SectionCard title="Décisions récentes" eyebrow="Journal des décisions"><DecisionFeed events={recentDecisions} onOpen={onOpen} /></SectionCard><SectionCard title="Blocages par motif" eyebrow="Pourquoi les dossiers sont bloqués"><BlockReasons rows={blockReasons} /></SectionCard><SectionCard title="Départs en cours" eyebrow="Opérations"><CaseList items={departures} onOpen={onOpen} /></SectionCard><SectionCard title="Conflits ouverts" eyebrow="Attention"><ConflictList conflicts={conflicts.filter(item => item.status === 'OPEN')} /></SectionCard><SectionCard title="Contrats à échéance" eyebrow="Prochaines 14 jours"><CaseList items={contracts} showDate onOpen={onOpen} /></SectionCard><SectionCard title="Niveau de risque par dossier" eyebrow="Portefeuille"><div className="risk-list">{[...cases].sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.risk_level] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.risk_level])).map(item => <button className="risk-row compact-button" key={item.case_id} onClick={() => onOpen(item.case_id)}><div><strong>{item.case_id}</strong><span>{item.subject?.full_name}</span></div><RiskBadge risk={item.risk_level} /></button>)}</div></SectionCard></div></>
}
function CaseList({ items, showDate = false, onOpen }: { items: Case[]; showDate?: boolean; onOpen?: (caseId: string) => void }) { return items.length ? <div className="compact-list">{items.map(item => <button className="compact-row compact-button" key={item.case_id} onClick={() => onOpen?.(item.case_id)}><div className="case-avatar">{initials(item.subject?.full_name || '?')}</div><div className="row-main"><strong>{item.subject?.full_name || item.case_id}</strong><span>{journeyLabel(item.journey_type)} · {item.case_id}</span></div>{showDate ? <span className="date">{formatDate(item.contract_end_date)}</span> : <RiskBadge risk={item.risk_level} />}</button>)}</div> : <EmptyState /> }
function StepList({ items }: { items: Step[] }) { return items.length ? <div className="compact-list">{items.map(item => <div className="compact-row" key={item.id}><div className="tiny-icon"><FileCheck2 size={15} /></div><div className="row-main"><strong>{item.step_name}</strong><span>{item.case_id} · {item.owner?.full_name || item.owner_role}</span></div><span className="date">{formatDate(item.due_date)}</span></div>)}</div> : <EmptyState /> }
function ConflictList({ conflicts }: { conflicts: ReturnType<typeof useConflicts>['data'] }) { return conflicts.length ? <div className="compact-list">{conflicts.map(item => <div className="compact-row" key={item.id}><div className="tiny-icon coral"><AlertTriangle size={15} /></div><div className="row-main"><strong>{item.description}</strong><span>{item.case_id} · Ouvert le {formatDate(item.opened_at)}</span></div></div>)}</div> : <EmptyState /> }
function DecisionFeed({ events, onOpen }: { events: Event[]; onOpen: (caseId: string) => void }) {
  return events.length ? <div className="compact-list">{events.map(event => <button className="compact-row compact-button" key={event.id} onClick={() => onOpen(event.case_id)}><div className="tiny-icon"><Gavel size={15} /></div><div className="row-main"><strong>{event.case_id}</strong><span>{event.actor} · {formatTime(event.created_at)}</span></div><DecisionBadge decision={event.decision} /></button>)}</div> : <EmptyState text="Aucune décision enregistrée" />
}
function BlockReasons({ rows }: { rows: [string, number][] }) {
  return rows.length ? <div className="compact-list">{rows.map(([reason, count]) => <div className="compact-row" key={reason}><div className="tiny-icon coral"><ShieldAlert size={15} /></div><div className="row-main"><strong><DecisionLabel decision={reason} /></strong><span>{count} dossier{count > 1 ? 's' : ''} bloqué{count > 1 ? 's' : ''}</span></div><span className="count-pill">{count}</span></div>)}</div> : <EmptyState text="Aucun blocage" />
}
function DecisionLabel({ decision }: { decision: string }) {
  if (decision === 'Non précisé') return <>Non précisé</>
  return <DecisionBadge decision={decision} />
}

function TaskCaseGroup({ sectionKey, caseItem, caseSteps, actor, expandedKey, setExpandedKey, onValidated }: {
  sectionKey: string
  caseItem: Case
  caseSteps: Step[]
  actor: string
  expandedKey: string | null
  setExpandedKey: (key: string | null) => void
  onValidated: (message?: string) => void
}) {
  const sortedSteps = [...caseSteps].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const groupKey = `${sectionKey}-${caseItem.case_id}`
  const isExpanded = expandedKey === groupKey
  const nextStep = sortedSteps[0]
  const hasOverdue = sortedSteps.some(s => s.status === 'OVERDUE')
  return <div>
    <button className="task-item compact-button" onClick={() => setExpandedKey(isExpanded ? null : groupKey)} style={{cursor: 'pointer'}}>
      <div className="task-row">
        <div><strong>{caseItem.subject?.full_name || caseItem.case_id}</strong><span>{caseItem.case_id}{caseItem.subject?.person_ref ? ` · ${caseItem.subject.person_ref}` : ''}</span></div>
        <div><span className="muted">{sortedSteps.length} étape{sortedSteps.length > 1 ? 's' : ''}</span></div>
        <div className={hasOverdue ? 'date overdue' : 'date'}>{formatDate(nextStep.due_date)}<small>{hasOverdue ? 'En retard' : 'À venir'}</small></div>
        <StatusBadge status={hasOverdue ? 'OVERDUE' : 'PENDING'} />
      </div>
    </button>
    {isExpanded && <div className="nested-steps">{sortedSteps.map(step => (
      <div className="task-item nested" key={step.id}>
        <div className="task-row">
          <div className="task-step">{step.step_name}</div>
          <div className={step.status === 'OVERDUE' ? 'date overdue' : 'date'}>{formatDate(step.due_date)}<small>{step.status === 'OVERDUE' ? 'En retard' : 'À venir'}</small></div>
          <StatusBadge status={step.status} />
          <div className="task-decision">{step.decision ? <DecisionBadge decision={step.decision} /> : <span className="muted">—</span>}</div>
        </div>
        <div className="task-panel">
          <DecisionPanel step={{ id: step.id, case_id: step.case_id, owner_role: step.owner_role, step_name: step.step_name }} actor={actor} journeyType={caseItem.journey_type || ''} onSuccess={onValidated} />
        </div>
      </div>
    ))}</div>}
  </div>
}

function Tasks({ actor, steps, cases, onValidated }: { actor: string; steps: Step[]; cases: Case[]; onValidated: (message?: string) => void }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const caseFor = (caseId: string) => cases.find(c => c.case_id === caseId)

  const urgentSteps = useMemo(() => steps.filter(step => isUrgent(step.due_date)), [steps])
  const laterSteps = useMemo(() => steps.filter(step => !isUrgent(step.due_date)), [steps])
  const urgentGroups = useMemo(() => groupStepsByCase(urgentSteps), [urgentSteps])
  const laterGroups = useMemo(() => groupStepsByCase(laterSteps), [laterSteps])

  return <>
    <div className="page-intro compact"><div><p className="eyebrow">Mon espace de travail</p><h1>Mes tâches <span className="count-pill">{urgentSteps.length}</span></h1><p className="subtle">Les stagiaires qui attendent votre validation.</p></div></div>
    <section className="table-card">
      <div className="table-toolbar"><div><strong>À traiter maintenant</strong><span>Priorisées par échéance</span></div><span className="filter-chip"><Activity size={14} /> {actor}</span></div>
      <div className="task-table">
        <div className="task-header"><span>Dossier</span><span>Tâches en attente</span><span>Prochaine échéance</span><span>Statut</span></div>
        {urgentGroups.length ? urgentGroups.map(([caseId, caseSteps]) => {
          const caseItem = caseFor(caseId)
          if (!caseItem) return null
          return <TaskCaseGroup key={caseId} sectionKey="urgent" caseItem={caseItem} caseSteps={caseSteps} actor={actor} expandedKey={expandedKey} setExpandedKey={setExpandedKey} onValidated={onValidated} />
        }) : <EmptyState text="Aucune tâche urgente pour cet acteur" />}
      </div>
    </section>
    {laterGroups.length > 0 && (
      <section className="table-card upcoming">
        <div className="table-toolbar"><div><strong>À venir</strong><span>Échéances au-delà de 7 jours</span></div><span className="count-pill muted-pill">À venir ({laterSteps.length})</span></div>
        <div className="task-table">
          <div className="task-header"><span>Dossier</span><span>Tâches en attente</span><span>Prochaine échéance</span><span>Statut</span></div>
          {laterGroups.map(([caseId, caseSteps]) => {
            const caseItem = caseFor(caseId)
            if (!caseItem) return null
            return <TaskCaseGroup key={caseId} sectionKey="later" caseItem={caseItem} caseSteps={caseSteps} actor={actor} expandedKey={expandedKey} setExpandedKey={setExpandedKey} onValidated={onValidated} />
          })}
        </div>
      </section>
    )}
  </>
}

function CaseDetail({ selectedCase, steps, events, conflicts, actor, onValidated }: { selectedCase: Case; steps: Step[]; events: Event[]; conflicts: ReturnType<typeof useConflicts>['data']; actor: string; onValidated: () => void }) {
  const caseSteps = steps.filter(step => step.case_id === selectedCase.case_id); const top = caseSteps.filter(step => !step.parent_step_id)
  return <><div className="detail-header"><div className="back-label">Dossier / {selectedCase.case_id}</div><div className="detail-title"><div className="case-avatar large">{initials(selectedCase.subject?.full_name || '?')}</div><div><h1>{selectedCase.subject?.full_name}</h1><p>{journeyLabel(selectedCase.journey_type)} · {selectedCase.case_id}</p></div><StatusBadge status={selectedCase.status} /><RiskBadge risk={selectedCase.risk_level} /></div><div className="detail-meta"><span><b>Début</b>{formatDate(selectedCase.start_date)}</span><span><b>Fin de contrat</b>{formatDate(selectedCase.contract_end_date)}</span><span><b>Étapes</b>{caseSteps.filter(step => step.status === 'VALIDATED').length}/{caseSteps.length} validées</span><span><b>Encadrant</b>{selectedCase.encadrant?.full_name || '— not yet assigned —'}</span></div></div><div className="detail-grid"><SectionCard title="Parcours de validation" eyebrow="Étapes du dossier"><div className="step-tree">{top.length ? top.map(step => <div key={step.id}><StepRow step={step} actor={actor} journeyType={selectedCase.journey_type} onValidateSuccess={onValidated} />{caseSteps.filter(child => child.parent_step_id === step.id).map(child => <StepRow key={child.id} step={child} actor={actor} journeyType={selectedCase.journey_type} onValidateSuccess={onValidated} nested />)}</div>) : <EmptyState />}</div></SectionCard><div className="side-stack"><SectionCard title="Chronologie" eyebrow="Dernières activités"><Timeline events={events.filter(event => event.case_id === selectedCase.case_id)} /></SectionCard><SectionCard title="Conflits" eyebrow="Signalements"><ConflictList conflicts={conflicts.filter(item => item.case_id === selectedCase.case_id)} /></SectionCard></div></div></>
}
function Timeline({ events }: { events: Event[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return events.length ? <div className="timeline">{[...events].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).map(event => {
    const hasDetails = event.details && Object.keys(event.details).length > 0
    return <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><div className="timeline-top"><strong>{event.event_type}</strong><small>{formatTime(event.created_at)}</small></div>{event.decision && <div className="timeline-decision"><DecisionBadge decision={event.decision} /></div>}<p>{event.note || 'Événement enregistré'}</p><span className="timeline-actor">{event.actor}</span>{hasDetails && <button className="timeline-toggle" onClick={() => setOpen(open === event.id ? null : event.id)}>{open === event.id ? 'Masquer les détails' : 'Voir les détails'}</button>}{open === event.id && <DetailsList details={event.details} />}</div></div>
  })}</div> : <EmptyState text="Aucun événement" />
}

export default function App() {
  const { data: cases, refetch: refetchCases } = useCases(); const { data: steps, refetch: refetchSteps } = useSteps(); const { data: events, refetch: refetchEvents } = useEvents(); const { data: people } = usePeople(); const { data: conflicts } = useConflicts()
  const [actor, setActor] = useState('MGR-004'); const [page, setPage] = useState(window.location.pathname); const [toast, setToast] = useState(''); const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.case_id || 'CASE-PRO-STG-001')
  const navigate = (path: string) => { window.history.pushState({}, '', path); setPage(path) }

  // Manager-specific tasks from Supabase query
  const actorPerson = people.find(p => p.person_ref === actor)
  const { cases: managerCases, steps: managerSteps, refetch: refetchManagerTasks } = useManagerTasks(actorPerson?.id)

  const decoratedCases = useMemo(() => cases.map(item => ({ ...item, subject: item.subject || people.find(person => person.id === item.subject_person_id), encadrant: item.encadrant || (item.encadrant_person_id != null ? people.find(person => person.id === item.encadrant_person_id) : undefined) })), [cases, people])
  const selectedCase = decoratedCases.find(item => item.case_id === selectedCaseId) || decoratedCases[0]
  const decoratedSteps = useMemo(() => steps.map(step => ({ ...step, owner: step.owner || people.find(person => person.id === step.owner_person_id) })), [steps, people])
  const decoratedManagerSteps = useMemo(() => managerSteps.map(step => ({ ...step, owner: step.owner || people.find(person => person.id === step.owner_person_id) })), [managerSteps, people])
  const decoratedManagerCases = useMemo(() => managerCases.map(item => ({ ...item, subject: item.subject || people.find(person => person.id === item.subject_person_id) })), [managerCases, people])
  const urgentManagerStepCount = useMemo(() => decoratedManagerSteps.filter(step => isUrgent(step.due_date)).length, [decoratedManagerSteps])
  const refetchAll = () => Promise.all([refetchSteps(), refetchCases(), refetchEvents(), refetchManagerTasks()])
  // Fusion processes the decision asynchronously, so poll a few times for the DB write to land.
  const onValidated = async (message?: string) => {
    setToast('Décision enregistrée — synchronisation…')
    for (const delay of [0, 2500, 6000]) {
      await new Promise(resolve => setTimeout(resolve, delay))
      await refetchAll()
    }
    setToast(message || 'Décision enregistrée')
  }
  const openCase = (caseId: string) => { setSelectedCaseId(caseId); navigate(`/case/${caseId}`) }
  const pageContent = page === '/intake' ? <Intake /> : page === '/tasks' ? <Tasks actor={actor} steps={decoratedManagerSteps} cases={decoratedManagerCases} onValidated={onValidated} /> : page.startsWith('/case/') && selectedCase ? <CaseDetail selectedCase={selectedCase} steps={decoratedSteps} events={events} conflicts={conflicts} actor={actor} onValidated={onValidated} /> : <Dashboard cases={decoratedCases} steps={decoratedSteps} events={events} conflicts={conflicts} onOpen={openCase} />
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><img src={logo} alt="smartRH — Intelligent HR Tracking System" className="brand-logo" /></div><nav><button className={page === '/' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('/')}><LayoutDashboard size={17} />Vue d'ensemble</button><button className={page === '/tasks' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('/tasks')}><Check size={17} />Mes tâches<span className="nav-count">{urgentManagerStepCount}</span></button><button className={page === '/intake' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('/intake')}><UserPlus size={17} />Nouveau dossier</button></nav><div className="sidebar-foot"><div className="sync-dot" />{hasSupabaseConfig ? 'Supabase connecté' : 'Mode démonstration'}<small>Phase 2 · HR operations</small></div></aside><main className="main"><header className="topbar"><button className="mobile-menu"><Menu size={19} /></button><span className="breadcrumb">HR journey tracker <ChevronRight size={14} /> <b>{page === '/intake' ? 'Nouveau dossier' : page === '/tasks' ? 'Mes tâches' : page.startsWith('/case/') ? 'Détail dossier' : "Vue d'ensemble"}</b></span><ActorSelect people={people} actor={actor} setActor={setActor} /></header><div className="content">{pageContent}</div></main>{toast && <Toast message={toast} onClose={() => setToast('')} />}</div>
}
