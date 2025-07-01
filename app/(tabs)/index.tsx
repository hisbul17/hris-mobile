import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Calendar, CheckCircle, AlertCircle, TrendingUp, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { attendanceAPI, leaveAPI, authAPI } from '@/utils/api';

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [profileResponse, statusResponse, summaryResponse, balanceResponse] = await Promise.all([
        authAPI.getProfile(),
        attendanceAPI.getTodayStatus(),
        attendanceAPI.getSummary(),
        leaveAPI.getMyBalance()
      ]);

      setUserProfile(profileResponse.data);
      setTodayStatus(statusResponse.data);
      setAttendanceSummary(summaryResponse.data);
      setLeaveBalance(balanceResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCheckIn = () => {
    router.push('/(tabs)/attendance');
  };

  const handleRequestLeave = () => {
    router.push('/(tabs)/leave');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : 'User';
  const attendancePercentage = attendanceSummary?.summary?.attendance_percentage || 0;
  const totalLeaveUsed = leaveBalance?.balances?.reduce((sum: number, balance: any) => sum + parseFloat(balance.used_days || 0), 0) || 0;
  const totalLeaveRemaining = leaveBalance?.balances?.reduce((sum: number, balance: any) => sum + parseFloat(balance.remaining_days || 0), 0) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.header}
        >
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.date}>{currentDate}</Text>
          <Text style={styles.time}>{currentTime}</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionCard, styles.checkInCard]} onPress={handleQuickCheckIn}>
              <View style={styles.actionIcon}>
                <Clock size={24} color="#16a34a" />
              </View>
              <Text style={styles.actionTitle}>
                {todayStatus?.is_checked_in ? 'Check Out' : 'Check In'}
              </Text>
              <Text style={styles.actionSubtitle}>
                {todayStatus?.is_checked_in ? 'End your day' : 'Start your day'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.leaveCard]} onPress={handleRequestLeave}>
              <View style={styles.actionIcon}>
                <Calendar size={24} color="#ea580c" />
              </View>
              <Text style={styles.actionTitle}>Request Leave</Text>
              <Text style={styles.actionSubtitle}>Apply for time off</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.statusLabel}>Location</Text>
                <Text style={styles.statusValue}>Office</Text>
              </View>
              <View style={styles.statusItem}>
                {todayStatus?.is_checked_in ? (
                  <CheckCircle size={16} color="#16a34a" />
                ) : (
                  <AlertCircle size={16} color="#ea580c" />
                )}
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={styles.statusValue}>
                  {todayStatus?.is_checked_in ? 'Present' : 'Not Checked In'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Clock size={16} color="#2563eb" />
                <Text style={styles.statusLabel}>Check In</Text>
                <Text style={styles.statusValue}>
                  {todayStatus?.attendance?.check_in_time ? 
                    new Date(todayStatus.attendance.check_in_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '--:--'}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <TrendingUp size={16} color="#ea580c" />
                <Text style={styles.statusLabel}>Working Hours</Text>
                <Text style={styles.statusValue}>
                  {todayStatus?.attendance?.working_hours ? 
                    `${parseFloat(todayStatus.attendance.working_hours).toFixed(1)}h` : '0h'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {todayStatus?.attendance?.check_in_time && (
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, styles.successIcon]}>
                  <CheckCircle size={16} color="#16a34a" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Check-in recorded</Text>
                  <Text style={styles.activityTime}>
                    Today at {new Date(todayStatus.attendance.check_in_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, styles.infoIcon]}>
                <AlertCircle size={16} color="#2563eb" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Dashboard loaded</Text>
                <Text style={styles.activityTime}>Just now</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {attendanceSummary?.summary?.present_days || 0}
              </Text>
              <Text style={styles.statLabel}>Days Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{Math.round(totalLeaveUsed)}</Text>
              <Text style={styles.statLabel}>Days Leave</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{Math.round(attendancePercentage)}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  time: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
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
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
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
  checkInCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  leaveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  statusCard: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successIcon: {
    backgroundColor: '#dcfce7',
  },
  warningIcon: {
    backgroundColor: '#fed7aa',
  },
  infoIcon: {
    backgroundColor: '#dbeafe',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
});