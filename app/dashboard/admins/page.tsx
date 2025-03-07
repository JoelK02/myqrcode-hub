'use client';

import React, { useEffect, useState } from 'react';
import { 
  Admin, 
  getAdmins,
  updateAdmin, 
  deleteAdmin 
} from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Info, 
  AlertTriangle,
  UserPlus 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
  }>({
    name: '',
    email: '',
    role: 'staff'
  });
  
  useEffect(() => {
    fetchAdmins();
  }, []);
  
  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      toast.error('Failed to load admin accounts');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'staff'
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditAdmin = async (admin: Admin) => {
    setIsEditing(admin.id);
    setFormData({
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
  };
  
  const handleCancelEdit = () => {
    setIsEditing(null);
    resetForm();
  };
  
  const handleUpdateAdmin = async (adminId: string) => {
    try {
      // Validate form
      if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
        toast.error('Please fill out all fields');
        return;
      }
      
      const updatedAdmin = await updateAdmin({
        id: adminId,
        name: formData.name,
        email: formData.email,
        role: formData.role
      });
      
      if (updatedAdmin) {
        setAdmins(prevAdmins => 
          prevAdmins.map(admin => 
            admin.id === adminId ? updatedAdmin : admin
          )
        );
        setIsEditing(null);
        resetForm();
        toast.success('Admin account updated successfully');
      } else {
        throw new Error('Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Failed to update admin account');
    }
  };
  
  const handleConfirmDelete = async (adminId: string) => {
    try {
      setIsDeleting(adminId);
      const success = await deleteAdmin(adminId);
      
      if (success) {
        setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== adminId));
        toast.success('Admin account deleted successfully');
      } else {
        throw new Error('Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin account');
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleCancelDelete = () => {
    setIsDeleting(null);
  };
  
  const getRoleBadgeColor = (role: Admin['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please sign in to access admin management.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Admin Management</h1>
          <p className="text-gray-600">Manage admin accounts for your organization</p>
        </div>
        <Link 
          href="/dashboard/admins/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add New Admin
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading admin accounts...</span>
        </div>
      ) : (
        <>
          {/* Admin List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">Admin Accounts</h2>
            </div>
            
            {admins.length === 0 ? (
              <div className="p-6 text-center">
                <div className="inline-flex justify-center items-center bg-blue-50 p-4 rounded-full mb-4">
                  <Info className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Admin Accounts</h3>
                <p className="text-gray-600 mb-4">Create your first admin account to get started</p>
                <Link 
                  href="/dashboard/admins/add"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Admin Account
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing === admin.id ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              required
                            />
                          ) : (
                            <div className="font-medium text-gray-900">{admin.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing === admin.id ? (
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              required
                            />
                          ) : (
                            <div className="text-gray-500">{admin.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing === admin.id ? (
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(admin.role)}`}>
                              {admin.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing === admin.id ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleUpdateAdmin(admin.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : isDeleting === admin.id ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleConfirmDelete(admin.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditAdmin(admin)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setIsDeleting(admin.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Help text */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">About Admin Accounts</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Admin accounts are used to complete orders and perform administrative tasks.
                  Each admin account is linked to your user and can only be managed by you.
                </p>
                <ul className="mt-2 list-disc list-inside text-sm text-blue-700 pl-2">
                  <li><strong>Admin:</strong> Has full access to all administrative functions</li>
                  <li><strong>Manager:</strong> Can manage orders and complete them</li>
                  <li><strong>Staff:</strong> Can view orders and complete them</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 