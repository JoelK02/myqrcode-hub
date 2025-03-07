'use client';

import React, { useState } from 'react';
import { createAdmin } from '../../../services/admin';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2, ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'manager' | 'staff'
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    role: '',
    general: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      role: '',
      general: ''
    };

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Validate role
    if (!formData.role) {
      newErrors.role = 'Role is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({ name: '', email: '', role: '', general: '' });

      const result = await createAdmin({
        name: formData.name,
        email: formData.email,
        role: formData.role
      });

      if (result) {
        // Success
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/admins');
        }, 2000);
      } else {
        throw new Error('Failed to create admin account');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to create admin account. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <p className="text-center text-gray-700">Please sign in to access this page.</p>
          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-xl font-bold mb-4">Admin Account Created!</h1>
          <p className="text-gray-600 mb-6">
            The new admin account has been successfully created.
          </p>
          <Link 
            href="/dashboard/admins" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View All Admins
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 flex items-center">
        <Link href="/dashboard/admins" className="text-gray-500 hover:text-gray-700 mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Add New Admin</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <UserPlus className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">Create Administrator Account</h2>
          </div>
          <p className="text-gray-600">
            Create a new admin account that will be associated with your user.
            Different admin accounts can be used for different roles or responsibilities.
          </p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              className={`w-full p-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@example.com"
              className={`w-full p-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
            
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Staff:</strong> Can complete orders but have limited access to other features</p>
              <p><strong>Manager:</strong> Can manage orders and access most administrative features</p>
              <p><strong>Admin:</strong> Has full access to all features and settings</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/admins"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 