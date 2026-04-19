import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Mail, Phone, Lock, User, Trash2, Eye, EyeOff } from 'lucide-react';
import { Role } from '../../types/auth.types';
import { adminService } from '../../services/admin.service';
import { authService } from '../../services/auth.service';
import type { StaffMember } from '../../types/admin.types';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui';
import FormField from '../../components/ui/FormField';

interface StaffFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const StaffManagement = () => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: Role.STAFF,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');

  // Fetch staff members
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      if (roleFilter === 'ALL') {
        response = await adminService.getAllStaff({
          page: currentPage,
          size: pageSize,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
        });
      } else {
        response = await adminService.getStaffByRole(roleFilter, {
          page: currentPage,
          size: pageSize,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
        });
      }

      setStaffList(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError('Failed to fetch staff members');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, roleFilter, pageSize]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      await adminService.deleteStaff(id);
      setSuccess('Staff member deleted successfully');
      fetchStaff();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete staff member');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to register staff
      await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
      });

      setSuccess('Staff member registered successfully!');
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: Role.STAFF,
      });

      // Refresh staff list
      fetchStaff();

      // Hide form after success
      setTimeout(() => {
        setShowAddForm(false);
        setSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || 'Failed to register staff member. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 animate-fade-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight"><span className="text-gradient">Staff Management</span></h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your staff members</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="primary">
          <UserPlus size={20} />
          Add Staff Member
        </Button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="card p-6 mb-8 modal-enter">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Register New Staff Member</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                leftIcon={<User size={20} />}
                required
              />

              <FormField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                leftIcon={<Mail size={20} />}
                required
              />

              <FormField
                label="Phone Number"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1234567890"
                leftIcon={<Phone size={20} />}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={Role.STAFF}>Staff</option>
                  <option value={Role.OWNER}>Owner</option>
                </select>
              </div>

              <FormField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                leftIcon={<Lock size={20} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-gray-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                required
              />

              <FormField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                leftIcon={<Lock size={20} />}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="hover:text-gray-700">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register Staff'}
              </Button>
              <Button type="button" onClick={() => setShowAddForm(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Current Staff</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {totalElements} staff member{totalElements !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value as Role | 'ALL');
                setCurrentPage(0);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value={Role.STAFF}>Staff Only</option>
              <option value={Role.OWNER}>Owner Only</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-gray-600 mt-2">Loading staff members...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No staff members found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {staffList.map(staff => (
                <div key={staff.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{staff.fullName}</h3>
                      <p className="text-sm text-gray-500 mt-1">{staff.email}</p>
                      <p className="text-sm text-gray-500">{staff.phoneNumber}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined: {new Date(staff.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          staff.role === Role.OWNER
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {staff.role}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          staff.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          staff.isEmailVerified
                            ? 'bg-green-100 text-green-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}
                      >
                        {staff.isEmailVerified ? 'Verified' : 'Unverified'}
                      </span>

                      {/* Action buttons - only show for OWNER */}
                      {user?.role === Role.OWNER && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDelete(staff.id)}
                            variant="danger"
                            size="sm"
                            title="Delete staff"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing page {currentPage + 1} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    variant="primary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
