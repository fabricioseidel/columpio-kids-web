'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UberEatsStore } from '@/types/uber-eats'

const DEFAULT_HOURS = '10:00 - 20:30'

const DAYS: { key: keyof UberEatsStore; label: string; short: string }[] = [
  { key: 'hours_monday', label: 'Lunes', short: 'Lun' },
  { key: 'hours_tuesday', label: 'Martes', short: 'Mar' },
  { key: 'hours_wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'hours_thursday', label: 'Jueves', short: 'Jue' },
  { key: 'hours_friday', label: 'Viernes', short: 'Vie' },
  { key: 'hours_saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'hours_sunday', label: 'Domingo', short: 'Dom' },
]

// ─── Store Modal ──────────────────────────────────────────────────────────────

function StoreModal({
  store,
  onClose,
  onSave,
}: {
  store: UberEatsStore | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    name: store?.name ?? '',
    uuid_code: store?.uuid_code ?? '',
    hours_monday: store?.hours_monday ?? DEFAULT_HOURS,
    hours_tuesday: store?.hours_tuesday ?? DEFAULT_HOURS,
    hours_wednesday: store?.hours_wednesday ?? DEFAULT_HOURS,
    hours_thursday: store?.hours_thursday ?? DEFAULT_HOURS,
    hours_friday: store?.hours_friday ?? DEFAULT_HOURS,
    hours_saturday: store?.hours_saturday ?? DEFAULT_HOURS,
    hours_sunday: store?.hours_sunday ?? DEFAULT_HOURS,
    is_active: store?.is_active ?? true,
  })
  const [sameForAll, setSameForAll] = useState(false)
  const [saving, setSaving] = useState(false)

  const setHours = (key: string, value: string) => {
    if (sameForAll) {
      setForm((f) => ({
        ...f,
        hours_monday: value,
        hours_tuesday: value,
        hours_wednesday: value,
        hours_thursday: value,
        hours_friday: value,
        hours_saturday: value,
        hours_sunday: value,
      }))
    } else {
      setForm((f) => ({ ...f, [key]: value }))
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) return alert('El nombre de la tienda es obligatorio')
    setSaving(true)
    const payload = { ...form, name: form.name.trim(), uuid_code: form.uuid_code.trim() || null }
    const { error } = store
      ? await supabase.from('uber_eats_stores').update(payload).eq('id', store.id)
      : await supabase.from('uber_eats_stores').insert(payload)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">{store ? 'Editar tienda' : 'Nueva tienda'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de tienda <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Mi tienda - Providencia"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Tal como aparecerá en la app de Uber Eats</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UUID de Uber Eats</label>
              <input
                type="text"
                value={form.uuid_code}
                onChange={(e) => setForm((f) => ({ ...f, uuid_code: e.target.value }))}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Horarios de atención</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={sameForAll}
                  onChange={(e) => setSameForAll(e.target.checked)}
                  className="rounded"
                />
                Mismo horario todos los días
              </label>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <div key={day.key}>
                  <div className="text-xs text-gray-500 font-medium text-center mb-1">{day.short}</div>
                  <input
                    type="text"
                    value={form[day.key as keyof typeof form] as string}
                    onChange={(e) => setHours(day.key, e.target.value)}
                    className="w-full px-1.5 py-1.5 border border-gray-300 rounded text-xs text-center"
                    placeholder="Cerrado"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Formato: 10:00 - 20:30</p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded"
            />
            Tienda activa (se incluirá en la exportación)
          </label>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : store ? 'Guardar cambios' : 'Crear tienda'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stores Tab ───────────────────────────────────────────────────────────────

export default function StoresTab() {
  const [stores, setStores] = useState<UberEatsStore[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStore, setEditingStore] = useState<UberEatsStore | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const fetchStores = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('uber_eats_stores').select('*').order('name')
    if (data) setStores(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tienda? Esta acción no se puede deshacer.')) return
    await supabase.from('uber_eats_stores').delete().eq('id', id)
    fetchStores()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tiendas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Cada tienda activa genera una columna de stock en el Excel exportado
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          + Nueva tienda
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
          Cargando tiendas...
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 font-medium">No hay tiendas configuradas</p>
          <p className="text-gray-400 text-sm mt-1">
            Agrega al menos una tienda para poder exportar el catálogo
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            + Agregar primera tienda
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`bg-white rounded-lg border border-gray-200 p-5 ${!store.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{store.name}</h3>
                    {!store.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {store.uuid_code ? (
                      store.uuid_code
                    ) : (
                      <span className="text-yellow-500 font-sans">Sin UUID configurado</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingStore(store)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <div key={day.key} className="text-center">
                    <div className="text-xs text-gray-400 font-medium mb-1">{day.short}</div>
                    <div className="bg-gray-50 rounded px-1 py-1.5 text-xs text-gray-700 leading-tight">
                      {(store[day.key as keyof UberEatsStore] as string) || DEFAULT_HOURS}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showNewForm || editingStore) && (
        <StoreModal
          store={editingStore}
          onClose={() => {
            setShowNewForm(false)
            setEditingStore(null)
          }}
          onSave={() => {
            setShowNewForm(false)
            setEditingStore(null)
            fetchStores()
          }}
        />
      )}
    </div>
  )
}
