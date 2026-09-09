export type JourneyType = 'probation' | 'renewal' | 'offboarding'
export type CaseStatus = 'OPEN' | 'BLOCKED' | 'CLOSED'
export type StepStatus = 'PENDING' | 'VALIDATED' | 'BLOCKED' | 'OVERDUE'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Person { id: number; person_ref: string; full_name: string; email: string; role: string }
export interface Case { id: number; case_id: string; subject_person_id: number; journey_type: JourneyType; start_date: string; contract_end_date: string | null; status: CaseStatus; risk_level: RiskLevel; created_at: string; closed_at: string | null; subject?: Person; encadrant_person_id: number | null; encadrant?: Person }
export interface Step { id: number; case_id: string; step_name: string; owner_person_id: number; owner_role: string; due_date: string; status: StepStatus; validated_at: string | null; reminders_sent: number; escalated: boolean; parent_step_id: number | null; owner?: Person; decision?: string | null; details?: Record<string, unknown> | null }
export interface Event { id: number; case_id: string; step_id: number | null; event_type: string; actor: string; note: string | null; created_at: string; decision?: string | null; details?: Record<string, unknown> | null }
export interface Conflict { id: number; case_id: string; description: string; status: 'OPEN' | 'RESOLVED'; opened_at: string; resolved_at: string | null }

/** Phase 4 (Fusion RiskAgent) writes these three shapes into hr_risk_analysis. */
export interface RiskKpis { total_open: number; high: number; medium: number; low: number; blocked: number; overdue_steps: number }
export interface PrioritizedCase { case_id: string; risk_level: RiskLevel; reasons: string[]; recommended_action: string }
export interface RiskAnalysis { id: number; generated_at: string; summary: string | null; kpis: RiskKpis | null; prioritized: PrioritizedCase[] | null; model: string | null; case_count: number | null }

export type DecisionAction = 'validate' | 'block'
export interface DecisionOption { owner_role: string; action: DecisionAction; decision: string; label_fr: string; is_terminal: boolean; sort_order: number }
