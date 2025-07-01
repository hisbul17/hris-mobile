import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Calendar, CircleCheck as CheckCircle, CircleAlert as AlertCircle, TrendingUp, MapPin } from 'lucide-react-native';

export default function HomeScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.header}
        >
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.date}>{currentDate}</Text>
          <Text style={styles.time}>{currentTime}</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionCard, styles.checkInCard]}>
              <View style={styles.actionIcon}>
                <Clock size={24} color="#16a34a" />
              </View>
              <Text style={styles.actionTitle}>Check In</Text>
              <Text style={styles.actionSubtitle}>Start your day</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.leaveCard]}>
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
                <CheckCircle size={16} color="#16a34a" />
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={styles.statusValue}>Present</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Clock size={16} color="#2563eb" />
                <Text style={styles.statusLabel}>Check In</Text>
                <Text style={styles.statusValue}>08:30 AM</Text>
              </View>
              <View style={styles.statusItem}>
                <TrendingUp size={16} color="#ea580c" />
                <Text style={styles.statusLabel}>Working Hours</Text>
                <Text style={styles.statusValue}>2h 30m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, styles.successIcon]}>
                <CheckCircle size={16} color="#16a34a" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Check-in recorded</Text>
                <Text style={styles.activityTime}>Today at 08:30 AM</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, styles.warningIcon]}>
                <Calendar size={16} color="#ea580c" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Leave request pending</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, styles.infoIcon]}>
                <AlertCircle size={16} color="#2563eb" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Monthly report available</Text>
                <Text style={styles.activityTime}>1 week ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>22</Text>
              <Text style={styles.statLabel}>Days Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Days Leave</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>98%</Text>
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