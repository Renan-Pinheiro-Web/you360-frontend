// pages/admin/index.js
// YOU360 — Painel Administrativo usando API PHP

import Head from 'next/head'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { api, isAuthenticated, removeToken } from '../../lib/apiClient'

/* ── helpers ──────────────────────────────────────────────── */
const fmtBRL  = v => `R$ ${Number(v).toFixed(2).replace('.', ',')}`
const fmtDate = s => s ? new Date(s).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

/* ════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('produtos')
  const [adminNome, setAdminNome] = useState('Admin')
  const [toast, setToast]         = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/admin/login'); return }
    api.auth.me().then(d => setAdminNome(d.nome || 'Admin')).catch(() => {
      removeToken(); router.replace('/admin/login')
    })
  }, [router])

  const handleLogout = async () => {
    await api.auth.logout()
    router.replace('/admin/login')
  }

  const TABS = [
    { key:'hero',       label:'Hero',       icon:'⬆️' },
    { key:'linhas',     label:'Linhas',     icon:'🏷️' },
    { key:'produtos',   label:'Produtos',   icon:'📦' },
    { key:'depoimentos',label:'Depoimentos',icon:'💬' },
    { key:'vendas',     label:'Vendas',     icon:'🛒' },
    { key:'clientes',   label:'Clientes',   icon:'👥' },
  ]

  return (
    <>
      <Head>
        <title>Admin — YOU360</title>
        <meta name="robots" content="noindex,nofollow"/>
      </Head>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 text-white font-body text-sm flex items-center gap-3 shadow-xl transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-sage'}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      <div className="min-h-screen flex flex-col" style={{ background:'#0f0f0f' }}>

        {/* Header Admin */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <ellipse cx="14" cy="18" rx="9" ry="8" fill="#4a7c59" opacity=".85"/>
              <rect x="11" y="6" width="6" height="6" rx="2" fill="#fafaf8"/>
              <rect x="12.5" y="3" width="3" height="4" rx="1.5" fill="#4a7c59"/>
            </svg>
            <span className="font-display text-lg font-light tracking-widest text-white">
              YOU<strong className="text-sage font-semibold">360</strong>
              <span className="font-body text-xs text-white/30 ml-3 tracking-wider">ADMIN</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-body text-xs text-white/30 hidden md:block">{adminNome}</span>
            <a href="/" target="_blank" className="font-body text-xs tracking-widest text-white/30 hover:text-sage transition-colors hidden md:block">
              VER LOJA ↗
            </a>
            <button onClick={handleLogout}
              className="font-body text-xs tracking-widest border border-white/15 text-white/50 hover:border-red-500/50 hover:text-red-400 px-4 py-2 transition-all">
              SAIR
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-48 border-r border-white/8 flex-shrink-0 py-6 hidden md:flex flex-col">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-6 py-3 font-body text-xs tracking-widest transition-all text-left ${
                  activeTab === tab.key
                    ? 'text-sage border-r-2 border-sage bg-sage/10'
                    : 'text-white/40 hover:text-white/70'
                }`}>
                <span>{tab.icon}</span>
                {tab.label.toUpperCase()}
              </button>
            ))}
          </aside>

          {/* Mobile tabs */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 flex" style={{background:'#0f0f0f'}}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center py-3 gap-1 font-body text-[10px] tracking-wider transition-all ${
                  activeTab === tab.key ? 'text-sage' : 'text-white/30'
                }`}>
                <span className="text-base leading-none">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {activeTab === 'hero'        && <HeroTab        showToast={showToast}/>}
            {activeTab === 'linhas'      && <LinhasTab      showToast={showToast}/>}
            {activeTab === 'produtos'    && <ProdutosTab    showToast={showToast}/>}
            {activeTab === 'depoimentos' && <DepoimentosTab showToast={showToast}/>}
            {activeTab === 'vendas'      && <VendasTab      showToast={showToast}/>}
            {activeTab === 'clientes'    && <ClientesTab    showToast={showToast}/>}
          </main>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTES DE ABA
