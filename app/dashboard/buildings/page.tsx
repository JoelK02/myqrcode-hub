'use client';

import React, { useEffect, useState } from 'react';
import { Building } from '../../types/buildings';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from '../../services/buildings';
import { BuildingDialog } from '../../components/buildings/BuildingDialog';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | undefined>();

  // Fetch buildings on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchBuildings = async () => {
      try {
        setIsLoading(true);
        const data = await getBuildings();
        if (isMounted) {
          setBuildings(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load buildings');
          console.error('Error loading buildings:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBuildings();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      const data = await getBuildings();
      setBuildings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load buildings');
      console.error('Error loading buildings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBuilding = async (data: Omit<Building, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createBuilding(data);
      await loadBuildings();
    } catch (err) {
      console.error('Error creating building:', err);
      throw err;
    }
  };

  const handleUpdateBuilding = async (data: Omit<Building, 'created_at' | 'updated_at'>) => {
    try {
      await updateBuilding(data);
      await loadBuildings();
    } catch (err) {
      console.error('Error updating building:', err);
      throw err;
    }
  };

  const handleDeleteBuilding = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this building?')) {
      return;
    }

    try {
      await deleteBuilding(id);
      await loadBuildings();
    } catch (err) {
      console.error('Error deleting building:', err);
      alert('Failed to delete building');
    }
  };

  const openCreateDialog = () => {
    setSelectedBuilding(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (building: Building) => {
    setSelectedBuilding(building);
    setDialogOpen(true);
  };

  const getStatusColor = (status: Building['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Loading buildings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Buildings & Units</h1>
          <p className="text-muted-foreground">Manage your properties and units.</p>
        </div>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          Add Building
        </button>
      </header>

      <div className="grid gap-6">
        {buildings.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">No buildings found. Add your first building to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {buildings.map((building) => (
              <div
                key={building.id}
                className="bg-card rounded-lg border p-6 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{building.name}</h3>
                  <p className="text-muted-foreground">{building.address}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(building.status)}`}>
                      {building.status.charAt(0).toUpperCase() + building.status.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {building.total_units} units
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/buildings/${building.id}`}
                    className="p-2 hover:bg-accent rounded-md text-primary"
                    title="Manage units"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => openEditDialog(building)}
                    className="p-2 hover:bg-accent rounded-md"
                    title="Edit building"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBuilding(building.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-md"
                    title="Delete building"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BuildingDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={selectedBuilding ? handleUpdateBuilding : handleCreateBuilding}
        building={selectedBuilding}
        title={selectedBuilding ? 'Edit Building' : 'Add Building'}
      />
    </div>
  );
} 