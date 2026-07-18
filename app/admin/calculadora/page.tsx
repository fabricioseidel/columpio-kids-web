'use client'

import { useState, useEffect } from 'react'
import { clp } from '@/lib/format'

// Calculadora de precios para Uber Eats (portada de productos-columpio):
// precio sugerido = costo * (1 + ganancia) / (1 - comisión)

const LS_KEYS = { iva: 'ck-calc-iva', comm: 'ck-calc-comm', profit: 'ck-calc-profit' }

export default function CalculadoraPage() {
  const [iva, setIva] = useState(19)
  const [commission, setCommission] = useState(30)
  const [profit, setProfit] = useState(30)
  const [costNet, setCostNet] = useState<number | ''>('')
  const [costIva, setCostIva] = useState<number | ''>('')
  const [manualPrice, setManualPrice] = useState<number | null>(null)

  useEffect(() => {
    setIva(Number(localStorage.getItem(LS_KEYS.iva)) || 19)
    setCommission(Number(localStorage.getItem(LS_KEYS.comm)) || 30)
    setProfit(Number(localStorage.getItem(LS_KEYS.profit)) || 30)
  }, [])

  const persist = (key: string, value: number) => localStorage.setItem(key, String(value))

  const handleCostIva = (v: number | '') => {
    setCostIva(v)
    setCostNet(v === '' ? '' : Math.round(v / (1 + iva / 100)))
    setManualPrice(null)
  }
  const handleCostNet = (v: number | '') => {
    setCostNet(v)
    setCostIva(v === '' ? '' : Math.round(v * (1 + iva / 100)))
    setManualPrice(null)
  }
  const handleIva = (v: number) => {
    setIva(v)
    persist(LS_KEYS.iva, v)
    if (costNet !== '') setCostIva(Math.round(costNet * (1 + v / 100)))
  }

  const cost = costIva === '' ? 0 : costIva
  const c = Math.min(commission, 99) / 100
  const g = profit / 100
  const suggested = 1 - c > 0 ? Math.round((cost * (1 + g)) / (1 - c)) : 0
  const price = manualPrice ?? suggested
  const commissionAmt = Math.round(price * c)
  const net = price - commissionAmt
  const gain = Math.round(net - cost)
  const margin = cost > 0 ? (gain / cost) * 100 : 0

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Calculadora de precios Uber Eats</h2>
      <p className="text-sm text-gray-500 mb-6">
        Calcula a qué precio publicar un producto para que, descontada la comisión de Uber,
        te quede la ganancia que buscas.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo con IVA</label>
            <input
              type="number"
              value={costIva}
              onChange={(e) => handleCostIva(e.target.value ? Number(e.target.value) : '')}
              placeholder="Lo que pagas"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo sin IVA</label>
            <input
              type="number"
              value={costNet}
              onChange={(e) => handleCostNet(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IVA %</label>
            <input
              type="number"
              value={iva}
              onChange={(e) => handleIva(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comisión Uber %</label>
            <input
              type="number"
              value={commission}
              onChange={(e) => {
                const v = Number(e.target.value) || 0
                setCommission(v)
                persist(LS_KEYS.comm, v)
                setManualPrice(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia deseada %</label>
            <input
              type="number"
              value={profit}
              onChange={(e) => {
                const v = Number(e.target.value) || 0
                setProfit(v)
                persist(LS_KEYS.profit, v)
                setManualPrice(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-900 text-white rounded-lg p-4 text-center">
          <div className="text-xs opacity-80 uppercase tracking-wide">Precio sugerido</div>
          <div className="text-3xl font-bold font-mono">{clp(suggested)}</div>
          <div className="text-xs opacity-80 mt-1">
            Costo {clp(cost)} · comisión {commission}% · ganancia objetivo {profit}%
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio final a publicar
            {manualPrice !== null && (
              <button
                onClick={() => setManualPrice(null)}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                usar sugerido
              </button>
            )}
          </label>
          <input
            type="number"
            value={price || ''}
            onChange={(e) => setManualPrice(e.target.value ? Number(e.target.value) : 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
        </div>

        <div className="divide-y divide-gray-100 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Costo (desembolso real)</span>
            <span className="font-mono font-semibold">{clp(cost)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Comisión Uber ({commission}%)</span>
            <span className="font-mono font-semibold text-red-500">− {clp(commissionAmt)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Te deposita Uber</span>
            <span className="font-mono font-semibold">{clp(net)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Ganancia neta</span>
            <span className={`font-mono font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {clp(gain)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Margen sobre costo</span>
            <span className={`font-mono font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
