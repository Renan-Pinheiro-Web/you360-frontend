// pages/index.js
// YOU360 — Loja pública usando API PHP

import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/apiClient'
import ProductCard from '../components/ProductCard'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '5588993668921'

function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2)  return `(${digits}`
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
}

export async function getServerSideProps() {
  try {
    const [products, heroConfig, linhasConfig, depoimentos] = await Promise.all([
      api.products.list(),
      api.hero.get(),
      api.linhas.list(),
      api.depoimentos.list(),
    ])
    return {
      props: {
        initialProducts: products    || [],
        heroConfig:      heroConfig  || null,
        linhasConfig:    linhasConfig || [],
        depoimentos:     depoimentos || [],
      },
    }
  } catch (err) {
    console.error('[getServerSideProps]', err)
    return {
      props: { initialProducts: [], heroConfig: null, linhasConfig: [], depoimentos: [] },
    }
  }
}

export default function Home({ initialProducts, heroConfig, linhasConfig, depoimentos }) {
  const [products,     setProducts]     = useState(initialProducts)
  const [activeFilter, setActiveFilter] = useState('all')
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [cart,         setCart]         = useState([])
  const [cartOpen,     setCartOpen]     = useState(false)
  const [clienteForm,  setClienteForm]  = useState(false)
  const [clienteData,  setClienteData]  = useState({ nome:'', cidade:'', estado:'', whatsapp:'' })
  const [sendingOrder, setSendingOrder] = useState(false)
  const [orderError,   setOrderError]   = useState('')
  const navRef = useRef(null)

  const filtered = activeFilter === 'all'
    ? products
    : products.filter(p => p.linha === activeFilter)

  const linhas    = [...new Set(products.map(p => p.linha).filter(Boolean))]
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    const handleScroll = () => navRef.current?.classList.toggle('scrolled', window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [filtered])

  // ── Recarrega produtos do servidor para refletir estoque atualizado
  const refreshProducts = async () => {
    try {
      const fresh = await api.products.list()
      if (fresh) setProducts(fresh)
    } catch {}
  }

  // ── Carrinho ────────────────────────────────────────────────
  const addToCart = (produto) => {
    // Converte estoque para Number (API pode retornar string)
    const estoqueNum = produto.estoque !== null && produto.estoque !== undefined
      ? Number(produto.estoque)
      : null
    const maxQty = estoqueNum !== null ? estoqueNum : Infinity

    setCart(prev => {
      const exists = prev.find(i => i.id === produto.id)
      if (exists) {
        if (exists.qty >= maxQty) return prev
        return prev.map(i => i.id === produto.id ? { ...i, qty: i.qty + 1 } : i)
      }
      if (maxQty <= 0) return prev
      return [...prev, {
        id:      produto.id,
        nome:    produto.nome,
        preco:   produto.preco,
        qty:     1,
        estoque: estoqueNum,
      }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const changeQty = (id, delta) => setCart(prev =>
    prev.map(i => {
      if (i.id !== id) return i
      // estoque já está como Number quando salvo no cart
      const maxQty = i.estoque !== null && i.estoque !== undefined ? i.estoque : Infinity
      return { ...i, qty: Math.min(Math.max(1, i.qty + delta), maxQty) }
    })
  )

  const cartTotal = cart.reduce((s, i) => s + i.preco * i.qty, 0)

  const sendCartWhatsapp = () => {
    if (cart.length === 0) return
    setOrderError('')
    setClienteForm(true)
    setCartOpen(false)
  }

  const confirmOrder = async () => {
    if (!clienteData.nome.trim())     return setOrderError('Informe seu nome.')
    if (!clienteData.whatsapp.trim()) return setOrderError('Informe seu WhatsApp.')
    setSendingOrder(true); setOrderError('')

    const cartSnapshot  = [...cart]
    const totalSnapshot = cartSnapshot.reduce((s, i) => s + i.preco * i.qty, 0)

    try {
      await api.vendas.storePublic({
        cliente: {
          nome:     clienteData.nome.trim(),
          cidade:   clienteData.cidade.trim(),
          estado:   clienteData.estado.trim().toUpperCase(),
          whatsapp: clienteData.whatsapp,
        },
        itens: cartSnapshot.map(i => ({
          product_id:   i.id,
          nome_produto: i.nome,
          preco_unit:   i.preco,
          quantidade:   i.qty,
        })),
      })

      // CORREÇÃO — recarrega produtos para atualizar estoque em tempo real
      await refreshProducts()

      const linhasMsg = cartSnapshot.map(i =>
        `• *${i.nome}* x${i.qty} — R$ ${(i.preco * i.qty).toFixed(2).replace('.', ',')}`
      )
      linhasMsg.push(`\nCliente: *${clienteData.nome}*`)
      if (clienteData.cidade) linhasMsg.push(`Cidade: ${clienteData.cidade}${clienteData.estado ? ' — ' + clienteData.estado.toUpperCase() : ''}`)

      const waMsg = encodeURIComponent(
        `Olá! Gostaria de fazer um pedido:\n\n${linhasMsg.join('\n')}\n\n*Total: R$ ${totalSnapshot.toFixed(2).replace('.', ',')}*\n\nPode me ajudar?`
      )
      const waUrl  = `https://wa.me/${WHATSAPP}?text=${waMsg}`
      const popup  = window.open(waUrl, '_blank')

      setCart([])
      setClienteData({ nome: '', cidade: '', estado: '', whatsapp: '' })

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setClienteForm(false)
        setOrderError(`__WA_BLOCKED__${waUrl}`)
      } else {
        setClienteForm(false)
      }
    } catch (err) {
      setOrderError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setSendingOrder(false)
    }
  }

  const deps = depoimentos.length > 0 ? depoimentos : [
    { id:1, nome:'Fernanda Lima',    cidade:'Fortaleza, CE', inicial:'F', cor:'text-sage',       bg:'bg-sage/30',
      texto:'O sérum de vitamina C da YOU360 transformou minha pele em apenas 3 semanas. Manchas sumidas e pele completamente iluminada!' },
    { id:2, nome:'Camila Rocha',     cidade:'São Paulo, SP', inicial:'C', cor:'text-blush',      bg:'bg-blush/30',
      texto:'Uso a linha Essence YOU todo dia e recebo elogios constantemente. A fixação é impressionante — dura o dia inteiro.' },
    { id:3, nome:'Patrícia Mendes',  cidade:'Recife, PE',    inicial:'P', cor:'text-sage-light', bg:'bg-sage/20',
      texto:'O Beauty Pro AHA Peel foi um investimento que valeu muito. Pele mais firme e sem manchas. Me sinto renovada!' },
  ]

  return (
    <>
      <Head>
        <title>YOU360 — Cosméticos & Estética Premium</title>
        <meta name="description" content="Cosméticos e produtos de estética premium. Skincare, perfumes e tratamentos faciais que transformam sua pele." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-5 px-6 md:px-12 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="18" rx="9" ry="8" fill="#4a7c59" opacity=".85"/>
            <rect x="11" y="6" width="6" height="6" rx="2" fill="#0f0f0f"/>
            <rect x="12.5" y="3" width="3" height="4" rx="1.5" fill="#4a7c59"/>
            <circle cx="14" cy="18" r="4" fill="#fafaf8" opacity=".25"/>
          </svg>
          <span className="font-display text-2xl font-light tracking-widest text-obsidian">
            YOU<strong className="font-semibold text-sage">360</strong>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8 font-body text-sm font-light tracking-widest text-obsidian/70">
          {[['#home','INÍCIO'],['#banners','LINHAS'],['#produtos','PRODUTOS'],['#sobre','SOBRE'],['#depoimentos','DEPOIMENTOS']].map(([href,label]) => (
            <li key={href}><a href={href} className="hover:text-sage transition-colors">{label}</a></li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 border border-sage text-sage text-xs tracking-widest font-body px-4 py-2.5 hover:bg-sage hover:text-white transition-all duration-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span className="hidden md:inline">CARRINHO</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-sage text-white text-xs font-body rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 p-1">
            <span className="w-6 h-px bg-obsidian block transition-all" style={menuOpen?{transform:'rotate(45deg) translate(4px,4px)'}:{}}/>
            <span className="w-6 h-px bg-obsidian block transition-all" style={menuOpen?{opacity:0}:{}}/>
            <span className="w-4 h-px bg-obsidian block transition-all" style={menuOpen?{transform:'rotate(-45deg) translate(4px,-4px)',width:'1.5rem'}:{}}/>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 bg-cream flex flex-col items-center justify-center gap-8 transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {[['#home','INÍCIO'],['#banners','LINHAS'],['#produtos','PRODUTOS'],['#sobre','SOBRE'],['#depoimentos','DEPOIMENTOS']].map(([href,label]) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}
            className="font-display text-3xl font-light tracking-widest text-obsidian hover:text-sage transition-colors">{label}</a>
        ))}
      </div>

      {/* ── CARRINHO LATERAL ───────────────────────────────────── */}
      <div className={`fixed inset-0 z-[55] transition-all duration-300 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setCartOpen(false)}/>

      <div className={`fixed top-0 right-0 bottom-0 z-[60] w-full max-w-sm flex flex-col border-l border-white/10 transition-transform duration-400 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#0f0f0f' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="font-display text-xl font-light text-white tracking-widest">CARRINHO</h2>
            <p className="font-body text-xs text-white/30 mt-0.5">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
          </div>
          <button onClick={() => setCartOpen(false)} className="text-white/30 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="1" opacity=".4" className="mb-4">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p className="font-display text-xl font-light text-white/30 italic mb-2">Carrinho vazio</p>
            <button onClick={() => setCartOpen(false)}
              className="mt-6 font-body text-xs tracking-widest border border-sage text-sage px-5 py-2.5 hover:bg-sage hover:text-white transition-all">
              VER PRODUTOS
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.map(item => {
                const estoqueAtingido = item.estoque !== null && item.estoque !== undefined && item.qty >= item.estoque
                return (
                  <div key={item.id} className="flex items-start gap-4 py-4 border-b border-white/8">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base font-light text-white truncate">{item.nome}</p>
                      <p className="font-body text-xs text-white/40 mt-0.5">R$ {Number(item.preco).toFixed(2).replace('.', ',')} cada</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 border border-white/20 text-white/50 flex items-center justify-center hover:border-sage hover:text-sage transition-all text-lg leading-none">−</button>
                        <span className="font-body text-sm text-white w-4 text-center">{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} disabled={estoqueAtingido} className="w-7 h-7 border border-white/20 text-white/50 flex items-center justify-center hover:border-sage hover:text-sage transition-all text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display text-lg font-light text-white">R$ {(item.preco * item.qty).toFixed(2).replace('.', ',')}</p>
                      <button onClick={() => removeFromCart(item.id)} className="font-body text-xs text-red-400/50 hover:text-red-400 transition-colors mt-1 block">remover</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-5 border-t border-white/8">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-sm text-white/50 tracking-widest">TOTAL</p>
                <p className="font-display text-2xl font-light text-white">R$ {cartTotal.toFixed(2).replace('.', ',')}</p>
              </div>
              <button onClick={sendCartWhatsapp}
                className="w-full bg-sage text-white font-body text-xs tracking-widest py-4 hover:bg-sage-dark transition-all flex items-center justify-center gap-3 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                ENVIAR PEDIDO VIA WHATSAPP
              </button>
              <button onClick={() => setCart([])} className="w-full font-body text-xs tracking-widest text-white/30 hover:text-white/60 transition-colors py-1">limpar carrinho</button>
            </div>
          </>
        )}
      </div>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section id="home" className="hero-bg noise relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute top-16 right-0 w-[500px] h-[500px] rounded-full bg-sage/8 blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blush/30 blur-3xl pointer-events-none"/>
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-6 reveal">
              <span className="deco-line"/>Cosméticos & Estética Premium
            </p>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-light leading-[1.05] text-obsidian reveal reveal-delay-1">
              Sua Pele,<br/><em className="text-sage">Sua Melhor</em><br/>Versão.
            </h1>
            <p className="font-body font-light text-obsidian/60 mt-6 text-base leading-relaxed max-w-md reveal reveal-delay-2">
              Cosméticos desenvolvidos com tecnologia de ponta e ingredientes selecionados para revelar a beleza que já existe em você.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-10 reveal reveal-delay-3">
              <a href="#produtos" className="bg-sage text-white font-body text-xs tracking-widest px-8 py-4 hover:bg-sage-dark transition-all duration-300 inline-flex items-center gap-2">
                CONHEÇA NOSSOS PRODUTOS
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="#sobre" className="font-body text-xs tracking-widest text-obsidian/60 hover:text-sage transition-colors border-b border-obsidian/20 hover:border-sage pb-0.5">SOBRE A MARCA</a>
            </div>
            <div className="flex gap-10 mt-14 reveal reveal-delay-4">
              <div>
                <p className="font-display text-4xl font-light text-obsidian">10K+</p>
                <p className="font-body text-xs tracking-widest text-obsidian/50 mt-1">CLIENTES FELIZES</p>
              </div>
              <div className="w-px bg-obsidian/10 self-stretch"/>
              <div>
                <p className="font-display text-4xl font-light text-obsidian">{products.length}</p>
                <p className="font-body text-xs tracking-widest text-obsidian/50 mt-1">PRODUTOS</p>
              </div>
              <div className="w-px bg-obsidian/10 self-stretch"/>
              <div>
                <p className="font-display text-4xl font-light text-obsidian">5</p>
                <p className="font-body text-xs tracking-widest text-obsidian/50 mt-1">ANOS DE HISTÓRIA</p>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center items-center reveal reveal-delay-2">
            <div className="absolute w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full border border-sage/20 animate-spin" style={{ animationDuration: '20s' }}/>
            <div className="absolute w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full border border-blush/30 animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse' }}/>
            <div className="relative z-10 w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #d4e8da 0%, #f0d8d8 100%)' }}>
              {heroConfig?.imagem_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={heroConfig.imagem_url} alt="Produto em destaque" className="w-full h-full object-cover"/>
                : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="50" fill="#d4e8da" opacity=".6"/>
                      <circle cx="60" cy="60" r="35" fill="#4a7c59" opacity=".3"/>
                      <text x="60" y="68" textAnchor="middle" fontFamily="serif" fontSize="28" fill="#2e5238" fontWeight="300">Y360</text>
                    </svg>
                  </div>
                )}
            </div>
            {heroConfig?.nome && (
              <div className="absolute bottom-4 left-0 bg-obsidian/90 text-white px-4 py-2 text-xs font-body z-10">
                {heroConfig.nome}{heroConfig.preco ? ` — R$ ${Number(heroConfig.preco).toFixed(0)}` : ''}
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="font-body text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-12 bg-obsidian animate-pulse"/>
        </div>
      </section>

      {/* ── BANNERS / LINHAS ───────────────────────────────────── */}
      <section id="banners" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-14 reveal">
          <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-3">Coleção Exclusiva</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-obsidian">Nossas <em>Linhas</em></h2>
          <div className="section-divider mt-4"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(linhasConfig.length === 3 ? linhasConfig : [
            { id:1, nome_linha:'LINHA SKINCARE', titulo:'Skin',    subtitulo:'Glow',  descricao:'Vitamina C, Colágeno & Ácido Hialurônico', imagem_url:'' },
            { id:2, nome_linha:'LINHA PERFUMES', titulo:'Essence', subtitulo:'YOU',   descricao:'Oud, Almíscar & Flores Nobres',             imagem_url:'' },
            { id:3, nome_linha:'LINHA ESTÉTICA', titulo:'Beauty',  subtitulo:'Pro',   descricao:'Ácido Glicólico, Retinol & Niacinamida',   imagem_url:'' },
          ]).map((b, i) => {
            const bgs    = ['bottle-bg-1','bottle-bg-3','bottle-bg-5']
            const delays = ['reveal-delay-1','reveal-delay-2','reveal-delay-3']
            const heightClass = i === 1 ? 'h-[480px] md:h-[560px] md:-mt-10' : 'h-[480px]'
            return (
              <a key={b.id} href="#produtos" className={`banner-card block rounded-none relative ${heightClass} group ${delays[i]} reveal`}>
                <div className={`banner-img absolute inset-0 ${bgs[i]} flex items-center justify-center`}>
                  {b.imagem_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={b.imagem_url} alt={b.nome_linha} className="w-full h-full object-cover"/>
                    : <BannerIcon index={i}/>
                  }
                </div>
                <div className="banner-overlay absolute inset-0"/>
                {i === 1 && <div className="absolute top-6 right-6 z-10"><span className="bg-sage text-white font-body text-xs tracking-widest px-3 py-1">DESTAQUE</span></div>}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <p className="font-body text-xs tracking-[0.3em] text-white/70 mb-2">{b.nome_linha}</p>
                  <h3 className="font-display text-3xl font-light text-white leading-tight">{b.titulo}<br/><em>{b.subtitulo}</em></h3>
                  <p className="font-body text-sm text-white/60 mt-2">{b.descricao}</p>
                  <span className="inline-block mt-4 font-body text-xs tracking-widest border border-white/50 text-white px-4 py-2 group-hover:bg-white group-hover:text-obsidian transition-all duration-300">VER COLEÇÃO →</span>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── DIFERENCIAIS ───────────────────────────────────────── */}
      <section className="bg-obsidian text-white py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { icon:'🧪', tag:'FORMULAÇÃO',  title:'Ingredientes\nAtivos Premium',   desc:'Selecionamos os ativos mais eficazes e seguros do mercado.' },
            { icon:'✨', tag:'RESULTADO',    title:'Eficácia\nComprovada',           desc:'Resultados visíveis desde as primeiras semanas de uso.' },
            { icon:'🌿', tag:'CRUELTY-FREE', title:'Sem Testes\nem Animais',         desc:'100% cruelty-free. Beleza com consciência e responsabilidade.' },
            { icon:'📦', tag:'EMBALAGEM',    title:'Design\nSustentável',            desc:'Embalagens eco-friendly que respeitam o meio ambiente.' },
          ].map((d, i) => (
            <div key={i} className={`reveal ${i>0?`reveal-delay-${i}`:''} text-center`}>
              <div className="w-12 h-12 rounded-full border border-sage flex items-center justify-center mx-auto mb-5 text-xl">{d.icon}</div>
              <p className="font-body text-xs tracking-[0.3em] text-sage mb-3">{d.tag}</p>
              <h4 className="font-display text-xl font-light whitespace-pre-line">{d.title}</h4>
              <p className="font-body text-sm text-white/50 mt-3 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUTOS ───────────────────────────────────────────── */}
      <section id="produtos" className="py-24 px-6 md:px-12 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-3">Nossa Seleção</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-obsidian">Produtos <em>Exclusivos</em></h2>
            <div className="section-divider mt-4"/>
            <p className="font-body font-light text-obsidian/50 mt-4 text-sm max-w-md mx-auto">Cada produto é desenvolvido para transformar sua rotina de beleza.</p>
          </div>

          {linhas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12 reveal">
              <button onClick={() => setActiveFilter('all')}
                className={`font-body text-xs tracking-widest px-5 py-2 border transition-all ${activeFilter==='all' ? 'bg-sage border-sage text-white' : 'border-obsidian/20 text-obsidian/60 hover:border-sage hover:text-sage'}`}>
                TODOS
              </button>
              {linhas.map(l => (
                <button key={l} onClick={() => setActiveFilter(l)}
                  className={`font-body text-xs tracking-widest px-5 py-2 border transition-all ${activeFilter===l ? 'bg-sage border-sage text-white' : 'border-obsidian/20 text-obsidian/60 hover:border-sage hover:text-sage'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20"><p className="font-display text-2xl text-obsidian/30 italic">Nenhum produto encontrado.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} delay={i % 3} onBuy={() => addToCart(p)}/>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SOBRE ──────────────────────────────────────────────── */}
      <section id="sobre" className="py-24 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative reveal">
            <div className="w-full aspect-[4/5] bg-gradient-to-br from-sage/15 to-blush/30 flex items-center justify-center gap-6">
              <span className="font-display text-8xl text-sage/20 font-light select-none">Y</span>
              <span className="font-display text-8xl text-blush/40 font-light select-none">360</span>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-obsidian text-white p-6 w-36 h-36 flex flex-col items-center justify-center text-center">
              <p className="font-display text-3xl font-light leading-none">5</p>
              <p className="font-body text-xs tracking-widest text-white/60 mt-1">ANOS DE<br/>EXCELÊNCIA</p>
            </div>
          </div>
          <div className="reveal reveal-delay-1">
            <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-4">Nossa História</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-obsidian leading-tight mb-6">A ciência a serviço<br/>da sua <em>beleza</em></h2>
            <p className="font-body font-light text-obsidian/60 leading-relaxed mb-4">Fundada com a missão de democratizar o acesso a cosméticos de alta performance, a YOU360 desenvolve produtos que combinam ciência avançada com ingredientes naturais selecionados.</p>
            <p className="font-body font-light text-obsidian/60 leading-relaxed mb-8">Nossa equipe de especialistas trabalha continuamente para trazer as mais recentes inovações em skincare e estética, garantindo segurança, eficácia e resultados reais para todos os tipos de pele.</p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="border-l-2 border-sage pl-4"><p className="font-display text-3xl font-light text-obsidian">{products.length}+</p><p className="font-body text-xs tracking-widest text-obsidian/50 mt-1">PRODUTOS ATIVOS</p></div>
              <div className="border-l-2 border-blush-dark pl-4"><p className="font-display text-3xl font-light text-obsidian">10K+</p><p className="font-body text-xs tracking-widest text-obsidian/50 mt-1">CLIENTES EM TODO O BRASIL</p></div>
            </div>
            <a href="#produtos" className="inline-flex items-center gap-3 font-body text-xs tracking-widest text-sage border-b border-sage pb-0.5 hover:text-sage-dark transition-colors">
              CONHEÇA NOSSA COLEÇÃO
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────── */}
      <section id="depoimentos" className="py-24 px-6 md:px-12 bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-3">O que dizem sobre nós</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white">Vozes que nos <em>inspiram</em></h2>
            <div className="section-divider mt-4"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {deps.map((t, i) => {
              const cores = ['text-sage','text-blush','text-sage-light']
              const bgs   = ['bg-sage/30','bg-blush/30','bg-sage/20']
              const cor   = t.cor || cores[i % 3]
              const bg    = t.bg  || bgs[i % 3]
              return (
                <div key={t.id || i} className={`testimonial-card bg-white/5 p-8 reveal ${i>0?`reveal-delay-${i}`:''}`}>
                  <div className="flex gap-1 mb-5"><span className="text-sage">★★★★★</span></div>
                  {/* CORREÇÃO — quebra de texto no depoimento */}
                  <p className="font-display text-xl font-light text-white/80 italic leading-relaxed mb-6"
                    style={{ overflowWrap:'break-word', wordBreak:'break-word', whiteSpace:'normal' }}>
                    "{t.texto}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center font-display ${cor} text-lg flex-shrink-0`}>
                      {t.inicial || t.nome?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-white font-medium" style={{ overflowWrap:'break-word', wordBreak:'break-word' }}>{t.nome}</p>
                      <p className="font-body text-xs text-white/40 tracking-wider">{t.cidade}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Newsletter/>
      <Footer products={products}/>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse nos produtos da YOU360.')}`}
        target="_blank" rel="noopener" aria-label="Chat no WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-sage rounded-full flex items-center justify-center shadow-lg hover:bg-sage-dark transition-all duration-300 hover:scale-110">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>

      {/* ── FORMULÁRIO DO CLIENTE ───────────────────────────────── */}
      {clienteForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)' }}>
          <div className="w-full max-w-md border border-white/10" style={{ background:'#0f0f0f' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <h2 className="font-display text-xl font-light text-white tracking-widest">FINALIZAR PEDIDO</h2>
                <p className="font-body text-xs text-white/30 mt-0.5">Informe seus dados para enviar via WhatsApp</p>
              </div>
              <button onClick={() => { setClienteForm(false); setCartOpen(true) }} className="text-white/30 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="border border-white/8 p-4 space-y-1 mb-2" style={{ background:'rgba(255,255,255,0.02)' }}>
                <p className="font-body text-xs tracking-widest text-white/30 mb-2">RESUMO DO PEDIDO</p>
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between font-body text-xs text-white/60">
                    <span>{i.nome} x{i.qty}</span>
                    <span>R$ {(i.preco * i.qty).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-body text-sm text-white pt-2 border-t border-white/8 mt-2">
                  <span>Total</span>
                  <span className="font-display text-lg">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <div>
                <label className="font-body text-xs tracking-widest text-white/40 block mb-2">NOME *</label>
                <input value={clienteData.nome} onChange={e => setClienteData({...clienteData, nome: e.target.value})}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
                  style={{ background:'rgba(255,255,255,0.05)' }}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs tracking-widest text-white/40 block mb-2">CIDADE</label>
                  <input value={clienteData.cidade} onChange={e => setClienteData({...clienteData, cidade: e.target.value})}
                    placeholder="Ex: Quixadá"
                    className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
                    style={{ background:'rgba(255,255,255,0.05)' }}/>
                </div>
                <div>
                  <label className="font-body text-xs tracking-widest text-white/40 block mb-2">ESTADO</label>
                  <input value={clienteData.estado} onChange={e => setClienteData({...clienteData, estado: e.target.value})}
                    placeholder="CE" maxLength={2}
                    className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors uppercase"
                    style={{ background:'rgba(255,255,255,0.05)' }}/>
                </div>
              </div>
              <div>
                <label className="font-body text-xs tracking-widest text-white/40 block mb-2">WHATSAPP *</label>
                <input value={clienteData.whatsapp} onChange={e => setClienteData({...clienteData, whatsapp: maskPhone(e.target.value)})}
                  placeholder="(88) 99999-9999"
                  className="w-full px-4 py-3 font-body text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sage border border-white/10 transition-colors"
                  style={{ background:'rgba(255,255,255,0.05)' }}/>
              </div>
              {orderError && !orderError.startsWith('__WA_BLOCKED__') && (
                <p className="font-body text-xs text-red-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {orderError}
                </p>
              )}
              {orderError && orderError.startsWith('__WA_BLOCKED__') && (
                <div className="border border-sage/30 p-4" style={{background:'rgba(74,124,89,0.08)'}}>
                  <p className="font-body text-xs text-white/70 mb-3">Pedido registrado! Clique para abrir o WhatsApp:</p>
                  <a href={orderError.replace('__WA_BLOCKED__','')} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-sage text-white font-body text-xs tracking-widest py-3 hover:bg-sage-dark transition-all">
                    ABRIR WHATSAPP
                  </a>
                </div>
              )}
              <button onClick={confirmOrder} disabled={sendingOrder}
                className="w-full bg-sage text-white font-body text-xs tracking-widest py-4 hover:bg-sage-dark transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-2">
                {sendingOrder
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>PROCESSANDO...</>
                  : 'ENVIAR PEDIDO VIA WHATSAPP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BannerIcon({ index }) {
  const icons = ['🧴','🌸','✨']
  return <span className="text-8xl opacity-20">{icons[index]}</span>
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const handleSubmit = () => {
    if (email.includes('@')) { setStatus('ok'); setEmail('') }
    else setStatus('err')
    setTimeout(() => setStatus(''), 3000)
  }
  return (
    <section className="py-20 px-6 md:px-12 bg-sage">
      <div className="max-w-2xl mx-auto text-center reveal">
        <p className="font-body text-xs tracking-[0.4em] text-white/60 uppercase mb-3">Fique por dentro</p>
        <h2 className="font-display text-3xl md:text-4xl font-light text-white mb-6">Receba lançamentos & <em>ofertas exclusivas</em></h2>
        <div className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={status==='ok' ? '✦ Inscrito com sucesso!' : status==='err' ? 'E-mail inválido' : 'Seu melhor e-mail'}
            className="flex-1 px-5 py-4 font-body text-sm bg-white text-obsidian placeholder:text-obsidian/40 focus:outline-none border-0"/>
          <button onClick={handleSubmit} className="bg-obsidian text-white font-body text-xs tracking-widest px-7 py-4 hover:bg-sage-dark transition-colors duration-300 whitespace-nowrap">
            INSCREVER-SE
          </button>
        </div>
        <p className="font-body text-xs text-white/40 mt-4">Sem spam. Cancele quando quiser.</p>
      </div>
    </section>
  )
}

function Footer({ products }) {
  return (
    <footer className="bg-obsidian border-t border-white/5 pt-16 pb-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><ellipse cx="14" cy="18" rx="9" ry="8" fill="#4a7c59" opacity=".85"/><rect x="11" y="6" width="6" height="6" rx="2" fill="#fafaf8"/><rect x="12.5" y="3" width="3" height="4" rx="1.5" fill="#4a7c59"/></svg>
              <span className="font-display text-xl font-light tracking-widest text-white">YOU<strong className="font-semibold text-sage">360</strong></span>
            </div>
            <p className="font-body text-sm text-white/40 leading-relaxed max-w-xs">Cosméticos premium que celebram a individualidade através de produtos únicos e transformadores.</p>
          </div>
          <div>
            <h4 className="font-body text-xs tracking-[0.3em] text-white/30 uppercase mb-5">Navegação</h4>
            <ul className="space-y-3">
              {[['#home','Início'],['#banners','Linhas'],['#produtos','Produtos'],['#sobre','Sobre'],['#depoimentos','Depoimentos']].map(([href,label]) => (
                <li key={href}><a href={href} className="font-body text-sm text-white/50 hover:text-sage transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body text-xs tracking-[0.3em] text-white/30 uppercase mb-5">Contato</h4>
            <ul className="space-y-3">
              <li className="font-body text-sm text-white/50">(88) 99366-8921</li>
              <li className="font-body text-sm text-white/50">Quixadá, Ceará — Brasil</li>
              <li className="font-body text-sm text-white/50">contato@you360.com.br</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/20 tracking-wider">© {new Date().getFullYear()} YOU360. Todos os direitos reservados.</p>
          <p className="font-body text-xs text-white/20">Feito com <span className="text-sage">♥</span> no Brasil</p>
        </div>
      </div>
    </footer>
  )
}
