// src/pages/AuthPage.tsx
import { useState, type FormEvent } from 'react'
import {
  ArrowRight, BarChart3, CircleAlert, Eye, EyeOff, FolderOpen, Globe, Lock, Mail, ShieldCheck, UserRound,
} from 'lucide-react'
import logo from '../components/Logo.jpeg'
import type { Person } from '../types'

export interface AuthPageProps {
  people: Person[]
  onLogin: (person: Person, remember: boolean) => void
  onNotice: (message: string) => void
}

const FEATURES = [
  { icon: UserRound, title: 'Suivi des parcours RH', subtitle: 'Accompagnez chaque collaborateur' },
  { icon: FolderOpen, title: 'Gestion des dossiers', subtitle: 'Centralisez toutes les informations' },
  { icon: BarChart3, title: 'Analyse & KPI', subtitle: 'Des décisions basées sur vos données' },
  { icon: ShieldCheck, title: 'Conformité', subtitle: 'Sécurisez et simplifiez vos processus' },
]

export default function AuthPage({ people, onLogin, onNotice }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const normalized = email.trim().toLowerCase()
    const match = people.find(person => person.email?.toLowerCase() === normalized)
    if (!match) {
      setError('Aucun compte trouvé pour cette adresse e-mail.')
      return
    }
    onLogin(match, remember)
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-brand">
          <img src={logo} alt="smartRH — Intelligent HR Tracking System" />
        </div>

        <p className="auth-eyebrow">Plateforme RH intelligente</p>
        <h1 className="auth-heading">Bienvenue sur<br />Smart<span>RH</span></h1>
        <p className="auth-subtitle">
          Une plateforme intelligente pour une gestion RH plus simple, plus efficace et plus humaine.
        </p>

        <div className="auth-features">
          {FEATURES.map(feature => {
            const Icon = feature.icon
            return (
              <div className="auth-feature-row" key={feature.title}>
                <span className="auth-feature-icon"><Icon size={18} /></span>
                <span>
                  <strong>{feature.title}</strong>
                  <small>{feature.subtitle}</small>
                </span>
              </div>
            )
          })}
        </div>

        <p className="auth-tagline">Ensemble pour une gestion RH plus humaine.</p>
      </div>

      <div className="auth-right">
        <div className="auth-lang">
          <Globe size={14} /> Français
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2 className="auth-form-heading">Se <span>connecter</span></h2>
          <p className="auth-form-subtitle">Accédez à votre espace personnel et gérez votre parcours RH.</p>

          {error && (
            <div className="auth-error">
              <CircleAlert size={16} />
              {error}
            </div>
          )}

          <label className="auth-field-label" htmlFor="auth-email">Adresse email</label>
          <div className="auth-field">
            <Mail size={16} />
            <input
              id="auth-email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label className="auth-field-label" htmlFor="auth-password">Mot de passe</label>
          <div className="auth-field">
            <Lock size={16} />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Votre mot de passe"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-field-toggle"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="auth-row">
            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />
              Se souvenir de moi
            </label>
            <button
              type="button"
              className="auth-forgot"
              onClick={() => onNotice('Fonctionnalité à venir.')}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button type="submit" className="auth-submit">
            Se connecter <ArrowRight size={16} />
          </button>

          <p className="auth-footer">
            © {new Date().getFullYear()} SmartRH<br />
            Plateforme intelligente de gestion des ressources humaines
          </p>
        </form>
      </div>
    </div>
  )
}
