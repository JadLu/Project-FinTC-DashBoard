// src/components/DecisionBadge.tsx
import { useDecisionLabels } from '../hooks/useDecisionOptions'

const TERMINAL = new Set(['EXTEND', 'TERMINATE', 'CONFIRM', 'RENEW', 'OFFBOARD'])

/** Small badge shown next to a status badge when a step/event carries a decision. */
export default function DecisionBadge({ decision }: { decision?: string | null }) {
  const { labelFor, isTerminal } = useDecisionLabels()
  if (!decision) return null
  const terminal = isTerminal(decision) || TERMINAL.has(decision)
  return (
    <span className={`badge decision-badge${terminal ? ' terminal' : ''}`} title={decision}>
      {labelFor(decision) || decision}
    </span>
  )
}
