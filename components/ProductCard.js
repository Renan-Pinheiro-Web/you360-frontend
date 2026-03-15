
// components/ProductCard.js
// YOU360 — Card de produto para a listagem da loja

import { useState } from 'react'
import Link from 'next/link'

export default function ProductCard({ product, delay = 0, onBuy }) {
  const [imgError, setImgError] = useState(false)

  const esgotado = product.estoque !== null &&
                   product.estoque !== undefined &&
                   product.estoque <= 0

  const bgClass = [
    'bottle-bg-1','bottle-bg-2','bottle-bg-3',
    'bottle-bg-4','bottle-bg-5','bottle-bg-6'
  ][Math.abs((product.nome?.charCodeAt(0) || 65) - 65) % 6]

  const delayClass = delay > 0 ? `reveal-delay-${delay}` : ''

  return (
    <div className={`product-card group reveal ${delayClass}`}>

      {/* Imagem */}
      <Link href={`/produto/${product.id}`}>
        <div className={`relative aspect-[3/4] overflow-hidden mb-4 cursor-pointer ${bgClass}`}>
          {product.imagem_url && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imagem_url}
              alt={product.nome}
              className="product-img w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.3)"/>
                <circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.4)"/>
                <circle cx="40" cy="40" r="10" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>
          )}

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3 bg-sage text-white font-body text-xs tracking-widest px-3 py-1">
              {product.badge}
            </div>
          )}

          {/* Esgotado overlay */}
          {esgotado && (
            <div className="absolute inset-0 bg-obsidian/50 flex items-center justify-center">
              <span className="font-body text-xs tracking-widest text-white/70 border border-white/30 px-3 py-1">
                ESGOTADO
              </span>
            </div>
          )}

          {/* Estoque baixo */}
          {!esgotado && product.estoque !== null && product.estoque !== undefined && product.estoque <= 5 && product.estoque > 0 && (
            <div className="absolute top-3 right-3 bg-blush-dark text-white font-body text-xs px-2 py-0.5">
              ÚLTIMAS {product.estoque}
            </div>
          )}

          {/* Hover overlay com botão ver */}
          <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/20 transition-all duration-500 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
            <span className="font-body text-xs tracking-widest text-white border border-white/60 px-4 py-2 backdrop-blur-sm">
              VER DETALHES
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="px-1">
        {product.linha && (
          <p className="font-body text-xs tracking-[0.3em] text-sage uppercase mb-1">
            {product.linha}
          </p>
        )}

        <Link href={`/produto/${product.id}`}>
          <h3 className="font-display text-xl font-light text-obsidian group-hover:text-sage transition-colors cursor-pointer leading-tight mb-1">
            {product.nome}
          </h3>
        </Link>

        {product.fragrancia && (
          <p className="font-body text-xs text-obsidian/40 italic mb-3 line-clamp-1">
            {product.fragrancia}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="font-display text-2xl font-light text-obsidian">
            R$ {Number(product.preco).toFixed(2).replace('.', ',')}
          </p>

          <button
            onClick={() => !esgotado && onBuy && onBuy(product)}
            disabled={esgotado}
            className={`font-body text-xs tracking-widest px-4 py-2.5 border transition-all duration-300 flex items-center gap-2
              ${esgotado
                ? 'border-obsidian/10 text-obsidian/20 cursor-not-allowed'
                : 'border-sage text-sage hover:bg-sage hover:text-white'
              }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {esgotado ? 'ESGOTADO' : 'COMPRAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
