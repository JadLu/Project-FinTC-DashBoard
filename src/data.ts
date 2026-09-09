import type { Case, Conflict, DecisionOption, Event, Person, RiskAnalysis, Step } from './types'

const today = new Date()
const date = (offset: number) => new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10)
export const demoPeople: Person[] = [
  { id: 1, person_ref: 'MGR-004', full_name: 'Sophie Martin', email: 'sophie@orbit.fr', role: 'manager' },
  { id: 2, person_ref: 'RH-002', full_name: 'Camille Bernard', email: 'camille@orbit.fr', role: 'rh' },
  { id: 3, person_ref: 'IT-007', full_name: 'Yanis Haddad', email: 'yanis@orbit.fr', role: 'it' },
  { id: 4, person_ref: 'STG-019', full_name: 'Lina Moreau', email: 'lina@orbit.fr', role: 'stagiaire' },
  { id: 5, person_ref: 'ENC-003', full_name: 'Marc Petit', email: 'marc@orbit.fr', role: 'encadrant' },
]
export const demoCases: Case[] = [
  { id: 1, case_id: 'CASE-PRO-STG-001', subject_person_id: 4, journey_type: 'probation', start_date: date(-72), contract_end_date: date(12), status: 'OPEN', risk_level: 'MEDIUM', created_at: date(-72), closed_at: null, subject: demoPeople[3], encadrant_person_id: null },
  { id: 2, case_id: 'CASE-OFF-004', subject_person_id: 5, journey_type: 'offboarding', start_date: date(-430), contract_end_date: date(4), status: 'OPEN', risk_level: 'HIGH', created_at: date(-12), closed_at: null, subject: demoPeople[4], encadrant_person_id: null },
  { id: 3, case_id: 'CASE-REN-002', subject_person_id: 1, journey_type: 'renewal', start_date: date(-330), contract_end_date: date(8), status: 'BLOCKED', risk_level: 'HIGH', created_at: date(-30), closed_at: null, subject: demoPeople[0], encadrant_person_id: null },
  { id: 4, case_id: 'CASE-CLOSED-008', subject_person_id: 4, journey_type: 'probation', start_date: date(-180), contract_end_date: date(-5), status: 'CLOSED', risk_level: 'LOW', created_at: date(-180), closed_at: date(-10), subject: demoPeople[3], encadrant_person_id: null },
]
export const demoSteps: Step[] = [
  { id: 101, case_id: 'CASE-PRO-STG-001', step_name: 'Évaluation manager', owner_person_id: 1, owner_role: 'manager', due_date: date(2), status: 'PENDING', validated_at: null, reminders_sent: 1, escalated: false, parent_step_id: null, owner: demoPeople[0], decision: null, details: null },
  { id: 102, case_id: 'CASE-PRO-STG-001', step_name: 'Collecte feedback équipe', owner_person_id: 5, owner_role: 'encadrant', due_date: date(3), status: 'PENDING', validated_at: null, reminders_sent: 0, escalated: false, parent_step_id: 101, owner: demoPeople[4], decision: null, details: null },
  { id: 103, case_id: 'CASE-PRO-STG-001', step_name: 'Validation RH', owner_person_id: 2, owner_role: 'rh', due_date: date(6), status: 'PENDING', validated_at: null, reminders_sent: 0, escalated: false, parent_step_id: null, owner: demoPeople[1], decision: null, details: null },
  { id: 201, case_id: 'CASE-OFF-004', step_name: 'Restitution matériel IT', owner_person_id: 3, owner_role: 'it', due_date: date(-1), status: 'OVERDUE', validated_at: null, reminders_sent: 2, escalated: true, parent_step_id: null, owner: demoPeople[2], decision: null, details: null },
  { id: 202, case_id: 'CASE-OFF-004', step_name: 'Entretien de départ', owner_person_id: 2, owner_role: 'rh', due_date: date(5), status: 'PENDING', validated_at: null, reminders_sent: 0, escalated: false, parent_step_id: null, owner: demoPeople[1], decision: null, details: null },
  { id: 301, case_id: 'CASE-REN-002', step_name: 'Contrôle budget renouvellement', owner_person_id: 1, owner_role: 'manager', due_date: date(8), status: 'BLOCKED', validated_at: null, reminders_sent: 1, escalated: false, parent_step_id: null, owner: demoPeople[0], decision: 'MISSING_INFO', details: { objectives_met: '2/3', feedback: 'Budget prévisionnel non transmis par le contrôle de gestion.' } },
]
export const demoEvents: Event[] = [
  { id: 1, case_id: 'CASE-OFF-004', step_id: 201, event_type: 'ESCALATED', actor: 'Fusion AI', note: 'Échéance dépassée', created_at: new Date(Date.now() - 86400000).toISOString(), decision: null, details: null },
  { id: 2, case_id: 'CASE-PRO-STG-001', step_id: 101, event_type: 'REMINDER_SENT', actor: 'Fusion AI', note: 'Rappel automatique envoyé', created_at: new Date(Date.now() - 172800000).toISOString(), decision: null, details: null },
  { id: 3, case_id: 'CASE-REN-002', step_id: 301, event_type: 'BLOCKED', actor: 'MGR-004', note: 'Budget à confirmer', created_at: new Date(Date.now() - 259200000).toISOString(), decision: 'MISSING_INFO', details: { objectives_met: '2/3', feedback: 'Budget prévisionnel non transmis par le contrôle de gestion.' } },
  { id: 4, case_id: 'CASE-CLOSED-008', step_id: null, event_type: 'STEP_VALIDATED', actor: 'MGR-004', note: null, created_at: new Date(Date.now() - 900000000).toISOString(), decision: 'CONTINUE', details: { performance_rating: '4', objectives_met: '3/3', proficiency: 'Autonome' } },
]

