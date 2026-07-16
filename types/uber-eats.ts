export type UberEatsProduct = {
  id: string
  barcode: string
  name: string
  original_category: string | null
  uber_category: string | null
  uber_sub_category: string | null
  uber_categories: string[] | null
  price: number
  price_with_vat: number | null
  vat_percentage: number | null
  description: string | null
  image_url: string | null
  product_type: string | null
  hfss_item: string | null
  alcohol_units: number | null
  quantity_restriction: number | null
  in_stock: boolean | null
  measurement_unit: string | null
  measurement_value: number | null
  is_valid: boolean | null
  validation_errors: string[] | null
  modified: boolean | null
  excluded: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type UberEatsStore = {
  id: string
  name: string
  uuid_code: string | null
  hours_monday: string | null
  hours_tuesday: string | null
  hours_wednesday: string | null
  hours_thursday: string | null
  hours_friday: string | null
  hours_saturday: string | null
  hours_sunday: string | null
  is_active: boolean | null
  created_at: string | null
}

export type CatalogProduct = {
  id: number
  barcode: string
  name: string | null
  category: string | null
  sale_price: number | null
  image_url: string | null
  description: string | null
  is_active: boolean | null
}
