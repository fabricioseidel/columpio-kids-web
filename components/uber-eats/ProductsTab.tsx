'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UberEatsProduct, CatalogProduct } from '@/types/uber-eats'

function validate(p: Partial<UberEatsProduct>): string[] {
  const errs: string[] = []
  if (!p.uber_category) errs.push('Categoría requerida')
  if (!p.name) errs.push('Nombre requerido')
  if (!p.price_with_vat) errs.push('Precio requerido')
  if (!p.image_url) errs.push('URL de imagen requerida')
  return errs
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditProductModal({
  product,
  onClose,
  onSave,
}: {
  product: UberEatsProduct
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState<{
    name: string
    uber_category: string
    uber_sub_category: string
    price_with_vat: number
    vat_percentage: number
    description: string
    image_url: string
    product_type: string
    hfss_item: string
    alcohol_units: number | null
    quantity_restriction: number | null
    in_stock: boolean
    excluded: boolean
  }>({
    name: product.name ?? '',
    uber_category: product.uber_category ?? '',
    uber_sub_category: product.uber_sub_category ?? '',
    price_with_vat: product.price_with_vat ?? product.price ?? 0,
    vat_percentage: product.vat_percentage ?? 19,
    description: product.description ?? '',
    image_url: product.image_url ?? '',
    product_type: product.product_type ?? '',
    hfss_item: product.hfss_item ?? '',
    alcohol_units: product.alcohol_units ?? null,
    quantity_restriction: product.quantity_restriction ?? null,
    in_stock: product.in_stock ?? true,
    excluded: product.excluded ?? false,
  })
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const errors = validate(form)
    const { error } = await supabase
      .from('uber_eats_products')
      .update({
        name: form.name,
        uber_category: form.uber_category || null,
        uber_sub_category: form.uber_sub_category || null,
        price_with_vat: form.price_with_vat,
        vat_percentage: form.vat_percentage,
        description: form.description || null,
        image_url: form.image_url || null,
        product_type: form.product_type || null,
        hfss_item: form.hfss_item || null,
        alcohol_units: form.alcohol_units,
        quantity_restriction: form.quantity_restriction,
        in_stock: form.in_stock,
        excluded: form.excluded,
        is_valid: errors.length === 0,
        validation_errors: errors.length > 0 ? errors : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)
    setSaving(false)
    if (error) return alert('Error al guardar: ' + error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">Editar producto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 font-mono">
            {product.barcode}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría Uber Eats <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.uber_category}
                onChange={(e) => set('uber_category', e.target.value)}
                placeholder="Ej: Juguetes y juegos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-categoría</label>
              <input
                type="text"
                value={form.uber_sub_category}
                onChange={(e) => set('uber_sub_category', e.target.value)}
                placeholder="Ej: Columpios"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio con IVA <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.price_with_vat}
                onChange={(e) => set('price_with_vat', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IVA (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.vat_percentage}
                onChange={(e) => set('vat_percentage', Number(e.target.value))}
                placeholder="19"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de imagen <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de producto</label>
              <select
                value={form.product_type}
                onChange={(e) => set('product_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Sin tipo especial</option>
                <option value="Alcohol">Alcohol</option>
                <option value="Tobacco">Tabaco</option>
                <option value="Vapes">Vapes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HFSS Item</label>
              <select
                value={form.hfss_item}
                onChange={(e) => set('hfss_item', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">No aplica</option>
                <option value="HFSS Food">HFSS Food</option>
                <option value="HFSS Drink">HFSS Drink</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidades de alcohol
              </label>
              <input
                type="number"
                value={form.alcohol_units ?? ''}
                onChange={(e) =>
                  set('alcohol_units', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Solo si aplica"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restricción de cantidad
              </label>
              <input
                type="number"
                value={form.quantity_restriction ?? ''}
                onChange={(e) =>
                  set('quantity_restriction', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Sin límite"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => set('in_stock', e.target.checked)}
                className="rounded"
              />
              En stock
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.excluded}
                onChange={(e) => set('excluded', e.target.checked)}
                className="rounded"
              />
              Excluir del catálogo
            </label>
          </div>
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
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Products Modal ───────────────────────────────────────────────────────

function AddProductsModal({
  existingBarcodes,
  onClose,
  onSave,
}: {
  existingBarcodes: string[]
  onClose: () => void
  onSave: () => void
}) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, barcode, name, category, sale_price, image_url, description, is_active')
      .order('name')
      .then(({ data }) => {
        if (data) setCatalog(data.filter((p) => !existingBarcodes.includes(p.barcode)))
        setLoading(false)
      })
  }, [existingBarcodes])

  const filtered = catalog.filter(
    (p) =>
      !search ||
      (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (barcode: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(barcode) ? next.delete(barcode) : next.add(barcode)
      return next
    })

  const handleAdd = async () => {
    if (selected.size === 0) return
    setSaving(true)
    const inserts = catalog
      .filter((p) => selected.has(p.barcode))
      .map((p) => ({
        barcode: p.barcode,
        name: p.name ?? '',
        original_category: p.category,
        uber_category: null,
        uber_sub_category: null,
        price: p.sale_price ?? 0,
        price_with_vat: p.sale_price ?? 0,
        vat_percentage: 19,
        description: p.description ?? null,
        image_url: p.image_url ?? null,
        in_stock: true,
        is_valid: false,
        validation_errors: ['Categoría requerida'],
        excluded: false,
      }))
    const { error } = await supabase.from('uber_eats_products').insert(inserts)
    setSaving(false)
    if (error) return alert('Error: ' + error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">Agregar productos del catálogo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => setSelected(new Set(filtered.map((p) => p.barcode)))}
              className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
            >
              Seleccionar todos
            </button>
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-blue-600 mt-2">{selected.size} seleccionado(s)</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {search ? 'Sin resultados para esta búsqueda' : 'Todos los productos ya están en el catálogo'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr
                    key={p.barcode}
                    onClick={() => toggle(p.barcode)}
                    className={`cursor-pointer hover:bg-gray-50 ${selected.has(p.barcode) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(p.barcode)}
                        onChange={() => toggle(p.barcode)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.category ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {p.sale_price != null ? `$${p.sale_price.toLocaleString('es-CL')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || saving}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Agregando...' : `Agregar ${selected.size > 0 ? selected.size : ''} producto${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

export default function ProductsTab() {
  const [products, setProducts] = useState<UberEatsProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<UberEatsProduct | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('uber_eats_products').select('*').order('name')
    if (data) setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.uber_category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.uber_sub_category ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto del catálogo de Uber Eats?')) return
    await supabase.from('uber_eats_products').delete().eq('id', id)
    fetchProducts()
  }

  const active = products.filter((p) => !p.excluded)
  const total = active.length
  const valid = active.filter((p) => p.is_valid).length
  const outOfStock = active.filter((p) => !p.in_stock).length

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-500 mt-0.5">Productos activos</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`text-2xl font-bold ${valid === total && total > 0 ? 'text-green-600' : 'text-orange-500'}`}>
            {valid}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">Válidos para exportar</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`text-2xl font-bold ${outOfStock > 0 ? 'text-red-500' : 'text-gray-900'}`}>
            {outOfStock}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">Sin stock</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 whitespace-nowrap"
        >
          + Agregar productos
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
          Cargando productos...
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría UE</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sub-categoría</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Precio c/IVA</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">IVA</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      {search
                        ? 'No hay resultados para esta búsqueda'
                        : 'No hay productos. Haz clic en "+ Agregar productos"'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 transition-colors ${p.excluded ? 'opacity-40' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.uber_category ?? (
                          <span className="text-red-400 text-xs">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.uber_sub_category ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {p.price_with_vat != null
                          ? `$${p.price_with_vat.toLocaleString('es-CL')}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {p.vat_percentage != null ? `${p.vat_percentage}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.in_stock
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {p.in_stock ? 'En stock' : 'Sin stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.is_valid ? (
                          <span className="text-green-500 text-base" title="Válido">✓</span>
                        ) : (
                          <span
                            className="text-red-400 text-base"
                            title={(p.validation_errors ?? []).join(', ')}
                          >
                            ✗
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={() => {
            setEditingProduct(null)
            fetchProducts()
          }}
        />
      )}

      {showAddModal && (
        <AddProductsModal
          existingBarcodes={products.map((p) => p.barcode)}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false)
            fetchProducts()
          }}
        />
      )}
    </div>
  )
}
