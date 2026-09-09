// src/components/CaseIntakeForm.tsx
import { useState, type FormEvent } from 'react'
import { Check, CircleAlert, Loader2 } from 'lucide-react'
import { useCreateCase } from '../hooks/useCreateCase'
import type { CreateCasePayload } from '../api'

const JOURNEY_OPTIONS: { label: string; value: CreateCasePayload['journey_type'] }[] = [
  { label: "Période d'essai", value: 'probation' },
  { label: 'Renouvellement de contrat', value: 'renewal' },
  { label: 'Départ / Offboarding', value: 'offboarding' },
]

const EMPTY = {
  person_ref: '',
  full_name: '',
  email: '',
  journey_type: 'probation' as CreateCasePayload['journey_type'],
  start_date: '',
  contract_end_date: '',
}

const fieldClass =
  'h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/30'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--text-3)]'

export default function CaseIntakeForm() {
  const { submit, loading, error } = useCreateCase()
  const [form, setForm] = useState(EMPTY)
  const [success, setSuccess] = useState('')

  const set = (key: keyof typeof EMPTY) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm(current => ({ ...current, [key]: event.target.value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccess('')

    const payload: CreateCasePayload = {
      person_ref: form.person_ref.trim(),
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      journey_type: form.journey_type,
      start_date: form.start_date,
      ...(form.contract_end_date ? { contract_end_date: form.contract_end_date } : {}),
    }

    const response = await submit(payload)
    if (response?.ok) {
      setSuccess(
        response.case_id
          ? `✅ Case created: ${response.case_id}`
          : '✅ Demande envoyée à Fusion. Le dossier apparaîtra sur le tableau de bord après traitement.',
      )
      setForm(EMPTY)
    }
  }

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="mb-6">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.1px] text-[var(--text-3)]">
          Onboarding
        </p>
        <h2 className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight text-[var(--text)]">
          Nouveau dossier stagiaire
        </h2>
        <p className="mt-1.5 text-[13px] text-[var(--text-2)]">
          Renseignez les informations ci-dessous. Le dossier est créé automatiquement dans Fusion.
        </p>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-[var(--green-bg)] bg-[var(--green-bg)] px-4 py-3 text-sm font-medium text-[var(--green-fg)]">
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-[var(--red-bg)] bg-[var(--red-bg)] px-4 py-3 text-sm font-medium text-[var(--red-fg)]">
          <CircleAlert size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate={false} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="person_ref">Matricule *</label>
          <input id="person_ref" className={fieldClass} value={form.person_ref} onChange={set('person_ref')} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="full_name">Nom Complet *</label>
          <input id="full_name" className={fieldClass} value={form.full_name} onChange={set('full_name')} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">Email *</label>
          <input id="email" type="email" className={fieldClass} value={form.email} onChange={set('email')} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="journey_type">Type de Parcours *</label>
          <select id="journey_type" className={fieldClass} value={form.journey_type} onChange={set('journey_type')} required>
            {JOURNEY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="start_date">Date de Début *</label>
          <input id="start_date" type="date" className={fieldClass} value={form.start_date} onChange={set('start_date')} required />
        </div>

        {(form.journey_type === 'renewal' || form.journey_type === 'offboarding') && (
          <div>
            <label className={labelClass} htmlFor="contract_end_date">Date Fin de Contrat</label>
            <input id="contract_end_date" type="date" className={fieldClass} value={form.contract_end_date} onChange={set('contract_end_date')} />
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}
