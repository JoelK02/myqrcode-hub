'use client';

import React, { useEffect, useState } from 'react';
import { Unit } from '../../types/units';
import { Building } from '../../types/buildings';
import { CreateUnitInput, UpdateUnitInput } from '../../types/units';
import { getBuildings } from '../../services/buildings';
import { QrCode, Loader2 } from 'lucide-react';
import { generateQRCodeDataUrl } from '../../services/qrcode';

interface UnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUnitInput | UpdateUnitInput) => Promise<void>;
  unit?: Unit;
  building?: Building;  // Make building optional
  title: string;
}

export function UnitDialog({
  isOpen,
  onClose,
  onSubmit,
  unit,
  building,
  title
}: UnitDialogProps) {
  const [formData, setFormData] = useState<CreateUnitInput>({
    building_id: '',
    unit_number: '',
    floor_number: '',
    qr_code_url: '',
    status: 'available',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQRCode, setIsGeneratingQRCode] = useState(false);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  // Add a notification about automatic QR code generation
  const showAutomaticQRNotice = !unit;

  // Fetch all buildings when the dialog opens
  useEffect(() => {
    if (isOpen && !building) {
      const fetchBuildings = async () => {
        try {
          setLoadingBuildings(true);
          const data = await getBuildings();
          setBuildings(data);
        } catch (error) {
          console.error('Error fetching buildings:', error);
        } finally {
          setLoadingBuildings(false);
        }
      };
      
      fetchBuildings();
    }
  }, [isOpen, building]);

  // Set form data when unit or building changes
  useEffect(() => {
    if (unit) {
      // Unit exists - editing mode
      setFormData({
        building_id: unit.building_id,
        unit_number: unit.unit_number,
        floor_number: unit.floor_number || '',
        status: unit.status,
        description: unit.description || '',
        qr_code_url: unit.qr_code_url || ''
      });
    } else if (building) {
      // Creating a new unit with preselected building
      setFormData({
        building_id: building.id,
        unit_number: '',
        floor_number: '',
        status: 'available',
        description: '',
        qr_code_url: ''
      });
    } else {
      // Reset form for a blank new unit
      setFormData({
        building_id: '',
        unit_number: '',
        floor_number: '',
        status: 'available',
        description: '',
        qr_code_url: ''
      });
    }
  }, [unit, building, isOpen]);

  // Show preview of QR code
  const showQRPreview = async (unitId: string) => {
    try {
      setIsGeneratingQRCode(true);
      const dataUrl = await generateQRCodeDataUrl(unitId);
      setQrCodePreview(dataUrl);
    } catch (error) {
      console.error('Error generating QR code preview:', error);
    } finally {
      setIsGeneratingQRCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If we have a unit, this is an update operation, so include the ID
      const submitData = unit 
        ? { ...formData, id: unit.id } 
        : formData;
        
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting unit:', error);
      alert('Failed to save unit');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show automatic QR code generation notice for new units */}
          {showAutomaticQRNotice && (
            <div className="bg-primary/10 p-3 rounded-md border border-primary/20 text-sm">
              <p className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span>A QR code will be automatically generated when you create this unit.</span>
              </p>
            </div>
          )}
          
          {!unit && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="building_id">
                Building*
              </label>
              {building ? (
                <input
                  type="text"
                  value={building.name}
                  readOnly
                  disabled
                  className="w-full rounded-md border px-3 py-2 bg-muted"
                />
              ) : (
                <select
                  id="building_id"
                  required
                  value={formData.building_id}
                  onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                  className="w-full rounded-md border px-3 py-2"
                  disabled={loadingBuildings}
                >
                  <option value="">Select a building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              {loadingBuildings && <p className="text-sm text-muted-foreground mt-1">Loading buildings...</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="unit_number">
              Unit Number*
            </label>
            <input
              id="unit_number"
              type="text"
              required
              value={formData.unit_number}
              onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="floor_number">
              Floor Number
            </label>
            <input
              id="floor_number"
              type="text"
              value={formData.floor_number || ''}
              onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="qr_code_url">
              QR Code
            </label>
            <div className="flex items-center gap-2">
              <input
                id="qr_code_url"
                type="text"
                readOnly
                value={formData.qr_code_url || 'QR code will be generated automatically'}
                className="w-full rounded-md border px-3 py-2 bg-muted"
              />
              {unit && unit.qr_code_url && (
                <button
                  type="button"
                  onClick={() => showQRPreview(unit.id)}
                  className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                  title="Show QR Preview"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              )}
            </div>
            {qrCodePreview && (
              <div className="mt-2 flex justify-center">
                <img 
                  src={qrCodePreview} 
                  alt="QR Code Preview" 
                  className="w-32 h-32 border p-1 bg-white"
                />
              </div>
            )}
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
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status*
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Unit['status'] })}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
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
              disabled={isLoading || (!unit && !formData.building_id)}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 