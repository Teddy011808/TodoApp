import { Link, Stack } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HabitRow from '@/components/HabitRow'
import { useAuth } from '@/context/AuthContext'
import { useHabitsContext } from '@/context/HabitsContext'
import { shareProgress } from '@/lib/share'
import type { Habit } from '@/types'

/** List screen: the web Habits page's list, as a FlatList. */
export default function HabitListScreen() {
  const { signOut } = useAuth()
  const { habits, loading, refreshing, error, pendingIds, refresh, toggleToday } = useHabitsContext()
  const [note, setNote] = useState<string | null>(null)

  const done = habits.filter((habit) => habit.daily_logs.length > 0).length

  // The single call site of the platform branch.
  const handleShare = async () => {
    const result = await shareProgress(`I've done ${done} of ${habits.length} habits today.`)
    setNote(result === 'copied' ? 'Copied to the clipboard' : null)
  }

  const renderItem = useCallback(
    ({ item }: { item: Habit }) => <HabitRow habit={item} busy={pendingIds.has(item.id)} onToggle={toggleToday} />,
    [pendingIds, toggleToday],
  )

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => void signOut()} accessibilityRole="button" hitSlop={8} className="px-3">
              <Text className="text-dim">Sign out</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        renderItem={renderItem}
        onRefresh={refresh}
        refreshing={refreshing}
        contentContainerClassName="gap-2 p-4"
        ListHeaderComponent={
          <View className="mb-2 gap-2">
            <Text className="text-sm text-dim">
              {loading ? 'Loading…' : `${done} of ${habits.length} done today`}
            </Text>
            {error !== null && (
              <Text accessibilityRole="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-danger">
                {error}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#6aa6ff" className="mt-8" />
          ) : (
            <Text className="mt-8 text-center text-dim">No habits yet — add your first one below.</Text>
          )
        }
      />

      <SafeAreaView edges={['bottom']} className="border-t border-border bg-surface">
        {note !== null && <Text className="px-4 pt-3 text-center text-sm text-ok">{note}</Text>}
        <View className="flex-row gap-3 p-4">
          <Link href="/add" asChild>
            <Pressable accessibilityRole="button" className="flex-1 items-center rounded-xl bg-accent py-3 active:opacity-80">
              <Text className="text-base font-semibold text-accent-ink">+ Add habit</Text>
            </Pressable>
          </Link>
          <Pressable
            onPress={() => void handleShare()}
            accessibilityRole="button"
            className="items-center justify-center rounded-xl border border-border bg-surface-2 px-5 active:opacity-80"
          >
            <Text className="text-base text-text">Share</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}
