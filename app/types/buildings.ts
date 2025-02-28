export interface Building {
  id: string;
  name: string;
  address: string;
  total_units: number;
  created_at: string;
  updated_at: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface CreateBuildingInput {
  name: string;
  address: string;
  total_units: number;
  description?: string;
  status: Building['status'];
}

export interface UpdateBuildingInput extends Partial<CreateBuildingInput> {
  id: string;
} 