// Mirrors the decision_options table: (owner_role, action, decision, label_fr, is_terminal, sort_order)
export const demoDecisionOptions: DecisionOption[] = [
  { owner_role: 'manager', action: 'validate', decision: 'CONTINUE', label_fr: 'Poursuivre la période d’essai', is_terminal: false, sort_order: 1 },
  { owner_role: 'manager', action: 'validate', decision: 'CONTINUE_RESERVE', label_fr: 'Poursuivre avec réserves', is_terminal: false, sort_order: 2 },
  { owner_role: 'manager', action: 'block', decision: 'EXTEND', label_fr: 'Prolonger la période d’essai', is_terminal: true, sort_order: 1 },
  { owner_role: 'manager', action: 'block', decision: 'TERMINATE', label_fr: 'Mettre fin au contrat', is_terminal: true, sort_order: 2 },
  { owner_role: 'manager', action: 'block', decision: 'MISSING_INFO', label_fr: 'Informations manquantes', is_terminal: false, sort_order: 3 },
  { owner_role: 'encadrant', action: 'validate', decision: 'CONTINUE', label_fr: 'Feedback favorable', is_terminal: false, sort_order: 1 },
  { owner_role: 'encadrant', action: 'block', decision: 'MISSING_INFO', label_fr: 'Feedback insuffisant', is_terminal: false, sort_order: 1 },
  { owner_role: 'rh', action: 'validate', decision: 'CONFIRM', label_fr: 'Valider la décision RH', is_terminal: true, sort_order: 1 },
  { owner_role: 'rh', action: 'block', decision: 'MISSING_INFO', label_fr: 'Dossier incomplet', is_terminal: false, sort_order: 1 },
  { owner_role: 'rh', action: 'block', decision: 'LEGAL_HOLD', label_fr: 'Blocage juridique', is_terminal: false, sort_order: 2 },
  { owner_role: 'paie', action: 'validate', decision: 'DONE', label_fr: 'Paie traitée', is_terminal: false, sort_order: 1 },
  { owner_role: 'paie', action: 'block', decision: 'MISSING_INFO', label_fr: 'Données de paie manquantes', is_terminal: false, sort_order: 1 },
  { owner_role: 'it', action: 'validate', decision: 'DONE', label_fr: 'Accès et matériel traités', is_terminal: false, sort_order: 1 },
  { owner_role: 'it', action: 'block', decision: 'HANDOVER_PENDING', label_fr: 'Passation en attente', is_terminal: false, sort_order: 1 },
  { owner_role: 'it', action: 'block', decision: 'MISSING_INFO', label_fr: 'Informations manquantes', is_terminal: false, sort_order: 2 },
  { owner_role: 'moyens_generaux', action: 'validate', decision: 'DONE', label_fr: 'Restitution complète', is_terminal: false, sort_order: 1 },
  { owner_role: 'moyens_generaux', action: 'block', decision: 'HANDOVER_PENDING', label_fr: 'Restitution incomplète', is_terminal: false, sort_order: 1 },
]
export const demoConflicts: Conflict[] = [{ id: 1, case_id: 'CASE-REN-002', description: 'Dates contractuelles incohérentes avec le dossier de paie.', status: 'OPEN', opened_at: date(-3), resolved_at: null }]

// Mirrors hr_risk_analysis: the report Fusion Phase 4 writes after each RiskAgent run.
export const demoRiskAnalysis: RiskAnalysis[] = [{
  id: 1,
  generated_at: new Date(Date.now() - 3600000).toISOString(),
  summary: "Trois dossiers restent ouverts. Le renouvellement CASE-REN-002 est bloqué sur le contrôle budgétaire et concentre l'essentiel du risque ; l'offboarding CASE-OFF-004 accumule une restitution IT en retard à quatre jours de la fin de contrat.",
  kpis: { total_open: 3, high: 2, medium: 1, low: 0, blocked: 1, overdue_steps: 1 },
  prioritized: [
    { case_id: 'CASE-REN-002', risk_level: 'HIGH', reasons: ['Étape « Contrôle budget renouvellement » bloquée (manager)', 'Conflit ouvert sur les dates contractuelles', 'Fin de contrat dans 8 jours'], recommended_action: 'Relancer le contrôle de gestion pour le budget prévisionnel et arbitrer le conflit de dates avec la RH.' },
    { case_id: 'CASE-OFF-004', risk_level: 'HIGH', reasons: ['Restitution matériel IT en retard depuis 1 jour', 'Escalade déjà déclenchée'], recommended_action: 'Escalader au responsable IT : la restitution doit être clôturée avant la fin de contrat.' },
    { case_id: 'CASE-PRO-STG-001', risk_level: 'MEDIUM', reasons: ["Évaluation manager due dans 2 jours", 'Feedback équipe non encore collecté'], recommended_action: "Rappeler à Sophie Martin de finaliser l'évaluation avant l'échéance." },
  ],
  model: 'gpt-4o-mini',
  case_count: 3,
}]
