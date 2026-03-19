// pages/produto/[id].js
// YOU360 — Página individual do produto (API PHP)

import Head from 'next/head'
import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'
import { api } from '../../lib/apiClient'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '5588993668921'

export async function getServerSideProps({ params }) {
  try {
    const [product, galeriaData, suggestions] = await Promise.all([
      api.products.get(params.id),
      api.products.gallery(params.id).catch(() => []),
      api.products.list().then(all =>
        (all || []).filter(p => p.id !== params.id && p.ativo).slice(0, 3)
      ).catch(() => []),
    ])

    if (!product || !product.ativo) return { notFound: true }

    return {
      props: {
        product,
        galeria:     galeriaData || [],
        suggestions: suggestions || [],
      },
    }
  } catch {
    return { notFound: true }
  }
}

export default function ProdutoPage({ product, galeria, suggestions }) {
  const navRef = useRef(null)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  // Monta lista completa de imagens: principal + galeria
  const allImages = [
    ...(product.imagem_url ? [{ url: product.imagem_url, label: 'Principal' }] : []),
    ...galeria.map((g, i) => ({ url: g.imagem_url, label: `Foto ${i + 2}` })),
  ]

  const formattedPrice = `R$ ${Number(product.preco).toFixed(2).replace('.', ',')}`

  // CORREÇÃO — Number() antes de comparar (API pode retornar string)
  const estoqueNum = product.estoque !== null && product.estoque !== undefined
    ? Number(product.estoque)
    : null
  const esgotado = estoqueNum !== null && estoqueNum <= 0
  const poucas   = estoqueNum !== null && estoqueNum > 0 && estoqueNum <= 5

  useEffect(() => {
    const handleScroll = () => navRef.current?.classList.toggle('scrolled', window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navegação por teclado na galeria
  useEffect(() => {
    if (allImages.length <= 1) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') setActiveImgIdx(i => Math.min(i + 1, allImages.length - 1))
      if (e.key === 'ArrowLeft')  setActiveImgIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [allImages.length])

  const openWhatsapp = () => {
    if (esgotado) return
    const msg = encodeURIComponent(
      `Olá! Tenho interesse em comprar o produto *${product.nome}* (${formattedPrice}). Pode me ajudar?`
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
  }

  // Cor da linha para badge
  const linhaColor = {
    skincare:   'text-sage',
    perfumes:   'text-sage',
    estetica:   'text-blush-dark',
    cabelos:    'text-sage',
    corpo:      'text-sage',
    maquiagem:  'text-blush-dark',
  }[product.linha?.toLowerCase()] || 'text-sage'

  const bgClass = [
    'bottle-bg-1','bottle-bg-2','bottle-bg-3',
    'bottle-bg-4','bottle-bg-5','bottle-bg-6',
  ][Math.abs((product.nome?.charCodeAt(0) || 65) - 65) % 6]

  return (
    <>
      <Head>
        <title>{product.nome} — YOU360</title>
        <meta name="description" content={product.descricao || `${product.nome} — ${product.fragrancia || 'Cosméticos premium YOU360'}`}/>
        <meta property="og:title"       content={`${product.nome} — YOU360`}/>
        <meta property="og:description" content={product.descricao || product.fragrancia || ''}/>
        {product.imagem_url && <meta property="og:image" content={product.imagem_url}/>}
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-5 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="18" rx="9" ry="8" fill="#4a7c59" opacity=".85"/>
            <rect x="11" y="6" width="6" height="6" rx="2" fill="#0f0f0f"/>
            <rect x="12.5" y="3" width="3" height="4" rx="1.5" fill="#4a7c59"/>
            <circle cx="14" cy="18" r="4" fill="#fafaf8" opacity=".25"/>
          </svg>
          <span className="font-display text-2xl font-light tracking-widest text-obsidian">
            YOU<strong className="font-semibold text-sage">360</strong>
          </span>
        </Link>
        <ul className="hidden md:flex items-center gap-8 font-body text-sm font-light tracking-widest text-obsidian/70">
          {[['/#home','INÍCIO'],['/#banners','LINHAS'],['/#produtos','PRODUTOS'],['/#sobre','SOBRE'],['/#depoimentos','DEPOIMENTOS']].map(([href,label]) => (
            <li key={href}><Link href={href} className="hover:text-sage transition-colors">{label}</Link></li>
          ))}
        </ul>
        <Link href="/#produtos" className="hidden md:inline-flex items-center gap-2 border border-sage text-sage text-xs tracking-widest font-body px-5 py-2.5 hover:bg-sage hover:text-white transition-all duration-300">
          VER PRODUTOS
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 p-1" aria-label="Menu">
          <span className="w-6 h-px bg-obsidian block transition-all" style={menuOpen?{transform:'rotate(45deg) translate(4px,4px)'}:{}}/>
          <span className="w-6 h-px bg-obsidian block transition-all" style={menuOpen?{opacity:0}:{}}/>
          <span className="w-4 h-px bg-obsidian block transition-all" style={menuOpen?{transform:'rotate(-45deg) translate(4px,-4px)',width:'1.5rem'}:{}}/>
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 bg-cream flex flex-col items-center justify-center gap-8 transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {[['/#home','INÍCIO'],['/#banners','LINHAS'],['/#produtos','PRODUTOS'],['/#sobre','SOBRE'],['/#depoimentos','DEPOIMENTOS']].map(([href,label]) => (
          <Link key={href} href={href} onClick={() => setMenuOpen(false)}
            className="font-display text-3xl font-light tracking-widest text-obsidian hover:text-sage transition-colors">
            {label}
          </Link>
        ))}
      </div>

      {/* Breadcrumb */}
      <div className="pt-28 pb-4 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-body text-xs tracking-widest text-obsidian/40">
          <Link href="/" className="hover:text-sage transition-colors">INÍCIO</Link>
          <span>/</span>
          <Link href="/#produtos" className="hover:text-sage transition-colors">PRODUTOS</Link>
          <span>/</span>
          <span className="text-obsidian/70">{product.nome.toUpperCase()}</span>
        </div>
      </div>

      {/* ── PRODUTO PRINCIPAL ──────────────────────────────────── */}
      <section className="pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── GALERIA ── */}
          <div className="space-y-3">
            <div className={`${bgClass} relative overflow-hidden aspect-square flex items-center justify-center`}>
              {product.badge && (
                <div className="absolute top-5 left-5 z-10 bg-sage text-white font-body text-xs tracking-widest px-4 py-1.5">
                  {product.badge}
                </div>
              )}

              {allImages.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={allImages[activeImgIdx].url}
                  alt={`${product.nome} — ${allImages[activeImgIdx].label}`}
                  className="w-2/3 h-2/3 object-contain drop-shadow-2xl transition-opacity duration-300"
                />
              ) : (
                <FallbackBottle/>
              )}

              {allImages.length > 1 && (
                <>
                  <button onClick={() => setActiveImgIdx(i => Math.max(i-1,0))} disabled={activeImgIdx===0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all disabled:opacity-20">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button onClick={() => setActiveImgIdx(i => Math.min(i+1,allImages.length-1))} disabled={activeImgIdx===allImages.length-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all disabled:opacity-20">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                  <div className="absolute bottom-3 right-3 bg-obsidian/60 text-white font-body text-xs px-2 py-1">
                    {activeImgIdx+1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImgIdx(i)}
                    className={`flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-all ${activeImgIdx===i ? 'border-sage' : 'border-transparent opacity-50 hover:opacity-80'}`}
                    style={{ background:'rgba(74,124,89,0.1)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.label} className="w-full h-full object-contain p-1"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── DETALHES ── */}
          <div className="py-4">
            {product.linha && (
              <p className={`font-body text-xs tracking-[0.4em] ${linhaColor} uppercase mb-3`}>{product.linha}</p>
            )}
            <h1 className="font-display text-5xl md:text-6xl font-light text-obsidian leading-tight mb-2">{product.nome}</h1>
            {product.fragrancia && (
              <p className="font-body text-sm text-obsidian/50 tracking-wide mb-6">{product.fragrancia}</p>
            )}
            <div className="w-12 h-px bg-sage mb-6"/>
            {product.descricao && (
              <p className="font-body font-light text-obsidian/70 leading-relaxed text-base mb-8">{product.descricao}</p>
            )}

            {/* Preço */}
            <div className="flex items-end gap-3 mb-3">
              <p className={`font-display text-5xl font-light ${esgotado ? 'text-obsidian/30' : 'text-obsidian'}`}>
                {formattedPrice}
              </p>
            </div>

            {/* UNIDADES — visível na página do produto */}
            {estoqueNum !== null && (
              <div className={`flex items-center gap-2 mb-6 font-body text-xs tracking-wider ${esgotado ? 'text-red-400' : poucas ? 'text-orange-400' : 'text-sage'}`}>
                <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${esgotado ? 'bg-red-400' : poucas ? 'bg-orange-400' : 'bg-sage'}`}/>
                {esgotado
                  ? 'Produto esgotado'
                  : poucas
                    ? `Últimas ${estoqueNum} unidade${estoqueNum > 1 ? 's' : ''} disponíveis`
                    : `${estoqueNum} unidades disponíveis`
                }
              </div>
            )}

            {/* Botão de compra */}
            {esgotado ? (
              <div className="w-full border border-obsidian/10 text-obsidian/30 font-body text-xs tracking-widest py-5 flex items-center justify-center gap-3 mb-4 cursor-not-allowed">
                PRODUTO ESGOTADO
              </div>
            ) : (
              <button onClick={openWhatsapp}
                className="w-full bg-sage text-white font-body text-xs tracking-widest py-5 hover:bg-sage-dark transition-all duration-300 flex items-center justify-center gap-3 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                COMPRAR VIA WHATSAPP
              </button>
            )}

            <Link href="/#produtos"
              className="w-full border border-obsidian/20 text-obsidian/60 font-body text-xs tracking-widest py-4 hover:border-sage hover:text-sage transition-all flex items-center justify-center gap-2">
              ← VER TODOS OS PRODUTOS
            </Link>

            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-obsidian/8">
              {[{icon:'🌿',label:'Cruelty-free'},{icon:'✦',label:'Alta qualidade'},{icon:'📦',label:'Entrega segura'}].map((d,i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl mb-1">{d.icon}</p>
                  <p className="font-body text-xs text-obsidian/40 tracking-wider">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SUGESTÕES ── */}
      {suggestions.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-cream">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-3">Você também pode gostar</p>
              <h2 className="font-display text-3xl md:text-4xl font-light text-obsidian">Outros Produtos</h2>
              <div className="w-12 h-px bg-sage mx-auto mt-4"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {suggestions.map((s) => {
                const sEstoque = s.estoque !== null && s.estoque !== undefined ? Number(s.estoque) : null
                const sEsgotado = sEstoque !== null && sEstoque <= 0
                const sBg = ['bottle-bg-1','bottle-bg-2','bottle-bg-3','bottle-bg-4','bottle-bg-5','bottle-bg-6'][Math.abs((s.nome?.charCodeAt(0)||65)-65)%6]
                return (
                  <Link key={s.id} href={`/produto/${s.id}`} className="product-card bg-white block hover:no-underline">
                    <div className={`${sBg} h-56 flex items-center justify-center relative overflow-hidden`}>
                      {s.badge && !sEsgotado && (
                        <div className="absolute top-4 left-4 bg-sage text-white font-body text-xs px-3 py-1 z-10">{s.badge}</div>
                      )}
                      {sEsgotado && (
                        <div className="absolute inset-0 bg-obsidian/40 z-10 flex items-center justify-center">
                          <span className="bg-obsidian text-white font-body text-xs tracking-widest px-3 py-1.5">ESGOTADO</span>
                        </div>
                      )}
                      {s.imagem_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={s.imagem_url} alt={s.nome} className="h-4/5 object-contain drop-shadow-lg"/>
                        : <FallbackBottle small/>}
                    </div>
                    <div className="p-5">
                      {s.linha && <p className="font-body text-xs tracking-[0.3em] text-sage mb-1">{s.linha.toUpperCase()}</p>}
                      <h3 className="font-display text-xl font-light text-obsidian">{s.nome}</h3>
                      {s.fragrancia && <p className="font-body text-xs text-obsidian/40 mt-1">{s.fragrancia}</p>}
                      {/* UNIDADES nas sugestões */}
                      {sEstoque !== null && (
                        <p className={`font-body text-xs mt-1 ${sEsgotado ? 'text-red-400' : sEstoque <= 5 ? 'text-orange-400' : 'text-sage/70'}`}>
                          {sEsgotado ? 'Esgotado' : sEstoque <= 5 ? `Últimas ${sEstoque} un.` : `${sEstoque} un.`}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <p className="font-display text-2xl font-light text-obsidian">R$ {Number(s.preco).toFixed(2).replace('.', ',')}</p>
                        <span className="font-body text-xs tracking-widest text-sage border-b border-sage pb-0.5">VER →</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse nos produtos da YOU360.')}`}
        target="_blank" rel="noopener" aria-label="Chat no WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-sage rounded-full flex items-center justify-center shadow-lg hover:bg-sage-dark transition-all duration-300 hover:scale-110">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </>
  )
}

function FallbackBottle({ small = false }) {
  const s = small ? 0.7 : 1
  return (
    <svg width={160*s} height={240*s} viewBox="0 0 160 240" fill="none" className="drop-shadow-xl">
      <rect x="20" y="80" width="120" height="155" rx="18" fill="white" opacity=".8"/>
      <rect x="55" y="50" width="50" height="35" rx="8" fill="#e8e8e4"/>
      <rect x="48" y="32" width="64" height="24" rx="7" fill="#4a7c59"/>
      <rect x="72" y="16" width="16" height="18" rx="4" fill="#2e5238"/>
      <rect x="86" y="20" width="14" height="6" rx="3" fill="#4a7c59"/>
      <rect x="25" y="94" width="9" height="134" rx="4.5" fill="white" opacity=".35"/>
      <rect x="35" y="128" width="90" height="70" rx="8" fill="white" opacity=".35"/>
    </svg>
  )
}
