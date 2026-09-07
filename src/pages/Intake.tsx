// src/pages/Intake.tsx
import CaseIntakeForm from '../components/CaseIntakeForm'

export default function Intake() {
  return (
    <>
      <div className="page-intro compact">
        <div>
          <p className="eyebrow">Espace stagiaire</p>
          <h1>Créer un dossier</h1>
          <p className="subtle">Formulaire d'intake — remplace le formulaire Tally.</p>
        </div>
      </div>
      <div className="mx-auto max-w-[720px]">
        <CaseIntakeForm />
      </div>
    </>
  )
}
