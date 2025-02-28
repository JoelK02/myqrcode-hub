'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building } from '../../../types/buildings';
import { Unit } from '../../../types/units';
import { getBuilding } from '../../../services/buildings';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../../../services/units';
import { UnitDialog } from '../../../components/units/UnitDialog';
import { Plus, Pencil, Trash2, ArrowLeft, QrCode } from 'lucide-react';

export default function BuildingDetailsPage() {
  const params = useParams();
  const buildingId = params.id as string;

  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>();

  // Fetch building and units on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch building data
        const buildingData = await getBuilding(buildingId);
        if (isMounted) {
          setBuilding(buildingData);
        }
        
        // Fetch units for this building
        const unitsData = await getUnits(buildingId);
        if (isMounted) {
          setUnits(unitsData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load building data');
          console.error('Error loading building data:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [buildingId]);

  const handleCreateUnit = async (data: Omit<Unit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createUnit(data);
      const updatedUnits = await getUnits(buildingId);
      setUnits(updatedUnits);
    } catch (err) {
      console.error('Error creating unit:', err);
      throw err;
    }
  };

  const handleUpdateUnit = async (data: Omit<Unit, 'created_at' | 'updated_at'>) => {
    try {
      await updateUnit(data);
      const updatedUnits = await getUnits(buildingId);
      setUnits(updatedUnits);
    } catch (err) {
      console.error('Error updating unit:', err);
      throw err;
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) {
      return;
    }

    try {
      await deleteUnit(id);
      const updatedUnits = await getUnits(buildingId);
      setUnits(updatedUnits);
    } catch (err) {
      console.error('Error deleting unit:', err);
      alert('Failed to delete unit');
    }
  };

  const openCreateDialog = () => {
    setSelectedUnit(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setDialogOpen(true);
  };

  const getStatusColor = (status: Unit['status']) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'occupied':
        return 'text-blue-600 bg-blue-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'reserved':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Loading building data...
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
        <p>{error || 'Building not found'}</p>
        <Link href="/dashboard/buildings" className="mt-4 text-primary hover:underline">
          Back to buildings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Link href="/dashboard/buildings" className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Buildings
        </Link>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{building.name}</h1>
          <p className="text-muted-foreground">{building.address}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-sm px-2 py-1 rounded-full ${
              building.status === 'active' ? 'text-green-600 bg-green-100' :
              building.status === 'inactive' ? 'text-gray-600 bg-gray-100' :
              'text-yellow-600 bg-yellow-100'
            }`}>
              {building.status.charAt(0).toUpperCase() + building.status.slice(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              {building.total_units} total units
            </span>
          </div>
        </div>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          Add Unit
        </button>
      </header>

      {building.description && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-muted-foreground">{building.description}</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Units</h2>
        {units.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">No units found for this building. Add your first unit to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium">Room {unit.unit_number}</h3>
                    {unit.floor_number && (
                      <p className="text-sm text-muted-foreground">Floor: {unit.floor_number}</p>
                    )}
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(unit.status)}`}>
                    {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                  </span>
                </div>
                
                {unit.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{unit.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-2 mt-2 border-t">
                  {unit.qr_code_url ? (
                    <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <QrCode className="h-4 w-4" />
                      View QR Code
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">No QR code</span>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDialog(unit)}
                      className="p-1.5 hover:bg-accent rounded-md"
                      title="Edit unit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md"
                      title="Delete unit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <UnitDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={selectedUnit ? handleUpdateUnit : handleCreateUnit}
        unit={selectedUnit}
        building={building}
        title={selectedUnit ? 'Edit Unit' : 'Add Unit'}
      />
    </div>
  );
} 