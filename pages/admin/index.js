// pages/admin/index.js
// YOU360 — Painel Admin completo

import Head from 'next/head'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { api, isAuthenticated, removeToken } from '../../lib/apiClient'

function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2)  return `(${digits}`
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
}

const LINHAS_DB  = ['skincare','perfumes','estetica','cabelos','corpo','maquiagem']
const BADGES     = ['', 'NOVO', 'DESTAQUE', 'EXCLUSIVO', 'LIMITADO', 'MAIS VENDIDO']
const EMPTY_PROD = { nome:'', linha:'skincare', fragrancia:'', descricao:'', preco:'', badge:'', ativo:true, imagem_url:'', estoque:'' }
const EMPTY_DEP  = { nome:'', cidade:'', texto:'', inicial:'', cor:'text-sage', bg:'bg-sage/30', ativo:true }

const fmtBRL      = v => `R$ ${Number(v).toFixed(2).replace('.', ',')}`
const fmtDate     = s => s ? new Date(s).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmtDateTime = s => s ? new Date(s).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab,     setActiveTab]     = useState('hero')
  const [adminNome,     setAdminNome]     = useState('Admin')
  const [toast,         setToast]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
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

  return (
    <>
      <Head><title>Admin — YOU360</title><meta name="robots" content="noindex,nofollow"/></Head>

      <div className="min-h-screen bg-obsidian flex">

        {/* ── SIDEBAR ── */}
        <aside className="hidden md:flex w-60 flex-col border-r border-white/8 px-4 py-8 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center px-2 mb-10">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/IMG-20260325-WA0003-removebg-preview.png" alt="YOU360" className="h-10 w-auto object-contain brightness-0 invert"/>
</div>
          <nav className="flex-1 space-y-1">
            <SidebarLink active={activeTab==='hero'} onClick={() => setActiveTab('hero')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="11" rx="2"/><path d="M3 17h18M7 21h10"/></svg>}
              label="Produto Inicial"/>
            <SidebarLink active={activeTab==='linhas'} onClick={() => setActiveTab('linhas')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="18" rx="1"/><rect x="16" y="3" width="6" height="18" rx="1"/></svg>}
              label="Linhas"/>
            <SidebarLink active={activeTab==='produtos'} onClick={() => setActiveTab('produtos')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/></svg>}
              label="Produtos"/>
            <SidebarLink active={activeTab==='depoimentos'} onClick={() => setActiveTab('depoimentos')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
              label="Depoimentos"/>
            <div className="h-px bg-white/8 my-2"/>
            <SidebarLink active={activeTab==='vendas'} onClick={() => setActiveTab('vendas')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
              label="Vendas"/>
            <SidebarLink active={activeTab==='clientes'} onClick={() => setActiveTab('clientes')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
              label="Clientes"/>
          </nav>
          <div className="border-t border-white/8 pt-4 mt-4">
            <p className="font-body text-xs text-white/30 px-2 mb-1 truncate">{adminNome}</p>
            <a href="/" target="_blank" className="admin-sidebar-link w-full text-left hover:text-sage mb-1 block">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Ver Loja
            </a>
            <button onClick={handleLogout} className="admin-sidebar-link w-full text-left hover:text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sair
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/8">
           {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/IMG-20260325-WA0003-removebg-preview.png" alt="YOU360" className="h-8 w-auto object-contain brightness-0 invert"/>
            <button onClick={handleLogout} className="font-body text-xs text-white/40 hover:text-white">Sair</button>
          </div>
          <div className="md:hidden flex border-b border-white/8 overflow-x-auto">
            {[{key:'hero',label:'HERO'},{key:'linhas',label:'LINHAS'},{key:'produtos',label:'PRODUTOS'},{key:'depoimentos',label:'DEP.'},{key:'vendas',label:'VENDAS'},{key:'clientes',label:'CLIENTES'}].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-shrink-0 px-4 py-3 font-body text-xs tracking-widest transition-colors ${activeTab===t.key ? 'text-sage border-b-2 border-sage' : 'text-white/40'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {activeTab === 'hero'        && <HeroSection       showToast={showToast}/>}
          {activeTab === 'linhas'      && <LinhasSection      showToast={showToast}/>}
          {activeTab === 'produtos'    && <ProdutosSection    showToast={showToast} setDeleteConfirm={setDeleteConfirm}/>}
          {activeTab === 'depoimentos' && <DepoimentosSection showToast={showToast}/>}
          {activeTab === 'vendas'      && <VendasSection      showToast={showToast} setActiveTab={setActiveTab}/>}
          {activeTab === 'clientes'    && <ClientesSection    showToast={showToast}/>}
        </main>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 font-body text-sm shadow-xl flex items-center gap-3
          ${toast.type==='error' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-sage text-white'}`}>
          {toast.type==='error'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.msg}
        </div>
      )}

      {deleteConfirm && (
        <DeleteConfirmToast
          produto={deleteConfirm}
          onConfirm={async () => {
            try {
              await api.adminProducts.remove(deleteConfirm.id)
              setDeleteConfirm(null)
              showToast(`"${deleteConfirm.nome}" excluído`)
              window.dispatchEvent(new Event('refetch-products'))
            } catch (err) {
              showToast(err.message || 'Erro ao excluir', 'error')
              setDeleteConfirm(null)
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <style jsx global>{`
        .admin-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); color:white; font-family:'Jost',sans-serif; font-size:0.875rem; padding:10px 14px; outline:none; transition:border-color 0.2s; }
        .admin-input:focus { border-color:#4a7c59; }
        .admin-input::placeholder { color:rgba(255,255,255,0.25); }
        .admin-input option { background:#1a1a1a; color:white; }
        .admin-sidebar-link { display:flex; align-items:center; gap:10px; padding:9px 12px; font-family:'Jost',sans-serif; font-size:0.75rem; letter-spacing:0.05em; color:rgba(255,255,255,0.4); transition:all 0.2s; border-radius:2px; }
        .admin-sidebar-link:hover { color:rgba(255,255,255,0.8); background:rgba(255,255,255,0.04); }
        .admin-sidebar-link.active { color:#4a7c59; background:rgba(74,124,89,0.12); }
        .drag-over { border-color:#4a7c59 !important; background:rgba(74,124,89,0.08) !important; }
      `}</style>
    </>
  )
}


// ══════════════════════════════════════════════════════════════
//  UPLOAD BUTTON — componente reutilizável
// ══════════════════════════════════════════════════════════════
function UploadButton({ onUpload, uploading, showToast }) {
  const fileRef = useRef()
  const handleChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const tiposPermitidos = ['image/jpeg','image/png','image/webp','image/gif']
    if (!tiposPermitidos.includes(file.type)) { showToast('Formato inválido. Use JPG, PNG ou WEBP.','error'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('Imagem muito grande. Máximo 5MB.','error'); return }
    await onUpload(file)
    e.target.value = ''
  }
  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} className="hidden"/>
      <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
        className="font-body text-xs tracking-widest border border-white/20 text-white/50 px-4 py-2 hover:border-sage hover:text-sage transition-all disabled:opacity-50 flex items-center gap-2">
        {uploading
          ? <><div className="w-3 h-3 border border-sage/50 border-t-sage rounded-full animate-spin"/>ENVIANDO...</>
          : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>FAZER UPLOAD</>}
      </button>
    </>
  )
}


// ══════════════════════════════════════════════════════════════
//  ABA A — HERO
// ══════════════════════════════════════════════════════════════
function HeroSection({ showToast }) {
  const [form,         setForm]         = useState({ nome:'', preco:'', imagem_url:'' })
  const [imgPreview,   setImgPreview]   = useState('')
  const [urlInput,     setUrlInput]     = useState('')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)

  useEffect(() => {
    api.hero.get().then(d => {
      if (d) {
        setForm({ nome: d.nome||'', preco: d.preco ? String(d.preco) : '', imagem_url: d.imagem_url||'' })
        setImgPreview(d.imagem_url||'')
        setUrlInput(d.imagem_url||'')
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      const result = await api.upload.image(file)
      const url = result.url || result
      setUrlInput(url); setImgPreview(url)
      showToast('Imagem enviada!')
    } catch (err) { showToast(err.message||'Erro no upload','error') }
    finally { setUploading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.hero.update({
        nome:       form.nome.trim()||null,
        preco:      form.preco ? parseFloat(form.preco) : null,
        imagem_url: urlInput.trim()||null,
      })
      setImgPreview(urlInput.trim())
      showToast('Produto inicial atualizado!')
    } catch (err) { showToast(err.message||'Erro ao salvar','error') }
    finally { setSaving(false) }
  }

  if (loading) return <SectionLoader/>
  return (
    <div className="flex-1 overflow-auto">
      <header className="px-6 md:px-8 py-5 border-b border-white/8">
        <h1 className="font-display text-2xl font-light text-white">Produto Inicial</h1>
        <p className="font-body text-xs text-white/30 mt-0.5">Define o produto exibido na sessão principal do site</p>
      </header>
      <div className="px-6 md:px-8 py-8 max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border border-white/10 p-5" style={{ background:'rgba(255,255,255,0.03)' }}>
            <p className="font-body text-xs tracking-widest text-white/40 mb-4">IMAGEM DO PRODUTO INICIAL</p>
            <div className="flex items-start gap-5">
              <div className="w-28 h-36 flex-shrink-0 border border-white/10 overflow-hidden flex items-center justify-center" style={{ background:'rgba(74,124,89,0.1)' }}>
                {imgPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={imgPreview} alt="preview" className="w-full h-full object-contain p-2"/>
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="1" opacity=".5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M3 21l5-5 4 4 4-5 5 6"/></svg>}
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-body text-xs text-white/40 tracking-widest">URL DA IMAGEM</p>
                <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setImgPreview(e.target.value) }} placeholder="https://exemplo.com/imagem.jpg" className="admin-input"/>
                <div className="flex items-center gap-3">
                  <UploadButton onUpload={handleUpload} uploading={uploading} showToast={showToast}/>
                  <p className="font-body text-xs text-white/25">PNG, JPG ou WEBP. Máx 5MB.</p>
                </div>
                {imgPreview && !clearConfirm && (
                  <button type="button" onClick={() => setClearConfirm(true)} className="font-body text-xs text-red-400/60 hover:text-red-400 transition-colors block">Remover imagem</button>
                )}
                {clearConfirm && (
                  <div className="border border-red-500/30 px-3 py-2" style={{ background:'rgba(220,38,38,0.08)' }}>
                    <p className="font-body text-xs text-red-300 mb-2">Tem certeza?</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setUrlInput(''); setImgPreview(''); setClearConfirm(false) }} className="font-body text-xs bg-red-700 text-white px-3 py-1">SIM</button>
                      <button type="button" onClick={() => setClearConfirm(false)} className="font-body text-xs border border-white/20 text-white/50 px-3 py-1">CANCELAR</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <FormField label="NOME DO PRODUTO">
            <input value={form.nome} onChange={e => setForm({...form,nome:e.target.value})} placeholder="Ex: YOU Glow Sérum" className="admin-input"/>
          </FormField>
          <FormField label="PREÇO (R$)">
            <input type="number" step="0.01" min="0" value={form.preco} onChange={e => setForm({...form,preco:e.target.value})} placeholder="189.90" className="admin-input"/>
          </FormField>
          <button type="submit" disabled={saving||uploading} className="w-full bg-sage text-white font-body text-xs tracking-widest py-4 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            {saving ? 'SALVANDO...' : 'SALVAR PRODUTO INICIAL'}
          </button>
        </form>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  ABA B — LINHAS
// ══════════════════════════════════════════════════════════════
const LINHA_BG_LABELS = ['Linha 1 — Fundo verde/rosado','Linha 2 — Fundo escuro · Destaque','Linha 3 — Fundo rosado']

function LinhasSection({ showToast }) {
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(null)
  const [uploading, setUploading] = useState([false,false,false])
  const [forms,     setForms]     = useState([
    {nome_linha:'',titulo:'',subtitulo:'',descricao:'',imagem_url:''},
    {nome_linha:'',titulo:'',subtitulo:'',descricao:'',imagem_url:''},
    {nome_linha:'',titulo:'',subtitulo:'',descricao:'',imagem_url:''},
  ])

  useEffect(() => {
    api.linhas.list().then(data => {
      if (data && data.length >= 3) {
        setForms(data.slice(0,3).map(l => ({
          nome_linha: l.nome_linha||'', titulo: l.titulo||'',
          subtitulo: l.subtitulo||'', descricao: l.descricao||'', imagem_url: l.imagem_url||''
        })))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const updateForm = (idx, field, value) => setForms(forms.map((f,i) => i===idx ? {...f,[field]:value} : f))

  const handleUpload = async (idx, file) => {
    const upd = [...uploading]; upd[idx] = true; setUploading(upd)
    try {
      const result = await api.upload.image(file)
      updateForm(idx, 'imagem_url', result.url || result)
      showToast(`Imagem da Linha ${idx+1} enviada!`)
    } catch (err) { showToast(err.message||'Erro no upload','error') }
    finally { const upd2 = [...uploading]; upd2[idx] = false; setUploading(upd2) }
  }

  const handleSave = async (e, idx) => {
    e.preventDefault(); setSaving(idx+1)
    try {
      await api.linhas.update(idx+1, {
        nome_linha: forms[idx].nome_linha.trim(),
        titulo:     forms[idx].titulo.trim()||null,
        subtitulo:  forms[idx].subtitulo.trim()||null,
        descricao:  forms[idx].descricao.trim()||null,
        imagem_url: forms[idx].imagem_url.trim()||null,
      })
      showToast(`Linha ${idx+1} atualizada!`)
    } catch (err) { showToast(err.message||'Erro','error') }
    finally { setSaving(null) }
  }

  if (loading) return <SectionLoader/>
  return (
    <div className="flex-1 overflow-auto">
      <header className="px-6 md:px-8 py-5 border-b border-white/8">
        <h1 className="font-display text-2xl font-light text-white">Linhas</h1>
        <p className="font-body text-xs text-white/30 mt-0.5">Edite o conteúdo dos 3 banners de coleções</p>
      </header>
      <div className="px-6 md:px-8 py-8 space-y-10 max-w-2xl">
        {forms.map((form, idx) => (
          <div key={idx} className="border border-white/8 p-6" style={{background:'rgba(255,255,255,0.02)'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-sage text-sm">{idx+1}</span>
              </div>
              <div>
                <p className="font-body text-sm text-white font-medium">Linha {idx+1}</p>
                <p className="font-body text-xs text-white/30">{LINHA_BG_LABELS[idx]}</p>
              </div>
            </div>
            <form onSubmit={(e) => handleSave(e,idx)} className="space-y-4">
              <FormField label="IMAGEM">
                <div className="space-y-2">
                  {form.imagem_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imagem_url} alt="preview" className="w-16 h-20 object-cover border border-white/10"/>
                  )}
                  <input value={form.imagem_url} onChange={e => updateForm(idx,'imagem_url',e.target.value)} placeholder="https://exemplo.com/imagem.jpg" className="admin-input"/>
                  <div className="flex items-center gap-3">
                    <UploadButton onUpload={(file) => handleUpload(idx, file)} uploading={uploading[idx]} showToast={showToast}/>
                    <p className="font-body text-xs text-white/25">PNG, JPG ou WEBP. Máx 5MB.</p>
                  </div>
                </div>
              </FormField>
              <FormField label="NOME DA LINHA">
                <input value={form.nome_linha} onChange={e => updateForm(idx,'nome_linha',e.target.value)} placeholder="Ex: LINHA SKINCARE" className="admin-input"/>
              </FormField>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <FormField label="TÍTULO"><input value={form.titulo} onChange={e => updateForm(idx,'titulo',e.target.value)} placeholder="Ex: Skin" className="admin-input"/></FormField>
                <FormField label="SUBTÍTULO"><input value={form.subtitulo} onChange={e => updateForm(idx,'subtitulo',e.target.value)} placeholder="Ex: Glow" className="admin-input"/></FormField>
              </div>
              <FormField label="DESCRIÇÃO CURTA">
                <input value={form.descricao} onChange={e => updateForm(idx,'descricao',e.target.value)} placeholder="Ex: Vitamina C, Colágeno & Ácido Hialurônico" className="admin-input"/>
              </FormField>
              <button type="submit" disabled={saving===idx+1||uploading[idx]} className="w-full bg-sage/20 border border-sage/40 text-sage font-body text-xs tracking-widest py-3 hover:bg-sage hover:text-white hover:border-sage transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving===idx+1 && <div className="w-4 h-4 border-2 border-sage/30 border-t-sage rounded-full animate-spin"/>}
                {saving===idx+1 ? 'SALVANDO...' : `SALVAR LINHA ${idx+1}`}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  ABA C — PRODUTOS
// ══════════════════════════════════════════════════════════════
function ProdutosSection({ showToast, setDeleteConfirm }) {
  const [products,    setProducts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [duplicating, setDuplicating] = useState(null)
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState(null)
  const [form,        setForm]        = useState(EMPTY_PROD)
  const [search,      setSearch]      = useState('')
  const [statusFilter,setStatusFilter]= useState('todos')
  const [savingOrder, setSavingOrder] = useState(false)
  const [priceHistory,setPriceHistory]= useState(null)
  const [galleryProd, setGalleryProd] = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [uploading,   setUploading]   = useState(false)

  const dragItem  = useRef(null)
  const dragOver  = useRef(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    try { const data = await api.adminProducts.list(); setProducts(data||[]) } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])
  useEffect(() => {
    const handler = () => fetchProducts()
    window.addEventListener('refetch-products', handler)
    return () => window.removeEventListener('refetch-products', handler)
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.nome?.toLowerCase().includes(search.toLowerCase()) || p.linha?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter==='todos' ? true : statusFilter==='ativos' ? p.ativo===true : p.ativo===false
    return matchSearch && matchStatus
  })

  const countAtivos   = products.filter(p=>p.ativo).length
  const countInativos = products.filter(p=>!p.ativo).length

  const handleDragStart = (idx) => { dragItem.current=idx; setDragIndex(idx) }
  const handleDragEnter = (idx) => { dragOver.current=idx; setOverIndex(idx) }
  const handleDragEnd   = async () => {
    const from=dragItem.current; const to=dragOver.current
    setDragIndex(null); setOverIndex(null); dragItem.current=null; dragOver.current=null
    if (from===null||to===null||from===to) return
    const reordered=[...products]; const [moved]=reordered.splice(from,1); reordered.splice(to,0,moved)
    setProducts(reordered); setSavingOrder(true)
    try { await api.adminProducts.reorder(reordered.map((p,i) => ({ id:p.id, ordem:i }))); showToast('Ordem salva!') }
    catch { showToast('Erro ao salvar ordem','error') }
    finally { setSavingOrder(false) }
  }

  const handleDuplicate = async (p) => {
    setDuplicating(p.id)
    try { await api.adminProducts.duplicate(p.id); showToast(`"${p.nome}" duplicado!`); fetchProducts() }
    catch (err) { showToast(err.message||'Erro','error') }
    finally { setDuplicating(null) }
  }

  const openPriceHistory = async (p) => {
    try {
      const data = await api.adminProducts.priceHistory(p.id)
      // BUG 3 CORRIGIDO — PHP retorna { produto, historico }, não array direto
      const historico = data?.historico || (Array.isArray(data) ? data : [])
      setPriceHistory({ produto:p, historico })
    }
    catch { setPriceHistory({ produto:p, historico:[] }) }
  }

  const openNew  = () => { setEditingId(null); setForm(EMPTY_PROD); setShowForm(true) }
  const openEdit = (p) => {
    setEditingId(p.id)
    setForm({ nome:p.nome||'', linha:p.linha||'skincare', fragrancia:p.fragrancia||'', descricao:p.descricao||'', preco:p.preco?String(p.preco):'', badge:p.badge||'', ativo:p.ativo!==false, imagem_url:p.imagem_url||'', estoque:p.estoque!==null&&p.estoque!==undefined?String(p.estoque):'' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null) }

  const handleFileUpload = async (file) => {
    setUploading(true)
    try {
      const result = await api.upload.image(file)
      setForm(f => ({...f, imagem_url: result.url || result}))
      showToast('Imagem enviada!')
    } catch (err) { showToast(err.message||'Erro no upload','error') }
    finally { setUploading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return showToast('Nome é obrigatório','error')
    if (!form.preco||isNaN(form.preco)) return showToast('Preço inválido','error')
    setSaving(true)
    try {
      const estoqueVal = form.estoque===''||form.estoque===null ? null : parseInt(form.estoque)
      const payload = { nome:form.nome.trim(), linha:form.linha, fragrancia:form.fragrancia.trim(), descricao:form.descricao.trim(), preco:parseFloat(form.preco), badge:form.badge||null, ativo:form.ativo, imagem_url:form.imagem_url.trim()||null, estoque:estoqueVal }
      if (editingId) { await api.adminProducts.update(editingId, payload); showToast('Produto atualizado!') }
      else { await api.adminProducts.create({...payload, ordem:products.length}); showToast('Produto cadastrado!') }
      closeForm(); fetchProducts()
    } catch (err) { showToast(err.message||'Erro','error') }
    finally { setSaving(false) }
  }

  const handleDelete = (p) => {
    setDeleting(p.id); setDeleteConfirm({id:p.id,nome:p.nome})
    const cleanup=()=>setDeleting(null)
    window.addEventListener('refetch-products',cleanup,{once:true})
    setTimeout(cleanup,10000)
  }

  const toggleAtivo = async (p) => {
    try { await api.adminProducts.toggle(p.id); fetchProducts() } catch {}
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-white/8">
        <div>
          <h1 className="font-display text-2xl font-light text-white">Produtos</h1>
          <p className="font-body text-xs text-white/30 mt-0.5 flex items-center gap-2">
            {products.length} produto{products.length!==1?'s':''}
            {savingOrder && <span className="text-sage animate-pulse">· salvando ordem...</span>}
          </p>
        </div>
        <button onClick={openNew} className="bg-sage text-white font-body text-xs tracking-widest px-3 md:px-5 py-2.5 hover:bg-sage-dark transition-all flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          <span className="hidden sm:inline">NOVO PRODUTO</span>
          <span className="sm:hidden">NOVO</span>
        </button>
      </header>

      <div className="px-4 md:px-8 py-4 border-b border-white/5 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou linha..."
            className="w-full pl-10 pr-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
            style={{background:'rgba(255,255,255,0.04)'}}/>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[{key:'todos',label:`Todos (${products.length})`},{key:'ativos',label:`Ativos (${countAtivos})`},{key:'inativos',label:`Inativos (${countInativos})`}].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`font-body text-xs tracking-widest px-3 py-1.5 border transition-all ${statusFilter===f.key ? 'border-sage text-sage bg-sage/10' : 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-white/15 italic mb-3">Nenhum produto</p>
            <p className="font-body text-sm text-white/30">{statusFilter!=='todos'?'Nenhum produto neste filtro.':'Clique em "Novo Produto" para começar.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, idx) => (
              <div key={p.id}
                draggable={!search&&statusFilter==='todos'}
                onDragStart={()=>handleDragStart(idx)} onDragEnter={()=>handleDragEnter(idx)}
                onDragEnd={handleDragEnd} onDragOver={e=>e.preventDefault()}
                className={`border transition-all select-none ${dragIndex===idx?'opacity-40':''} ${overIndex===idx&&dragIndex!==idx?'drag-over border-sage/50':'border-white/8 hover:border-white/15'}`}
                style={{background:'rgba(255,255,255,0.03)'}}>

                {/* ── Linha principal do card ── */}
                <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4"
                  style={{cursor:(!search&&statusFilter==='todos')?'grab':'default'}}>

                  {!search&&statusFilter==='todos' && (
                    <div className="flex-shrink-0 text-white/20 hover:text-white/50 cursor-grab hidden sm:block">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"/></svg>
                    </div>
                  )}

                  <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 overflow-hidden" style={{background:'rgba(74,124,89,0.15)'}}>
                    {p.imagem_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-sage/40"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M3 21l5-5 4 4 4-5 5 6"/></svg></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-display text-base md:text-lg font-light text-white truncate">{p.nome}</p>
                      {p.badge && <span className="font-body text-xs bg-sage/20 text-sage-light px-1.5 py-0.5">{p.badge}</span>}
                      {!p.ativo && <span className="font-body text-xs bg-white/5 text-white/30 px-1.5 py-0.5 border border-white/10">INATIVO</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.linha && <span className="font-body text-xs text-white/30 tracking-widest uppercase">{p.linha}</span>}
                      {/* CORREÇÃO — Number() para comparação correta quando API retorna string */}
                      {p.estoque !== null && p.estoque !== undefined && (
                        <span className={`font-body text-xs px-1.5 py-0.5 ${Number(p.estoque)<=0 ? 'bg-red-900/30 text-red-400' : Number(p.estoque)<=5 ? 'bg-orange-900/30 text-orange-400' : 'bg-sage/10 text-sage/70'}`}>
                          {Number(p.estoque)<=0 ? 'ESGOTADO' : `${p.estoque} un.`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-display text-base md:text-xl font-light text-white">{fmtBRL(p.preco)}</p>
                    <button onClick={() => toggleAtivo(p)}
                      className={`w-9 md:w-10 h-5 rounded-full transition-all duration-300 relative flex-shrink-0 ${p.ativo?'bg-sage':'bg-white/15'}`} title={p.ativo?'Desativar':'Ativar'}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${p.ativo?'left-4 md:left-5':'left-0.5'}`}/>
                    </button>
                  </div>
                </div>

                {/* ── Mobile: barra de ações na base ── */}
                <div className="md:hidden flex items-center gap-1 px-3 pb-3 border-t border-white/5 pt-2 overflow-x-auto">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all font-body text-xs">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                  <button onClick={() => handleDuplicate(p)} disabled={duplicating===p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all disabled:opacity-50 font-body text-xs">
                    {duplicating===p.id ? <div className="w-3 h-3 border border-sage border-t-transparent rounded-full animate-spin"/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
                    Duplicar
                  </button>
                  <button onClick={() => setGalleryProd(p)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all font-body text-xs">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Galeria
                  </button>
                  <button onClick={() => openPriceHistory(p)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all font-body text-xs">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    Preços
                  </button>
                  <button onClick={() => handleDelete(p)} disabled={deleting===p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-50 font-body text-xs">
                    {deleting===p.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                    Excluir
                  </button>
                </div>

                {/* ── Desktop: botões inline abaixo da linha principal ── */}
                <div className="hidden md:flex items-center gap-1.5 px-4 pb-3 justify-end">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all" title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDuplicate(p)} disabled={duplicating===p.id} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all disabled:opacity-50" title="Duplicar">
                    {duplicating===p.id ? <div className="w-3 h-3 border border-sage border-t-transparent rounded-full animate-spin"/>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
                  </button>
                  <button onClick={() => setGalleryProd(p)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all" title="Galeria">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                  <button onClick={() => openPriceHistory(p)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all" title="Histórico de preços">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </button>
                  <button onClick={() => handleDelete(p)} disabled={deleting===p.id} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-50" title="Excluir">
                    {deleting===p.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"/>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal produto */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)'}}>
          <div className="relative w-full max-w-xl my-4 sm:my-8 border border-white/10" style={{background:'#1a1a1a'}}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <h2 className="font-display text-2xl font-light text-white">{editingId?'Editar Produto':'Novo Produto'}</h2>
              <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
              <FormField label="NOME DO PRODUTO *">
                <input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} required placeholder="Ex: YOU Glow Sérum" className="admin-input"/>
              </FormField>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <FormField label="LINHA">
                  {(() => {
                    const linhasExistentes = [...new Set([...LINHAS_DB, ...products.map(p=>p.linha).filter(Boolean)])].sort()
                    const isNova = form.linha && !linhasExistentes.includes(form.linha)
                    return (
                      <div className="space-y-1.5">
                        <select value={isNova ? '__nova__' : (form.linha || '')} onChange={e => { if (e.target.value==='__nova__') setForm({...form,linha:''}); else setForm({...form,linha:e.target.value}) }} className="admin-input">
                          {linhasExistentes.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                          <option value="__nova__">+ Nova linha...</option>
                        </select>
                        {(isNova || form.linha==='') && (
                          <input autoFocus value={form.linha==='__nova__'?'':form.linha} onChange={e=>setForm({...form,linha:e.target.value.toLowerCase().trim()})} placeholder="Digite o nome da nova linha" className="admin-input" style={{fontSize:'0.85rem'}}/>
                        )}
                      </div>
                    )
                  })()}
                </FormField>
                <FormField label="BADGE">
                  <select value={form.badge} onChange={e=>setForm({...form,badge:e.target.value})} className="admin-input">
                    {BADGES.map(b=><option key={b} value={b}>{b||'— Nenhum'}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="NOTAS / FRAGRÂNCIA">
                <input value={form.fragrancia} onChange={e=>setForm({...form,fragrancia:e.target.value})} placeholder="Ex: Vitamina C 20%, Ácido Hialurônico & Niacinamida" className="admin-input"/>
              </FormField>
              <FormField label="DESCRIÇÃO">
                <textarea value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} rows={3} placeholder="Descreva o produto..." className="admin-input resize-none"/>
              </FormField>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <FormField label="PREÇO (R$) *">
                  <input type="number" step="0.01" min="0" value={form.preco} onChange={e=>setForm({...form,preco:e.target.value})} required placeholder="189.90" className="admin-input"/>
                </FormField>
                <FormField label="ESTOQUE (opcional)">
                  <input type="number" min="0" value={form.estoque} onChange={e=>setForm({...form,estoque:e.target.value})} placeholder="Vazio = sem controle" className="admin-input"/>
                </FormField>
              </div>
              {form.estoque !== '' && (
                <div className="border-l-2 border-sage/40 pl-4 py-1">
                  <p className="font-body text-xs text-white/35 leading-relaxed">
                    {parseInt(form.estoque)<=0 ? '⚠ Produto aparecerá como "Esgotado" na loja.' : parseInt(form.estoque)<=5 ? `⚠ Aparecerá "Últimas ${form.estoque} unidades" na loja.` : `✓ ${form.estoque} unidades disponíveis.`}
                  </p>
                </div>
              )}
              <FormField label="IMAGEM PRINCIPAL">
                <div className="space-y-3">
                  {form.imagem_url && (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imagem_url} alt="preview" className="w-16 h-16 object-cover border border-white/10 flex-shrink-0"/>
                      <p className="font-body text-xs text-white/40 truncate flex-1">{form.imagem_url}</p>
                    </div>
                  )}
                  <input value={form.imagem_url} onChange={e=>setForm({...form,imagem_url:e.target.value})} placeholder="https://exemplo.com/imagem.jpg" className="admin-input"/>
                  <div className="flex items-center gap-3">
                    <UploadButton onUpload={handleFileUpload} uploading={uploading} showToast={showToast}/>
                    <p className="font-body text-xs text-white/25">PNG, JPG ou WEBP. Máx 5MB.</p>
                  </div>
                </div>
              </FormField>
              <div className="flex items-center justify-between py-2">
                <div><p className="font-body text-sm text-white">Produto ativo</p><p className="font-body text-xs text-white/30">Produtos inativos não aparecem na loja</p></div>
                <button type="button" onClick={()=>setForm({...form,ativo:!form.ativo})} className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.ativo?'bg-sage':'bg-white/15'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.ativo?'left-7':'left-1'}`}/>
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-3 hover:border-white/30 transition-all">CANCELAR</button>
                <button type="submit" disabled={saving||uploading} className="flex-1 bg-sage text-white font-body text-xs tracking-widest py-3 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {saving ? 'SALVANDO...' : editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal histórico de preços */}
      {priceHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)'}} onClick={()=>setPriceHistory(null)}>
          <div className="w-full max-w-md border border-white/10" style={{background:'#1a1a1a'}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div><h2 className="font-display text-xl font-light text-white">Histórico de Preços</h2><p className="font-body text-xs text-white/40 mt-0.5">{priceHistory.produto.nome}</p></div>
              <button onClick={()=>setPriceHistory(null)} className="text-white/30 hover:text-white transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <div className="px-6 py-5 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between py-3 border-b border-white/8 mb-2">
                <span className="font-body text-xs text-sage tracking-widest">PREÇO ATUAL</span>
                <span className="font-display text-2xl font-light text-white">{fmtBRL(priceHistory.produto.preco)}</span>
              </div>
              {priceHistory.historico.length===0 ? (
                <div className="py-8 text-center"><p className="font-body text-sm text-white/30">Nenhuma alteração registrada.</p></div>
              ) : (
                <div className="space-y-2 mt-3">
                  {priceHistory.historico.map((h,i) => {
                    const subiu = h.preco_novo > h.preco_anterior
                    return (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-body text-xs ${subiu?'text-red-400':'text-sage'}`}>{subiu?'▲':'▼'} {fmtBRL(h.preco_novo)}</span>
                            <span className="font-body text-xs text-white/20">de {fmtBRL(h.preco_anterior)}</span>
                          </div>
                          <p className="font-body text-xs text-white/25 mt-0.5">{fmtDateTime(h.created_at)}</p>
                        </div>
                        <span className={`font-body text-xs px-2 py-0.5 ${subiu?'bg-red-400/10 text-red-400':'bg-sage/10 text-sage'}`}>
                          {subiu?`+${fmtBRL(h.preco_novo-h.preco_anterior)}`:`-${fmtBRL(h.preco_anterior-h.preco_novo)}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {galleryProd && (
        <GaleriaModal produto={galleryProd} showToast={showToast} onClose={() => setGalleryProd(null)}/>
      )}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  GALERIA DE IMAGENS
// ══════════════════════════════════════════════════════════════
function GaleriaModal({ produto, showToast, onClose }) {
  const [galeria,    setGaleria]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [adding,     setAdding]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [urlInput,   setUrlInput]   = useState('')
  const [deleteId,   setDeleteId]   = useState(null)
  const fileRef = useRef()

  const fetchGaleria = async () => {
    setLoading(true)
    try { const data = await api.products.gallery(produto.id); setGaleria(data||[]) }
    catch { setGaleria([]) }
    setLoading(false)
  }

  useEffect(() => { fetchGaleria() }, [produto.id])

  const handleAdd = async () => {
    if (!urlInput.trim()) return showToast('Cole uma URL de imagem','error')
    setAdding(true)
    try { await api.adminProducts.addGallery(produto.id, urlInput.trim()); showToast('Foto adicionada!'); setUrlInput(''); fetchGaleria() }
    catch (err) { showToast(err.message||'Erro ao adicionar','error') }
    finally { setAdding(false) }
  }

  // IMPLEMENTAÇÃO 1 — upload direto de arquivo para galeria
  const handleUploadFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const tiposPermitidos = ['image/jpeg','image/png','image/webp','image/gif']
    if (!tiposPermitidos.includes(file.type)) { showToast('Formato inválido. Use JPG, PNG ou WEBP.','error'); e.target.value=''; return }
    if (file.size > 5 * 1024 * 1024) { showToast('Imagem muito grande. Máximo 5MB.','error'); e.target.value=''; return }
    setUploading(true)
    try {
      const result = await api.upload.image(file)
      const url = result.url || result
      await api.adminProducts.addGallery(produto.id, url)
      showToast('Foto enviada e adicionada à galeria!')
      fetchGaleria()
    } catch (err) { showToast(err.message||'Erro no upload','error') }
    finally { setUploading(false); e.target.value='' }
  }

  const handleDelete = async (id) => {
    setDeleteId(id)
    try { await api.adminProducts.removeGallery(produto.id, id); showToast('Foto removida!'); fetchGaleria() }
    catch { showToast('Erro ao remover foto','error') }
    finally { setDeleteId(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-2xl my-4 sm:my-8 border border-white/10" style={{ background:'#1a1a1a' }} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="font-display text-xl font-light text-white">Galeria de Imagens</h2>
            <p className="font-body text-xs text-white/40 mt-0.5">{produto.nome} · {galeria.length} foto{galeria.length!==1?'s':''} extras</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-5">
          {/* Upload direto */}
          <div className="border border-white/8 p-4 mb-5" style={{background:'rgba(255,255,255,0.02)'}}>
            <p className="font-body text-xs tracking-widest text-white/40 mb-3">FAZER UPLOAD DE FOTO</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadFile} className="hidden"/>
            <button onClick={() => fileRef.current.click()} disabled={uploading}
              className="w-full font-body text-xs tracking-widest border border-dashed border-white/20 text-white/50 py-4 hover:border-sage hover:text-sage transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading
                ? <><div className="w-4 h-4 border-2 border-sage/30 border-t-sage rounded-full animate-spin"/>ENVIANDO IMAGEM...</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>CLIQUE PARA FAZER UPLOAD (PNG, JPG ou WEBP · Máx 5MB)</>}
            </button>
          </div>
          {/* URL manual */}
          <p className="font-body text-xs text-white/30 mb-2">OU cole uma URL de imagem pública:</p>
          <div className="flex gap-3 mb-6">
            <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" className="admin-input flex-1"/>
            <button onClick={handleAdd} disabled={adding||uploading} className="font-body text-xs tracking-widest bg-sage text-white px-5 py-2.5 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
              {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>}
              ADD
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin"/></div>
          ) : galeria.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="1" opacity=".4" className="mx-auto mb-3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p className="font-body text-sm text-white/30">Nenhuma foto extra cadastrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {galeria.map((img, i) => (
                <div key={img.id} className="relative group aspect-square border border-white/10 overflow-hidden" style={{ background:'rgba(74,124,89,0.1)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imagem_url} alt={`Foto ${i+1}`} className="w-full h-full object-contain p-1"/>
                  <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDelete(img.id)} disabled={deleteId===img.id}
                      className="w-9 h-9 bg-red-700 flex items-center justify-center hover:bg-red-800 transition-all disabled:opacity-50">
                      {deleteId===img.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                    </button>
                  </div>
                  <div className="absolute bottom-1 right-1 bg-obsidian/60 text-white font-body text-xs px-1.5 py-0.5 leading-none">{i+1}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  ABA D — DEPOIMENTOS
// ══════════════════════════════════════════════════════════════
const COR_OPTIONS = [
  { cor:'text-sage',       bg:'bg-sage/30',    label:'Verde' },
  { cor:'text-blush',      bg:'bg-blush/30',   label:'Rosa' },
  { cor:'text-sage-light', bg:'bg-sage/20',    label:'Verde claro' },
  { cor:'text-white',      bg:'bg-white/20',   label:'Branco' },
]

function DepoimentosSection({ showToast }) {
  const [deps,       setDeps]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [form,       setForm]       = useState(EMPTY_DEP)
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const fetchDeps = async () => {
    setLoading(true)
    try { const data = await api.depoimentos.adminList(); setDeps(data||[]) } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchDeps() }, [])

  const openNew  = () => { setEditingId(null); setForm(EMPTY_DEP); setShowForm(true) }
  const openEdit = (d) => {
    setEditingId(d.id)
    setForm({ nome:d.nome||'', cidade:d.cidade||'', texto:d.texto||'', inicial:d.inicial||'', cor:d.cor||'text-sage', bg:d.bg||'bg-sage/30', ativo:d.ativo!==false })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return showToast('Nome é obrigatório','error')
    if (!form.texto.trim()) return showToast('Depoimento é obrigatório','error')
    setSaving(true)
    try {
      const payload = { nome:form.nome.trim(), cidade:form.cidade.trim()||null, texto:form.texto.trim(), inicial:form.inicial.trim()||form.nome.trim().charAt(0).toUpperCase(), cor:form.cor, bg:form.bg, ativo:form.ativo }
      if (editingId) { await api.depoimentos.update(editingId, payload); showToast('Depoimento atualizado!') }
      else { await api.depoimentos.create({...payload, ordem:deps.length}); showToast('Depoimento adicionado!') }
      closeForm(); fetchDeps()
    } catch (err) { showToast(err.message||'Erro','error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleteId(confirmDel.id)
    try { await api.depoimentos.remove(confirmDel.id); showToast('Depoimento excluído!'); setConfirmDel(null); fetchDeps() }
    catch { showToast('Erro ao excluir','error') }
    finally { setDeleteId(null) }
  }

  const toggleAtivo = async (d) => {
    try { await api.depoimentos.toggle(d.id); fetchDeps() } catch {}
  }

  if (loading) return <SectionLoader/>
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/8">
        <div>
          <h1 className="font-display text-2xl font-light text-white">Depoimentos</h1>
          <p className="font-body text-xs text-white/30 mt-0.5">Gerencie os depoimentos exibidos na loja</p>
        </div>
        <button onClick={openNew} className="bg-sage text-white font-body text-xs tracking-widest px-5 py-2.5 hover:bg-sage-dark transition-all flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          NOVO DEPOIMENTO
        </button>
      </header>

      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        {deps.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-white/15 italic mb-3">Nenhum depoimento</p>
            <p className="font-body text-sm text-white/30">Os depoimentos padrão serão exibidos enquanto não houver cadastros.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {deps.map(d => (
              <div key={d.id} className="flex items-start gap-4 p-5 border border-white/8 hover:border-white/15 transition-all" style={{background:'rgba(255,255,255,0.03)'}}>
                <div className={`w-10 h-10 rounded-full ${d.bg||'bg-sage/30'} flex items-center justify-center flex-shrink-0`}>
                  <span className={`font-display ${d.cor||'text-sage'} text-lg`}>{d.inicial || d.nome?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-body text-sm text-white font-medium">{d.nome}</p>
                    {d.cidade && <p className="font-body text-xs text-white/30">{d.cidade}</p>}
                    {!d.ativo && <span className="font-body text-xs bg-white/5 text-white/30 px-2 py-0.5 border border-white/10">INATIVO</span>}
                  </div>
                  <p className="font-display text-sm font-light text-white/60 italic leading-relaxed line-clamp-2">"{d.texto}"</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleAtivo(d)} className={`w-9 h-5 rounded-full transition-all duration-300 relative ${d.ativo?'bg-sage':'bg-white/15'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${d.ativo?'left-4':'left-0.5'}`}/>
                  </button>
                  <button onClick={() => openEdit(d)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => setConfirmDel(d)} disabled={deleteId===d.id} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-50">
                    {deleteId===d.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"/>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)'}}>
          <div className="relative w-full max-w-lg my-4 sm:my-8 border border-white/10" style={{background:'#1a1a1a'}}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <h2 className="font-display text-xl font-light text-white">{editingId?'Editar Depoimento':'Novo Depoimento'}</h2>
              <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <FormField label="NOME *"><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} required placeholder="Ex: Fernanda Lima" className="admin-input"/></FormField>
                <FormField label="CIDADE"><input value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} placeholder="Ex: Fortaleza, CE" className="admin-input"/></FormField>
              </div>
              <FormField label="DEPOIMENTO *">
                <textarea value={form.texto} onChange={e=>setForm({...form,texto:e.target.value})} required rows={4} placeholder="O que o cliente disse..." className="admin-input resize-none"/>
              </FormField>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <FormField label="INICIAL DO AVATAR">
                  <input value={form.inicial} onChange={e=>setForm({...form,inicial:e.target.value.toUpperCase().slice(0,1)})} placeholder="Ex: F" maxLength={1} className="admin-input"/>
                </FormField>
                <FormField label="COR DO AVATAR">
                  <div className="flex gap-2 pt-1">
                    {COR_OPTIONS.map(opt => (
                      <button key={opt.cor} type="button" onClick={() => setForm({...form,cor:opt.cor,bg:opt.bg})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${form.cor===opt.cor?'border-white scale-110':'border-transparent'} ${opt.bg}`}
                        title={opt.label}>
                        <span className={`font-display text-sm ${opt.cor}`}>A</span>
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
              {/* CORREÇÃO — fix quebra de texto no preview */}
              <div className="border border-white/8 p-4 overflow-hidden" style={{background:'rgba(255,255,255,0.02)'}}>
                <p className="font-body text-xs text-white/30 tracking-widest mb-3">PREVIEW</p>
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full ${form.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`font-display ${form.cor} text-lg`}>{form.inicial || form.nome?.charAt(0) || '?'}</span>
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="font-body text-sm text-white font-medium" style={{overflowWrap:'break-word',wordBreak:'break-word'}}>{form.nome || 'Nome do cliente'}</p>
                    <p className="font-body text-xs text-white/40">{form.cidade || 'Cidade, Estado'}</p>
                    <p className="font-display text-sm font-light text-white/60 italic mt-1" style={{overflowWrap:'break-word',wordBreak:'break-word',whiteSpace:'normal'}}>"{form.texto || 'Depoimento aparecerá aqui...'}"</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div><p className="font-body text-sm text-white">Depoimento ativo</p><p className="font-body text-xs text-white/30">Inativos não aparecem na loja</p></div>
                <button type="button" onClick={() => setForm({...form,ativo:!form.ativo})} className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.ativo?'bg-sage':'bg-white/15'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.ativo?'left-7':'left-1'}`}/>
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-3 hover:border-white/30 transition-all">CANCELAR</button>
                <button type="submit" disabled={saving} className="flex-1 bg-sage text-white font-body text-xs tracking-widest py-3 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {saving ? 'SALVANDO...' : editingId ? 'SALVAR' : 'ADICIONAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] shadow-2xl border border-red-500/30" style={{background:'#1a0f0f',width:'calc(100vw - 3rem)',maxWidth:'440px'}}>
          <div className="px-5 py-4">
            <p className="font-body text-sm text-white font-medium mb-1">Excluir depoimento?</p>
            <p className="font-body text-xs text-white/50 mb-4">De <span className="text-white/70">{confirmDel.nome}</span> — esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-2.5 hover:border-white/30 transition-all">CANCELAR</button>
              <button onClick={handleDelete} className="flex-1 bg-red-700 text-white font-body text-xs tracking-widest py-2.5 hover:bg-red-800 transition-all">SIM, EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  ABA E — VENDAS
//  CORREÇÃO: lê v.clientes?.nome e v.venda_itens (estrutura real do PHP)
// ══════════════════════════════════════════════════════════════
const PERIODOS = [
  { key:'hoje',   label:'Hoje' },
  { key:'semana', label:'Semana' },
  { key:'mes',    label:'Mês' },
  { key:'custom', label:'Período' },
]

function VendasSection({ showToast }) {
  const [vendas,      setVendas]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [periodo,     setPeriodo]     = useState('mes')
  const [dataInicio,  setDataInicio]  = useState('')
  const [dataFim,     setDataFim]     = useState('')
  const [detailVenda, setDetailVenda] = useState(null)
  const [deleteId,    setDeleteId]    = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [showNovaVenda, setShowNovaVenda] = useState(false)

  const fetchVendas = async () => {
    setLoading(true)
    try {
      const params = {}
      if (periodo === 'custom') {
        params.from = dataInicio
        params.to   = dataFim
      } else {
        // Passa o periodo diretamente para o apiClient mapear corretamente
        params.periodo = periodo
      }
      const data = await api.vendas.list(params)
      setVendas(data||[])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchVendas() }, [periodo, dataInicio, dataFim])

  // CORREÇÃO — soma usando estrutura real do PHP (v.venda_itens)
  const totalPeriodo = vendas
    .filter(v => v.status !== 'cancelada')
    .reduce((s,v) => s + Number(v.total), 0)

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleteId(confirmDel.id)
    try { await api.vendas.remove(confirmDel.id); showToast('Venda excluída!'); setConfirmDel(null); fetchVendas() }
    catch (err) { showToast(err.message||'Erro ao excluir','error') }
    finally { setDeleteId(null) }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-light text-white">Vendas</h1>
          <p className="font-body text-xs text-white/30 mt-0.5">
            {vendas.length} venda{vendas.length!==1?'s':''} · Total: <span className="text-sage">{fmtBRL(totalPeriodo)}</span>
          </p>
        </div>
        <button onClick={() => setShowNovaVenda(true)} className="bg-sage text-white font-body text-xs tracking-widest px-5 py-2.5 hover:bg-sage-dark transition-all flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          NOVA VENDA
        </button>
      </header>

      {/* Filtros + limpar */}
      <div className="px-6 md:px-8 py-3 border-b border-white/5 flex items-center gap-2 flex-wrap">
        {PERIODOS.map(p => (
          <button key={p.key} onClick={() => setPeriodo(p.key)}
            className={`font-body text-xs tracking-widest px-3 py-1.5 border transition-all ${periodo===p.key ? 'border-sage text-sage bg-sage/10' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
            {p.label}
          </button>
        ))}
        {periodo==='custom' && (
          <div className="flex flex-wrap items-center gap-2 ml-0 sm:ml-2 w-full sm:w-auto mt-1 sm:mt-0">
            <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className="font-body text-xs text-white/60 px-3 py-1.5 border border-white/10 focus:outline-none focus:border-sage flex-1 sm:flex-none" style={{background:'rgba(255,255,255,0.05)'}}/>
            <span className="text-white/30 text-xs">até</span>
            <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} className="font-body text-xs text-white/60 px-3 py-1.5 border border-white/10 focus:outline-none focus:border-sage flex-1 sm:flex-none" style={{background:'rgba(255,255,255,0.05)'}}/>
          </div>
        )}
        {(periodo !== 'mes' || dataInicio || dataFim) && (
          <button onClick={() => { setPeriodo('mes'); setDataInicio(''); setDataFim('') }}
            className="font-body text-xs text-white/30 hover:text-white/60 transition-colors ml-1 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            limpar filtros
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        {loading ? <SectionLoader/> : vendas.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-white/15 italic mb-2">Nenhuma venda</p>
            <p className="font-body text-sm text-white/30">Altere o período ou aguarde novos pedidos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vendas.map(v => {
              // CORREÇÃO — lê estrutura real retornada pelo PHP
              const clienteNome = v.clientes?.nome || 'Cliente não informado'
              const clienteWA   = v.clientes?.whatsapp || ''
              const itens       = v.venda_itens || []

              return (
                <div key={v.id}>
                  <div className="flex items-center gap-3 p-4 border border-white/8 hover:border-white/15 transition-all cursor-pointer"
                    style={{background:'rgba(255,255,255,0.02)'}}
                    onClick={() => setDetailVenda(detailVenda?.id === v.id ? null : v)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-xs text-white/30">#{v.numero}</span>
                        <span className="font-body text-sm text-white font-medium">{clienteNome}</span>
                        <span className={`font-body text-xs px-2 py-0.5 ${v.status==='cancelada' ? 'bg-red-900/30 text-red-400' : 'bg-sage/10 text-sage'}`}>{v.status}</span>
                      </div>
                      <p className="font-body text-xs text-white/30 mt-0.5">
                        {fmtDateTime(v.created_at)}
                        <span className="mx-1.5 text-white/15">·</span>
                        {itens.map(i => i.nome_produto).join(', ').substring(0,60)}
                        {itens.map(i=>i.nome_produto).join(', ').length > 60 ? '…' : ''}
                        <span className="mx-1.5 text-white/15">·</span>
                        {itens.length} item{itens.length!==1?'s':''}
                      </p>
                    </div>
                    <p className="font-display text-xl font-light text-white flex-shrink-0">{fmtBRL(v.total)}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
                      <button onClick={() => setConfirmDel(v)} disabled={deleteId===v.id}
                        className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/40 transition-all">
                        {deleteId===v.id
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"/>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                      </button>
                    </div>
                  </div>

                  {/* Detalhe expandido — CORREÇÃO: usa itens = v.venda_itens */}
                  {detailVenda?.id === v.id && (
                    <div className="border border-white/8 border-t-0 px-5 py-4" style={{background:'rgba(74,124,89,0.04)'}}>
                      {clienteWA   && <p className="font-body text-xs text-white/40 mb-2">WhatsApp: <span className="text-white/60">{clienteWA}</span></p>}
                      {v.clientes?.cidade && <p className="font-body text-xs text-white/40 mb-3">Cidade: <span className="text-white/60">{v.clientes.cidade}</span></p>}
                      <div className="space-y-2 mt-1">
                        {itens.map((i,idx) => (
                          <div key={idx} className="flex justify-between font-body text-xs text-white/60">
                            <span>{i.nome_produto} <span className="text-white/30">x{i.quantidade}</span></span>
                            <span>{fmtBRL(i.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-body text-sm text-white mt-3 pt-3 border-t border-white/8">
                        <span>Total</span><span className="font-display text-lg">{fmtBRL(v.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNovaVenda && (
        <NovaVendaModal
          showToast={showToast}
          onClose={() => setShowNovaVenda(false)}
          onSaved={() => { setShowNovaVenda(false); fetchVendas() }}
        />
      )}

      {confirmDel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] shadow-2xl border border-red-500/30 w-[calc(100vw-3rem)] max-w-[440px]" style={{background:'#1a0f0f'}}>
          <div className="px-5 py-4">
            <p className="font-body text-sm text-white font-medium mb-1">Excluir venda #{confirmDel.numero}?</p>
            <p className="font-body text-xs text-white/50 mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-2.5 hover:border-white/30 transition-all">CANCELAR</button>
              <button onClick={handleDelete} className="flex-1 bg-red-700 text-white font-body text-xs tracking-widest py-2.5 hover:bg-red-800 transition-all">SIM, EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  ABA F — CLIENTES
//  CORREÇÃO: historico usa v.venda_itens (estrutura real do PHP)
// ══════════════════════════════════════════════════════════════
function ClientesSection({ showToast }) {
  const [clientes,    setClientes]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState(null)
  const [form,        setForm]        = useState({ nome:'', cidade:'', estado:'', whatsapp:'' })
  const [saving,      setSaving]      = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [historico,   setHistorico]   = useState(null)
  const [histLoading, setHistLoading] = useState(false)

  const fetchClientes = async (q = '') => {
    setLoading(true)
    try { const data = await api.clientes.list(q); setClientes(data||[]) } catch {}
    setLoading(false)
  }

  // Busca inicial
  useEffect(() => { fetchClientes('') }, [])

  // Debounce: dispara busca na API 300ms após parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => { fetchClientes(search) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Frontend usa a lista já filtrada pelo backend
  const filtered = clientes

  const openHistorico = async (c) => {
    setHistorico({ cliente:c, vendas:[], stats:null })
    setHistLoading(true)
    try {
      // BUG 2 CORRIGIDO — PHP retorna { cliente, vendas, stats }, não array direto
      const resultado = await api.clientes.historico(c.id)
      const v = (resultado?.vendas || resultado || [])
      const confirmadas = v.filter(x => x.status !== 'cancelada')

      // Se o PHP já retornou stats, usa — senão calcula no frontend
      const statsBackend = resultado?.stats
      const stats = statsBackend ? {
        totalConfirm:   statsBackend.total_confirm   ?? statsBackend.totalConfirm   ?? confirmadas.length,
        totalCancelada: statsBackend.total_cancelada ?? statsBackend.totalCancelada ?? v.filter(x => x.status==='cancelada').length,
        totalGasto:     statsBackend.total_gasto     ?? statsBackend.totalGasto     ?? confirmadas.reduce((s,x) => s + Number(x.total), 0),
        ticketMedio:    statsBackend.ticket_medio    ?? statsBackend.ticketMedio    ?? (confirmadas.length ? confirmadas.reduce((s,x) => s + Number(x.total), 0) / confirmadas.length : 0),
        primeiraCompra: statsBackend.primeira_compra ?? statsBackend.primeiraCompra ?? (v.length ? v[v.length-1].created_at : null),
        ultimaCompra:   statsBackend.ultima_compra   ?? statsBackend.ultimaCompra   ?? (v.length ? v[0].created_at : null),
      } : {
        totalConfirm:   confirmadas.length,
        totalCancelada: v.filter(x => x.status==='cancelada').length,
        totalGasto:     confirmadas.reduce((s,x) => s + Number(x.total), 0),
        ticketMedio:    confirmadas.length ? confirmadas.reduce((s,x) => s + Number(x.total), 0) / confirmadas.length : 0,
        primeiraCompra: v.length ? v[v.length-1].created_at : null,
        ultimaCompra:   v.length ? v[0].created_at : null,
      }
      setHistorico({ cliente:c, vendas:v, stats })
    } catch {}
    setHistLoading(false)
  }

  const openNew  = () => { setEditingId(null); setForm({ nome:'', cidade:'', estado:'', whatsapp:'' }); setShowForm(true) }
  const openEdit = (c, e) => { e.stopPropagation(); setEditingId(c.id); setForm({ nome:c.nome||'', cidade:c.cidade||'', estado:c.estado||'', whatsapp:c.whatsapp||'' }); setShowForm(true) }

  const handleSave = async () => {
    if (!form.nome.trim()) return showToast('Nome é obrigatório','error')
    if (!form.whatsapp.trim()) return showToast('WhatsApp é obrigatório','error')
    setSaving(true)
    try {
      const payload = { nome:form.nome.trim(), cidade:form.cidade.trim(), estado:form.estado.trim().toUpperCase(), whatsapp:form.whatsapp }
      if (editingId) { await api.clientes.update(editingId, payload); showToast('Cliente atualizado!') }
      else { await api.clientes.create(payload); showToast('Cliente cadastrado!') }
      setShowForm(false); fetchClientes(search)
    } catch (err) { showToast(err.message||'Erro','error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleteId(confirmDel.id)
    try {
      await api.clientes.remove(confirmDel.id)
      showToast('Cliente excluído!')
      if (historico?.cliente?.id===confirmDel.id) setHistorico(null)
      setConfirmDel(null); fetchClientes(search)
    } catch (err) { showToast(err.message||'Erro ao excluir','error') }
    finally { setDeleteId(null) }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-light text-white">Clientes</h1>
          <p className="font-body text-xs text-white/30 mt-0.5">{filtered.length} cliente{filtered.length!==1?'s':''}</p>
        </div>
        <button onClick={openNew} className="bg-sage text-white font-body text-xs tracking-widest px-5 py-2.5 hover:bg-sage-dark transition-all flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          NOVO CLIENTE
        </button>
      </header>

      <div className="px-6 md:px-8 py-4 border-b border-white/5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, cidade ou WhatsApp..."
            className="w-full pl-10 pr-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
            style={{background:'rgba(255,255,255,0.04)'}}/>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
        {loading ? <SectionLoader/> : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-white/15 italic mb-2">Nenhum cliente</p>
            <p className="font-body text-sm text-white/30">{search ? 'Nenhum resultado para essa busca.' : 'Clientes são criados automaticamente ao receber pedidos.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id}
                className="flex items-center gap-3 p-4 border border-white/8 hover:border-white/20 transition-all cursor-pointer group"
                style={{background:'rgba(255,255,255,0.02)'}}
                onClick={() => openHistorico(c)}>
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0 group-hover:bg-sage/30 transition-colors">
                  <span className="font-display text-sage text-lg">{c.nome?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-sm text-white font-medium group-hover:text-sage transition-colors">{c.nome}</p>
                    {c.total_compras > 0 && <span className="font-body text-xs px-1.5 py-0.5 bg-sage/10 text-sage">{c.total_compras} compra{c.total_compras!==1?'s':''}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {c.cidade && <span className="font-body text-xs text-white/30">{c.cidade}{c.estado ? ', '+c.estado.toUpperCase() : ''}</span>}
                    {c.whatsapp && <span className="font-body text-xs text-white/30">{c.whatsapp}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block mr-2">
                  <p className="font-body text-xs text-white/30">cadastro {fmtDate(c.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
                  <button onClick={() => openHistorico(c)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all" title="Ver histórico">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                  <button onClick={(e) => openEdit(c,e)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-sage hover:border-sage transition-all" title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDel(c) }} disabled={deleteId===c.id}
                    className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/40 transition-all" title="Excluir">
                    {deleteId===c.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"/>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal histórico — CORREÇÃO: usa v.venda_itens */}
      {historico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)'}}
          onClick={() => setHistorico(null)}>
          <div className="w-full max-w-xl border border-white/10 max-h-[88vh] flex flex-col"
            style={{background:'#141414'}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-sage text-lg">{historico.cliente.nome?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="font-display text-xl font-light text-white">{historico.cliente.nome}</h2>
                  <p className="font-body text-xs text-white/40 mt-0.5">
                    {historico.cliente.cidade && `${historico.cliente.cidade}${historico.cliente.estado ? ', '+historico.cliente.estado.toUpperCase() : ''} · `}
                    {historico.cliente.whatsapp}
                  </p>
                </div>
              </div>
              <button onClick={() => setHistorico(null)} className="text-white/30 hover:text-white transition-colors mt-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {histLoading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : (
              <>
                {historico.stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-white/8">
                    {[
                      { label:'COMPRAS',     val: historico.stats.totalConfirm },
                      { label:'TOTAL GASTO', val: fmtBRL(historico.stats.totalGasto) },
                      { label:'TICKET MÉDIO',val: fmtBRL(historico.stats.ticketMedio) },
                      { label:'CANCELADAS',  val: historico.stats.totalCancelada },
                    ].map((s,i) => (
                      <div key={i} className="px-4 py-3 border-r border-white/5 last:border-r-0 text-center">
                        <p className="font-display text-lg font-light text-white">{s.val}</p>
                        <p className="font-body text-xs text-white/30 tracking-widest mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {historico.vendas.length === 0 ? (
                    <p className="font-body text-sm text-white/30 text-center py-8">Nenhuma compra registrada.</p>
                  ) : historico.vendas.map((v,i) => {
                    // CORREÇÃO — lê v.venda_itens que é o que o PHP retorna
                    const itens = v.venda_itens || []
                    return (
                      <div key={i} className="mb-4 border border-white/8 overflow-hidden" style={{background:'rgba(255,255,255,0.02)'}}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5" style={{background:'rgba(255,255,255,0.03)'}}>
                          <div className="flex items-center gap-2">
                            <span className="font-body text-xs text-white/30">#{v.numero}</span>
                            <span className="font-body text-xs text-white/50">{fmtDateTime(v.created_at)}</span>
                          </div>
                          <span className={`font-body text-xs px-2 py-0.5 ${v.status==='cancelada'?'bg-red-900/30 text-red-400':'bg-sage/10 text-sage'}`}>{v.status}</span>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {itens.map((it,j) => (
                            <div key={j} className="flex justify-between font-body text-xs text-white/70">
                              <span>{it.nome_produto} <span className="text-white/40">×{it.quantidade}</span></span>
                              <span>{fmtBRL(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-t border-white/5" style={{background:'rgba(255,255,255,0.03)'}}>
                          <span className="font-body text-xs text-white/40 tracking-widest">TOTAL</span>
                          <span className="font-display text-lg font-light text-white">{fmtBRL(v.total)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)'}}>
          <div className="w-full max-w-md border border-white/10" style={{background:'#141414'}}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <h2 className="font-display text-xl font-light text-white">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <FormField label="NOME *"><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Nome completo" className="admin-input"/></FormField>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <FormField label="CIDADE"><input value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} placeholder="Ex: Quixadá" className="admin-input"/></FormField>
                <FormField label="ESTADO"><input value={form.estado} onChange={e=>setForm({...form,estado:e.target.value.toUpperCase().slice(0,2)})} placeholder="CE" maxLength={2} className="admin-input uppercase"/></FormField>
              </div>
              <FormField label="WHATSAPP *"><input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:maskPhone(e.target.value)})} placeholder="(88) 99999-9999" className="admin-input"/></FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-3 hover:border-white/30 transition-all">CANCELAR</button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 bg-sage text-white font-body text-xs tracking-widest py-3 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {saving ? 'SALVANDO...' : editingId ? 'SALVAR' : 'CADASTRAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] shadow-2xl border border-red-500/30 w-[calc(100vw-3rem)] max-w-[440px]" style={{background:'#1a0f0f'}}>
          <div className="px-5 py-4">
            <p className="font-body text-sm text-white font-medium mb-1">Excluir cliente?</p>
            <p className="font-body text-xs text-white/50 mb-4"><span className="text-white/70">{confirmDel.nome}</span> — as vendas permanecerão no histórico.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-2.5 hover:border-white/30 transition-all">CANCELAR</button>
              <button onClick={handleDelete} className="flex-1 bg-red-700 text-white font-body text-xs tracking-widest py-2.5 hover:bg-red-800 transition-all">SIM, EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  NOVA VENDA MANUAL — modal completo
//  Implementação 4+5: cria venda, vincula cliente, aparece no histórico
// ══════════════════════════════════════════════════════════════
function NovaVendaModal({ showToast, onClose, onSaved }) {
  const [step,          setStep]          = useState('cliente') // 'cliente' | 'itens'
  const [clientes,      setClientes]      = useState([])
  const [loadingCli,    setLoadingCli]    = useState(true)
  const [searchCli,     setSearchCli]     = useState('')
  const [clienteSel,    setClienteSel]    = useState(null) // cliente existente selecionado
  const [novoCliente,   setNovoCliente]   = useState(false)
  const [formCli,       setFormCli]       = useState({ nome:'', cidade:'', estado:'', whatsapp:'' })
  const [products,      setProducts]      = useState([])
  const [loadingProd,   setLoadingProd]   = useState(false)
  const [searchProd,    setSearchProd]    = useState('')
  const [itens,         setItens]         = useState([]) // [{product, quantidade}]
  const [saving,        setSaving]        = useState(false)

  // Carrega clientes
  useEffect(() => {
    api.clientes.list('').then(d => { setClientes(d||[]); setLoadingCli(false) }).catch(() => setLoadingCli(false))
  }, [])

  // Carrega produtos
  useEffect(() => {
    setLoadingProd(true)
    api.adminProducts.list().then(d => { setProducts((d||[]).filter(p => p.ativo)); setLoadingProd(false) }).catch(() => setLoadingProd(false))
  }, [])

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(searchCli.toLowerCase()) ||
    c.whatsapp?.includes(searchCli.replace(/\D/g,''))
  )

  const produtosFiltrados = products.filter(p =>
    p.nome?.toLowerCase().includes(searchProd.toLowerCase()) ||
    p.linha?.toLowerCase().includes(searchProd.toLowerCase())
  )

  const addItem = (product) => {
    setItens(prev => {
      const exists = prev.find(i => i.product.id === product.id)
      if (exists) return prev
      return [...prev, { product, quantidade: 1 }]
    })
  }

  const removeItem = (productId) => setItens(prev => prev.filter(i => i.product.id !== productId))

  const changeQty = (productId, delta) => setItens(prev =>
    prev.map(i => {
      if (i.product.id !== productId) return i
      const estoqueMax = i.product.estoque !== null ? Number(i.product.estoque) : 999
      return { ...i, quantidade: Math.min(Math.max(1, i.quantidade + delta), estoqueMax) }
    })
  )

  const total = itens.reduce((s, i) => s + Number(i.product.preco) * i.quantidade, 0)

  const handleSave = async () => {
    if (itens.length === 0) return showToast('Adicione pelo menos 1 produto','error')

    // Valida cliente
    let clienteId = null
    if (novoCliente) {
      if (!formCli.nome.trim()) return showToast('Nome do cliente é obrigatório','error')
      if (!formCli.whatsapp.trim()) return showToast('WhatsApp do cliente é obrigatório','error')
    } else if (clienteSel) {
      clienteId = clienteSel.id
    }
    // Se novoCliente = false e clienteSel = null, venda sem cliente (permitido)

    setSaving(true)
    try {
      // Se novo cliente, cria primeiro
      if (novoCliente && formCli.nome.trim()) {
        try {
          const criado = await api.clientes.create({
            nome:     formCli.nome.trim(),
            cidade:   formCli.cidade.trim(),
            estado:   formCli.estado.trim().toUpperCase(),
            whatsapp: formCli.whatsapp,
          })
          clienteId = criado.id
        } catch (err) {
          // WhatsApp já existe — busca o cliente
          if (err.status === 409) {
            const wa = formCli.whatsapp.replace(/\D/g,'')
            const existing = clientes.find(c => c.whatsapp?.replace(/\D/g,'') === wa)
            if (existing) clienteId = existing.id
            else throw err
          } else throw err
        }
      }

      await api.vendas.create({
        cliente_id: clienteId || '',
        status:     'confirmada',
        origem:     'manual',
        itens: itens.map(i => ({
          product_id:   i.product.id,
          nome_produto: i.product.nome,
          preco_unit:   Number(i.product.preco),
          quantidade:   i.quantidade,
        })),
      })

      showToast('Venda registrada com sucesso!')
      onSaved()
    } catch (err) {
      showToast(err.message || 'Erro ao registrar venda', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 overflow-y-auto"
      style={{background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)'}}
      onClick={onClose}>
      <div className="w-full max-w-2xl my-4 sm:my-8 border border-white/10"
        style={{background:'#141414'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="font-display text-lg sm:text-2xl font-light text-white">Nova Venda Manual</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`font-body text-xs px-2 py-0.5 transition-all ${step==='cliente' ? 'text-sage bg-sage/10' : 'text-white/30'}`}>1. Cliente</span>
              <span className="text-white/20 text-xs">→</span>
              <span className={`font-body text-xs px-2 py-0.5 transition-all ${step==='itens' ? 'text-sage bg-sage/10' : 'text-white/30'}`}>2. Produtos</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5">

          {/* ── STEP 1: CLIENTE ── */}
          {step === 'cliente' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => { setNovoCliente(false); setClienteSel(null) }}
                  className={`flex-1 font-body text-xs tracking-widest py-2.5 border transition-all ${!novoCliente ? 'border-sage text-sage bg-sage/10' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                  CLIENTE EXISTENTE
                </button>
                <button onClick={() => { setNovoCliente(true); setClienteSel(null) }}
                  className={`flex-1 font-body text-xs tracking-widest py-2.5 border transition-all ${novoCliente ? 'border-sage text-sage bg-sage/10' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                  CRIAR NOVO CLIENTE
                </button>
              </div>

              {!novoCliente && (
                <>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input value={searchCli} onChange={e=>setSearchCli(e.target.value)} placeholder="Buscar cliente por nome ou WhatsApp..."
                      className="w-full pl-9 pr-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
                      style={{background:'rgba(255,255,255,0.04)'}}/>
                  </div>
                  <div className="border border-white/8 overflow-hidden max-h-60 overflow-y-auto" style={{background:'rgba(255,255,255,0.02)'}}>
                    {/* Opção sem cliente */}
                    <div onClick={() => setClienteSel(null)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 transition-all ${!clienteSel ? 'bg-sage/10' : 'hover:bg-white/5'}`}>
                      <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-white/30 text-xs">—</span>
                      </div>
                      <span className="font-body text-sm text-white/40 italic">Sem cliente vinculado</span>
                      {!clienteSel && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="2" className="ml-auto"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    {loadingCli ? (
                      <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin"/></div>
                    ) : clientesFiltrados.length === 0 ? (
                      <p className="font-body text-xs text-white/30 text-center py-6">Nenhum cliente encontrado.</p>
                    ) : clientesFiltrados.map(c => (
                      <div key={c.id} onClick={() => setClienteSel(c)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 transition-all ${clienteSel?.id===c.id ? 'bg-sage/10' : 'hover:bg-white/5'}`}>
                        <div className="w-7 h-7 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                          <span className="font-display text-sage text-sm">{c.nome?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-white truncate">{c.nome}</p>
                          {c.whatsapp && <p className="font-body text-xs text-white/30">{c.whatsapp}</p>}
                        </div>
                        {clienteSel?.id===c.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {novoCliente && (
                <div className="space-y-3">
                  <FormField label="NOME *"><input value={formCli.nome} onChange={e=>setFormCli({...formCli,nome:e.target.value})} placeholder="Nome completo" className="admin-input"/></FormField>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <FormField label="CIDADE"><input value={formCli.cidade} onChange={e=>setFormCli({...formCli,cidade:e.target.value})} placeholder="Ex: Quixadá" className="admin-input"/></FormField>
                    <FormField label="ESTADO"><input value={formCli.estado} onChange={e=>setFormCli({...formCli,estado:e.target.value.toUpperCase().slice(0,2)})} placeholder="CE" maxLength={2} className="admin-input uppercase"/></FormField>
                  </div>
                  <FormField label="WHATSAPP *"><input value={formCli.whatsapp} onChange={e=>setFormCli({...formCli,whatsapp:maskPhone(e.target.value)})} placeholder="(88) 99999-9999" className="admin-input"/></FormField>
                </div>
              )}

              <button onClick={() => setStep('itens')}
                className="w-full bg-sage text-white font-body text-xs tracking-widest py-3.5 hover:bg-sage-dark transition-all flex items-center justify-center gap-2">
                PRÓXIMO — SELECIONAR PRODUTOS
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {/* ── STEP 2: PRODUTOS ── */}
          {step === 'itens' && (
            <div className="space-y-4">
              {/* Resumo do cliente */}
              <div className="flex items-center gap-2 px-3 py-2 border border-white/8" style={{background:'rgba(255,255,255,0.03)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span className="font-body text-xs text-white/60">
                  {novoCliente && formCli.nome ? formCli.nome : clienteSel ? clienteSel.nome : 'Sem cliente vinculado'}
                </span>
                <button onClick={() => setStep('cliente')} className="ml-auto font-body text-xs text-white/30 hover:text-sage transition-colors">alterar</button>
              </div>

              {/* Busca de produto */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={searchProd} onChange={e=>setSearchProd(e.target.value)} placeholder="Buscar produto..."
                  className="w-full pl-9 pr-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
                  style={{background:'rgba(255,255,255,0.04)'}}/>
              </div>

              {/* Lista de produtos para adicionar */}
              <div className="border border-white/8 overflow-hidden max-h-52 overflow-y-auto" style={{background:'rgba(255,255,255,0.02)'}}>
                {loadingProd ? (
                  <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin"/></div>
                ) : produtosFiltrados.length === 0 ? (
                  <p className="font-body text-xs text-white/30 text-center py-6">Nenhum produto ativo encontrado.</p>
                ) : produtosFiltrados.map(p => {
                  const jaAdicionado = itens.some(i => i.product.id === p.id)
                  const estoqueNum = p.estoque !== null ? Number(p.estoque) : null
                  const semEstoque = estoqueNum !== null && estoqueNum <= 0
                  return (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 transition-all ${semEstoque ? 'opacity-40' : jaAdicionado ? 'bg-sage/5' : 'hover:bg-white/5'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-white truncate">{p.nome}</p>
                        <div className="flex items-center gap-2">
                          <p className="font-body text-xs text-white/30">{fmtBRL(p.preco)}</p>
                          {estoqueNum !== null && <span className={`font-body text-xs ${semEstoque?'text-red-400':estoqueNum<=5?'text-orange-400':'text-sage/60'}`}>{semEstoque?'Esgotado':`${estoqueNum} un.`}</span>}
                        </div>
                      </div>
                      <button onClick={() => !semEstoque && !jaAdicionado && addItem(p)} disabled={semEstoque || jaAdicionado}
                        className={`font-body text-xs px-3 py-1.5 border transition-all ${jaAdicionado ? 'border-sage/30 text-sage/50 cursor-default' : semEstoque ? 'border-white/10 text-white/20 cursor-not-allowed' : 'border-white/20 text-white/50 hover:border-sage hover:text-sage'}`}>
                        {jaAdicionado ? 'Adicionado' : 'Adicionar'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Itens selecionados */}
              {itens.length > 0 && (
                <div className="border border-white/8 overflow-hidden" style={{background:'rgba(255,255,255,0.02)'}}>
                  <p className="font-body text-xs tracking-widest text-white/30 px-4 py-2 border-b border-white/5">ITENS DA VENDA</p>
                  {itens.map(i => (
                    <div key={i.product.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-white truncate">{i.product.nome}</p>
                        <p className="font-body text-xs text-white/30">{fmtBRL(i.product.preco)} × {i.quantidade} = {fmtBRL(Number(i.product.preco) * i.quantidade)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => changeQty(i.product.id, -1)} className="w-6 h-6 border border-white/20 text-white/50 flex items-center justify-center hover:border-sage hover:text-sage transition-all text-sm">−</button>
                        <span className="font-body text-sm text-white w-5 text-center">{i.quantidade}</span>
                        <button onClick={() => changeQty(i.product.id, 1)}
                          disabled={i.product.estoque !== null && i.quantidade >= Number(i.product.estoque)}
                          className="w-6 h-6 border border-white/20 text-white/50 flex items-center justify-center hover:border-sage hover:text-sage transition-all text-sm disabled:opacity-30">+</button>
                        <button onClick={() => removeItem(i.product.id)} className="w-6 h-6 text-white/20 hover:text-red-400 transition-colors ml-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 border-t border-white/8" style={{background:'rgba(255,255,255,0.03)'}}>
                    <span className="font-body text-xs text-white/40 tracking-widest">TOTAL</span>
                    <span className="font-display text-xl font-light text-white">{fmtBRL(total)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('cliente')} className="font-body text-xs tracking-widest border border-white/15 text-white/50 py-3 px-5 hover:border-white/30 transition-all flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  VOLTAR
                </button>
                <button onClick={handleSave} disabled={saving || itens.length === 0}
                  className="flex-1 bg-sage text-white font-body text-xs tracking-widest py-3 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {saving ? 'REGISTRANDO...' : `REGISTRAR VENDA · ${fmtBRL(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ══════════════════════════════════════════════════════════════
function DeleteConfirmToast({ produto, onConfirm, onCancel }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] shadow-2xl border border-red-500/30" style={{background:'#1a0f0f',width:'calc(100vw - 3rem)',maxWidth:'440px'}}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </div>
          <div className="flex-1">
            <p className="font-body text-sm text-white font-medium">Excluir produto?</p>
            <p className="font-body text-xs text-white/50 mt-0.5"><span className="text-white/70">"{produto.nome}"</span> será removido permanentemente.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 font-body text-xs tracking-widest border border-white/15 text-white/50 py-2.5 hover:border-white/30 transition-all">CANCELAR</button>
          <button onClick={onConfirm} className="flex-1 bg-red-700 text-white font-body text-xs tracking-widest py-2.5 hover:bg-red-800 transition-all">SIM, EXCLUIR</button>
        </div>
      </div>
    </div>
  )
}

function SidebarLink({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`admin-sidebar-link w-full text-left ${active?'active':''}`}>
      {icon}{label}
    </button>
  )
}

function SectionLoader() {
  return <div className="flex-1 flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin"/></div>
}

function FormField({ label, children }) {
  return <div><label className="font-body text-xs tracking-widest text-white/40 block mb-2">{label}</label>{children}</div>
}
