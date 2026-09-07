// src/components/DetailsFields.tsx
import { useState } from 'react'
import { usePeople } from '../hooks'

type Details = Record<string, unknown>

interface DetailsFieldsProps {
  ownerRole: string
  journeyType: string
  value: Details
  onChange: (value: Details) => void
}

const fieldClass =
  'h-9 w-full rounded-md border border-[#dce4e2] bg-white px-2.5 text-[13px] text-[#253536] outline-none transition focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/25'
const areaClass =
  'min-h-[64px] w-full rounded-md border border-[#dce4e2] bg-white px-2.5 py-1.5 text-[13px] text-[#253536] outline-none transition focus:border-[#f26522] focus:ring-2 focus:ring-[#f26522]/25'
const labelClass = 'mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#6d8381]'

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? String(v) : '')
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : [])
const splitCsv = (raw: string) => raw.split(',').map(s => s.trim()).filter(Boolean)

export default function DetailsFields({ ownerRole, journeyType, value, onChange }: DetailsFieldsProps) {
  // raw text for comma-separated fields so the user can type commas freely
  const [csvRaw, setCsvRaw] = useState<Record<string, string>>({})
  const { data: people } = usePeople()
  const encadrants = people.filter(person => person.role === 'encadrant')

  const set = (key: string, v: unknown) => {
    const next = { ...value }
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete next[key]
    else next[key] = v
    onChange(next)
  }
  const csvValue = (key: string) => (key in csvRaw ? csvRaw[key] : arr(value[key]).join(', '))
  const onCsv = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvRaw(c => ({ ...c, [key]: e.target.value }))
    set(key, splitCsv(e.target.value))
  }
  const toggleInGroup = (key: string, option: string) => {
    const current = arr(value[key])
    set(key, current.includes(option) ? current.filter(o => o !== option) : [...current, option])
  }

  // Helpers return plain JSX (called, not mounted as components) so inputs keep focus.
  const textField = (k: string, label: string, type: 'text' | 'number' | 'date' = 'text') => (
    <div key={k}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        className={fieldClass}
        value={type === 'number' ? num(value[k]) : str(value[k])}
        onChange={e => set(k, type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}
      />
    </div>
  )
  const areaField = (k: string, label: string) => (
    <div key={k} className="sm:col-span-2">
      <label className={labelClass}>{label}</label>
      <textarea className={areaClass} value={str(value[k])} onChange={e => set(k, e.target.value)} />
    </div>
  )
  const csvField = (k: string, label: string) => (
    <div key={k}>
      <label className={labelClass}>{label}</label>
      <input className={fieldClass} placeholder="séparé par des virgules" value={csvValue(k)} onChange={onCsv(k)} />
    </div>
  )
  const selectField = (k: string, label: string, options: string[]) => (
    <div key={k}>
      <label className={labelClass}>{label}</label>
      <select className={fieldClass} value={str(value[k])} onChange={e => set(k, e.target.value)}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const peopleSelect = (k: string, label: string, list: { person_ref: string; full_name: string }[]) => (
    <div key={k}>
      <label className={labelClass}>{label}</label>
      <select className={fieldClass} value={str(value[k])} onChange={e => set(k, e.target.value)}>
        <option value="">— Choisir —</option>
        {list.map(p => <option key={p.person_ref} value={p.person_ref}>{p.full_name} ({p.person_ref})</option>)}
      </select>
    </div>
  )
  const checkField = (k: string, label: string) => (
    <label key={k} className="flex items-center gap-2 text-[13px] text-[#253536]">
      <input type="checkbox" checked={value[k] === true} onChange={e => set(k, e.target.checked || undefined)} />
      {label}
    </label>
  )
  const checkGroup = (k: string, label: string, options: string[]) => (
    <div key={k} className="sm:col-span-2">
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {options.map(o => (
          <label key={o} className="flex items-center gap-1.5 text-[13px] text-[#253536]">
            <input type="checkbox" checked={arr(value[k]).includes(o)} onChange={() => toggleInGroup(k, o)} />
            {o}
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ownerRole === 'manager' && [
        selectField('performance_rating', 'Note de performance', ['1', '2', '3', '4', '5']),
        textField('objectives_met', 'Objectifs atteints (ex. 3/3)'),
        textField('proficiency', 'Niveau de maîtrise'),
        peopleSelect('encadrant_ref', 'Encadrant à affecter', encadrants),
        areaField('feedback', 'Commentaire'),
      ]}

      {ownerRole === 'encadrant' && [
        textField('collaboration_score', 'Score de collaboration (0-10)', 'number'),
        textField('feedback_sources', 'Nombre de retours collectés', 'number'),
        csvField('positive_themes', 'Points positifs'),
        csvField('concerns', 'Points de vigilance'),
      ]}

      {ownerRole === 'rh' && [
        areaField('decision_basis', 'Motivation de la décision'),
        selectField('legal_review', 'Revue juridique', ['OK', 'Pending', 'Issue']),
        textField('document', 'Référence document'),
      ]}

      {ownerRole === 'paie' && journeyType === 'renewal' && [
        textField('new_salary', 'Nouveau salaire', 'number'),
        textField('currency', 'Devise'),
        textField('effective_date', "Date d'effet", 'date'),
        csvField('benefits_changes', 'Évolutions des avantages'),
      ]}

      {ownerRole === 'paie' && journeyType === 'offboarding' && [
        textField('accrued_vacation_days', 'Congés acquis (jours)', 'number'),
        textField('severance', 'Indemnité de départ', 'number'),
        textField('net_final_amount', 'Solde de tout compte (net)', 'number'),
        textField('payment_date', 'Date de paiement', 'date'),
      ]}

      {ownerRole === 'it' && [
        checkGroup('systems_revoked', 'Accès révoqués', ['AD', 'Email', 'GitHub', 'Jira', 'VPN', 'Badge']),
        textField('laptop_serial', 'N° de série ordinateur'),
        checkField('backup_completed', 'Sauvegarde effectuée'),
        checkField('data_wiped', 'Données effacées'),
      ]}

      {ownerRole === 'moyens_generaux' && [
        checkGroup('items_collected', 'Éléments récupérés', ['badge', 'office_key', 'parking_card', 'laptop']),
        textField('replacement_cost', 'Coût de remplacement', 'number'),
        checkField('security_risk', 'Risque de sécurité'),
      ]}
    </div>
  )
}

/** Renders a saved details object as a compact key / value list. */
export function DetailsList({ details }: { details: Record<string, unknown> | null | undefined }) {
  const entries = details
    ? Object.entries(details).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
    : []
  if (!entries.length) return null
  return (
    <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-semibold text-[#6d8381]">{k}</dt>
          <dd className="text-[#4c5a59]">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
        </div>
      ))}
    </dl>
  )
}
