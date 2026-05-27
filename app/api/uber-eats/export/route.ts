import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [productsRes, storesRes] = await Promise.all([
    supabase
      .from('uber_eats_products')
      .select('*')
      .eq('excluded', false)
      .order('uber_category', { nullsFirst: false }),
    supabase.from('uber_eats_stores').select('*').eq('is_active', true).order('name'),
  ])

  if (productsRes.error) {
    return NextResponse.json({ error: productsRes.error.message }, { status: 500 })
  }

  const products = productsRes.data ?? []
  const stores = storesRes.data ?? []

  const wb = XLSX.utils.book_new()

  // ── Tiendas sheet ─────────────────────────────────────────────────────────

  const tiendasData = [
    ['DATOS TIENDA', '', 'HORARIO TIENDA', '', '', '', '', '', ''],
    [
      'Nombre de Tienda (Así aparecerá en app)',
      'UUID',
      'LUNES',
      'MARTES',
      'MIÉRCOLES',
      'JUEVES',
      'VIERNES',
      'SÁBADO',
      'DOMINGO',
    ],
    ...stores.map((s) => [
      s.name,
      s.uuid_code ?? '',
      s.hours_monday ?? '10:00 - 20:30',
      s.hours_tuesday ?? '10:00 - 20:30',
      s.hours_wednesday ?? '10:00 - 20:30',
      s.hours_thursday ?? '10:00 - 20:30',
      s.hours_friday ?? '10:00 - 20:30',
      s.hours_saturday ?? '10:00 - 20:30',
      s.hours_sunday ?? '10:00 - 20:30',
    ]),
  ]

  const wsTiendas = XLSX.utils.aoa_to_sheet(tiendasData)
  XLSX.utils.book_append_sheet(wb, wsTiendas, 'Tiendas')

  // ── Catálogo sheet ────────────────────────────────────────────────────────

  // Row 1: required/optional flags
  const row1 = [
    'Optional',
    'Optional',
    'Mandatory',
    'Mandatory',
    'Mandatory',
    'Optional',
    'Optional',
    'Optional',
    'Mandatory',
    'Mandatory',
    'Optional',
    'Mandatory',
    'Optional',
    'Optional',
    'PRODUCT IN STOCK (1) / OUT OF STOCK (0)',
    ...stores.slice(1).map(() => ''),
  ]

  // Row 2: column headers
  const row2 = [
    'UPC/EAN',
    'External ID',
    'Category',
    'Sub-Category',
    'Product Name (+ brand + size / weight)',
    'Product Type',
    'Total Alcohol Units',
    'HFSS Item',
    'Price (incl VAT)\nStandard',
    'IVA',
    'Description',
    'Item Image URL',
    'Quantity Restriction',
    'External Data',
    ...stores.map((s) => s.name),
  ]

  // Data rows
  const dataRows = products.map((p) => [
    p.barcode ?? '',
    '',
    p.uber_category ?? '',
    p.uber_sub_category ?? '',
    p.name ?? '',
    p.product_type ?? '',
    p.alcohol_units ?? '',
    p.hfss_item ?? '',
    p.price_with_vat ?? p.price ?? 0,
    (p.vat_percentage ?? 19) / 100,
    p.description ?? '',
    p.image_url ?? '',
    p.quantity_restriction ?? '',
    '',
    ...stores.map(() => (p.in_stock ? 1 : 0)),
  ])

  const wsCatalog = XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows])
  XLSX.utils.book_append_sheet(wb, wsCatalog, 'Catalogo')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const date = new Date().toISOString().split('T')[0]
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="catalogo_uber_eats_${date}.xlsx"`,
    },
  })
}
