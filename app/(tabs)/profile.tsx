import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Phone, MapPin, Calendar, Settings, Bell, Shield, LogOut, CreditCard as Edit, Save, X } from 'lucide-react-native';
import { router } from 'expo-router';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  employeeId: string;
}

export default function ProfileScreen() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    position: 'Software Developer',
    department: 'Engineering',
    joinDate: 'January 15, 2023',
    employeeId: 'EMP001',
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]
    );
  };

  const handleSaveProfile = () => {
    setProfileData(editData);
    setShowEditModal(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const menuItems = [
    {
      icon: <Bell size={20} color="#2563eb" />,
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => Alert.alert('Info', 'Notifications settings'),
    },
    {
      icon: <Shield size={20} color="#2563eb" />,
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      onPress: () => Alert.alert('Info', 'Privacy & Security settings'),
    },
    {
      icon: <Settings size={20} color="#2563eb" />,
      title: 'App Settings',
      subtitle: 'Customize your app experience',
      onPress: () => Alert.alert('Info', 'App settings'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#ffffff" />
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Edit size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profileData.name}</Text>
          <Text style={styles.profilePosition}>{profileData.position}</Text>
          <Text style={styles.profileDepartment}>{profileData.department}</Text>
        </LinearGradient>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileData.email}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.phone}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue}>{profileData.employeeId}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Join Date</Text>
                <Text style={styles.infoValue}>{profileData.joinDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Leave Days Used</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>16</Text>
              <Text style={styles.statLabel}>Leave Days Left</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>{item.icon}</View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
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
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Save size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={editData.name}
                onChangeText={(text) => setEditData({ ...editData, name: text })}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={editData.email}
                onChangeText={(text) => setEditData({ ...editData, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={editData.phone}
                onChangeText={(text) => setEditData({ ...editData, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Position</Text>
              <TextInput
                style={styles.formInput}
                value={editData.position}
                onChangeText={(text) => setEditData({ ...editData, position: text })}
                placeholder="Enter your position"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <TextInput
                style={styles.formInput}
                value={editData.department}
                onChangeText={(text) => setEditData({ ...editData, department: text })}
                placeholder="Enter your department"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.saveButtonGradient}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  editButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#e5e7eb',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e5e7eb',
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#dc2626',
    marginLeft: 8,
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
    marginBottom: 24,
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
  saveButton: {
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
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
});