import { useState } from 'react'
import { supabase } from '../supabase'
import { Lock, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Provide friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address first.')
        } else if (error.message.includes('too many requests') || error.status === 429) {
          setError('Too many login attempts. Please wait a moment and try again.')
        } else {
          setError(error.message)
        }
      }
      // On success, App.jsx auth listener handles redirect automatically
    } catch (err) {
      setError('A network error occurred. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="max-w-md w-full">

        {/* Back to website link */}
        <a
          href="../index.html"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Website
        </a>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-primary p-8 text-center">
            <div className="w-16 h-16 bg-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <Lock className="text-primary w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-dark font-heading">Mazhalai Admin</h1>
            <p className="text-dark/70 mt-1 text-sm">Sign in to manage your preschool</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="admin@mazhalaidaycare.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                className="w-full bg-dark text-white font-bold py-3.5 px-4 rounded-xl hover:bg-black transition-all focus:outline-none focus:ring-4 focus:ring-dark/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Secured by Supabase Authentication
        </p>
      </div>
    </div>
  )
}
