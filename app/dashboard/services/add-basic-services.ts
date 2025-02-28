import { createService } from '../../services/service';
import { CreateServiceInput } from '../../types/service';

// 4 basic services across different categories
const basicServices: CreateServiceInput[] = [
  {
    name: 'Daily Room Cleaning',
    description: 'Standard daily room cleaning service including fresh linens, bathroom cleaning, and trash removal.',
    price: 25.00,
    duration: 30,
    category: 'housekeeping',
    is_available: true
  },
  {
    name: 'Relaxation Massage',
    description: 'A full-body relaxation massage to reduce stress and promote well-being.',
    price: 85.00,
    duration: 60,
    category: 'spa',
    is_available: true
  },
  {
    name: 'Airport Transportation',
    description: 'Reliable transportation to and from the airport with professional drivers.',
    price: 45.00,
    duration: 45,
    category: 'concierge',
    is_available: true
  },
  {
    name: 'Quick Repairs',
    description: 'Fast response for minor repairs and maintenance issues in your room or unit.',
    price: 35.00,
    duration: 40,
    category: 'maintenance',
    is_available: true
  }
];

export const addBasicServices = async () => {
  try {
    for (const service of basicServices) {
      await createService(service);
      console.log(`Added service: ${service.name}`);
    }
    console.log('All basic services added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding basic services:', error);
    return false;
  }
};

// This can be called manually when needed or imported elsewhere
export default addBasicServices; 