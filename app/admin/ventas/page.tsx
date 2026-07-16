'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { clp, fecha } from '@/lib/format'
import Receipt, { ReceiptData } from '@/components/pos/Receipt'
import type { Sale, SaleItem, StoreSettings } from '@/types/db'

const METODOS: Record<string, string> = {
  efectivo: '💵 Efectivo',
  tarjeta: '💳 Tarjeta',
  transferencia: '📱 Transferencia',
}

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [itemsBySale, setItemsBySale] = useState<Record<number, SaleItem[]>>({})
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [dateFilter, setDateFilter] = useState('')

  const fetchSales = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('sales').select('*').order('ts', { ascending: false }).limit(200)
    if (dateFilter) {
      const start = new Date(dateFilter + 'T00:00:00')
      const end = new Date(dateFilter + 'T23:59:59.999')
      query = query.gte('ts', start.toISOString()).lte('ts', end.toISOString())
    }
    const [salesRes, settingsRes] = await Promise.all([
      query,
      supabase.from('settings').select('*').single(),
    ])
    if (salesRes.data) setSales(salesRes.data)
    if (settingsRes.data) setSettings(settingsRes.data)
    setLoading(false)
  }, [dateFilter])

  useEffect(() => { fetchSales() }, [fetchSales])

  const loadItems = async (saleId: number): Promise<SaleItem[]> => {
    if (itemsBySale[saleId]) return itemsBySale[saleId]
    const { data } = await supabase.from('sale_items').select('*').eq('sale_id', saleId)
    const items = data ?? []
    setItemsBySale((prev) => ({ ...prev, [saleId]: items }))
    return items
  }

  const toggleExpand = async (saleId: number) => {
    if (expanded === saleId) return setExpanded(null)
    await loadItems(saleId)
    setExpanded(saleId)
  }

  const handleReprint = async (sale: Sale) => {
    const items = await loadItems(sale.id)
    setReceipt({ sale, items, settings })
    setTimeout(() => window.print(), 100)
  }

  const handleVoid = async (sale: Sale) => {
    if (!confirm(`¿Anular la venta #${sale.id} por ${clp(sale.total)}? Se repondrá el stock.`)) return
    const { error } = await supabase.rpc('void_sale', { p_sale_id: sale.id })
    if (error) return alert('Error: ' + error.message)
    fetchSales()
  }

  const valid = sales.filter((s) => !s.voided)
  const totalDia = valid.reduce((sum, s) => sum + s.total, 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Historial de ventas</h2>
          <p className="text-sm text-gray-500">
            {valid.length} venta(s){dateFilter ? ' en la fecha' : ' recientes'} · Total {clp(totalDia)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-sm text-blue-600 hover:text-blue-800">
              Ver todas
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">Cargando...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
          No hay ventas registradas{dateFilter && ' en esta fecha'}.
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-lg border border-gray-200 ${s.voided ? 'opacity-50' : ''}`}
            >
              <button
                onClick={() => toggleExpand(s.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-gray-400">#{String(s.id).padStart(6, '0')}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{fecha(s.ts)}</div>
                    <div className="text-xs text-gray-500">{METODOS[s.payment_method] ?? s.payment_method}</div>
                  </div>
                  {s.voided && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Anulada</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-900">{clp(s.total)}</span>
                  <span className="text-gray-400 text-xs">{expanded === s.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === s.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <table className="w-full text-sm mb-3">
                    <tbody className="divide-y divide-gray-50">
                      {(itemsBySale[s.id] ?? []).map((it) => (
                        <tr key={it.id}>
                          <td className="py-1.5 text-gray-900">{it.product_name}</td>
                          <td className="py-1.5 text-right text-gray-500">{it.quantity} × {clp(it.unit_price)}</td>
                          <td className="py-1.5 text-right font-medium w-24">{clp(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {s.discount > 0 && (
                    <div className="text-sm text-gray-500 text-right mb-2">Descuento: -{clp(s.discount)}</div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleReprint(s)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      🖨️ Reimprimir
                    </button>
                    {!s.voided && (
                      <button
                        onClick={() => handleVoid(s)}
                        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        Anular venta
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Receipt data={receipt} />
    </div>
  )
}
