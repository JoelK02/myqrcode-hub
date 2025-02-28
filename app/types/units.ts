export interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
  qr_code_url?: string;
  floor_number?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitInput {
  building_id: string;
  unit_number: string;
  qr_code_url?: string;
  floor_number?: string;
  status: Unit['status'];
  description?: string;
}

export interface UpdateUnitInput extends Partial<CreateUnitInput> {
  id: string;
} 