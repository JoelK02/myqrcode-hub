'use client';

import React, { useEffect } from 'react';
import { MenuItem, CreateMenuItemInput } from '../../types/menu';

interface MenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMenuItemInput) => Promise<void>;
  menuItem?: MenuItem;
  title: string;
}

export function MenuItemDialog({
  isOpen,
  onClose,
  onSubmit,
  menuItem,
  title
}: MenuItemDialogProps) {
  const [formData, setFormData] = React.useState<CreateMenuItemInput>({
    name: '',
    description: '',
    price: 0,
    category: 'food',
    image_url: '',
    is_available: true
  });
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        description: menuItem.description || '',
        price: menuItem.price,
        category: menuItem.category,
        image_url: menuItem.image_url || '',
        is_available: menuItem.is_available
      });
    } else {
      // Reset form when creating a new item
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'food',
        image_url: '',
        is_available: true
      });
    }
  }, [menuItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting menu item:', error);
      alert('Failed to save menu item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Item Name*
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="category">
              Category*
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItem['category'] })}
              className="w-full rounded-md border px-3 py-2"
              required
            >
              <option value="food">Food</option>
              <option value="drink">Drink</option>
              <option value="dessert">Dessert</option>
              <option value="special">Special</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="price">
              Price* ($)
            </label>
            <input
              id="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="Item description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="image_url">
              Image URL
            </label>
            <input
              id="image_url"
              type="text"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center">
            <input
              id="is_available"
              type="checkbox"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label className="ml-2 text-sm font-medium" htmlFor="is_available">
              Available for ordering
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 