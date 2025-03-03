export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'food' | 'drink' | 'dessert' | 'special' | 'other';
  image_url?: string;
  is_available: boolean;
  building_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  price: number;
  category: MenuItem['category'];
  image_url?: string;
  is_available: boolean;
  building_id?: string;
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {
  id: string;
} 