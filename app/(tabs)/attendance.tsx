import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, MapPin, Clock, CircleCheck as CheckCircle, Circle as XCircle, RotateCcw } from 'lucide-react-native';
import { attendanceAPI } from '@/utils/api';

export default function AttendanceScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadTodayStatus();
  }, []);

  const loadTodayStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus();
      setTodayStatus(response.data);
      setIsCheckedIn(response.data.is_checked_in || false);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance status');
    }
  };

  const handleAttendance = async () => {
    if (Platform.OS === 'web') {
      // For web platform, skip camera and directly handle attendance
      await handleAttendanceAction();
      return;
    }

    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is required for attendance.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleAttendanceAction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isCheckedIn) {
        // Check out
        await attendanceAPI.checkOut({
          check_out_location: { latitude: 0, longitude: 0 }, // Mock location for web
          notes: 'Checked out via mobile app'
        });
        setIsCheckedIn(false);
        Alert.alert('Success', 'Successfully checked out!');
      } else {
        // Check in
        await attendanceAPI.checkIn({
          check_in_location: { latitude: 0, longitude: 0 }, // Mock location for web
          notes: 'Checked in via mobile app'
        });
        setIsCheckedIn(true);
        Alert.alert('Success', 'Successfully checked in!');
      }
      
      // Reload status
      await loadTodayStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to process attendance');
      Alert.alert('Error', err.message || 'Failed to process attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        console.log('Photo taken:', photo);
        
        setShowCamera(false);
        await handleAttendanceAction();
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>{currentDate}</Text>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadTodayStatus}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Status */}
        <View style={styles.statusContainer}>
          <LinearGradient
            colors={isCheckedIn ? ['#16a34a', '#15803d'] : ['#6b7280', '#4b5563']}
            style={styles.statusCard}
          >
            <View style={styles.statusIcon}>
              {isCheckedIn ? (
                <CheckCircle size={32} color="#ffffff" />
              ) : (
                <XCircle size={32} color="#ffffff" />
              )}
            </View>
            <Text style={styles.statusTitle}>
              {isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </Text>
            <Text style={styles.statusTime}>{currentTime}</Text>
          </LinearGradient>
        </View>

        {/* Location Info */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <MapPin size={20} color="#2563eb" />
            <Text style={styles.locationTitle}>Work Location</Text>
          </View>
          <Text style={styles.locationAddress}>
            Main Office Building{'\n'}
            123 Business Street, City Center
          </Text>
          <View style={styles.locationStatus}>
            <View style={styles.locationDot} />
            <Text style={styles.locationStatusText}>You are in range</Text>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleTitle}>Today's Schedule</Text>
          <View style={styles.scheduleItem}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.scheduleText}>Working Hours: 09:00 AM - 06:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.scheduleText}>Break Time: 12:00 PM - 01:00 PM</Text>
          </View>
        </View>

        {/* Attendance Button */}
        <TouchableOpacity 
          style={styles.attendanceButton} 
          onPress={handleAttendance}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isCheckedIn ? ['#dc2626', '#b91c1c'] : ['#2563eb', '#1d4ed8']}
            style={[styles.attendanceButtonGradient, isLoading && styles.disabledButton]}
          >
            <Camera size={24} color="#ffffff" />
            <Text style={styles.attendanceButtonText}>
              {isLoading ? 'Processing...' : (isCheckedIn ? 'Check Out' : 'Check In')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Attendance */}
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>Recent Attendance</Text>
          {todayStatus?.attendance ? (
            <View style={styles.recentItem}>
              <View style={styles.recentDate}>
                <Text style={styles.recentDateText}>Today</Text>
              </View>
              <View style={styles.recentDetails}>
                <Text style={styles.recentTime}>
                  Check In: {todayStatus.attendance.check_in_time ? 
                    new Date(todayStatus.attendance.check_in_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not checked in'}
                </Text>
                <Text style={styles.recentStatus}>
                  {todayStatus.attendance.check_out_time ? 'Completed' : 'Working'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No attendance record for today</Text>
          )}
        </View>
      </View>

      {/* Camera Modal */}
      {Platform.OS !== 'web' && (
        <Modal visible={showCamera} animationType="slide">
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <TouchableOpacity
                    style={styles.cameraCloseButton}
                    onPress={() => setShowCamera(false)}
                  >
                    <XCircle size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>Take Attendance Photo</Text>
                  <TouchableOpacity
                    style={styles.cameraFlipButton}
                    onPress={toggleCameraFacing}
                  >
                    <RotateCcw size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cameraFrame}>
                  <View style={styles.frameCorner} />
                  <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                  <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                  <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
                </View>

                <View style={styles.cameraFooter}>
                  <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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
  statusContainer: {
    marginBottom: 24,
  },
  statusCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  statusTime: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    opacity: 0.9,
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 8,
  },
  locationStatusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#16a34a',
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
  },
  attendanceButton: {
    marginBottom: 24,
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
  attendanceButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  attendanceButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 12,
  },
  recentCard: {
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
  recentTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recentDate: {
    width: 80,
  },
  recentDateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  recentDetails: {
    flex: 1,
  },
  recentTime: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  recentStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#16a34a',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cameraFlipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 60,
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#ffffff',
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
  },
});