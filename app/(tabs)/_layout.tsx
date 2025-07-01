import { Tabs } from 'expo-router';
import { Chrome as Home, Clock, CalendarDays, User, Users, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { getAuthToken, authAPI } from '@/utils/api';

export default function TabLayout() {
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const response = await authAPI.getProfile();
          setUserRole(response.data.role);
        }
      } catch (error) {
        console.error('Failed to load user role:', error);
      }
    };

    loadUserRole();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ size, color }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          tabBarIcon: ({ size, color }) => <CalendarDays size={size} color={color} />,
        }}
      />
      {(userRole === 'admin' || userRole === 'hrd') && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
          }}
        />
      )}
      {userRole === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}