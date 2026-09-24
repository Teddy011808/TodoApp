import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'

/** Same account as the web app — RLS gives this phone exactly the same rows. */
export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setError(null)
    setSubmitting(true)
    const message = await signIn(email.trim(), password)
    setSubmitting(false)
    if (message !== null) setError(message)
    // On success the auth guard in _layout swaps this screen for the list.
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="gap-3 p-6 pt-16" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-bold text-text">◆ Habits</Text>
        <Text className="mb-4 text-dim">Sign in with your web account.</Text>

        <Text className="text-sm font-medium text-dim">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@gmail.com"
          placeholderTextColor="#6b7483"
          accessibilityLabel="Email"
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text"
        />

        <Text className="text-sm font-medium text-dim">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          placeholder="••••••••"
          placeholderTextColor="#6b7483"
          onSubmitEditing={() => void submit()}
          accessibilityLabel="Password"
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text"
        />

        {error !== null && (
          <Text accessibilityRole="alert" className="text-danger">
            {error}
          </Text>
        )}

        <View className="mt-2">
          <Pressable
            onPress={() => void submit()}
            disabled={submitting}
            accessibilityRole="button"
            className="items-center rounded-xl bg-accent py-3 active:opacity-80"
          >
            {submitting ? (
              <ActivityIndicator color="#0b1220" />
            ) : (
              <Text className="text-base font-semibold text-accent-ink">Sign in</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
