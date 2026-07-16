'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AjustesPage() {
  const [form, setForm] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    receipt_footer: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) {
        setForm({
          store_name: data.store_name ?? '',
          store_address: data.store_address ?? '',
          store_phone: data.store_phone ?? '',
          receipt_footer: data.receipt_footer ?? '',
        })
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('settings')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', true)
    setSaving(false)
    if (error) return alert('Error: ' + error.message)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando...</div>

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Ajustes de la tienda</h2>
      <p className="text-sm text-gray-500 mb-6">Estos datos aparecen en la boleta impresa.</p>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda</label>
          <input type="text" value={form.store_name}
            onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input type="text" value={form.store_address}
            onChange={(e) => setForm((f) => ({ ...f, store_address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input type="text" value={form.store_phone}
            onChange={(e) => setForm((f) => ({ ...f, store_phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje al pie de la boleta</label>
          <input type="text" value={form.receipt_footer}
            onChange={(e) => setForm((f) => ({ ...f, receipt_footer: e.target.value }))}
            placeholder="¡Gracias por su compra!"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {saved && <span className="text-sm text-green-600">✓ Guardado</span>}
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700 text-sm">Recordatorios</p>
        <p>• La boleta impresa es un documento interno; no reemplaza la boleta electrónica del SII.</p>
        <p>• Para cambiar tu contraseña usa la opción de recuperación en el login o el dashboard de Supabase.</p>
      </div>
    </div>
  )
}
