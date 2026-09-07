// src/components/DecisionPanel.tsx
import { useMemo, useState } from 'react'
import { Check, ShieldAlert } from 'lucide-react'
import { useValidateStep } from '../hooks/useValidateStep'
import { useDecisionOptions } from '../hooks/useDecisionOptions'
import DetailsFields from './DetailsFields'
import type { DecisionAction } from '../types'

export interface PanelStep {
  id: number
  case_id: string
  owner_role: string
}

interface DecisionPanelProps {
  step: PanelStep
  actor: string
  journeyType: string
  onSuccess: () => void
}

const TERMINAL_WARNING = '⚠️ Cette décision met fin au parcours ou le réoriente.'

/**
 * Two-stage action UI: "Valider" / "Bloquer" buttons that expand into a panel
 * with a required decision select, role-specific detail fields and a note.
 */
export default function DecisionPanel({ step, actor, journeyType, onSuccess }: DecisionPanelProps) {
  const { submit, loading, error } = useValidateStep()
  const { forAction } = useDecisionOptions(step.owner_role)

  const [action, setAction] = useState<DecisionAction | null>(null)
  const [decision, setDecision] = useState('')
  const [details, setDetails] = useState<Record<string, unknown>>({})
  const [note, setNote] = useState('')

  const options = useMemo(() => (action ? forAction(action) : []), [action, forAction])
  const selected = options.find(o => o.decision === decision)

  const open = (next: DecisionAction) => {
    setAction(next)
    setDecision('')
    setDetails({})
    setNote('')
  }
  const reset = () => {
    setAction(null)
    setDecision('')
    setDetails({})
    setNote('')
  }

  const confirm = async () => {
    if (!action || !decision) return
    const response = await submit({
      case_id: step.case_id,
      step_id: step.id,
      action,
      actor,
      note: note.trim() || undefined,
      decision,
      details: Object.keys(details).length ? details : undefined,
    })
    if (response) {
      reset()
      onSuccess()
    }
    // on error the hook sets `error`; keep the panel open
  }

  if (!action) {
    return (
      <div className="decision-triggers">
        <button className="action validate" onClick={() => open('validate')}>
          <Check size={14} /> Valider
        </button>
        <button className="action block" onClick={() => open('block')}>
          <ShieldAlert size={14} /> Bloquer
        </button>
      </div>
    )
  }

  return (
    <div className="decision-panel">
      <div className="decision-panel-head">
        {action === 'validate' ? 'Valider l’étape' : 'Bloquer l’étape'} · {step.owner_role}
      </div>

      <label className="decision-field">
        <span>Décision *</span>
        <select value={decision} onChange={e => setDecision(e.target.value)}>
          <option value="">— Choisir une décision —</option>
          {options.map(o => (
            <option key={o.decision} value={o.decision}>{o.label_fr}</option>
          ))}
        </select>
      </label>

      {selected?.is_terminal && <p className="decision-terminal">{TERMINAL_WARNING}</p>}

      <DetailsFields
        ownerRole={step.owner_role}
        journeyType={journeyType}
        value={details}
        onChange={setDetails}
      />

      <label className="decision-field">
        <span>Note (facultative)</span>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} />
      </label>

      {error && <p className="decision-error">{error}</p>}

      <div className="decision-panel-actions">
        <button
          className="action validate"
          disabled={!decision || loading}
          onClick={confirm}
        >
          {loading ? 'Envoi…' : 'Confirmer'}
        </button>
        <button className="action ghost" disabled={loading} onClick={reset}>
          Annuler
        </button>
      </div>
    </div>
  )
}
