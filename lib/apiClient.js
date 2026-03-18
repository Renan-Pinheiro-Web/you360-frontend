// lib/apiClient.js
// YOU360 — Cliente da API PHP REST

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'

const getToken = () => {
  if (typeof window === 'undefined') return null
  const match = document.cookie.match(/you360_token=([^;]+)/)
  return match ? match[1] : null
}

export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    document.cookie = `you360_token=${token}; path=/; max-age=86400; SameSite=Lax`
  }
}

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    document.cookie = 'you360_token=; path=/; max-age=0'
  }
}

export const isAuthenticated = () => !!getToken()

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  let data
  try {
    data = await res.json()
  } catch {
    data = { success: false, error: 'Resposta inválida do servidor.' }
  }

  if (!res.ok || !data.success) {
    const err = new Error(data.error || `Erro ${res.status}`)
    err.status  = res.status
    err.details = data.details || null
    throw err
  }

  return data.data !== undefined ? data.data : data
}

export const api = {

  // ── AUTH ───────────────────────────────────────────────────
  auth: {
    login:  (email, password) => request('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) }),
    me:     ()                 => request('/auth/me'),
    logout: async ()           => { try { await request('/auth/logout', { method:'POST' }) } catch {} removeToken() },
  },

  // ── PRODUTOS — loja pública ────────────────────────────────
  products: {
    list:    ()    => request('/products'),
    get:     (id)  => request(`/products/${id}`),
    gallery: (id)  => request(`/products/${id}/gallery`),
  },

  // ── PRODUTOS — admin ───────────────────────────────────────
  adminProducts: {
    list:         ()         => request('/admin/products'),
    get:          (id)       => request(`/admin/products/${id}`),
    create:       (data)     => request('/admin/products',            { method:'POST',   body: JSON.stringify(data) }),
    update:       (id, data) => request(`/admin/products/${id}`,      { method:'PUT',    body: JSON.stringify(data) }),
    remove:       (id)       => request(`/admin/products/${id}`,      { method:'DELETE' }),
    toggle:       (id)       => request(`/admin/products/${id}/toggle`, { method:'PATCH' }),
    reorder:      (items)    => request('/admin/products/reorder',    { method:'PUT',    body: JSON.stringify({ items }) }),
    duplicate:    (id)       => request(`/admin/products/${id}/duplicate`, { method:'POST' }),
    priceHistory: (id)       => request(`/admin/products/${id}/price-history`),
    addGallery:   (id, url)  => request(`/admin/products/${id}/gallery`, { method:'POST', body: JSON.stringify({ imagem_url: url }) }),
    removeGallery:(pid, iid) => request(`/admin/products/${pid}/gallery/${iid}`, { method:'DELETE' }),
  },

  // ── HERO ───────────────────────────────────────────────────
  hero: {
    get:    ()     => request('/hero'),
    update: (data) => request('/admin/hero', { method:'PUT', body: JSON.stringify(data) }),
  },

  // ── LINHAS ─────────────────────────────────────────────────
  linhas: {
    list:   ()         => request('/linhas'),
    update: (id, data) => request(`/admin/linhas/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  },

  // ── DEPOIMENTOS ────────────────────────────────────────────
  depoimentos: {
    list:      ()         => request('/depoimentos'),
    adminList: ()         => request('/admin/depoimentos'),
    create:    (data)     => request('/admin/depoimentos',      { method:'POST',   body: JSON.stringify(data) }),
    update:    (id, data) => request(`/admin/depoimentos/${id}`, { method:'PUT',    body: JSON.stringify(data) }),
    remove:    (id)       => request(`/admin/depoimentos/${id}`, { method:'DELETE' }),
    toggle:    (id)       => request(`/admin/depoimentos/${id}/toggle`, { method:'PATCH' }),
  },

  // ── VENDAS ─────────────────────────────────────────────────
  vendas: {
    // Pública — loja (WhatsApp)
    storePublic: (data) => request('/vendas', { method:'POST', body: JSON.stringify(data) }),

    // Admin — CORRIGIDO: mapeia from/to para periodo/data_inicio/data_fim que o PHP espera
    list: (params = {}) => {
      const p = {}
      if (params.from && params.to) {
        p.periodo     = 'custom'
        p.data_inicio = params.from
        p.data_fim    = params.to
      } else if (params.from) {
        p.periodo     = 'custom'
        p.data_inicio = params.from
      } else {
        p.periodo = 'mes'
      }
      const qs = new URLSearchParams(p).toString()
      return request(`/admin/vendas${qs ? '?' + qs : ''}`)
    },

    create: (data)     => request('/admin/vendas',      { method:'POST',   body: JSON.stringify(data) }),
    update: (id, data) => request(`/admin/vendas/${id}`, { method:'PUT',    body: JSON.stringify(data) }),
    remove: (id)       => request(`/admin/vendas/${id}`, { method:'DELETE' }),
  },

  // ── CLIENTES ───────────────────────────────────────────────
  clientes: {
    list:      (search = '') => request(`/admin/clientes${search ? '?search=' + encodeURIComponent(search) : ''}`),
    create:    (data)        => request('/admin/clientes',      { method:'POST',   body: JSON.stringify(data) }),
    update:    (id, data)    => request(`/admin/clientes/${id}`, { method:'PUT',    body: JSON.stringify(data) }),
    remove:    (id)          => request(`/admin/clientes/${id}`, { method:'DELETE' }),
    historico: (id)          => request(`/admin/clientes/${id}/historico`),
  },

  // ── UPLOAD ─────────────────────────────────────────────────
  upload: {
    image: async (file) => {
      const token = getToken()
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro no upload')
      return data.data
    },
  },
}
