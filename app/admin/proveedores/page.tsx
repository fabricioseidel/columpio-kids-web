'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { clp, fecha, fechaCorta } from '@/lib/format'
import type { Product, Supplier, SupplierOrder, SupplierOrderItem } from '@/types/db'

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  enviada: { label: 'Enviada', cls: 'bg-blue-100 text-blue-700' },
  recibida: { label: 'Recibida', cls: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-gray-100 text-gray-500' },
}

// ─── Modal de proveedor ──────────────────────────────────────────────────────

function SupplierModal({
  supplier,
  onClose,
  onSave,
}: {
  supplier: Supplier | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contact_name: supplier?.contact_name ?? '',
    phone: supplier?.phone ?? '',
    whatsapp: supplier?.whatsapp ?? '',
    email: supplier?.email ?? '',
    lead_time_days: supplier?.lead_time_days ?? 3,
    dispatch_days: supplier?.dispatch_days ?? '',
    min_order_amount: supplier?.min_order_amount ?? ('' as number | ''),
    notes: supplier?.notes ?? '',
    is_active: supplier?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return alert('El nombre es obligatorio')
    setSaving(true)
    const payload = {
      ...form,
      name: form.name.trim(),
      min_order_amount: form.min_order_amount === '' ? null : form.min_order_amount,
    }
    const { error } = supplier
      ? await supabase.from('suppliers').update(payload).eq('id', supplier.id)
      : await supabase.from('suppliers').insert(payload)
    setSaving(false)
    if (error) return alert('Error: ' + error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold mb-4">{supplier ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            <input type="text" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
            <input type="text" value={form.whatsapp || form.phone}
              onChange={(e) => { set('whatsapp', e.target.value); set('phone', e.target.value) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de entrega (días)</label>
            <input type="number" min={0} value={form.lead_time_days}
              onChange={(e) => set('lead_time_days', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días de despacho</label>
            <input type="text" value={form.dispatch_days} onChange={(e) => set('dispatch_days', e.target.value)}
              placeholder="Lun, Mié, Vie" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo ($)</label>
            <input type="number" value={form.min_order_amount}
              onChange={(e) => set('min_order_amount', e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mb-5">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded" />
          Proveedor activo
        </label>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de nueva orden de compra ──────────────────────────────────────────

function OrderModal({
  suppliers,
  products,
  onClose,
  onSave,
}: {
  suppliers: Supplier[]
  products: Product[]
  onClose: () => void
  onSave: () => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [lines, setLines] = useState<{ product: Product; quantity: number; unit_cost: number }[]>([])
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const supplier = suppliers.find((s) => s.id === supplierId)
  const expectedDate = supplier
    ? new Date(Date.now() + (supplier.lead_time_days ?? 3) * 86400000).toISOString().split('T')[0]
    : null

  // Al elegir proveedor, precargar sus productos bajo umbral
  const selectSupplier = (id: string) => {
    setSupplierId(id)
    const low = products.filter(
      (p) => p.supplier_id === id && p.is_active && p.stock <= (p.reorder_threshold ?? 0),
    )
    setLines(low.map((p) => ({
      product: p,
      quantity: Math.max((p.reorder_threshold ?? 5) * 2 - p.stock, 1),
      unit_cost: p.purchase_price ?? 0,
    })))
  }

  const addProduct = (p: Product) => {
    if (lines.some((l) => l.product.id === p.id)) return
    setLines((prev) => [...prev, { product: p, quantity: 1, unit_cost: p.purchase_price ?? 0 }])
    setSearch('')
  }

  const candidates = search
    ? products.filter(
        (p) => p.is_active && !lines.some((l) => l.product.id === p.id) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)),
      ).slice(0, 6)
    : []

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unit_cost, 0)

  const handleSave = async () => {
    if (!supplierId) return alert('Selecciona un proveedor')
    if (lines.length === 0) return alert('Agrega al menos un producto')
    setSaving(true)
    try {
      const { data: order, error } = await supabase
        .from('supplier_orders')
        .insert({ supplier_id: supplierId, expected_date: expectedDate, total, notes: notes.trim() || null })
        .select()
        .single()
      if (error) throw new Error(error.message)
      const { error: e2 } = await supabase.from('supplier_order_items').insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product.id,
          product_name: l.product.name,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
          subtotal: l.quantity * l.unit_cost,
        })),
      )
      if (e2) throw new Error(e2.message)
      onSave()
    } catch (e) {
      alert('Error: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">Nueva orden de compra</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor <span className="text-red-500">*</span></label>
              <select value={supplierId} onChange={(e) => selectSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccionar...</option>
                {suppliers.filter((s) => s.is_active).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {supplier && (
                <p className="text-xs text-gray-400 mt-1">
                  Entrega estimada: {expectedDate} ({supplier.lead_time_days} días)
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          {supplierId && (
            <>
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Agregar producto por nombre o código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {candidates.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                    {candidates.map((p) => (
                      <button key={p.id} onClick={() => addProduct(p)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between">
                        <span>{p.name}</span>
                        <span className="text-gray-400">stock {p.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {lines.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8 border border-dashed border-gray-200 rounded-lg">
                  Sin productos. Busca arriba para agregar.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="text-left py-2 font-medium">Producto</th>
                      <th className="text-center py-2 font-medium w-24">Cantidad</th>
                      <th className="text-center py-2 font-medium w-28">Costo unit.</th>
                      <th className="text-right py-2 font-medium w-24">Subtotal</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((l, i) => (
                      <tr key={l.product.id}>
                        <td className="py-2">
                          {l.product.name}
                          <div className="text-xs text-gray-400">stock actual: {l.product.stock}</div>
                        </td>
                        <td className="py-2 text-center">
                          <input type="number" min={1} value={l.quantity}
                            onChange={(e) => setLines((prev) => prev.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) || 1 } : x))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm" />
                        </td>
                        <td className="py-2 text-center">
                          <input type="number" min={0} value={l.unit_cost}
                            onChange={(e) => setLines((prev) => prev.map((x, j) => j === i ? { ...x, unit_cost: Number(e.target.value) || 0 } : x))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm" />
                        </td>
                        <td className="py-2 text-right font-medium">{clp(l.quantity * l.unit_cost)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-600">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {supplier?.min_order_amount != null && total < supplier.min_order_amount && lines.length > 0 && (
                <p className="text-xs text-orange-500 mt-2">
                  ⚠️ El total {clp(total)} no alcanza el pedido mínimo de {clp(supplier.min_order_amount)}
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="text-lg font-bold">Total: {clp(total)}</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !supplierId || lines.length === 0}
              className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-40">
              {saving ? 'Creando...' : 'Crear orden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página Proveedores ──────────────────────────────────────────────────────

export default function ProveedoresPage() {
  const [tab, setTab] = useState<'proveedores' | 'ordenes'>('proveedores')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [orderItems, setOrderItems] = useState<Record<number, SupplierOrderItem[]>>({})
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [s, p, o] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
      supabase.from('supplier_orders').select('*').order('order_date', { ascending: false }).limit(100),
    ])
    if (s.data) setSuppliers(s.data)
    if (p.data) setProducts(p.data)
    if (o.data) setOrders(o.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const supplierName = (id: string | null) => suppliers.find((s) => s.id === id)?.name ?? '—'

  const toggleOrder = async (orderId: number) => {
    if (expandedOrder === orderId) return setExpandedOrder(null)
    if (!orderItems[orderId]) {
      const { data } = await supabase.from('supplier_order_items').select('*').eq('order_id', orderId)
      setOrderItems((prev) => ({ ...prev, [orderId]: data ?? [] }))
    }
    setExpandedOrder(orderId)
  }

  const updateOrderStatus = async (order: SupplierOrder, status: string) => {
    if (status === 'recibida') {
      if (!confirm(`¿Marcar la orden #${order.id} como recibida? Se sumará el stock de todos los ítems.`)) return
      const { error } = await supabase.rpc('receive_supplier_order', { p_order_id: order.id })
      if (error) return alert('Error: ' + error.message)
    } else {
      const { error } = await supabase.from('supplier_orders').update({ status }).eq('id', order.id)
      if (error) return alert('Error: ' + error.message)
    }
    fetchAll()
  }

  const pendientes = orders.filter((o) => o.status === 'pendiente' || o.status === 'enviada')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'proveedores', label: `Proveedores (${suppliers.length})` },
            { id: 'ordenes', label: `Órdenes de compra${pendientes.length ? ` (${pendientes.length} abiertas)` : ''}` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => (tab === 'proveedores' ? setShowNewSupplier(true) : setShowNewOrder(true))}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          {tab === 'proveedores' ? '+ Nuevo proveedor' : '+ Nueva orden'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">Cargando...</div>
      ) : tab === 'proveedores' ? (
        suppliers.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
            Sin proveedores. Crea el primero para gestionar reabastecimiento.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {suppliers.map((s) => (
              <div key={s.id} className={`bg-white rounded-lg border border-gray-200 p-4 ${!s.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.contact_name && <p className="text-sm text-gray-500">{s.contact_name}</p>}
                  </div>
                  <button onClick={() => setEditingSupplier(s)} className="text-blue-600 hover:text-blue-800 text-sm">
                    Editar
                  </button>
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">
                  {(s.whatsapp || s.phone) && <div>📞 {s.whatsapp || s.phone}</div>}
                  {s.email && <div>✉️ {s.email}</div>}
                  <div>🚚 Entrega en {s.lead_time_days ?? '—'} días{s.dispatch_days ? ` · despacho: ${s.dispatch_days}` : ''}</div>
                  {s.min_order_amount != null && <div>💰 Pedido mínimo: {clp(s.min_order_amount)}</div>}
                  <div className="text-xs text-gray-400 pt-1">
                    {products.filter((p) => p.supplier_id === s.id).length} producto(s) asociado(s)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
          Sin órdenes de compra. Crea una para reabastecer stock.
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-lg border border-gray-200">
              <button onClick={() => toggleOrder(o.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-400">#{o.id}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{supplierName(o.supplier_id)}</div>
                    <div className="text-xs text-gray-500">
                      Pedida {fecha(o.order_date, { timeStyle: undefined })}
                      {o.expected_date && ` · llega ${fechaCorta(o.expected_date)}`}
                      {o.delivered_date && ` · recibida ${fechaCorta(o.delivered_date)}`}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADOS[o.status].cls}`}>
                    {ESTADOS[o.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{clp(o.total)}</span>
                  <span className="text-gray-400 text-xs">{expandedOrder === o.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedOrder === o.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <table className="w-full text-sm mb-3">
                    <tbody className="divide-y divide-gray-50">
                      {(orderItems[o.id] ?? []).map((it) => (
                        <tr key={it.id}>
                          <td className="py-1.5">{it.product_name}</td>
                          <td className="py-1.5 text-right text-gray-500">{it.quantity} × {clp(it.unit_cost)}</td>
                          <td className="py-1.5 text-right font-medium w-24">{clp(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {o.notes && <p className="text-sm text-gray-500 mb-3">📝 {o.notes}</p>}
                  {(o.status === 'pendiente' || o.status === 'enviada') && (
                    <div className="flex justify-end gap-2">
                      {o.status === 'pendiente' && (
                        <button onClick={() => updateOrderStatus(o, 'enviada')}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          Marcar enviada
                        </button>
                      )}
                      <button onClick={() => updateOrderStatus(o, 'recibida')}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                        ✓ Recibir (suma stock)
                      </button>
                      <button onClick={() => updateOrderStatus(o, 'cancelada')}
                        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showNewSupplier || editingSupplier) && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setShowNewSupplier(false); setEditingSupplier(null) }}
          onSave={() => { setShowNewSupplier(false); setEditingSupplier(null); fetchAll() }}
        />
      )}

      {showNewOrder && (
        <OrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowNewOrder(false)}
          onSave={() => { setShowNewOrder(false); setTab('ordenes'); fetchAll() }}
        />
      )}
    </div>
  )
}
