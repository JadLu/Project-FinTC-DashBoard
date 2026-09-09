// src/pages/Intake.tsx
import CaseIntakeForm from '../components/CaseIntakeForm'
import { PageHeader } from '../components/ui'

export default function Intake() {
  return (
    <>
      <PageHeader
        eyebrow="smartRH · Espace stagiaire"
        title="Nouveau dossier"
        subtitle="Formulaire d'intake — envoie directement le dossier à Fusion."
      />
      <div className="mx-auto max-w-[760px]">
        <CaseIntakeForm />
      </div>
    </>
  )
}
