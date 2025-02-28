'use client';

import React, { useEffect, useState } from 'react';
import { Unit, CreateUnitInput, UpdateUnitInput } from '../../types/units';
import { Building } from '../../types/buildings';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../../services/units';
import { getBuildings } from '../../services/buildings';
import { UnitDialog } from '../../components/units/UnitDialog';
import { Plus, Pencil, Trash2, QrCode, Building2, X, Download } from 'lucide-react';
import Link from 'next/link';
import { generateQRCodeDataUrl } from '../../services/qrcode';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | undefined>();
  const [filterBuildingId, setFilterBuildingId] = useState<string>('');
  const [buildingMap, setBuildingMap] = useState<Record<string, Building>>({});
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loadingQrCode, setLoadingQrCode] = useState(false);
  
  useEffect(() => {
    fetchUnitsAndBuildings();
  }, []);
  
  useEffect(() => {
    if (filterBuildingId !== undefined) {
      fetchUnits(filterBuildingId || undefined);
    }
  }, [filterBuildingId]);
  
  const fetchUnitsAndBuildings = async () => {
    try {
      setIsLoading(true);
      const [unitsData, buildingsData] = await Promise.all([
        getUnits(),
        getBuildings()
      ]);
      
      setUnits(unitsData);
      setBuildings(buildingsData);
      
      // Create a map of building IDs to building objects for easy lookup
      const map: Record<string, Building> = {};
      buildingsData.forEach(building => {
        map[building.id] = building;
      });
      setBuildingMap(map);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUnits = async (buildingId?: string) => {
    try {
      setIsLoading(true);
      const data = await getUnits(buildingId);
      setUnits(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError('Failed to load units');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUnit = async (data: CreateUnitInput) => {
    try {
      setIsLoading(true);
      await createUnit(data);
      await fetchUnits(filterBuildingId || undefined);
    } catch (err) {
      console.error('Error creating unit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUnit = async (data: UpdateUnitInput) => {
    try {
      setIsLoading(true);
      await updateUnit(data);
      await fetchUnits(filterBuildingId || undefined);
    } catch (err) {
      console.error('Error updating unit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Unified handler function for create and update operations
  const handleSubmitUnit = async (data: CreateUnitInput | UpdateUnitInput) => {
    try {
      setIsLoading(true);
      // Check if it's an update operation (has an id property)
      if ('id' in data) {
        await updateUnit(data as UpdateUnitInput);
      } else {
        await createUnit(data as CreateUnitInput);
      }
      await fetchUnits(filterBuildingId || undefined);
    } catch (err) {
      console.error('Error submitting unit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) {
      return;
    }

    try {
      await deleteUnit(id);
      await fetchUnits(filterBuildingId || undefined);
    } catch (err) {
      console.error('Error deleting unit:', err);
      alert('Failed to delete unit');
    }
  };

  const openCreateDialog = () => {
    setSelectedUnit(undefined);
    setSelectedBuilding(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setSelectedBuilding(buildingMap[unit.building_id]);
    setDialogOpen(true);
  };
  
  const openQrCodeDialog = async (unit: Unit) => {
    if (!unit.qr_code_url) {
      alert('This unit does not have a QR code.');
      return;
    }
    
    try {
      setLoadingQrCode(true);
      setSelectedUnit(unit);
      setQrCodeDialogOpen(true);
      
      // Generate preview
      const dataUrl = await generateQRCodeDataUrl(unit.id);
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error showing QR code:', error);
      alert('Failed to load QR code');
    } finally {
      setLoadingQrCode(false);
    }
  };
  
  const downloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `unit-qrcode-${selectedUnit?.unit_number || 'unknown'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const printQrCode = () => {
    if (!qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the QR code');
      return;
    }
    
    const unitName = selectedUnit?.unit_number || 'unknown';
    const buildingName = buildingMap[selectedUnit?.building_id || '']?.name || 'unknown';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Unit QR Code - ${unitName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            h2 { margin-bottom: 5px; }
            .container { max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
            img { max-width: 300px; height: auto; margin-bottom: 20px; }
            .info { margin-bottom: 20px; color: #555; font-size: 14px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Unit ${unitName}</h2>
            <div class="info">Building: ${buildingName}</div>
            <img src="${qrCodeDataUrl}" alt="QR Code for Unit ${unitName}" />
            <p>Scan this QR code to place an order for this unit</p>
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print();" style="padding: 10px 20px;">Print QR Code</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  const testQrGeneration = async () => {
    try {
      const response = await fetch('/api/test-qr');
      const data = await response.json();
      
      if (data.success) {
        alert(`QR Code generated successfully!\nURL: ${data.qrCodeUrl}`);
      } else {
        alert(`Failed to generate QR Code: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing QR generation:', error);
      alert('Error testing QR generation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Loading units...
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
          <h1 className="text-3xl font-bold mb-2">Units</h1>
          <p className="text-muted-foreground">Manage all units across buildings.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <select
              value={filterBuildingId}
              onChange={(e) => setFilterBuildingId(e.target.value)}
              className="rounded-md border px-3 py-2 min-w-[200px]"
            >
              <option value="">All Buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={testQrGeneration}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground"
          >
            Test QR Generation
          </button>
          
          <button
            onClick={openCreateDialog}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            Add Unit
          </button>
        </div>
      </header>
      
      <div className="bg-card rounded-lg border">
        {units.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground mb-4">No units found.</p>
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              Add your first unit
            </button>
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => {
              const building = buildingMap[unit.building_id];
              
              return (
                <div
                  key={unit.id}
                  className="border rounded-lg overflow-hidden bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-lg">{unit.unit_number}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
                        {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <Link href={`/dashboard/buildings/${unit.building_id}`} className="hover:underline">
                        {building?.name || 'Unknown Building'}
                      </Link>
                    </div>
                    
                    {unit.floor_number && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Floor: {unit.floor_number}
                      </p>
                    )}
                  </div>
                  
                  {unit.description && (
                    <div className="p-4 border-b">
                      <p className="text-sm">{unit.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 mt-2 px-4 pb-4">
                    {unit.qr_code_url ? (
                      <button 
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                        onClick={() => openQrCodeDialog(unit)}
                      >
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
              );
            })}
          </div>
        )}
      </div>
      
      {/* Unit Dialog */}
      <UnitDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmitUnit}
        unit={selectedUnit}
        building={selectedBuilding}
        title={selectedUnit ? 'Edit Unit' : 'Add Unit'}
      />
      
      {/* QR Code Dialog */}
      {qrCodeDialogOpen && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">Unit QR Code</h2>
              <button 
                onClick={() => setQrCodeDialogOpen(false)}
                className="p-1 rounded-md hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Unit {selectedUnit.unit_number} - {buildingMap[selectedUnit.building_id]?.name || 'Unknown Building'}
              </p>
            </div>
            
            {loadingQrCode ? (
              <div className="flex justify-center items-center p-10">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  {qrCodeDataUrl && (
                    <img 
                      src={qrCodeDataUrl} 
                      alt={`QR Code for Unit ${selectedUnit.unit_number}`} 
                      className="border rounded-md h-64 w-64"
                    />
                  )}
                </div>
                
                <p className="text-center text-sm mb-6">
                  Scan this QR code to place an order for this unit.
                </p>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={downloadQrCode}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={printQrCode}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <QrCode className="h-4 w-4" />
                    Print
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 