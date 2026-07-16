'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { downloadUberEatsExcel } from '@/lib/uber-eats-export'

export default function ExportTab() {
  const [stats, setStats] = useState({ products: 0, valid: 0, stores: 0 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('uber_eats_products').select('id, is_valid, excluded'),
      supabase.from('uber_eats_stores').select('id').eq('is_active', true),
    ]).then(([p, s]) => {
      const active = (p.data ?? []).filter((x) => !x.excluded)
      setStats({
        products: active.length,
        valid: active.filter((x) => x.is_valid).length,
        stores: (s.data ?? []).length,
      })
      setLoading(false)
    })
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadUberEatsExcel()
    } catch (e) {
      alert('Error al exportar: ' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const canExport = stats.products > 0 && stats.stores > 0

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Exportar catálogo</h2>
      <p className="text-sm text-gray-500 mb-8">
        Genera el archivo Excel con el formato requerido por Uber Eats. Incluye las hojas
        &ldquo;Tiendas&rdquo; y &ldquo;Catálogo&rdquo; con todos los datos configurados.
      </p>

      {loading ? (
        <div className="text-gray-400 text-sm">Calculando estadísticas...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.products}</div>
              <div className="text-sm text-gray-500 mt-1">Productos en catálogo</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div
                className={`text-3xl font-bold ${stats.valid === stats.products && stats.products > 0 ? 'text-green-600' : 'text-orange-500'}`}
              >
                {stats.valid}
              </div>
              <div className="text-sm text-gray-500 mt-1">Productos válidos</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div className={`text-3xl font-bold ${stats.stores === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                {stats.stores}
              </div>
              <div className="text-sm text-gray-500 mt-1">Tiendas activas</div>
            </div>
          </div>

          {/* Warnings */}
          <div className="space-y-3 mb-8">
            {stats.products === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                No hay productos en el catálogo. Ve a la pestaña &ldquo;Catálogo&rdquo; y agrega productos primero.
              </div>
            )}
            {stats.stores === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                No hay tiendas activas. Ve a la pestaña &ldquo;Tiendas&rdquo; y agrega al menos una tienda.
              </div>
            )}
            {stats.valid < stats.products && stats.products > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
                <strong>{stats.products - stats.valid} producto(s)</strong> tienen campos obligatorios incompletos
                (categoría o imagen). Se incluirán en el archivo pero podrían ser rechazados por Uber Eats.
              </div>
            )}
            {canExport && stats.valid === stats.products && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                Todo listo para exportar. Todos los productos tienen la información completa.
              </div>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!canExport || exporting}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {exporting ? (
              <span className="text-sm">Generando archivo...</span>
            ) : (
              <span className="text-sm">Descargar catálogo Excel</span>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1.5">
            <p className="font-medium text-gray-700 text-sm">El archivo incluye:</p>
            <p>• Hoja &ldquo;Tiendas&rdquo;: nombre, UUID y horarios de cada tienda activa</p>
            <p>• Hoja &ldquo;Catálogo&rdquo;: todos los productos con categorías, precios, imágenes y descripciones</p>
            <p>
              • Una columna de stock por cada tienda activa (1 = en stock, 0 = sin stock)
            </p>
            <p className="pt-1 text-gray-400">
              Envía el archivo generado a mercados@uber.com para actualizar el catálogo.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
