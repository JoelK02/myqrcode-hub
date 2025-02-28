'use client';

import React, { useEffect } from 'react';
import { Building, CreateBuildingInput, UpdateBuildingInput } from '../../types/buildings';

interface BuildingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBuildingInput | UpdateBuildingInput) => Promise<void>;
  building?: Building;
  title: string;
}

export function BuildingDialog({
  isOpen,
  onClose,
  onSubmit,
  building,
  title
}: BuildingDialogProps) {
  const [formData, setFormData] = React.useState<CreateBuildingInput>({
    name: '',
    address: '',
    total_units: 0,
    description: '',
    status: 'active'
  });
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name,
        address: building.address,
        total_units: building.total_units,
        description: building.description || '',
        status: building.status
      });
    } else {
      // Reset form when opening in create mode
      setFormData({
        name: '',
        address: '',
        total_units: 0,
        description: '',
        status: 'active'
      });
    }
  }, [building, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // If we have a building, this is an update operation, so include the ID
      const submitData = building 
        ? { ...formData, id: building.id } 
        : formData;
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting building:', error);
      alert('Failed to save building');
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
              Building Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Enter building name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="address">
              Address
            </label>
            <input
              id="address"
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Enter building address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="total_units">
              Total Units
            </label>
            <input
              id="total_units"
              type="number"
              required
              min="1"
              value={formData.total_units}
              onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) })}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="Enter building description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Building['status'] })}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
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
              {isLoading ? 'Saving...' : 'Save Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 