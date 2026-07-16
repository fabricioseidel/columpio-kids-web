'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { clp } from '@/lib/format'
import type { Sale } from '@/types/db'

type TopProduct = { name: string; units: number; revenue: number }

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
}

export default function ReportesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const since = new Date(Date.now() - days * 86400000).toISOString()
      const [salesRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*').eq('voided', false).gte('ts', since).order('ts'),
        supabase.from('sale_items').select('product_name, quantity, subtotal, sales!inner(ts, voided)')
          .eq('sales.voided', false).gte('sales.ts', since),
      ])
      setSales(salesRes.data ?? [])
      const byProduct: Record<string, TopProduct> = {}
      for (const it of itemsRes.data ?? []) {
        const key = it.product_name
        byProduct[key] ??= { name: key, units: 0, revenue: 0 }
        byProduct[key].units += Number(it.quantity)
        byProduct[key].revenue += Number(it.subtotal)
      }
      setTopProducts(Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 10))
      setLoading(false)
    }
    load()
  }, [days])

  const total = sales.reduce((s, v) => s + v.total, 0)
  const ticketPromedio = sales.length ? total / sales.length : 0

  const hoy = dayKey(new Date().toISOString())
  const ventasHoy = sales.filter((s) => dayKey(s.ts) === hoy)
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0)

  const porDia = sales.reduce<Record<string, { total: number; count: number }>>((acc, s) => {
    const k = dayKey(s.ts)
    acc[k] ??= { total: 0, count: 0 }
    acc[k].total += s.total
    acc[k].count += 1
    return acc
  }, {})
  const dias = Object.entries(porDia).reverse()
  const maxDia = Math.max(...Object.values(porDia).map((d) => d.total), 1)

  const porMetodo = sales.reduce<Record<string, number>>((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] ?? 0) + s.total
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Reportes de ventas</h2>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">Calculando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{clp(totalHoy)}</div>
              <div className="text-sm text-gray-500">Hoy ({ventasHoy.length} ventas)</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{clp(total)}</div>
              <div className="text-sm text-gray-500">Total del período</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{sales.length}</div>
              <div className="text-sm text-gray-500">Ventas ({(sales.length / days).toFixed(1)}/día)</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{clp(ticketPromedio)}</div>
              <div className="text-sm text-gray-500">Ticket promedio</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Ventas por día */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Ventas por día</h3>
              {dias.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin ventas en el período</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dias.map(([dia, d]) => (
                    <div key={dia} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-gray-500 flex-shrink-0">{dia}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                        <div className="bg-gray-900 h-full rounded-full" style={{ width: `${(d.total / maxDia) * 100}%` }} />
                      </div>
                      <span className="w-24 text-right font-medium">{clp(d.total)}</span>
                      <span className="w-14 text-right text-gray-400 text-xs">{d.count} vta</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Top productos */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Top 10 productos</h3>
                {topProducts.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {topProducts.map((p, i) => (
                        <tr key={p.name}>
                          <td className="py-1.5 text-gray-400 w-6">{i + 1}.</td>
                          <td className="py-1.5 font-medium text-gray-900">{p.name}</td>
                          <td className="py-1.5 text-right text-gray-500">{p.units} un</td>
                          <td className="py-1.5 text-right font-medium w-24">{clp(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Por método de pago */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Por método de pago</h3>
                {Object.keys(porMetodo).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(porMetodo).map(([m, v]) => (
                      <div key={m} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{m}</span>
                        <span className="font-medium">{clp(v)} <span className="text-gray-400 text-xs">({((v / total) * 100).toFixed(0)}%)</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
