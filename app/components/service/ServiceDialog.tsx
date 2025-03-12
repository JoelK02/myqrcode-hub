import React, { useEffect, useState, useRef } from 'react';
import { Service, CreateServiceInput, UpdateServiceInput } from '../../types/service';
import { createClient } from '@supabase/supabase-js';
import { validateImage, uploadImage, deleteImage, IMAGE_BUCKETS } from '../../lib/imageUtils';
import { Image, X, Loader2, Upload } from 'lucide-react';

// Setup Supabase client for building data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple interface for building options
interface BuildingOption {
  id: string;
  name: string;
}

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>;
  service?: Service;
  title: string;
  defaultBuildingId?: string | null;
}

export function ServiceDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  service, 
  title,
  defaultBuildingId
}: ServiceDialogProps) {
  const [formData, setFormData] = useState<CreateServiceInput>({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    category: 'housekeeping',
    is_available: true,
    building_id: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch buildings list
  useEffect(() => {
    async function fetchBuildings() {
      if (!isOpen) return;
      
      try {
        setBuildingsLoading(true);
        const { data, error } = await supabase
          .from('buildings')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setBuildings(data || []);
      } catch (err) {
        console.error('Error fetching buildings:', err);
      } finally {
        setBuildingsLoading(false);
      }
    }
    
    fetchBuildings();
  }, [isOpen]);

  useEffect(() => {
    if (service) {
      // If editing an existing service
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        is_available: service.is_available,
        image_url: service.image_url,
        building_id: service.building_id
      });
    } else {
      // If creating a new service, use default values and defaultBuildingId if provided
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 60,
        category: 'housekeeping',
        is_available: true,
        image_url: undefined,
        building_id: defaultBuildingId || ''
      });
    }
    // Reset image state when dialog opens/closes or service changes
    setImageFile(null);
    setImageError(null);
  }, [service, isOpen, defaultBuildingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: isChecked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      building_id: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate the image
    const validation = validateImage(file);
    if (!validation.valid) {
      setImageError(validation.error);
      return;
    }
    
    // Clear any previous errors
    setImageError(null);
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // If removing an existing image (not a newly selected one)
    if (!imageFile && formData.image_url) {
      setFormData(prev => ({ ...prev, image_url: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let updatedFormData = { ...formData };
      
      // Handle image upload if a new image is selected
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const imageUrl = await uploadImage(
            imageFile, 
            IMAGE_BUCKETS.SERVICE, 
            formData.category || 'general'
          );
          
          if (imageUrl) {
            // If there was a previous image, delete it
            if (formData.image_url) {
              await deleteImage(formData.image_url, IMAGE_BUCKETS.SERVICE);
            }
            
            updatedFormData.image_url = imageUrl;
          }
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          setImageError(uploadErr instanceof Error ? uploadErr.message : 'Failed to upload image');
          setIsLoading(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      const submitData = service 
        ? { ...updatedFormData, id: service.id } 
        : updatedFormData;
      
      await onSubmit(submitData);
      onClose();
    } catch (err) {
      console.error('Error submitting service:', err);
      setError('Failed to save service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Service Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter service name"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                >
                  <option value="housekeeping">Housekeeping</option>
                  <option value="spa">Spa</option>
                  <option value="concierge">Concierge</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              {/* Image upload section */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium mb-1">
                  Service Image
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  
                  {/* Preview of current/selected image */}
                  {(formData.image_url || imageFile) && !isUploadingImage ? (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                        alt="Service preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-service.png';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 rounded-full bg-black/50 text-white p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : isUploadingImage ? (
                    <div className="w-24 h-24 border rounded-md flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </button>
                  )}
                  
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                    >
                      {formData.image_url || imageFile ? 'Change Image' : 'Select Image'}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a service image (optional). Max 2MB.
                    </p>
                    {imageError && (
                      <p className="text-xs text-destructive mt-1">{imageError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Building selector */}
              <div>
                <label htmlFor="building_id" className="block text-sm font-medium mb-1">
                  Building *
                </label>
                <select
                  id="building_id"
                  name="building_id"
                  value={formData.building_id || ''}
                  onChange={handleBuildingChange}
                  className="w-full p-2 border rounded-md"
                  disabled={buildingsLoading}
                  required
                >
                  <option value="">-- Select a building --</option>
                  {buildings.map(building => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which building this service is available in
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium mb-1">
                    Price ($) *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                  placeholder="Describe the service..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="is_available"
                  name="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="is_available" className="text-sm">
                  Available for booking
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-md"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  disabled={isLoading || isUploadingImage}
                >
                  {isLoading || isUploadingImage ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      {isUploadingImage ? 'Uploading...' : 'Saving...'}
                    </span>
                  ) : (
                    'Save Service'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}