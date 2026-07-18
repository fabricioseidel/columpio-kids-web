export type ProductTipo = {
  nombre?: string
  imagen?: string
}

export type ProductFeatures = {
  subcategoria?: string
  tipos?: ProductTipo[]
}

export type Product = {
  id: number
  barcode: string
  name: string
  category: string | null
  purchase_price: number | null
  sale_price: number
  offer_price: number | null
  stock: number
  reorder_threshold: number | null
  supplier_id: string | null
  image_url: string | null
  description: string | null
  features: ProductFeatures | null
  gallery: string[] | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type Sale = {
  id: number
  ts: string
  subtotal: number
  discount: number
  total: number
  payment_method: string
  cash_received: number | null
  change_given: number | null
  notes: string | null
  voided: boolean
  voided_at: string | null
}

export type SaleItem = {
  id: number
  sale_id: number
  product_id: number | null
  product_name: string
  barcode: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

export type InventoryMovement = {
  id: number
  product_id: number | null
  type: 'IN' | 'OUT'
  quantity: number
  reason: string | null
  reference: string | null
  stock_after: number | null
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  lead_time_days: number | null
  dispatch_days: string | null
  min_order_amount: number | null
  notes: string | null
  is_active: boolean | null
  created_at: string | null
}

export type SupplierOrder = {
  id: number
  supplier_id: string | null
  status: 'pendiente' | 'enviada' | 'recibida' | 'cancelada'
  order_date: string
  expected_date: string | null
  delivered_date: string | null
  total: number
  notes: string | null
}

export type SupplierOrderItem = {
  id: number
  order_id: number
  product_id: number | null
  product_name: string | null
  quantity: number
  unit_cost: number
  subtotal: number
}

export type StoreSettings = {
  id: boolean
  store_name: string | null
  store_address: string | null
  store_phone: string | null
  receipt_footer: string | null
}

export type CartLine = {
  product: Product
  quantity: number
}
