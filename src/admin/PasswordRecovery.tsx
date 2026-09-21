import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import {
  CheckCircle2,
  KeyRound,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './admin.css'

type PasswordRecoveryProps = {
  children: ReactNode
}

export default function PasswordRecovery({
  children,
}: PasswordRecoveryProps) {
  const [recovering, setRecovering] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const hashParameters = new URLSearchParams(
      window.location.hash.slice(1)
    )

    if (hashParameters.get('type') === 'recovery') {
      setRecovering(true)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handlePasswordUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(
        'Your password must contain at least 8 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSaving(true)

    const { error: updateError } =
      await supabase.auth.updateUser({
        password,
      })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
  }

  async function returnToAdmin() {
    try {
      await supabase.auth.signOut()
    } finally {
      window.location.replace(`${window.location.origin}/#admin`)
    }
  }

  if (!recovering) {
    return children
  }

  return (
    <main className="admin-recovery-page">
      <section className="admin-login-card admin-recovery-card">
        {success ? (
          <>
            <div className="admin-recovery-icon success">
              <CheckCircle2 size={27} />
            </div>

            <p className="admin-eyebrow">
              PASSWORD UPDATED
            </p>

            <h1>Password changed.</h1>

            <p className="admin-intro">
              Your new password is ready. Return to the
              admin page and sign in again.
            </p>

            <button
              className="admin-recovery-submit"
              onClick={returnToAdmin}
            >
              Return to admin login
            </button>
          </>
        ) : (
          <>
            <div className="admin-recovery-icon">
              <KeyRound size={27} />
            </div>

            <p className="admin-eyebrow">
              SECURE ACCOUNT RECOVERY
            </p>

            <h1>Choose a new password.</h1>

            <p className="admin-intro">
              Enter and confirm your new administrator
              password.
            </p>

            <form
              className="admin-login-form"
              onSubmit={handlePasswordUpdate}
            >
              <label>
                New password

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirm new password

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {error && (
                <p className="admin-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Updating password...'
                  : 'Update password'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}