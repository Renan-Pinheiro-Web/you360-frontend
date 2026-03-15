// pages/produto/[id].js
// YOU360 — Página de produto individual usando API PHP

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/apiClient'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '5588993668921'

export async function getServerSideProps({ params }) {
  try {
    const [product, allProducts] = await Promise.all([
      api.products.get(params.id),
      api.products.list(),
    ])

    const gallery = await api.products.gallery(params.id).catch(() => [])

    const suggested = allProducts
      .filter(p => p.id !== product.id && p.linha === product.linha && p.ativo)
      .slice(0, 4)

    return { props: { product, gallery, suggested } }
  } catch {
    return { notFound: true }
  }
}

export default function ProductPage({ product, gallery, suggested }) {
  const router = useRouter()
  const allImages = [
    product.imagem_url,
    ...gallery.map(g => g.imagem_url),
  ].filter(Boolean)

  const [currentImg, setCurrentImg]   = useState(0)
  const [qty, setQty]                 = useState(1)
  const [imgError, setImgError]       = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const maxQty = product.estoque !== null && product.estoque !== undefined
    ? product.estoque : Infinity
  const esgotado = maxQty === 0

  const prevImg = useCallback(() =>
    setCurrentImg(i => (i - 1 + allImages.length) % allImages.length), [allImages.length])
  const nextImg = useCallback(() =>
    setCurrentImg(i => (i + 1) % allImages.length), [allImages.length])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft')  prevImg()
      if (e.key === 'ArrowRight') nextImg()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [prevImg, nextImg])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.1 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handleBuyWhatsapp = () => {
    const msg = encodeURIComponent(
      `Olá! Tenho interesse em:\n\n*${product.nome}*\nQuantidade: ${qty}\nPreço: R$ ${(product.preco * qty).toFixed(2).replace('.', ',')}\n\nPode me ajudar?`
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
  }

  const handleAddToCart = () => {
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2000)
    // Dispara evento para a loja principal via sessionStorage
    const cartRaw  = sessionStorage.getItem('you360_cart') || '[]'
    const cart     = JSON.parse(cartRaw)
    const existing = cart.find(i => i.id === product.id)
    if (existing) {
      const updated = cart.map(i =>
        i.id === product.id
          ? { ...i, qty: Math.min(i.qty + qty, maxQty) }
          : i
      )
      sessionStorage.setItem('you360_cart', JSON.stringify(updated))
    } else {
      cart.push({ id: product.id, nome: product.nome, preco: product.preco, qty, estoque: product.estoque ?? null })
      sessionStorage.setItem('you360_cart', JSON.stringify(cart))
    }
  }

  const bgClass = ['bottle-bg-1','bottle-bg-2','bottle-bg-3','bottle-bg-4','bottle-bg-5','bottle-bg-6'][
    Math.abs((product.nome?.charCodeAt(0) || 0) - 65) % 6
  ]

  return (
    <>
      <Head>
        <title>{product.nome} — YOU360</title>
        <meta name="description" content={product.descricao?.slice(0, 155) || `${product.nome} – YOU360`} />
      </Head>

      {/* Navbar simples */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-obsidian/8 py-4 px-6 md:px-12 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 group">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="18" rx="9" ry="8" fill="#4a7c59" opacity=".85"/>
            <rect x="11" y="6" width="6" height="6" rx="2" fill="#0f0f0f"/>
            <rect x="12.5" y="3" width="3" height="4" rx="1.5" fill="#4a7c59"/>
          </svg>
          <span className="font-display text-xl font-light tracking-widest text-obsidian group-hover:text-sage transition-colors">
            YOU<strong className="font-semibold text-sage">360</strong>
          </span>
        </button>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 font-body text-xs tracking-widest text-obsidian/50 hover:text-sage transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          VOLTAR
        </button>
      </nav>

      <main className="pt-24 pb-24 min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 font-body text-xs text-obsidian/40 tracking-wider mb-10">
            <button onClick={() => router.push('/')} className="hover:text-sage transition-colors">INÍCIO</button>
            <span>/</span>
            <button onClick={() => router.push('/#produtos')} className="hover:text-sage transition-colors">PRODUTOS</button>
            {product.linha && (
              <>
                <span>/</span>
                <span className="text-obsidian/60 uppercase">{product.linha}</span>
              </>
            )}
            <span>/</span>
            <span className="text-obsidian truncate max-w-[200px]">{product.nome}</span>
          </nav>

          {/* Layout produto */}
          <div className="grid md:grid-cols-2 gap-16 items-start">

            {/* Galeria */}
            <div className="sticky top-28">
              {/* Imagem principal */}
              <div className={`relative aspect-square overflow-hidden ${bgClass} reveal`}>
                {allImages.length > 0 && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={currentImg}
                    src={allImages[currentImg]}
                    alt={product.nome}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="50" fill="rgba(255,255,255,0.2)"/>
                      <circle cx="60" cy="60" r="32" fill="rgba(255,255,255,0.3)"/>
                      <circle cx="60" cy="60" r="16" fill="rgba(255,255,255,0.5)"/>
                    </svg>
                  </div>
                )}

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-sage text-white font-body text-xs tracking-widest px-3 py-1">
                    {product.badge}
                  </div>
                )}

                {/* Estoque */}
                {!esgotado && product.estoque !== null && product.estoque <= 10 && (
                  <div className="absolute top-4 right-4 bg-blush-dark text-white font-body text-xs tracking-widest px-3 py-1">
                    ÚLTIMAS {product.estoque} UN.
                  </div>
                )}
                {esgotado && (
                  <div className="absolute inset-0 bg-obsidian/60 flex items-center justify-center">
                    <span className="font-display text-2xl text-white/70 italic tracking-widest">Esgotado</span>
                  </div>
                )}

                {/* Navegação galeria */}
                {allImages.length > 1 && (
                  <>
                    <button onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-obsidian/60 hover:bg-obsidian flex items-center justify-center text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <button onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-obsidian/60 hover:bg-obsidian flex items-center justify-center text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {allImages.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImg(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/40'}`}/>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImg(i)}
                      className={`w-16 h-16 overflow-hidden border-2 transition-all ${i === currentImg ? 'border-sage' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" onError={() => {}}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info produto */}
            <div className="reveal reveal-delay-1">
              {product.linha && (
                <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-3 flex items-center gap-2">
                  <span className="deco-line"/>
                  {product.linha}
                </p>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-light text-obsidian leading-tight mb-2">
                {product.nome}
              </h1>

              {product.fragrancia && (
                <p className="font-body text-sm text-obsidian/40 italic mb-6">{product.fragrancia}</p>
              )}

              {/* Preço e estoque */}
              <div className="flex items-end gap-4 mb-8">
                <p className="font-display text-5xl font-light text-obsidian">
                  R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                </p>
                {!esgotado ? (
                  <span className={`font-body text-xs tracking-widest px-3 py-1 mb-2 ${
                    product.estoque !== null && product.estoque <= 10
                      ? 'bg-blush/30 text-blush-dark'
                      : 'bg-sage/15 text-sage'
                  }`}>
                    {product.estoque !== null && product.estoque <= 10
                      ? `${product.estoque} em estoque`
                      : 'EM ESTOQUE'}
                  </span>
                ) : (
                  <span className="font-body text-xs tracking-widest px-3 py-1 mb-2 bg-obsidian/10 text-obsidian/40">
                    ESGOTADO
                  </span>
                )}
              </div>

              {/* Divisor */}
              <div className="w-16 h-px bg-sage mb-8"/>

              {/* Descrição */}
              {product.descricao && (
                <p className="font-body font-light text-obsidian/70 leading-relaxed text-base mb-8">
                  {product.descricao}
                </p>
              )}

              {/* Quantidade */}
              {!esgotado && (
                <div className="flex items-center gap-4 mb-8">
                  <span className="font-body text-xs tracking-widest text-obsidian/50">QTD.</span>
                  <div className="flex items-center border border-obsidian/20">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center text-obsidian/50 hover:text-obsidian hover:bg-sage/8 transition-all text-xl">−</button>
                    <span className="w-12 text-center font-body text-sm text-obsidian">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                      disabled={qty >= maxQty}
                      className="w-11 h-11 flex items-center justify-center text-obsidian/50 hover:text-obsidian hover:bg-sage/8 transition-all text-xl disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                  </div>
                  {qty > 1 && (
                    <span className="font-body text-sm text-obsidian/40">
                      = R$ {(product.preco * qty).toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
              )}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button
                  onClick={handleBuyWhatsapp}
                  disabled={esgotado}
                  className="flex-1 bg-sage text-white font-body text-xs tracking-widest py-4 px-6 hover:bg-sage-dark transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {esgotado ? 'PRODUTO ESGOTADO' : 'COMPRAR VIA WHATSAPP'}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={esgotado}
                  className={`flex-1 font-body text-xs tracking-widest py-4 px-6 border transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    addedFeedback
                      ? 'border-sage bg-sage text-white'
                      : 'border-obsidian/30 text-obsidian hover:border-sage hover:text-sage'
                  }`}>
                  {addedFeedback ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      ADICIONADO!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                      ADICIONAR AO CARRINHO
                    </>
                  )}
                </button>
              </div>

              {/* Detalhes */}
              <div className="border-t border-obsidian/10 pt-8 space-y-4">
                {[
                  ['Linha', product.linha],
                  ['Fragrância / Composição', product.fragrancia],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex gap-4">
                    <span className="font-body text-xs tracking-widest text-obsidian/40 w-40 flex-shrink-0">{label.toUpperCase()}</span>
                    <span className="font-body text-sm text-obsidian/70">{value}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          </div>

          {/* Sugestões da mesma linha */}
          {suggested.length > 0 && (
            <section className="mt-24">
              <div className="text-center mb-12 reveal">
                <p className="font-body text-xs tracking-[0.4em] text-sage uppercase mb-3">Da mesma linha</p>
                <h2 className="font-display text-3xl font-light text-obsidian">Você também pode gostar</h2>
                <div className="section-divider mt-4"/>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {suggested.map((p, i) => {
                  const bg2 = ['bottle-bg-2','bottle-bg-4','bottle-bg-6','bottle-bg-1'][i % 4]
                  const esg = p.estoque !== null && p.estoque !== undefined && p.estoque <= 0
                  return (
                    <a key={p.id} href={`/produto/${p.id}`}
                      className={`product-card group block reveal ${i > 0 ? `reveal-delay-${i}` : ''}`}>
                      <div className={`relative aspect-[3/4] mb-4 overflow-hidden ${bg2}`}>
                        {p.imagem_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-40">
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="25" fill="rgba(255,255,255,0.4)"/><circle cx="30" cy="30" r="15" fill="rgba(255,255,255,0.5)"/></svg>
                          </div>
                        )}
                        {p.badge && <div className="absolute top-3 left-3 bg-sage text-white font-body text-xs tracking-widest px-2 py-0.5">{p.badge}</div>}
                        {esg && <div className="absolute inset-0 bg-obsidian/50 flex items-center justify-center"><span className="font-body text-xs text-white/70 tracking-widest">ESGOTADO</span></div>}
                      </div>
                      <p className="font-body text-xs tracking-widest text-sage uppercase mb-1">{p.linha}</p>
                      <h3 className="font-display text-lg font-light text-obsidian group-hover:text-sage transition-colors">{p.nome}</h3>
                      <p className="font-display text-xl font-light text-obsidian mt-1">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</p>
                    </a>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Tenho interesse em ${product.nome}.`)}`}
        target="_blank" rel="noopener" aria-label="Chat no WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-sage rounded-full flex items-center justify-center shadow-lg hover:bg-sage-dark transition-all duration-300 hover:scale-110">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </>
  )
}
