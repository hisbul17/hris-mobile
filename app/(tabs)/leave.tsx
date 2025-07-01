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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, Send } from 'lucide-react-native';
import { leaveAPI } from '@/utils/api';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  max_days_per_year: number;
  is_paid: boolean;
}

interface LeaveRequest {
  id: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_date?: string;
  created_at: string;
}

interface LeaveBalance {
  leave_type_name: string;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export default function LeaveScreen() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [typesResponse, requestsResponse, balancesResponse] = await Promise.all([
        leaveAPI.getTypes(),
        leaveAPI.getMyRequests({ limit: 10 }),
        leaveAPI.getMyBalance()
      ]);

      setLeaveTypes(typesResponse.data);
      setLeaveRequests(requestsResponse.data.leave_requests || []);
      setLeaveBalances(balancesResponse.data.balances || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load leave data');
    } finally {
      setIsLoading(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!selectedLeaveType || !startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await leaveAPI.submitRequest({
        leave_type_id: selectedLeaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason
      });

      Alert.alert('Success', 'Leave request submitted successfully');
      setShowRequestModal(false);
      setSelectedLeaveType(null);
      setStartDate('');
      setEndDate('');
      setReason('');
      
      // Reload data
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit leave request');
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading && leaveTypes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leave data...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Leave Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <View style={styles.balanceContainer}>
            {leaveBalances.slice(0, 3).map((balance, index) => (
              <View key={index} style={styles.balanceCard}>
                <LinearGradient
                  colors={index === 0 ? ['#2563eb', '#1d4ed8'] : 
                         index === 1 ? ['#16a34a', '#15803d'] : 
                         ['#ea580c', '#dc2626']}
                  style={styles.balanceGradient}
                >
                  <Text style={styles.balanceType}>{balance.leave_type_name}</Text>
                  <Text style={styles.balanceNumbers}>
                    {balance.remaining_days} / {balance.allocated_days}
                  </Text>
                  <Text style={styles.balanceLabel}>Days Available</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <View style={styles.requestsList}>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTypeContainer}>
                      <FileText size={16} color="#2563eb" />
                      <Text style={styles.requestType}>{request.leave_type_name}</Text>
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
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </Text>
                    </View>
                    <View style={styles.requestDurationContainer}>
                      <Clock size={14} color="#6b7280" />
                      <Text style={styles.requestDuration}>
                        {request.total_days} day{request.total_days > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestReason}>{request.reason}</Text>

                  <Text style={styles.requestAppliedDate}>
                    Applied on {formatDate(request.created_at)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No leave requests found</Text>
            )}
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
            <TouchableOpacity onPress={submitLeaveRequest} disabled={isLoading}>
              <Send size={20} color={isLoading ? "#9ca3af" : "#2563eb"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Leave Type</Text>
              <View style={styles.leaveTypeContainer}>
                {leaveTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.leaveTypeButton,
                      selectedLeaveType === type.id && styles.leaveTypeButtonActive,
                    ]}
                    onPress={() => setSelectedLeaveType(type.id)}
                  >
                    <Text
                      style={[
                        styles.leaveTypeText,
                        selectedLeaveType === type.id && styles.leaveTypeTextActive,
                      ]}
                    >
                      {type.name}
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

            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]} 
              onPress={submitLeaveRequest}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.submitButtonGradient}
              >
                <Send size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </Text>
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
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
    textAlign: 'center',
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
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 32,
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
    gap: 8,
  },
  leaveTypeButton: {
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
  disabledButton: {
    opacity: 0.6,
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