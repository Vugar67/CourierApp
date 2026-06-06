export type UserRole = 'client' | 'warehouse_staff' | 'operator' | 'cashier' | 'courier' | 'admin'
export type Language = 'az' | 'ru' | 'en'
export type ParcelStatus =
  | 'expected'
  | 'arrived_origin'
  | 'consolidated'
  | 'in_container'
  | 'shipped'
  | 'in_transit'
  | 'arrived_destination'
  | 'customs_processing'
  | 'customs_hold'
  | 'at_warehouse'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'

export interface Profile {
  id: string
  role: UserRole
  personal_code: string | null
  first_name: string
  last_name: string
  phone: string | null
  language: Language
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Country {
  id: string
  code: string
  name_az: string
  name_ru: string
  name_en: string
  is_active: boolean
}

export interface Warehouse {
  id: string
  country_id: string
  name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string | null
  zip: string
  phone: string
  email: string | null
  is_origin: boolean
  is_active: boolean
}

export interface Parcel {
  id: string
  client_id: string
  warehouse_id: string
  tracking_number: string
  carrier: string | null
  description: string | null
  declared_value: number | null
  declared_currency: string
  actual_weight: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  volumetric_weight: number | null
  chargeable_weight: number | null
  delivery_cost: number | null
  status: ParcelStatus
  consolidation_box_id: string | null
  photo_urls: string[] | null
  notes: string | null
  received_at: string | null
  created_at: string
  updated_at: string
}

export interface ClientDeposit {
  id: string
  client_id: string
  balance: number
  currency: string
  updated_at: string
}
