import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  LogIn,
  LogOut,
  Package,
  Plus,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './admin.css'
import AdminProducts, {
  type AdminProduct,
} from './AdminProducts'
import ProductForm from './ProductForm'

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState(
    'adnansleety6@gmail.com'
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showProductForm, setShowProductForm] =
    useState(false)

  const [productsVersion, setProductsVersion] =
    useState(0)

  const [selectedProduct, setSelectedProduct] =
    useState<AdminProduct | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession)
        setCheckingSession(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (loginError) {
      setError(loginError.message)
    }

    setSubmitting(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (checkingSession) {
    return (
      <main className="admin-loading">
        Checking admin session...
      </main>
    )
  }

  if (!session) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <a className="admin-logo" href="#home">
            HOMMES<span>LUXE</span>
            <small>ADMINISTRATION</small>
          </a>

          <div>
            <p className="admin-eyebrow">
              PRIVATE ACCESS
            </p>

            <h1>Welcome back.</h1>

            <p className="admin-intro">
              Sign in to manage the HOMMESLUXE catalogue.
            </p>
          </div>

          <form
            className="admin-login-form"
            onSubmit={handleLogin}
          >
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting}>
              <LogIn size={18} />

              {submitting
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          <a className="admin-store-link" href="#home">
            Return to website
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <a className="admin-logo" href="#home">
            HOMMES<span>LUXE</span>
            <small>ADMINISTRATION</small>
          </a>

          <p>Signed in as {session.user.email}</p>
        </div>

        <button onClick={handleLogout}>
          <LogOut size={17} />
          Sign out
        </button>
      </header>

      <section className="admin-dashboard-content">
        <div className="admin-title-row">
          <div>
            <p className="admin-eyebrow">
              PRODUCT MANAGEMENT
            </p>

            <h1>Catalogue</h1>
          </div>

          <button
            className="admin-add-button"
            onClick={() => {
                setSelectedProduct(null)
                setShowProductForm(true)
            }}
          >
            <Plus size={18} />
            Add product
          </button>
        </div>

        <AdminProducts
            key={productsVersion}
            onEdit={(product) => {
                setSelectedProduct(product)
                setShowProductForm(true)
            }}
        />
      </section>

      {showProductForm && (
        <ProductForm
        product={selectedProduct}
            onClose={() => {
                setShowProductForm(false)
                setSelectedProduct(null)
            }}
            onSaved={() => {
                setShowProductForm(false)
                setSelectedProduct(null)
                setProductsVersion(
                    (current) => current + 1
                )
            }}
        />
        )}
    </main>
  )
}