══════════════════════════════════════════════════════════════ */

/* ── ABA: HERO ───────────────────────────────────────────── */
function HeroTab({ showToast }) {
  const [data, setData]     = useState({ nome:'', preco:'', imagem_url:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.hero.get().then(h => { if (h) setData({ nome: h.nome||'', preco: h.preco||'', imagem_url: h.imagem_url||'' }) }).catch(()=>{})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.hero.update(data)
      showToast('Hero atualizado!')
    } catch(e) { showToast(e.message,'error') } finally { setSaving(false) }
  }

  return (
    <TabWrapper title="Hero" subtitle="Produto destacado na seção inicial">
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
        <Field label="Nome do produto" value={data.nome} onChange={v=>setData({...data,nome:v})}/>
        <Field label="Preço (R$)" type="number" value={data.preco} onChange={v=>setData({...data,preco:v})}/>
        <div className="md:col-span-2">
          <Field label="URL da imagem" value={data.imagem_url} onChange={v=>setData({...data,imagem_url:v})} placeholder="https://..."/>
        </div>
        {data.imagem_url && (
          <div className="md:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.imagem_url} alt="" className="h-40 object-cover border border-white/10" onError={()=>{}}/>
          </div>
        )}
      </div>
      <SaveBtn onClick={save} saving={saving}/>
    </TabWrapper>
  )
}

/* ── ABA: LINHAS ─────────────────────────────────────────── */
function LinhasTab({ showToast }) {
  const [linhas, setLinhas] = useState([])
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    api.linhas.list().then(setLinhas).catch(()=>{})
  }, [])

  const save = async (linha) => {
    setSaving(linha.id)
    try {
      const updated = await api.linhas.update(linha.id, linha)
      setLinhas(prev => prev.map(l => l.id === linha.id ? updated : l))
      showToast(`Linha ${linha.id} salva!`)
    } catch(e) { showToast(e.message,'error') } finally { setSaving(null) }
  }

  const update = (id, field, val) =>
    setLinhas(prev => prev.map(l => l.id === id ? {...l,[field]:val} : l))

  return (
    <TabWrapper title="Linhas" subtitle="3 banners de coleções da loja">
      <div className="grid gap-8 max-w-3xl">
        {linhas.map(l => (
          <div key={l.id} className="border border-white/10 p-6 space-y-4" style={{background:'rgba(255,255,255,0.03)'}}>
            <p className="font-body text-xs tracking-widest text-sage">LINHA {l.id}</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da linha"  value={l.nome_linha||''} onChange={v=>update(l.id,'nome_linha',v)}/>
              <Field label="Título"          value={l.titulo||''}    onChange={v=>update(l.id,'titulo',v)}/>
              <Field label="Subtítulo"       value={l.subtitulo||''} onChange={v=>update(l.id,'subtitulo',v)}/>
              <Field label="Descrição"       value={l.descricao||''} onChange={v=>update(l.id,'descricao',v)}/>
              <div className="col-span-2">
                <Field label="URL da imagem" value={l.imagem_url||''} onChange={v=>update(l.id,'imagem_url',v)}/>
              </div>
            </div>
            {l.imagem_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imagem_url} alt="" className="h-28 object-cover border border-white/10" onError={()=>{}}/>
            )}
            <SaveBtn onClick={()=>save(l)} saving={saving===l.id}/>
          </div>
        ))}
      </div>
    </TabWrapper>
  )
}

