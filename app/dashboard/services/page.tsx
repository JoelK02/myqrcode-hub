'use client';

import React, { useEffect, useState } from 'react';
import { MenuItem, CreateMenuItemInput, UpdateMenuItemInput } from '../../types/menu';
import { Service, CreateServiceInput, UpdateServiceInput } from '../../types/service';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../../services/menu';
import { getServices, createService, updateService, deleteService } from '../../services/service';
import { MenuItemDialog } from '../../components/menu/MenuItemDialog';
import { ServiceDialog } from '../../components/service/ServiceDialog';
import { UtensilsCrossed, Plus, Pencil, Trash2, Coffee, Pizza, Cake, Star, Clock, Bed, Bath, Briefcase, Wrench, BookPlus } from 'lucide-react';
import addBasicServices from './add-basic-services';

export default function ServicesPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | undefined>();
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeServiceCategory, setActiveServiceCategory] = useState<string | null>(null);
  const [isAddingBasicServices, setIsAddingBasicServices] = useState(false);

  // Fetch menu items and services on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const menuData = await getMenuItems();
        const servicesData = await getServices();
        if (isMounted) {
          setMenuItems(menuData);
          setServices(servicesData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load data');
          console.error('Error loading data:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadMenuItems = async (category?: string) => {
    try {
      setIsFilterLoading(true);
      const data = await getMenuItems(category || undefined);
      setMenuItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to load menu items');
      console.error('Error loading menu items:', err);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleCreateMenuItem = async (data: CreateMenuItemInput) => {
    try {
      setIsLoading(true);
      await createMenuItem(data);
      fetchMenuItems();
    } catch (err) {
      console.error('Error creating menu item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMenuItem = async (data: UpdateMenuItemInput) => {
    try {
      setIsLoading(true);
      await updateMenuItem(data);
      fetchMenuItems();
    } catch (err) {
      console.error('Error updating menu item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await deleteMenuItem(id);
      setIsFilterLoading(true);
      const newItems = await getMenuItems(activeCategory || undefined);
      setMenuItems(newItems);
      setError(null);
    } catch (err) {
      console.error('Error deleting menu item:', err);
      alert('Failed to delete menu item');
    } finally {
      setIsFilterLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedMenuItem(undefined);
    setMenuDialogOpen(true);
  };

  const openEditDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setMenuDialogOpen(true);
  };

  const handleCategoryFilter = (category: string | null) => {
    setActiveCategory(category);
    loadMenuItems(category || undefined);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Pizza className="h-5 w-5" />;
      case 'drink':
        return <Coffee className="h-5 w-5" />;
      case 'dessert':
        return <Cake className="h-5 w-5" />;
      case 'special':
        return <Star className="h-5 w-5" />;
      default:
        return <UtensilsCrossed className="h-5 w-5" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Service related functions
  const loadServices = async (category?: string) => {
    try {
      setIsFilterLoading(true);
      const data = await getServices(category || undefined);
      setServices(data);
      setError(null);
    } catch (err) {
      setError('Failed to load services');
      console.error('Error loading services:', err);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleCreateService = async (data: CreateServiceInput) => {
    try {
      setIsLoading(true);
      await createService(data);
      fetchServices();
    } catch (err) {
      console.error('Error creating service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async (data: UpdateServiceInput) => {
    try {
      setIsLoading(true);
      await updateService(data);
      fetchServices();
    } catch (err) {
      console.error('Error updating service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await deleteService(id);
      setIsFilterLoading(true);
      const newServices = await getServices(activeServiceCategory || undefined);
      setServices(newServices);
      setError(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    } finally {
      setIsFilterLoading(false);
    }
  };

  const openCreateServiceDialog = () => {
    setSelectedService(undefined);
    setServiceDialogOpen(true);
  };

  const openEditServiceDialog = (service: Service) => {
    setSelectedService(service);
    setServiceDialogOpen(true);
  };

  const handleServiceCategoryFilter = (category: string | null) => {
    setActiveServiceCategory(category);
    loadServices(category || undefined);
  };

  const getServiceCategoryIcon = (category: string) => {
    switch (category) {
      case 'housekeeping':
        return <Bed className="h-5 w-5" />;
      case 'spa':
        return <Bath className="h-5 w-5" />;
      case 'concierge':
        return <Briefcase className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  const handleAddBasicServices = async () => {
    try {
      setIsAddingBasicServices(true);
      await addBasicServices();
      setIsFilterLoading(true);
      const newServices = await getServices(activeServiceCategory || undefined);
      setServices(newServices);
      setError(null);
    } catch (err) {
      console.error('Error adding basic services:', err);
      alert('Failed to add basic services');
    } finally {
      setIsAddingBasicServices(false);
      setIsFilterLoading(false);
    }
  };

  // Unified handler function for menu item create and update operations
  const handleSubmitMenuItem = async (data: CreateMenuItemInput | UpdateMenuItemInput) => {
    try {
      setIsLoading(true);
      // Check if it's an update operation (has an id property)
      if ('id' in data) {
        await updateMenuItem(data as UpdateMenuItemInput);
      } else {
        await createMenuItem(data as CreateMenuItemInput);
      }
      fetchMenuItems();
    } catch (err) {
      console.error('Error submitting menu item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Unified handler function for service create and update operations
  const handleSubmitService = async (data: CreateServiceInput | UpdateServiceInput) => {
    try {
      setIsLoading(true);
      // Check if it's an update operation (has an id property)
      if ('id' in data) {
        await updateService(data as UpdateServiceInput);
      } else {
        await createService(data as CreateServiceInput);
      }
      fetchServices();
    } catch (err) {
      console.error('Error submitting service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to fetch data
  const fetchMenuItems = async () => {
    try {
      setIsFilterLoading(true);
      const newItems = await getMenuItems(activeCategory || undefined);
      setMenuItems(newItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setIsFilterLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setIsFilterLoading(true);
      const newServices = await getServices(activeServiceCategory || undefined);
      setServices(newServices);
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setIsFilterLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Loading data...
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
          <h1 className="text-3xl font-bold mb-2">Menu & Services</h1>
          <p className="text-muted-foreground">Manage food, drinks, and other services offered to guests.</p>
        </div>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          Add Menu Item
        </button>
      </header>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryFilter(null)}
          disabled={isFilterLoading}
          className={`px-4 py-2 rounded-md transition-opacity ${
            isFilterLoading ? 'opacity-70' : 'opacity-100'
          } ${
            activeCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          All
        </button>
        {['food', 'drink', 'dessert', 'special', 'other'].map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryFilter(category)}
            disabled={isFilterLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-opacity ${
              isFilterLoading ? 'opacity-70' : 'opacity-100'
            } ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {getCategoryIcon(category)}
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-6 relative">
        {isFilterLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="text-primary animate-pulse">Updating items...</div>
          </div>
        )}

        {menuItems.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">
              {activeCategory
                ? `No ${activeCategory} items found. Add your first ${activeCategory} item to get started.`
                : 'No menu items found. Add your first menu item to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{item.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {getCategoryIcon(item.category)}
                      <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{formatPrice(item.price)}</div>
                </div>

                {item.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                )}

                {item.image_url && (
                  <div className="mb-4 aspect-video rounded-md overflow-hidden bg-muted">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 mt-2 border-t">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    item.is_available
                      ? 'text-green-600 bg-green-100'
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDialog(item)}
                      className="p-2 hover:bg-accent rounded-md"
                      title="Edit item"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md"
                      title="Delete item"
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

      {/* Services section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Services</h2>
          <button
            onClick={openCreateServiceDialog}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            Add Service
          </button>
        </div>

        {/* Service Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleServiceCategoryFilter(null)}
            disabled={isFilterLoading}
            className={`px-4 py-2 rounded-md transition-opacity ${
              isFilterLoading ? 'opacity-70' : 'opacity-100'
            } ${
              activeServiceCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            All
          </button>
          {['housekeeping', 'spa', 'concierge', 'maintenance'].map((category) => (
            <button
              key={category}
              onClick={() => handleServiceCategoryFilter(category)}
              disabled={isFilterLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-opacity ${
                isFilterLoading ? 'opacity-70' : 'opacity-100'
              } ${
                activeServiceCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {getServiceCategoryIcon(category)}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 relative">
          {isFilterLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-primary animate-pulse">Updating services...</div>
            </div>
          )}

          {services.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <p className="text-muted-foreground mb-6">
                {activeServiceCategory
                  ? `No ${activeServiceCategory} services found. Add your first ${activeServiceCategory} service to get started.`
                  : 'No services found. Add your first service to get started.'}
              </p>
              {!activeServiceCategory && (
                <button
                  onClick={handleAddBasicServices}
                  disabled={isAddingBasicServices}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                >
                  <BookPlus className="h-5 w-5" />
                  {isAddingBasicServices ? 'Adding Basic Services...' : 'Add 4 Basic Services'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{service.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        {getServiceCategoryIcon(service.category)}
                        <span>{service.category.charAt(0).toUpperCase() + service.category.slice(1)}</span>
                      </div>
                    </div>
                    <div className="text-lg font-semibold">{formatPrice(service.price)}</div>
                  </div>

                  {service.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(service.duration)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      service.is_available
                        ? 'text-green-600 bg-green-100'
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      {service.is_available ? 'Available' : 'Unavailable'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditServiceDialog(service)}
                        className="p-2 hover:bg-accent rounded-md"
                        title="Edit service"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-md"
                        title="Delete service"
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
      </div>

      <MenuItemDialog
        isOpen={menuDialogOpen}
        onClose={() => setMenuDialogOpen(false)}
        onSubmit={handleSubmitMenuItem}
        menuItem={selectedMenuItem}
        title={selectedMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
      />

      <ServiceDialog
        isOpen={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        onSubmit={handleSubmitService}
        service={selectedService}
        title={selectedService ? 'Edit Service' : 'Add Service'}
      />
    </div>
  );
} 