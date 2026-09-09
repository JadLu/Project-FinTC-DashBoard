import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig } from './supabase'
import { useAutoSync, useCases, useConflicts, useEvents, useManagerTasks, usePeople, useRiskAnalysis, useSteps } from './hooks'
import { useTheme } from './hooks/useTheme'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { Toast } from './components/ui'
import { titleForPath } from './lib/nav'
import { isUrgent } from './lib/format'
import { clearSession, readSession, writeSession } from './lib/session'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import CaseDetail from './pages/CaseDetail'
import Alerts from './pages/Alerts'
import Dossiers from './pages/Dossiers'
import Parcours from './pages/Parcours'
import Conflicts from './pages/Conflicts'
import Documents from './pages/Documents'
import Analysis from './pages/Analysis'
import Reports from './pages/Reports'
import Intake from './pages/Intake'
import type { JourneyType, Person } from './types'

const DEFAULT_ACTOR = 'MGR-004'

export default function App() {
  const { data: cases, refetch: refetchCases } = useCases()
  const { data: steps, refetch: refetchSteps } = useSteps()
  const { data: events, refetch: refetchEvents } = useEvents()
  const { data: people } = usePeople()
  const { data: conflicts } = useConflicts()
  const { data: riskAnalyses, refetch: refetchRiskAnalysis } = useRiskAnalysis()

  const initialSessionRef = readSession()
  const [actor, setActor] = useState(initialSessionRef || DEFAULT_ACTOR)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialSessionRef))
  const [page, setPage] = useState(window.location.pathname)
  const [toast, setToast] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.case_id || 'CASE-PRO-STG-001')
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path)
    setPage(path)
    setMenuOpen(false)
    window.scrollTo({ top: 0 })
  }, [])

  // Keep the shell in sync with the browser's back/forward buttons.
  useEffect(() => {
    const onPop = () => setPage(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => { document.title = `${titleForPath(page)} · smartRH` }, [page])

  // If a stored session points at a person that no longer exists, drop back to the login screen.
  useEffect(() => {
    if (isAuthenticated && people.length > 0 && !people.some(person => person.person_ref === actor)) {
      clearSession()
      setIsAuthenticated(false)
    }
  }, [isAuthenticated, people, actor])

  const actorPerson = people.find(person => person.person_ref === actor)
  const { cases: managerCases, steps: managerSteps, refetch: refetchManagerTasks } = useManagerTasks(actorPerson?.id)

  const decoratedCases = useMemo(() => cases.map(item => ({
    ...item,
    subject: item.subject || people.find(person => person.id === item.subject_person_id),
    encadrant: item.encadrant || (item.encadrant_person_id != null ? people.find(person => person.id === item.encadrant_person_id) : undefined),
  })), [cases, people])
  const decoratedSteps = useMemo(() => steps.map(step => ({
    ...step,
    owner: step.owner || people.find(person => person.id === step.owner_person_id),
  })), [steps, people])
  const decoratedManagerSteps = useMemo(() => managerSteps.map(step => ({
    ...step,
    owner: step.owner || people.find(person => person.id === step.owner_person_id),
  })), [managerSteps, people])
  const decoratedManagerCases = useMemo(() => managerCases.map(item => ({
    ...item,
    subject: item.subject || people.find(person => person.id === item.subject_person_id),
  })), [managerCases, people])

  const selectedCase = decoratedCases.find(item => item.case_id === selectedCaseId) || decoratedCases[0]
  const urgentManagerStepCount = useMemo(
    () => decoratedManagerSteps.filter(step => isUrgent(step.due_date)).length,
    [decoratedManagerSteps],
  )
  // Phase 4 appends one row per run; the Analyse IA page shows the most recent one.
  const latestAnalysis = useMemo(
    () => [...riskAnalyses].sort((a, b) => +new Date(b.generated_at) - +new Date(a.generated_at))[0],
    [riskAnalyses],
  )
  const alertCount = useMemo(() => decoratedSteps.filter(step => step.status === 'OVERDUE').length, [decoratedSteps])

  const refetchAll = useCallback(
    () => Promise.all([refetchSteps(), refetchCases(), refetchEvents(), refetchManagerTasks(), refetchRiskAnalysis()]),
    [refetchSteps, refetchCases, refetchEvents, refetchManagerTasks, refetchRiskAnalysis],
  )
  useAutoSync(refetchAll)

  // Fusion processes the decision asynchronously, so poll a few times for the DB write to land.
  const onValidated = async (message?: string) => {
    setToast('Décision enregistrée — synchronisation…')
    for (const delay of [0, 2500, 6000]) {
      await new Promise(resolve => setTimeout(resolve, delay))
      await refetchAll()
    }
    setToast(message || 'Décision enregistrée')
  }

  const openCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId)
    navigate(`/case/${caseId}`)
  }, [navigate])

  const onLogin = (person: Person, remember: boolean) => {
    setActor(person.person_ref)
    writeSession(person.person_ref, remember)
    setIsAuthenticated(true)
    navigate('/')
  }

  const onLogout = () => {
    clearSession()
    setIsAuthenticated(false)
    setActor(DEFAULT_ACTOR)
    navigate('/')
    setToast('Déconnecté.')
  }

  const renderPage = () => {
    if (page === '/intake') return <Intake />
    if (page === '/tasks') return <Tasks actor={actor} steps={decoratedManagerSteps} cases={decoratedManagerCases} onValidated={onValidated} />
    if (page === '/alertes') return <Alerts steps={decoratedSteps} cases={decoratedCases} onOpen={openCase} />
    if (page === '/dossiers') return <Dossiers cases={decoratedCases} steps={decoratedSteps} onOpen={openCase} />
    if (page === '/conflits') return <Conflicts conflicts={conflicts} cases={decoratedCases} onOpen={openCase} />
    if (page === '/documents') return <Documents events={events} cases={decoratedCases} onOpen={openCase} />
    if (page === '/analyse') return <Analysis events={events} cases={decoratedCases} steps={decoratedSteps} analysis={latestAnalysis} onOpen={openCase} />
    if (page === '/rapports') return <Reports cases={decoratedCases} steps={decoratedSteps} events={events} />
    if (page.startsWith('/parcours')) {
      const journey = (page.split('/')[2] || 'probation') as JourneyType
      return <Parcours journey={journey} cases={decoratedCases} steps={decoratedSteps} onOpen={openCase} />
    }
    if (page.startsWith('/case/') && selectedCase) {
      return (
        <CaseDetail
          selectedCase={selectedCase}
          steps={decoratedSteps}
          events={events}
          conflicts={conflicts}
          actor={actor}
          onValidated={onValidated}
          onBack={() => navigate('/dossiers')}
        />
      )
    }
    return <Dashboard cases={decoratedCases} steps={decoratedSteps} events={events} conflicts={conflicts} actorPerson={actorPerson} onOpen={openCase} />
  }

  // Allow unauthenticated access to /apply (intake form for Stagiaires)
  if (!isAuthenticated && page !== '/apply') {
    return (
      <>
        <AuthPage people={people} onLogin={onLogin} onNotice={setToast} />
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </>
    )
  }

  // Render unauthenticated intake form at /apply (clean, no header)
  if (page === '/apply') {
    return (
      <>
        <Intake showHeader={false} />
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        path={page}
        navigate={navigate}
        counts={{ cases: decoratedCases.length, tasks: urgentManagerStepCount, alerts: alertCount }}
        actorPerson={actorPerson}
        people={people}
        setActor={setActor}
        onLogout={onLogout}
        connected={hasSupabaseConfig}
        open={menuOpen}
      />
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />}
      <main className="main">
        <Topbar
          cases={decoratedCases}
          steps={decoratedSteps}
          people={people}
          actorPerson={actorPerson}
          setActor={setActor}
          navigate={navigate}
          openCase={openCase}
          alerts={alertCount}
          theme={theme}
          toggleTheme={toggleTheme}
          onMenu={() => setMenuOpen(value => !value)}
        />
        <div className="content">{renderPage()}</div>
      </main>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
