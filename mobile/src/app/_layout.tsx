import '../../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { HabitsProvider } from '@/context/HabitsContext'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

/** The web app's ProtectedRoute, as Expo Router guards. */
function RootStack() {
  const { user, loading } = useAuth()

  // Restoring the saved session: deciding now would flash the sign-in screen.
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6aa6ff" />
      </View>
    )
  }

  const stack = (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#171a21' },
        headerTintColor: '#e8eaed',
        contentStyle: { backgroundColor: '#0f1115' },
      }}
    >
      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="index" options={{ title: 'Habits' }} />
        <Stack.Screen name="add" options={{ title: 'New habit', presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={user === null}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )

  // Habits state sits above List and Add so both screens share one array.
  return user ? <HabitsProvider userId={user.id}>{stack}</HabitsProvider> : stack
}
