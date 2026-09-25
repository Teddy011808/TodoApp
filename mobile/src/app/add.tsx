import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { useHabitsContext } from '@/context/HabitsContext'

/** Add screen: the web add-habit form, as its own route. */
export default function AddHabitScreen() {
  const { addHabit } = useHabitsContext()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = name.trim()

  const save = async () => {
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    const message = await addHabit(trimmed)
    setSaving(false)
    if (message !== null) {
      setError(message)
      return
    }
    // Opened as a modal from the list; a deep link to /add has nothing to go back to.
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  return (
    <View className="flex-1 gap-3 bg-bg p-4">
      <Text className="text-sm font-medium text-dim">What habit do you want to build?</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Read 20 pages"
        placeholderTextColor="#6b7483"
        maxLength={80}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        editable={!saving}
        accessibilityLabel="New habit"
        className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-base text-text"
      />
      {error !== null && (
        <Text accessibilityRole="alert" className="text-danger">
          {error}
        </Text>
      )}
      <Pressable
        onPress={() => void save()}
        disabled={!trimmed || saving}
        accessibilityRole="button"
        className={`items-center rounded-xl bg-accent py-3 ${!trimmed || saving ? 'opacity-40' : 'active:opacity-80'}`}
      >
        {saving ? (
          <ActivityIndicator color="#0b1220" />
        ) : (
          <Text className="text-base font-semibold text-accent-ink">Save habit</Text>
        )}
      </Pressable>
    </View>
  )
}
