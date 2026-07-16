'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { clp, fecha } from '@/lib/format'
import type { Product, InventoryMovement, Supplier } from '@/types/db'

// ─── Modal de ajuste de stock ────────────────────────────────────────────────

function AdjustModal({
  product,
  onClose,
  onSave,
}: {
  product: Product
  onClose: () => void
  onSave: () => void
}) {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add')
  const [amount, setAmount] = useState<number | ''>('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (amount === '' || amount < 0) return alert('Ingresa una cantidad válida')
    let change = 0
    if (mode === 'add') change = amount
    else if (mode === 'remove') change = -amount
    else change = amount - product.stock
    if (change === 0) return onClose()
    setSaving(true)
    const { error } = await supabase.rpc('adjust_stock', {
      p_product_id: product.id,
      p_change: change,
      p_reason: reason.trim() || (mode === 'set' ? 'conteo físico' : mode === 'add' ? 'ingreso manual' : 'merma/salida manual'),
    })
    setSaving(false)
    if (error) return alert('Error: ' + error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Ajustar stock</h2>
        <p className="text-sm text-gray-500 mb-4">{product.name} — stock actual: <strong>{product.stock}</strong></p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'add', label: '+ Ingreso' },
            { id: 'remove', label: '− Salida' },
            { id: 'set', label: '= Conteo' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as typeof mode)}
              className={`py-2 rounded-lg border-2 text-sm font-medium ${
                mode === m.id ? 'border-black bg-gray-50' : 'border-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {mode === 'set' ? 'Stock real contado' : 'Cantidad'}
        </label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={mode === 'remove' ? 'merma, rotura, vencido...' : 'opcional'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página Inventario ───────────────────────────────────────────────────────

export default function InventarioPage() {
  const [tab, setTab] = useState<'stock' | 'movimientos' | 'reposicion'>('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [movements, setMovements] = useState<(InventoryMovement & { products: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<Product | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [p, s, m] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('inventory_movements').select('*, products(name)').order('created_at', { ascending: false }).limit(150),
    ])
    if (p.data) setProducts(p.data)
    if (s.data) setSuppliers(s.data)
    if (m.data) setMovements(m.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const active = products.filter((p) => p.is_active)
  const lowStock = active.filter((p) => p.stock <= (p.reorder_threshold ?? 0))
  const negative = active.filter((p) => p.stock < 0)
  const valorInventario = active.reduce((sum, p) => sum + p.stock * (p.purchase_price ?? 0), 0)

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search),
  )

  const supplierName = (id: string | null) => suppliers.find((s) => s.id === id)?.name ?? 'Sin proveedor'

  const reposicionPorProveedor = lowStock.reduce<Record<string, Product[]>>((acc, p) => {
    const key = supplierName(p.supplier_id)
    ;(acc[key] ??= []).push(p)
    return acc
  }, {})

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{active.length}</div>
          <div className="text-sm text-gray-500">Productos activos</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-orange-500' : 'text-green-600'}`}>
            {lowStock.length}
          </div>
          <div className="text-sm text-gray-500">Por reponer</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`text-2xl font-bold ${negative.length > 0 ? 'text-red-500' : 'text-gray-900'}`}>
            {negative.length}
          </div>
          <div className="text-sm text-gray-500">Stock negativo (descuadre)</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{clp(valorInventario)}</div>
          <div className="text-sm text-gray-500">Valor inventario (costo)</div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: 'stock', label: 'Stock' },
          { id: 'reposicion', label: `Reposición${lowStock.length ? ` (${lowStock.length})` : ''}` },
          { id: 'movimientos', label: 'Movimientos' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">Cargando...</div>
      ) : tab === 'stock' ? (
        <>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white mb-3"
          />
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Umbral</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.barcode}</div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.stock < 0 ? 'bg-red-100 text-red-600'
                        : p.stock <= (p.reorder_threshold ?? 0) ? 'bg-orange-100 text-orange-600'
                        : 'bg-green-100 text-green-700'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{p.reorder_threshold ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{supplierName(p.supplier_id)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setAdjusting(p)} className="text-blue-600 hover:text-blue-800">
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === 'reposicion' ? (
        lowStock.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center text-green-700">
            ✓ Ningún producto bajo su umbral de reposición
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Sugerencia de compra agrupada por proveedor. Crea la orden desde la pestaña Proveedores.
            </p>
            {Object.entries(reposicionPorProveedor).map(([supplier, prods]) => (
              <div key={supplier} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
                  🚚 {supplier}
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {prods.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.stock < 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            stock {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-500">umbral {p.reorder_threshold}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">
                          sugerido: {Math.max((p.reorder_threshold ?? 5) * 2 - p.stock, 1)} un
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Cantidad</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock final</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin movimientos aún</td></tr>
              ) : movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fecha(m.created_at)}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{m.products?.name ?? '(eliminado)'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {m.type === 'IN' ? '+ Entrada' : '− Salida'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{m.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{m.stock_after ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {m.reason}{m.reference ? ` · ${m.reference}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjusting && (
        <AdjustModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSave={() => { setAdjusting(null); fetchAll() }}
        />
      )}
    </div>
  )
}