/* ── ABA: PRODUTOS ───────────────────────────────────────── */
function ProdutosTab({ showToast }) {
  const [products, setProducts]   = useState([])
  const [search, setSearch]       = useState('')
  const [filterAtivo, setFilter]  = useState('all')
  const [modal, setModal]         = useState(null) // null | 'new' | produto
  const [histModal, setHistModal] = useState(null)
  const [gallModal, setGallModal] = useState(null)
  const [loading, setLoading]     = useState(true)
  const dragItem  = useRef(null)
  const dragOver  = useRef(null)

  const load = useCallback(() => {
    setLoading(true)
    api.adminProducts.list()
      .then(setProducts)
      .catch(()=>showToast('Erro ao carregar produtos','error'))
      .finally(()=>setLoading(false))
  }, [showToast])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    if (filterAtivo === 'active'   && !p.ativo) return false
    if (filterAtivo === 'inactive' &&  p.ativo) return false
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null) return
    const copy = [...products]
    const dragged = copy.splice(dragItem.current, 1)[0]
    copy.splice(dragOver.current, 0, dragged)
    dragItem.current = null; dragOver.current = null
    setProducts(copy)
    try {
      await api.adminProducts.reorder(copy.map(p => p.id))
      showToast('Ordem salva!')
    } catch(e) { showToast(e.message,'error'); load() }
  }

  const toggleAtivo = async (p) => {
    try {
      await api.adminProducts.toggle(p.id)
      setProducts(prev => prev.map(x => x.id === p.id ? {...x, ativo: !x.ativo} : x))
    } catch(e) { showToast(e.message,'error') }
  }

  const duplicate = async (p) => {
    try {
      const novo = await api.adminProducts.duplicate(p.id)
      setProducts(prev => [...prev, novo])
      showToast(`"${p.nome}" duplicado!`)
    } catch(e) { showToast(e.message,'error') }
  }

  const remove = async (p) => {
    if (!confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.adminProducts.remove(p.id)
      setProducts(prev => prev.filter(x => x.id !== p.id))
      showToast('Produto excluído.')
    } catch(e) { showToast(e.message,'error') }
  }

  return (
    <TabWrapper title="Produtos" subtitle={`${products.length} produtos cadastrados`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="flex-1 min-w-[180px] px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-sage bg-white/5"/>
        <select value={filterAtivo} onChange={e=>setFilter(e.target.value)}
          className="px-3 py-2.5 font-body text-xs text-white border border-white/10 bg-black focus:outline-none">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <button onClick={()=>setModal('new')}
          className="bg-sage text-white font-body text-xs tracking-widest px-5 py-2.5 hover:bg-sage-dark transition-all flex items-center gap-2">
          + NOVO PRODUTO
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-sage/30 border-t-sage rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <div key={p.id} draggable
              onDragStart={()=>dragItem.current=i}
              onDragEnter={()=>dragOver.current=i}
              onDragEnd={handleDragEnd}
              onDragOver={e=>e.preventDefault()}
              className="flex items-center gap-4 p-4 border border-white/8 hover:border-sage/30 transition-all cursor-grab active:cursor-grabbing group"
              style={{background:'rgba(255,255,255,0.03)'}}>

              <span className="text-white/15 group-hover:text-white/40 transition-colors text-lg select-none">⠿</span>

              {/* Imagem mini */}
              <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-sage/10 flex items-center justify-center">
                {p.imagem_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.imagem_url} alt="" className="w-full h-full object-cover" onError={()=>{}}/>
                  : <span className="text-sage/40 text-xl">📦</span>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-base text-white font-light truncate">{p.nome}</p>
                  {p.badge && <span className="bg-sage/20 text-sage font-body text-xs px-2 py-0.5">{p.badge}</span>}
                  {!p.ativo && <span className="bg-white/10 text-white/30 font-body text-xs px-2 py-0.5">INATIVO</span>}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="font-body text-xs text-white/40">{p.linha || '—'}</span>
                  <span className="font-display text-sm text-sage">{fmtBRL(p.preco)}</span>
                  <span className="font-body text-xs text-white/30">
                    {p.estoque !== null && p.estoque !== undefined ? `Estoque: ${p.estoque}` : 'Estoque: ∞'}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <ActionBtn title="Editar"       icon="✏️"  onClick={()=>setModal(p)}/>
                <ActionBtn title="Galeria"      icon="🖼️"  onClick={()=>setGallModal(p)}/>
                <ActionBtn title="Preços"       icon="📈"  onClick={()=>setHistModal(p)}/>
                <ActionBtn title={p.ativo?'Desativar':'Ativar'} icon={p.ativo?'👁️':'🚫'} onClick={()=>toggleAtivo(p)}/>
                <ActionBtn title="Duplicar"     icon="📋"  onClick={()=>duplicate(p)}/>
                <ActionBtn title="Excluir"      icon="🗑️"  onClick={()=>remove(p)} danger/>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-white/20 italic">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={()=>setModal(null)}
          onSaved={(p)=>{ load(); setModal(null); showToast(modal==='new'?'Produto criado!':'Produto atualizado!') }}
          showToast={showToast}
        />
      )}
      {histModal && (
        <PriceHistoryModal product={histModal} onClose={()=>setHistModal(null)}/>
      )}
      {gallModal && (
        <GalleryModal product={gallModal} onClose={()=>setGallModal(null)} showToast={showToast}/>
      )}
    </TabWrapper>
  )
}

