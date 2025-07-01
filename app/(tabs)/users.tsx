import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Filter, CreditCard as Edit, Trash2, Key, Eye, EyeOff, X, Save, Users as UsersIcon, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react-native';
import { userAPI, departmentAPI } from '@/utils/api';

interface User {
  id: number;
  employee_id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
  position?: string;
  department_name?: string;
  department_id?: number;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    password: '',
    role: 'user',
    first_name: '',
    last_name: '',
    phone: '',
    position: '',
    department_id: '',
    hire_date: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedRole, selectedDepartment]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, departmentsResponse] = await Promise.all([
        userAPI.getAllUsers(),
        departmentAPI.getAllDepartments()
      ]);

      setUsers(usersResponse.data.users || []);
      setDepartments(departmentsResponse.data.departments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(user => user.department_id?.toString() === selectedDepartment);
    }

    setFilteredUsers(filtered);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      email: '',
      password: '',
      role: 'user',
      first_name: '',
      last_name: '',
      phone: '',
      position: '',
      department_id: '',
      hire_date: '',
    });
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.employee_id || !formData.email || !formData.password || !formData.first_name || !formData.last_name) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await userAPI.createUser(formData);
      Alert.alert('Success', 'User created successfully');
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData = { ...formData };
      delete updateData.password; // Don't include password in update

      await userAPI.updateUser(selectedUser.id, updateData);
      Alert.alert('Success', 'User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    try {
      await userAPI.resetPassword(selectedUser.id, newPassword);
      Alert.alert('Success', 'Password reset successfully');
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      employee_id: user.employee_id,
      email: user.email,
      password: '',
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      position: user.position || '',
      department_id: user.department_id?.toString() || '',
      hire_date: user.hire_date ? user.hire_date.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#dc2626';
      case 'hrd':
        return '#ea580c';
      default:
        return '#2563eb';
    }
  };

  const getRoleBadgeStyle = (role: string) => ({
    backgroundColor: getRoleColor(role),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <UsersIcon size={28} color="#111827" />
          <Text style={styles.title}>User Management</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Role:</Text>
            <View style={styles.filterButtons}>
              {['all', 'admin', 'hrd', 'user'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterButton,
                    selectedRole === role && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedRole === role && styles.filterButtonTextActive
                    ]}
                  >
                    {role === 'all' ? 'All' : role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Department:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    selectedDepartment === 'all' && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedDepartment('all')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedDepartment === 'all' && styles.filterButtonTextActive
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.filterButton,
                      selectedDepartment === dept.id.toString() && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedDepartment(dept.id.toString())}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedDepartment === dept.id.toString() && styles.filterButtonTextActive
                      ]}
                    >
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.usersList}>
          {filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.first_name} {user.last_name}
                  </Text>
                  <View style={getRoleBadgeStyle(user.role)}>
                    <Text style={styles.roleBadgeText}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(user)}
                  >
                    <Edit size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openPasswordModal(user)}
                  >
                    <Key size={16} color="#ea580c" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.userDetails}>
                <View style={styles.userDetailItem}>
                  <Mail size={14} color="#6b7280" />
                  <Text style={styles.userDetailText}>{user.email}</Text>
                </View>
                <View style={styles.userDetailItem}>
                  <Shield size={14} color="#6b7280" />
                  <Text style={styles.userDetailText}>ID: {user.employee_id}</Text>
                </View>
                {user.phone && (
                  <View style={styles.userDetailItem}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.userDetailText}>{user.phone}</Text>
                  </View>
                )}
                {user.department_name && (
                  <View style={styles.userDetailItem}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.userDetailText}>{user.department_name}</Text>
                  </View>
                )}
                {user.hire_date && (
                  <View style={styles.userDetailItem}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.userDetailText}>
                      Hired: {new Date(user.hire_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.userStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: user.is_active ? '#16a34a' : '#dc2626' }
                  ]}
                />
                <Text style={styles.statusText}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))}

          {filteredUsers.length === 0 && !error && (
            <View style={styles.emptyContainer}>
              <UsersIcon size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedRole !== 'all' || selectedDepartment !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first user to get started'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create User</Text>
            <TouchableOpacity onPress={handleCreateUser}>
              <Save size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Employee ID *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.employee_id}
                onChangeText={(text) => setFormData({ ...formData, employee_id: text })}
                placeholder="Enter employee ID"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>First Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.first_name}
                  onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                  placeholder="First name"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Last Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.last_name}
                  onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                  placeholder="Last name"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Role</Text>
              <View style={styles.roleButtons}>
                {['user', 'hrd', 'admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && styles.roleButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextActive
                      ]}
                    >
                      {role.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Position</Text>
              <TextInput
                style={styles.formInput}
                value={formData.position}
                onChangeText={(text) => setFormData({ ...formData, position: text })}
                placeholder="Job position"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <View style={styles.departmentButtons}>
                <TouchableOpacity
                  style={[
                    styles.departmentButton,
                    !formData.department_id && styles.departmentButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, department_id: '' })}
                >
                  <Text
                    style={[
                      styles.departmentButtonText,
                      !formData.department_id && styles.departmentButtonTextActive
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.departmentButton,
                      formData.department_id === dept.id.toString() && styles.departmentButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, department_id: dept.id.toString() })}
                  >
                    <Text
                      style={[
                        styles.departmentButtonText,
                        formData.department_id === dept.id.toString() && styles.departmentButtonTextActive
                      ]}
                    >
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hire Date</Text>
              <TextInput
                style={styles.formInput}
                value={formData.hire_date}
                onChangeText={(text) => setFormData({ ...formData, hire_date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.createButtonGradient}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>Create User</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity onPress={handleEditUser}>
              <Save size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Similar form fields as create modal, but without password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Employee ID *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.employee_id}
                onChangeText={(text) => setFormData({ ...formData, employee_id: text })}
                placeholder="Enter employee ID"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>First Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.first_name}
                  onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                  placeholder="First name"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Last Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.last_name}
                  onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                  placeholder="Last name"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Role</Text>
              <View style={styles.roleButtons}>
                {['user', 'hrd', 'admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && styles.roleButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextActive
                      ]}
                    >
                      {role.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleEditUser}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.createButtonGradient}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>Update User</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <TouchableOpacity onPress={handleResetPassword}>
              <Save size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.resetPasswordInfo}>
              Reset password for {selectedUser?.first_name} {selectedUser?.last_name}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Password</Text>
              <TextInput
                style={styles.formInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleResetPassword}>
              <LinearGradient
                colors={['#ea580c', '#dc2626']}
                style={styles.createButtonGradient}
              >
                <Key size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>Reset Password</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginLeft: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginLeft: 12,
  },
  filtersContainer: {
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    margin: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  usersList: {
    padding: 24,
    gap: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    gap: 8,
    marginBottom: 12,
  },
  userDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  passwordToggle: {
    paddingHorizontal: 16,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  roleButtonTextActive: {
    color: '#ffffff',
  },
  departmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  departmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  departmentButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  departmentButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  departmentButtonTextActive: {
    color: '#ffffff',
  },
  createButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
  resetPasswordInfo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
});