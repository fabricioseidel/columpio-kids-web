import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import type { ProductFeatures } from '@/types/db'

const HOURS_DEFAULT = '10:00 - 20:30'

type UberRow = (string | number)[]

/**
 * Construye las filas del catálogo expandiendo variantes: si un producto del
 * catálogo general tiene features.tipos (variantes con nombre/imagen propias),
 * genera una fila por variante — External ID `barcode-N`, nombre compuesto e
 * imagen de la variante — igual que el gestor original de productos-columpio.
 */
async function buildCatalogRows(): Promise<{ row1: UberRow; row2: UberRow; rows: UberRow[]; stores: { name: string }[] } | null> {
  const [productsRes, storesRes, catalogRes] = await Promise.all([
    supabase.from('uber_eats_products').select('*').eq('excluded', false)
      .order('uber_category', { nullsFirst: false }),
    supabase.from('uber_eats_stores').select('*').eq('is_active', true).order('name'),
    supabase.from('products').select('barcode, features, gallery'),
  ])
  if (productsRes.error) throw new Error(productsRes.error.message)
  if (storesRes.error) throw new Error(storesRes.error.message)

  const products = productsRes.data ?? []
  const stores = storesRes.data ?? []
  const featuresByBarcode = new Map<string, ProductFeatures | null>(
    (catalogRes.data ?? []).map((p) => [p.barcode, p.features]),
  )

  const row1: UberRow = [
    'Optional', 'Optional', 'Mandatory', 'Mandatory', 'Mandatory', 'Optional', 'Optional',
    'Optional', 'Mandatory', 'Mandatory', 'Optional', 'Mandatory', 'Optional', 'Optional',
    'PRODUCT IN STOCK (1) / OUT OF STOCK (0)',
    ...stores.slice(1).map(() => ''),
  ]
  const row2: UberRow = [
    'UPC/EAN', 'External ID', 'Category', 'Sub-Category',
    'Product Name (+ brand + size / weight)', 'Product Type', 'Total Alcohol Units',
    'HFSS Item', 'Price (incl VAT)\nStandard', 'IVA', 'Description', 'Item Image URL',
    'Quantity Restriction', 'External Data',
    ...stores.map((s) => s.name),
  ]

  const buildRow = (p: (typeof products)[number], externalId: string, name: string, image: string): UberRow => [
    p.barcode ?? '', externalId,
    p.uber_category ?? '',
    p.uber_sub_category ?? featuresByBarcode.get(p.barcode)?.subcategoria ?? '',
    name,
    p.product_type ?? '', p.alcohol_units ?? '', p.hfss_item ?? '',
    p.price_with_vat ?? p.price ?? 0, (p.vat_percentage ?? 19) / 100,
    p.description ?? '', image, p.quantity_restriction ?? '', '',
    ...stores.map(() => (p.in_stock ? 1 : 0)),
  ]

  const rows: UberRow[] = []
  for (const p of products) {
    const tipos = featuresByBarcode.get(p.barcode)?.tipos ?? []
    const usable = tipos.filter((t) => t.imagen || p.image_url)
    if (usable.length > 0) {
      usable.forEach((t, i) => {
        const image = t.imagen || p.image_url || ''
        const name = t.nombre ? `${p.name} ${t.nombre}` : `${p.name} (tipo ${i + 1})`
        rows.push(buildRow(p, `${p.barcode}-${i + 1}`, name, image))
      })
    } else {
      rows.push(buildRow(p, '', p.name ?? '', p.image_url ?? ''))
    }
  }

  return { row1, row2, rows, stores }
}

/** Genera y descarga el Excel del catálogo Uber Eats (client-side, sesión autenticada). */
export async function downloadUberEatsExcel(): Promise<void> {
  const storesRes = await supabase.from('uber_eats_stores').select('*').eq('is_active', true).order('name')
  if (storesRes.error) throw new Error(storesRes.error.message)
  const stores = storesRes.data ?? []

  const wb = XLSX.utils.book_new()

  // ── Hoja Tiendas ──
  const tiendasData = [
    ['DATOS TIENDA', '', 'HORARIO TIENDA', '', '', '', '', '', ''],
    ['Nombre de Tienda (Así aparecerá en app)', 'UUID', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'],
    ...stores.map((s) => [
      s.name, s.uuid_code ?? '',
      s.hours_monday ?? HOURS_DEFAULT, s.hours_tuesday ?? HOURS_DEFAULT,
      s.hours_wednesday ?? HOURS_DEFAULT, s.hours_thursday ?? HOURS_DEFAULT,
      s.hours_friday ?? HOURS_DEFAULT, s.hours_saturday ?? HOURS_DEFAULT,
      s.hours_sunday ?? HOURS_DEFAULT,
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tiendasData), 'Tiendas')

  // ── Hoja Catálogo (con variantes expandidas) ──
  const catalog = await buildCatalogRows()
  if (catalog) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([catalog.row1, catalog.row2, ...catalog.rows]),
      'Catalogo',
    )
  }

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `catalogo_uber_eats_${date}.xlsx`)
}

/** Descarga el catálogo (variantes expandidas) como CSV. */
export async function downloadUberEatsCsv(): Promise<void> {
  const catalog = await buildCatalogRows()
  if (!catalog) return
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [catalog.row2, ...catalog.rows].map((r) => r.map(esc).join(','))
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `catalogo_uber_eats_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Descarga el catálogo completo como JSON (respaldo). */
export async function downloadCatalogJson(): Promise<void> {
  const [uberRes, productsRes] = await Promise.all([
    supabase.from('uber_eats_products').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
  ])
  if (uberRes.error) throw new Error(uberRes.error.message)
  const payload = {
    exported_at: new Date().toISOString(),
    products: productsRes.data ?? [],
    uber_eats_products: uberRes.data ?? [],
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `respaldo_catalogo_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