/* ── Modal Produto ───────────────────────────────────────── */
function ProductModal({ product, onClose, onSaved, showToast }) {
  const isNew = !product
  const [form, setForm] = useState({
    nome:      product?.nome       || '',
    linha:     product?.linha      || '',
    fragrancia:product?.fragrancia || '',
    descricao: product?.descricao  || '',
    preco:     product?.preco      || '',
    badge:     product?.badge      || '',
    imagem_url:product?.imagem_url || '',
    ativo:     product?.ativo !== undefined ? product.ativo : true,
    estoque:   product?.estoque !== null && product?.estoque !== undefined ? product.estoque : '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({...f,[k]:v}))

  const save = async () => {
    if (!form.nome.trim()) { showToast('Nome é obrigatório','error'); return }
    if (!form.preco || isNaN(form.preco)) { showToast('Preço inválido','error'); return }
    setSaving(true)
    try {
      const payload = { ...form, preco: parseFloat(form.preco), estoque: form.estoque !== '' ? parseInt(form.estoque) : null }
      if (isNew) await api.adminProducts.create(payload)
      else       await api.adminProducts.update(product.id, payload)
      onSaved()
    } catch(e) { showToast(e.message,'error') } finally { setSaving(false) }
  }

  return (
    <Modal title={isNew ? 'Novo Produto' : `Editar: ${product.nome}`} onClose={onClose} size="lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label="Nome *" value={form.nome} onChange={v=>set('nome',v)}/></div>
        <Field label="Linha" value={form.linha} onChange={v=>set('linha',v)} placeholder="skincare / perfumes / estetica"/>
        <Field label="Badge" value={form.badge} onChange={v=>set('badge',v)} placeholder="NOVO / DESTAQUE"/>
        <div className="col-span-2"><Field label="Fragrância / Composição" value={form.fragrancia} onChange={v=>set('fragrancia',v)}/></div>
        <Field label="Preço (R$) *" type="number" value={form.preco} onChange={v=>set('preco',v)}/>
        <Field label="Estoque (vazio = ilimitado)" type="number" value={form.estoque} onChange={v=>set('estoque',v)}/>
        <div className="col-span-2"><Field label="URL da imagem" value={form.imagem_url} onChange={v=>set('imagem_url',v)}/></div>
        <div className="col-span-2">
          <label className="font-body text-xs tracking-widest text-white/40 block mb-2">DESCRIÇÃO</label>
          <textarea value={form.descricao} onChange={e=>set('descricao',e.target.value)} rows={3}
            className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-sage bg-white/5 resize-none"/>
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <label className="font-body text-xs tracking-widest text-white/40">STATUS</label>
          <button onClick={()=>set('ativo',!form.ativo)}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.ativo ? 'bg-sage' : 'bg-white/15'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.ativo ? 'left-7' : 'left-1'}`}/>
          </button>
          <span className="font-body text-xs text-white/50">{form.ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 border border-white/15 text-white/50 font-body text-xs tracking-widest py-3 hover:border-white/30 transition-all">CANCELAR</button>
        <SaveBtn onClick={save} saving={saving} className="flex-1"/>
      </div>
    </Modal>
  )
}

/* ── Modal Galeria ───────────────────────────────────────── */
function GalleryModal({ product, onClose, showToast }) {
  const [images, setImages] = useState([])
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    api.adminProducts.list().then(()=>{})  // refresh
    api.products.gallery(product.id).then(setImages).catch(()=>{})
  }, [product.id])

  const add = async () => {
    if (!newUrl.trim()) return
    try {
      await api.adminProducts.addGallery(product.id, newUrl)
      const updated = await api.products.gallery(product.id)
      setImages(updated); setNewUrl('')
      showToast('Imagem adicionada!')
    } catch(e) { showToast(e.message,'error') }
  }

  const remove = async (imgId) => {
    try {
      await api.adminProducts.removeGallery(product.id, imgId)
      setImages(prev => prev.filter(i => i.id !== imgId))
      showToast('Imagem removida.')
    } catch(e) { showToast(e.message,'error') }
  }

  return (
    <Modal title={`Galeria: ${product.nome}`} onClose={onClose}>
      <div className="flex gap-2 mb-6">
        <input value={newUrl} onChange={e=>setNewUrl(e.target.value)}
          placeholder="URL da imagem (https://...)"
          className="flex-1 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-sage bg-white/5"/>
        <button onClick={add} className="bg-sage text-white font-body text-xs tracking-widest px-4 py-2.5 hover:bg-sage-dark transition-all">
          + ADD
        </button>
      </div>
      {images.length === 0 ? (
        <p className="font-body text-sm text-white/30 text-center py-8">Nenhuma imagem extra cadastrada.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map(img => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imagem_url} alt="" className="w-full aspect-square object-cover border border-white/10" onError={()=>{}}/>
              <button onClick={()=>remove(img.id)}
                className="absolute top-1 right-1 w-7 h-7 bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

/* ── Modal Histórico de Preço ────────────────────────────── */
function PriceHistoryModal({ product, onClose }) {
  const [hist, setHist] = useState([])
  useEffect(() => {
    api.adminProducts.priceHistory(product.id).then(d => setHist(d.historico || [])).catch(()=>{})
  }, [product.id])

  return (
    <Modal title={`Histórico de Preços: ${product.nome}`} onClose={onClose}>
      {hist.length === 0 ? (
        <p className="font-body text-sm text-white/30 text-center py-8">Nenhuma alteração registrada.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {['Data','Anterior','Novo','Variação'].map(h => (
                <th key={h} className="text-left font-body text-xs tracking-widest text-white/30 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hist.map(h => {
              const diff = ((h.preco_novo - h.preco_anterior) / h.preco_anterior * 100).toFixed(1)
              const up   = h.preco_novo > h.preco_anterior
              return (
                <tr key={h.id} className="border-b border-white/5">
                  <td className="font-body text-xs text-white/50 py-3 pr-4">{fmtDate(h.created_at)}</td>
                  <td className="font-body text-sm text-white/60 py-3 pr-4">{fmtBRL(h.preco_anterior)}</td>
                  <td className="font-body text-sm text-white py-3 pr-4">{fmtBRL(h.preco_novo)}</td>
                  <td className={`font-body text-xs py-3 ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '▲' : '▼'} {Math.abs(diff)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

/* ── ABA: DEPOIMENTOS ────────────────────────────────────── */
function DepoimentosTab({ showToast }) {
  const [deps, setDeps]   = useState([])
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    api.depoimentos.adminList().then(setDeps).catch(()=>{})
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (d) => {
    try {
      await api.depoimentos.toggle(d.id)
      setDeps(prev => prev.map(x => x.id===d.id ? {...x,ativo:!x.ativo} : x))
    } catch(e) { showToast(e.message,'error') }
  }

  const remove = async (d) => {
    if (!confirm('Excluir este depoimento?')) return
    try {
      await api.depoimentos.remove(d.id)
      setDeps(prev => prev.filter(x => x.id!==d.id))
      showToast('Depoimento excluído.')
    } catch(e) { showToast(e.message,'error') }
  }

  return (
    <TabWrapper title="Depoimentos" subtitle={`${deps.length} depoimentos`}>
      <button onClick={()=>setModal('new')}
        className="mb-6 bg-sage text-white font-body text-xs tracking-widest px-5 py-2.5 hover:bg-sage-dark transition-all">
        + NOVO DEPOIMENTO
      </button>
      <div className="space-y-3">
        {deps.map(d => (
          <div key={d.id} className="flex items-start gap-4 p-4 border border-white/8 hover:border-sage/20 transition-all" style={{background:'rgba(255,255,255,0.02)'}}>
            <div className={`w-10 h-10 rounded-full ${d.bg||'bg-sage/30'} flex items-center justify-center font-display ${d.cor||'text-sage'} flex-shrink-0`}>
              {d.inicial || d.nome?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body text-sm text-white">{d.nome}</span>
                <span className="font-body text-xs text-white/30">{d.cidade}</span>
                {!d.ativo && <span className="bg-white/10 text-white/30 font-body text-xs px-2 py-0.5">INATIVO</span>}
              </div>
              <p className="font-body text-xs text-white/50 mt-1 line-clamp-2">"{d.texto}"</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <ActionBtn title="Editar"                              icon="✏️"  onClick={()=>setModal(d)}/>
              <ActionBtn title={d.ativo?'Desativar':'Ativar'}        icon={d.ativo?'👁️':'🚫'} onClick={()=>toggle(d)}/>
              <ActionBtn title="Excluir"                             icon="🗑️"  onClick={()=>remove(d)} danger/>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <DepModal dep={modal==='new'?null:modal} onClose={()=>setModal(null)}
          onSaved={()=>{ load(); setModal(null); showToast(modal==='new'?'Depoimento criado!':'Depoimento atualizado!') }}
          showToast={showToast}/>
      )}
    </TabWrapper>
  )
}

function DepModal({ dep, onClose, onSaved, showToast }) {
  const isNew = !dep
  const [form, setForm] = useState({ nome:dep?.nome||'', cidade:dep?.cidade||'', texto:dep?.texto||'', inicial:dep?.inicial||'', cor:dep?.cor||'text-sage', bg:dep?.bg||'bg-sage/30', ativo:dep?.ativo!==undefined?dep.ativo:true })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const save = async () => {
    if (!form.nome.trim() || !form.texto.trim()) { showToast('Nome e texto obrigatórios','error'); return }
    setSaving(true)
    try {
      if (isNew) await api.depoimentos.create(form)
      else       await api.depoimentos.update(dep.id, form)
      onSaved()
    } catch(e) { showToast(e.message,'error') } finally { setSaving(false) }
  }

  return (
    <Modal title={isNew?'Novo Depoimento':'Editar Depoimento'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome *"   value={form.nome}    onChange={v=>set('nome',v)}/>
          <Field label="Cidade"   value={form.cidade}  onChange={v=>set('cidade',v)}/>
          <Field label="Inicial"  value={form.inicial} onChange={v=>set('inicial',v)} placeholder="F"/>
          <Field label="Cor CSS"  value={form.cor}     onChange={v=>set('cor',v)}    placeholder="text-sage"/>
          <Field label="Bg CSS"   value={form.bg}      onChange={v=>set('bg',v)}     placeholder="bg-sage/30"/>
        </div>
        <div>
          <label className="font-body text-xs tracking-widest text-white/40 block mb-2">TEXTO *</label>
          <textarea value={form.texto} onChange={e=>set('texto',e.target.value)} rows={4}
            className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-sage bg-white/5 resize-none"/>
        </div>
        {/* Preview */}
        <div className="border border-white/8 p-4" style={{background:'rgba(255,255,255,0.02)'}}>
          <p className="font-body text-xs text-white/30 mb-3">PREVIEW</p>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${form.bg} flex items-center justify-center font-display ${form.cor}`}>
              {form.inicial || form.nome?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-body text-sm text-white">{form.nome||'Nome'}</p>
              <p className="font-body text-xs text-white/40">{form.cidade||'Cidade'}</p>
            </div>
          </div>
          <p className="font-body text-sm text-white/60 italic mt-3">"{form.texto||'Texto do depoimento...'}"</p>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 border border-white/15 text-white/50 font-body text-xs tracking-widest py-3">CANCELAR</button>
        <SaveBtn onClick={save} saving={saving} className="flex-1"/>
      </div>
    </Modal>
  )
}

/* ── ABA: VENDAS ─────────────────────────────────────────── */
function VendasTab({ showToast }) {
  const [vendas,   setVendas]   = useState([])
  const [periodo,  setPeriodo]  = useState('mes')
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.vendas.list({ periodo }).then(setVendas).catch(()=>showToast('Erro ao carregar vendas','error')).finally(()=>setLoading(false))
  }, [periodo, showToast])

  useEffect(() => { load() }, [load])

  const remove = async (v) => {
    if (!confirm(`Excluir venda #${v.numero}? O estoque será restaurado.`)) return
    try {
      await api.vendas.remove(v.id)
      setVendas(prev => prev.filter(x => x.id !== v.id))
      showToast('Venda excluída e estoque restaurado.')
    } catch(e) { showToast(e.message,'error') }
  }

  const total = vendas.filter(v=>v.status!=='cancelada').reduce((s,v)=>s+(+v.total),0)

  return (
    <TabWrapper title="Vendas" subtitle={`${vendas.length} vendas no período`}>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {[['hoje','Hoje'],['semana','7 dias'],['mes','Este mês']].map(([val,lbl]) => (
          <button key={val} onClick={()=>setPeriodo(val)}
            className={`font-body text-xs tracking-widest px-4 py-2 border transition-all ${periodo===val?'bg-sage border-sage text-white':'border-white/15 text-white/40 hover:border-sage/50'}`}>
            {lbl}
          </button>
        ))}
        <span className="ml-auto font-display text-xl text-sage">{fmtBRL(total)}</span>
      </div>

      {loading ? <Loader/> : (
        <div className="space-y-2">
          {vendas.map(v => (
            <div key={v.id} className="border border-white/8 overflow-hidden" style={{background:'rgba(255,255,255,0.02)'}}>
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/3 transition-colors" onClick={()=>setExpanded(expanded===v.id?null:v.id)}>
                <span className="font-display text-lg text-white/30 w-12">#{v.numero}</span>
                <div className="flex-1">
                  <p className="font-body text-sm text-white">{v.clientes?.nome || <span className="text-white/30">Sem cliente</span>}</p>
                  <p className="font-body text-xs text-white/30">{fmtDate(v.created_at)} · {v.origem}</p>
                </div>
                <span className={`font-body text-xs tracking-widest px-2 py-1 ${v.status==='confirmada'?'bg-green-900/50 text-green-400':'bg-red-900/50 text-red-400'}`}>
                  {v.status.toUpperCase()}
                </span>
                <span className="font-display text-lg text-white">{fmtBRL(v.total)}</span>
                <ActionBtn title="Excluir" icon="🗑️" onClick={()=>remove(v)} danger/>
              </div>
              {expanded === v.id && (
                <div className="border-t border-white/8 px-6 py-4" style={{background:'rgba(255,255,255,0.02)'}}>
                  <p className="font-body text-xs tracking-widest text-white/30 mb-3">ITENS</p>
                  {(v.venda_itens||[]).map(item => (
                    <div key={item.id} className="flex justify-between font-body text-sm py-1 border-b border-white/5">
                      <span className="text-white/70">{item.nome_produto} × {item.quantidade}</span>
                      <span className="text-white">{fmtBRL(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {vendas.length === 0 && (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-white/20 italic">Nenhuma venda no período.</p>
            </div>
          )}
        </div>
      )}
    </TabWrapper>
  )
}

/* ── ABA: CLIENTES ───────────────────────────────────────── */
function ClientesTab({ showToast }) {
  const [clientes, setClientes] = useState([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.clientes.list(search).then(setClientes).catch(()=>showToast('Erro ao carregar clientes','error')).finally(()=>setLoading(false))
  }, [search, showToast])

  return (
    <TabWrapper title="Clientes" subtitle={`${clientes.length} clientes cadastrados`}>
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Buscar por nome, WhatsApp ou cidade..."
        className="w-full max-w-md px-4 py-2.5 mb-6 font-body text-sm text-white placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-sage bg-white/5"/>

      {loading ? <Loader/> : (
        <div className="space-y-2">
          {clientes.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 border border-white/8 hover:border-sage/20 transition-all cursor-pointer"
              style={{background:'rgba(255,255,255,0.02)'}}
              onClick={()=>setSelected(selected?.id===c.id?null:c)}>
              <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center font-display text-sage flex-shrink-0">
                {c.nome?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-white">{c.nome}</p>
                <p className="font-body text-xs text-white/30">{c.cidade}{c.estado ? ` — ${c.estado}` : ''} · {c.whatsapp}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display text-base text-sage">{fmtBRL(c.total_gasto||0)}</p>
                <p className="font-body text-xs text-white/30">{c.total_compras||0} {c.total_compras===1?'compra':'compras'}</p>
              </div>
            </div>
          ))}
          {clientes.length === 0 && (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-white/20 italic">Nenhum cliente encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Painel de histórico inline */}
      {selected && (
        <div className="mt-6 border border-sage/30 p-6" style={{background:'rgba(74,124,89,0.06)'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display text-xl text-white">{selected.nome}</p>
              <p className="font-body text-xs text-white/40">{selected.whatsapp}</p>
            </div>
            <button onClick={()=>setSelected(null)} className="text-white/30 hover:text-white transition-colors">✕</button>
          </div>
          <p className="font-body text-xs tracking-widest text-white/30 mb-3">HISTÓRICO DE COMPRAS</p>
          {(selected.vendas||[]).length === 0 ? (
            <p className="font-body text-sm text-white/30">Sem compras registradas.</p>
          ) : (
            (selected.vendas||[]).map(v => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-white/8">
                <div>
                  <p className="font-body text-xs text-white/70">#{v.numero} — {fmtDate(v.created_at)}</p>
                  <p className="font-body text-xs text-white/30">{(v.venda_itens||[]).map(i=>i.nome_produto).join(', ')}</p>
                </div>
                <span className="font-display text-base text-white">{fmtBRL(v.total)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </TabWrapper>
  )
}

/* ════════════════════════════════════════════════════════════
   COMPONENTES GENÉRICOS
════════════════════════════════════════════════════════════ */
function TabWrapper({ title, subtitle, children }) {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-white">{title}</h1>
        {subtitle && <p className="font-body text-sm text-white/30 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div>
      <label className="font-body text-xs tracking-widest text-white/40 block mb-2">{label.toUpperCase()}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-sage bg-white/5 transition-colors"/>
    </div>
  )
}

function SaveBtn({ onClick, saving, className='' }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`bg-sage text-white font-body text-xs tracking-widest px-6 py-3 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${className}`}>
      {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
      {saving ? 'SALVANDO...' : 'SALVAR'}
    </button>
  )
}

function ActionBtn({ title, icon, onClick, danger=false }) {
  return (
    <button title={title} onClick={e=>{e.stopPropagation();onClick()}}
      className={`w-8 h-8 flex items-center justify-center text-sm border transition-all hover:scale-110 ${danger ? 'border-red-900/30 hover:border-red-500/50 hover:bg-red-900/20' : 'border-white/8 hover:border-sage/40 hover:bg-sage/10'}`}>
      {icon}
    </button>
  )
}

function Modal({ title, onClose, children, size='md' }) {
  const maxW = size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)'}}>
      <div className={`w-full ${maxW} border border-white/10 overflow-y-auto max-h-[90vh]`} style={{background:'#0f0f0f'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0" style={{background:'#0f0f0f'}}>
          <h2 className="font-display text-xl font-light text-white">{title}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-sage/30 border-t-sage rounded-full animate-spin"/>
    </div>
  )
}
