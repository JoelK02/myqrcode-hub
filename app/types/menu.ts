export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'food' | 'drink' | 'dessert' | 'special' | 'other';
  image_url?: string;
  is_available: boolean;
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
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {
  id: string;
} 