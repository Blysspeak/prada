import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { MorphingText } from '@/components/ui/MorphingText'
import styles from './LoginPage.module.css'

export function SetupPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(import.meta.env.BASE_URL + 'api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed')
      }

      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={import.meta.env.BASE_URL + 'prada-logo.png'} alt="PRADA" className={styles.logo} />
          <MorphingText
            texts={['PRADA', '∞ DATA']}
            className={styles.title}
          />
          <p className={styles.subtitle}>
            <Sparkles size={14} className={styles.subtitleIcon} />
            First Time Setup
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="login" className={styles.label}>
              Admin Login
            </label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              className={styles.input}
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? (
              'Setting up...'
            ) : (
              <>
                <KeyRound size={18} />
                Create Admin Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
