'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadProductImage } from '@/lib/images'
import { clp } from '@/lib/format'
import type { Product, Supplier } from '@/types/db'

// ─── Modal de producto (crear / editar) ──────────────────────────────────────

function ProductModal({
  product,
  suppliers,
  onClose,
  onSave,
}: {
  product: Product | null
  suppliers: Supplier[]
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    barcode: product?.barcode ?? '',
    name: product?.name ?? '',
    category: product?.category ?? '',
    purchase_price: product?.purchase_price ?? 0,
    sale_price: product?.sale_price ?? 0,
    stock: product?.stock ?? 0,
    reorder_threshold: product?.reorder_threshold ?? 5,
    supplier_id: product?.supplier_id ?? '',
    description: product?.description ?? '',
    image_url: product?.image_url ?? '',
    is_active: product?.is_active ?? true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleFile = (file: File | null) => {
    setImageFile(file)
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.barcode.trim() || !form.name.trim()) {
      return alert('Código de barras y nombre son obligatorios')
    }
    setSaving(true)
    try {
      let imageUrl = form.image_url
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile, form.barcode.trim())
      }
      const payload = {
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        category: form.category.trim() || null,
        purchase_price: form.purchase_price,
        sale_price: form.sale_price,
        reorder_threshold: form.reorder_threshold,
        supplier_id: form.supplier_id || null,
        description: form.description.trim() || null,
        image_url: imageUrl || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }
      const { error } = product
        ? await supabase.from('products').update(payload).eq('id', product.id)
        : await supabase.from('products').insert({ ...payload, stock: form.stock })
      if (error) throw new Error(error.message)
      onSave()
    } catch (e) {
      alert('Error al guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="flex gap-6 mb-4">
            <div className="flex-shrink-0">
              <label className="block w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer overflow-hidden bg-gray-50 flex items-center justify-center">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">Subir foto</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-[10px] text-gray-400 mt-1 text-center">Se comprime automáticamente</p>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de barras <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => set('barcode', e.target.value)}
                  disabled={!!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Columpios, Accesorios..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio compra</label>
              <input
                type="number"
                value={form.purchase_price}
                onChange={(e) => set('purchase_price', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio venta <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.sale_price}
                onChange={(e) => set('sale_price', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {product ? 'Stock (ver Inventario)' : 'Stock inicial'}
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => set('stock', Number(e.target.value))}
                disabled={!!product}
                title={product ? 'El stock se modifica desde Inventario para dejar registro' : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umbral reposición</label>
              <input
                type="number"
                value={form.reorder_threshold}
                onChange={(e) => set('reorder_threshold', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor preferente</label>
              <select
                value={form.supplier_id}
                onChange={(e) => set('supplier_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="rounded"
            />
            Producto activo (visible en el POS)
          </label>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Importación CSV ─────────────────────────────────────────────────────────

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []
  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (c === '"') inQ = false
        else cur += c
      } else if (c === '"') inQ = true
      else if (c === ',' || c === ';') { out.push(cur); cur = '' }
      else cur += c
    }
    out.push(cur)
    return out.map((s) => s.trim())
  }
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase())
  return lines.slice(1).map((line) => {
    const vals = parseLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => (row[h] = vals[i] ?? ''))
    return row
  })
}

// ─── Página Catálogo ─────────────────────────────────────────────────────────

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [p, s] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
    ])
    if (p.data) setProducts(p.data)
    if (s.data) setSuppliers(s.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q) ||
      (p.category ?? '').toLowerCase().includes(q)
    const matchC = !categoryFilter || p.category === categoryFilter
    return matchQ && matchC
  })

  const handleDelete = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"? Si tiene ventas asociadas, mejor desactívalo.`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return alert('No se pudo eliminar (probablemente tiene ventas). Desactívalo en su lugar.')
    fetchAll()
  }

  const handleCsv = async (file: File) => {
    setImporting(true)
    try {
      const rows = parseCsv(await file.text())
      if (rows.length === 0) throw new Error('CSV vacío o sin filas de datos')
      const required = ['barcode', 'name']
      if (!required.every((r) => r in rows[0])) {
        throw new Error('El CSV debe tener columnas: barcode, name (opcionales: category, purchase_price, sale_price, stock, reorder_threshold, description, image_url)')
      }
      const payload = rows
        .filter((r) => r.barcode && r.name)
        .map((r) => ({
          barcode: r.barcode,
          name: r.name,
          category: r.category || null,
          purchase_price: Number(r.purchase_price) || 0,
          sale_price: Number(r.sale_price) || 0,
          stock: Number(r.stock) || 0,
          reorder_threshold: Number(r.reorder_threshold) || 5,
          description: r.description || null,
          image_url: r.image_url || null,
          is_active: true,
        }))
      const { error } = await supabase.from('products').upsert(payload, { onConflict: 'barcode' })
      if (error) throw new Error(error.message)
      alert(`Importados/actualizados ${payload.length} productos`)
      fetchAll()
    } catch (e) {
      alert('Error importando: ' + (e as Error).message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const activos = products.filter((p) => p.is_active).length
  const bajoStock = products.filter((p) => p.is_active && p.stock <= (p.reorder_threshold ?? 0)).length

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-sm text-gray-500">Productos ({activos} activos)</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`text-2xl font-bold ${bajoStock > 0 ? 'text-orange-500' : 'text-green-600'}`}>{bajoStock}</div>
          <div className="text-sm text-gray-500">Bajo umbral de reposición</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
          <div className="text-sm text-gray-500">Categorías</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, código o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleCsv(e.target.files[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 bg-white disabled:opacity-50"
        >
          {importing ? 'Importando...' : 'Importar CSV'}
        </button>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          + Nuevo producto
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-14 px-3 py-3" />
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Producto</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Categoría</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-600">P. compra</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-600">P. venta</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                    {search || categoryFilter ? 'Sin resultados' : 'Aún no hay productos. Crea el primero o importa un CSV.'}
                  </td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'opacity-40' : ''}`}>
                    <td className="px-3 py-2">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.barcode}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{p.category ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{clp(p.purchase_price)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{clp(p.sale_price)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.stock <= 0 ? 'bg-red-100 text-red-600'
                        : p.stock <= (p.reorder_threshold ?? 0) ? 'bg-orange-100 text-orange-600'
                        : 'bg-green-100 text-green-700'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(p)} className="text-blue-600 hover:text-blue-800 mr-3">Editar</button>
                      <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showNew || editing) && (
        <ProductModal
          product={editing}
          suppliers={suppliers}
          onClose={() => { setShowNew(false); setEditing(null) }}
          onSave={() => { setShowNew(false); setEditing(null); fetchAll() }}
        />
      )}
    </div>
  )
}
