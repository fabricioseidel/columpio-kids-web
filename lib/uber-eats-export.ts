import * as XLSX from 'xlsx'
import { supabase } from './supabase'

/** Genera y descarga el Excel del catálogo Uber Eats (client-side, sesión autenticada). */
export async function downloadUberEatsExcel(): Promise<void> {
  const [productsRes, storesRes] = await Promise.all([
    supabase.from('uber_eats_products').select('*').eq('excluded', false)
      .order('uber_category', { nullsFirst: false }),
    supabase.from('uber_eats_stores').select('*').eq('is_active', true).order('name'),
  ])
  if (productsRes.error) throw new Error(productsRes.error.message)
  if (storesRes.error) throw new Error(storesRes.error.message)

  const products = productsRes.data ?? []
  const stores = storesRes.data ?? []

  const wb = XLSX.utils.book_new()

  // ── Hoja Tiendas ──
  const tiendasData = [
    ['DATOS TIENDA', '', 'HORARIO TIENDA', '', '', '', '', '', ''],
    ['Nombre de Tienda (Así aparecerá en app)', 'UUID', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'],
    ...stores.map((s) => [
      s.name, s.uuid_code ?? '',
      s.hours_monday ?? '10:00 - 20:30', s.hours_tuesday ?? '10:00 - 20:30',
      s.hours_wednesday ?? '10:00 - 20:30', s.hours_thursday ?? '10:00 - 20:30',
      s.hours_friday ?? '10:00 - 20:30', s.hours_saturday ?? '10:00 - 20:30',
      s.hours_sunday ?? '10:00 - 20:30',
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tiendasData), 'Tiendas')

  // ── Hoja Catálogo ──
  const row1 = [
    'Optional', 'Optional', 'Mandatory', 'Mandatory', 'Mandatory', 'Optional', 'Optional',
    'Optional', 'Mandatory', 'Mandatory', 'Optional', 'Mandatory', 'Optional', 'Optional',
    'PRODUCT IN STOCK (1) / OUT OF STOCK (0)',
    ...stores.slice(1).map(() => ''),
  ]
  const row2 = [
    'UPC/EAN', 'External ID', 'Category', 'Sub-Category',
    'Product Name (+ brand + size / weight)', 'Product Type', 'Total Alcohol Units',
    'HFSS Item', 'Price (incl VAT)\nStandard', 'IVA', 'Description', 'Item Image URL',
    'Quantity Restriction', 'External Data',
    ...stores.map((s) => s.name),
  ]
  const dataRows = products.map((p) => [
    p.barcode ?? '', '',
    p.uber_category ?? '', p.uber_sub_category ?? '', p.name ?? '',
    p.product_type ?? '', p.alcohol_units ?? '', p.hfss_item ?? '',
    p.price_with_vat ?? p.price ?? 0, (p.vat_percentage ?? 19) / 100,
    p.description ?? '', p.image_url ?? '', p.quantity_restriction ?? '', '',
    ...stores.map(() => (p.in_stock ? 1 : 0)),
  ])
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows]), 'Catalogo')

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `catalogo_uber_eats_${date}.xlsx`)
}
