'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { clp } from '@/lib/format'
import Receipt, { ReceiptData } from '@/components/pos/Receipt'
import type { Product, StoreSettings, CartLine } from '@/types/db'

// ─── Modal de cobro ──────────────────────────────────────────────────────────

function PaymentModal({
  total,
  onClose,
  onConfirm,
}: {
  total: number
  onClose: () => void
  onConfirm: (method: string, cashReceived: number | null) => Promise<void>
}) {
  const [method, setMethod] = useState('efectivo')
  const [cash, setCash] = useState<number | ''>('')
  const [processing, setProcessing] = useState(false)

  const change = method === 'efectivo' && cash !== '' ? cash - total : null
  const canConfirm = method !== 'efectivo' || (cash !== '' && cash >= total)
  const quick = [total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
    .filter((v, i, a) => a.indexOf(v) === i && v >= total)
    .slice(0, 4)

  const handleConfirm = async () => {
    setProcessing(true)
    try {
      await onConfirm(method, method === 'efectivo' && cash !== '' ? cash : null)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="text-center mb-5">
          <div className="text-sm text-gray-500">Total a pagar</div>
          <div className="text-4xl font-bold text-gray-900">{clp(total)}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'efectivo', label: 'Efectivo', icon: '💵' },
            { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
            { id: 'transferencia', label: 'Transfer.', icon: '📱' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                method === m.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-0.5">{m.icon}</div>
              {m.label}
            </button>
          ))}
        </div>

        {method === 'efectivo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo recibido</label>
            <input
              type="number"
              value={cash}
              onChange={(e) => setCash(e.target.value ? Number(e.target.value) : '')}
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-lg text-right font-mono"
            />
            <div className="flex gap-2 mt-2">
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => setCash(q)}
                  className="flex-1 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {clp(q)}
                </button>
              ))}
            </div>
            {change !== null && change >= 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between text-green-800">
                <span className="font-medium">Vuelto</span>
                <span className="text-xl font-bold">{clp(change)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={processing} className="flex-1 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || processing}
            className="flex-1 py-3 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-40"
          >
            {processing ? 'Registrando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── POS ─────────────────────────────────────────────────────────────────────

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState<number>(0)
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [lastSaleId, setLastSaleId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async () => {
    const [p, s] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('settings').select('*').single(),
    ])
    if (p.data) setProducts(p.data)
    if (s.data) setSettings(s.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(search)
    const matchC = !category || p.category === category
    return matchQ && matchC
  })

  const addToCart = (product: Product) => {
    setLastSaleId(null)
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const setQty = (productId: number, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) => (l.product.id === productId ? { ...l, quantity: qty } : l)),
    )
  }

  // Escáner de código de barras: los lectores USB escriben el código y envían Enter
  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !search.trim()) return
    const exact = products.find((p) => p.barcode === search.trim())
    if (exact) {
      addToCart(exact)
      setSearch('')
    } else if (filtered.length === 1) {
      addToCart(filtered[0])
      setSearch('')
    }
  }

  const subtotal = cart.reduce((sum, l) => sum + l.quantity * l.product.sale_price, 0)
  const total = Math.max(subtotal - discount, 0)

  const confirmSale = async (method: string, cashReceived: number | null) => {
    const items = cart.map((l) => ({
      product_id: l.product.id,
      quantity: l.quantity,
      unit_price: l.product.sale_price,
    }))
    const { data: saleId, error } = await supabase.rpc('register_sale', {
      p_items: items,
      p_payment_method: method,
      p_discount: discount,
      p_cash_received: cashReceived,
    })
    if (error) {
      alert('Error al registrar la venta: ' + error.message)
      return
    }
    const [saleRes, itemsRes] = await Promise.all([
      supabase.from('sales').select('*').eq('id', saleId).single(),
      supabase.from('sale_items').select('*').eq('sale_id', saleId),
    ])
    if (saleRes.data && itemsRes.data) {
      setReceipt({ sale: saleRes.data, items: itemsRes.data, settings })
    }
    setLastSaleId(saleId)
    setCart([])
    setDiscount(0)
    setShowPayment(false)
    fetchProducts()
    searchRef.current?.focus()
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Cargando productos...</div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-140px)]">
      {/* Productos */}
      <div className="flex-1 flex flex-col min-h-0">
        <input
          ref={searchRef}
          type="text"
          placeholder="Buscar o escanear código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          autoFocus
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white mb-3"
        />
        {categories.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                !category ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-600'
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c === category ? '' : c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  category === c ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
              No hay productos activos. Agrégalos en la pestaña Catálogo.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm text-left overflow-hidden transition-all active:scale-95"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                    )}
                    {p.stock <= 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        Sin stock
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-900 line-clamp-2 min-h-8">{p.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold">{clp(p.sale_price)}</span>
                      <span className="text-[10px] text-gray-400">stock {p.stock}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="w-full lg:w-96 bg-white rounded-lg border border-gray-200 flex flex-col lg:max-h-full">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Venta actual</h2>
          {cart.length > 0 && (
            <button onClick={() => { setCart([]); setDiscount(0) }} className="text-xs text-red-500 hover:text-red-700">
              Vaciar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-32">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-10">
              {lastSaleId ? (
                <div className="space-y-3">
                  <div className="text-green-600 font-medium">✓ Venta #{lastSaleId} registrada</div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                  >
                    🖨️ Imprimir boleta
                  </button>
                </div>
              ) : (
                'Toca un producto para agregarlo'
              )}
            </div>
          ) : (
            cart.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{l.product.name}</div>
                  <div className="text-xs text-gray-500">{clp(l.product.sale_price)} c/u</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQty(l.product.id, l.quantity - 1)}
                    className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                  <button
                    onClick={() => setQty(l.product.id, l.quantity + 1)}
                    className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-semibold">{clp(l.quantity * l.product.sale_price)}</div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{clp(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Descuento</span>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
            />
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
            <span>Total</span>
            <span>{clp(total)}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-30 text-base"
          >
            Cobrar {cart.length > 0 && clp(total)}
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal total={total} onClose={() => setShowPayment(false)} onConfirm={confirmSale} />
      )}

      <Receipt data={receipt} />
    </div>
  )
}
