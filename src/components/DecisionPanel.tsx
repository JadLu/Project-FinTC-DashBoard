// src/components/DecisionPanel.tsx
import { useMemo, useState } from 'react'
import { Check, ShieldAlert } from 'lucide-react'
import { useValidateStep } from '../hooks/useValidateStep'
import { useDecisionOptions } from '../hooks/useDecisionOptions'
import { useEncadrants } from '../hooks/useEncadrants'
import DetailsFields from './DetailsFields'
import type { ValidatePayload } from '../api'
import type { DecisionAction } from '../types'

export interface PanelStep {
  id: number
  case_id: string
  owner_role: string
  step_name: string
}

interface DecisionPanelProps {
  step: PanelStep
  actor: string
  journeyType: string
  onSuccess: (message?: string) => void
}

const TERMINAL_WARNING = '⚠️ Cette décision met fin au parcours ou le réoriente.'
const OBJECTIFS_STEP_NAME = 'Fixer objectifs periode essai'

/**
 * Two-stage action UI: "Valider" / "Bloquer" buttons that expand into a panel
 * with a required decision select, role-specific detail fields and a note.
 */
export default function DecisionPanel({ step, actor, journeyType, onSuccess }: DecisionPanelProps) {
  const { submit, loading, error } = useValidateStep()
  const { forAction } = useDecisionOptions(step.owner_role)
  const { encadrants } = useEncadrants()

  const [action, setAction] = useState<DecisionAction | null>(null)
  const [decision, setDecision] = useState('')
  const [details, setDetails] = useState<Record<string, unknown>>({})
  const [note, setNote] = useState('')
  const [encadrantRef, setEncadrantRef] = useState('')

  const isObjectifsStep = step.step_name === OBJECTIFS_STEP_NAME
  const requiresEncadrant = isObjectifsStep && action === 'validate'

  const options = useMemo(() => (action ? forAction(action) : []), [action, forAction])
  const selected = options.find(o => o.decision === decision)

  const open = (next: DecisionAction) => {
    setAction(next)
    setDecision('')
    setDetails({})
    setNote('')
    setEncadrantRef('')
  }
  const reset = () => {
    setAction(null)
    setDecision('')
    setDetails({})
    setNote('')
    setEncadrantRef('')
  }

  const confirm = async () => {
    if (!action || !decision) return
    if (requiresEncadrant && !encadrantRef) return
    const payload: ValidatePayload = {
      case_id: step.case_id,
      step_id: step.id,
      action,
      actor,
      note: note.trim() || undefined,
      decision,
      details: Object.keys(details).length ? details : undefined,
      ...(requiresEncadrant ? { encadrant_ref: encadrantRef } : {}),
    }
    const response = await submit(payload)
    if (response) {
      const message = response.encadrant_assigned
        ? '✅ Étape validée — Encadrant assigné'
        : undefined
      reset()
      onSuccess(message)
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

      {requiresEncadrant && (
        <label className="decision-field">
          <span>Encadrant (required)</span>
          <select value={encadrantRef} onChange={e => setEncadrantRef(e.target.value)} required>
            <option value="">— Choisir un Encadrant —</option>
            {encadrants.map(enc => (
              <option key={enc.person_ref} value={enc.person_ref}>
                {enc.full_name} ({enc.person_ref})
              </option>
            ))}
          </select>
        </label>
      )}

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
          disabled={!decision || loading || (requiresEncadrant && !encadrantRef)}
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
