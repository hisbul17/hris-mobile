import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Calendar, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, FileText, Send } from 'lucide-react-native';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
}

export default function LeaveScreen() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const leaveRequests: LeaveRequest[] = [
    {
      id: '1',
      type: 'Annual Leave',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      days: 3,
      reason: 'Family vacation',
      status: 'approved',
      appliedDate: '2024-01-05',
    },
    {
      id: '2',
      type: 'Sick Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-20',
      days: 1,
      reason: 'Medical appointment',
      status: 'pending',
      appliedDate: '2024-01-18',
    },
    {
      id: '3',
      type: 'Personal Leave',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      days: 3,
      reason: 'Personal matters',
      status: 'rejected',
      appliedDate: '2024-01-01',
    },
  ];

  const leaveBalance = {
    annual: { used: 8, total: 21 },
    sick: { used: 2, total: 12 },
    personal: { used: 1, total: 5 },
  };

  const submitLeaveRequest = () => {
    if (!leaveType || !startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Alert.alert('Success', 'Leave request submitted successfully');
    setShowRequestModal(false);
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#16a34a" />;
      case 'rejected':
        return <XCircle size={16} color="#dc2626" />;
      default:
        return <AlertCircle size={16} color="#ea580c" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#dcfce7';
      case 'rejected':
        return '#fee2e2';
      default:
        return '#fed7aa';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#16a34a';
      case 'rejected':
        return '#dc2626';
      default:
        return '#ea580c';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowRequestModal(true)}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leave Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.balanceGradient}
              >
                <Text style={styles.balanceType}>Annual Leave</Text>
                <Text style={styles.balanceNumbers}>
                  {leaveBalance.annual.total - leaveBalance.annual.used} / {leaveBalance.annual.total}
                </Text>
                <Text style={styles.balanceLabel}>Days Available</Text>
              </LinearGradient>
            </View>

            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.balanceGradient}
              >
                <Text style={styles.balanceType}>Sick Leave</Text>
                <Text style={styles.balanceNumbers}>
                  {leaveBalance.sick.total - leaveBalance.sick.used} / {leaveBalance.sick.total}
                </Text>
                <Text style={styles.balanceLabel}>Days Available</Text>
              </LinearGradient>
            </View>

            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['#ea580c', '#dc2626']}
                style={styles.balanceGradient}
              >
                <Text style={styles.balanceType}>Personal</Text>
                <Text style={styles.balanceNumbers}>
                  {leaveBalance.personal.total - leaveBalance.personal.used} / {leaveBalance.personal.total}
                </Text>
                <Text style={styles.balanceLabel}>Days Available</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <View style={styles.requestsList}>
            {leaveRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestTypeContainer}>
                    <FileText size={16} color="#2563eb" />
                    <Text style={styles.requestType}>{request.type}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) },
                    ]}
                  >
                    {getStatusIcon(request.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusTextColor(request.status) },
                      ]}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.requestDateContainer}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.requestDates}>
                      {request.startDate} - {request.endDate}
                    </Text>
                  </View>
                  <View style={styles.requestDurationContainer}>
                    <Clock size={14} color="#6b7280" />
                    <Text style={styles.requestDuration}>
                      {request.days} day{request.days > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <Text style={styles.requestReason}>{request.reason}</Text>

                <Text style={styles.requestAppliedDate}>
                  Applied on {request.appliedDate}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Request Leave Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRequestModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Leave</Text>
            <TouchableOpacity onPress={submitLeaveRequest}>
              <Send size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Leave Type</Text>
              <View style={styles.leaveTypeContainer}>
                {['Annual Leave', 'Sick Leave', 'Personal Leave'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.leaveTypeButton,
                      leaveType === type && styles.leaveTypeButtonActive,
                    ]}
                    onPress={() => setLeaveType(type)}
                  >
                    <Text
                      style={[
                        styles.leaveTypeText,
                        leaveType === type && styles.leaveTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>End Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Please provide a reason for your leave request..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitLeaveRequest}>
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.submitButtonGradient}
              >
                <Send size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
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
  content: {
    flex: 1,
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
  balanceContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  balanceCard: {
    flex: 1,
  },
  balanceGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceType: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceNumbers: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
  },
  requestsList: {
    gap: 16,
    paddingBottom: 24,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  requestDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  requestDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDates: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 6,
  },
  requestDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 6,
  },
  requestReason: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  requestAppliedDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
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
  modalCancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
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
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  leaveTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  leaveTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  leaveTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  leaveTypeTextActive: {
    color: '#ffffff',
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
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
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
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
});