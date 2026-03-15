// pages/admin/login.js
// Login admin usando API PHP — substitui o login Supabase

import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { api, setToken } from '../../lib/apiClient'

export default function AdminLogin() {
  const router   = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await api.auth.login(email, password)
      setToken(result.token)
      router.push('/admin')
    } catch (err) {
      setError(err.message || 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin — YOU360</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-obsidian flex items-center justify-center px-4"
        style={{ background: '#0f0f0f' }}>
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <ellipse cx="14" cy="18" rx="9" ry="8" fill="#4a7c59" opacity=".85"/>
                <rect x="11" y="6" width="6" height="6" rx="2" fill="#fafaf8"/>
                <rect x="12.5" y="3" width="3" height="4" rx="1.5" fill="#4a7c59"/>
              </svg>
              <span className="font-display text-3xl font-light tracking-widest text-white">
                YOU<strong className="font-semibold text-sage">360</strong>
              </span>
            </div>
            <p className="font-body text-xs tracking-[0.3em] text-white/30 uppercase">
              Painel Administrativo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-body text-xs tracking-widest text-white/40 block mb-2">
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@you360.com.br"
                className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/20
                           focus:outline-none focus:border-sage border border-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
            <div>
              <label className="font-body text-xs tracking-widest text-white/40 block mb-2">
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/20
                           focus:outline-none focus:border-sage border border-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>

            {error && (
              <p className="font-body text-xs text-red-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage text-white font-body text-xs tracking-widest py-4
                         hover:bg-sage-dark transition-all disabled:opacity-50
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              )}
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

          <p className="font-body text-xs text-white/20 text-center mt-8">
            YOU360 © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}
