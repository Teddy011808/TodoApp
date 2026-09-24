import { memo } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Habit } from '@/types'

interface HabitRowProps {
  habit: Habit
  busy: boolean
  onToggle: (habit: Habit) => void
}

/** The web HabitItem's checkbox + label, rebuilt from View/Text/Pressable. */
function HabitRow({ habit, busy, onToggle }: HabitRowProps) {
  const done = habit.daily_logs.length > 0

  return (
    <Pressable
      onPress={() => onToggle(habit)}
      disabled={busy}
      // aria-* props work on iOS, Android AND web; the older accessibilityState
      // is dropped by react-native-web, so screen readers there wouldn't know
      // which habits are ticked.
      role="checkbox"
      aria-checked={done}
      aria-disabled={busy}
      aria-label={`${habit.name} done today`}
      className={`flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 active:bg-surface-2 ${busy ? 'opacity-60' : ''}`}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-md border-2 ${done ? 'border-accent bg-accent' : 'border-dim'}`}
      >
        {done && <Text className="text-sm font-bold text-accent-ink">✓</Text>}
      </View>
      <Text className={`flex-1 text-base ${done ? 'text-dim line-through' : 'text-text'}`}>{habit.name}</Text>
    </Pressable>
  )
}

// FlatList re-renders rows on every list change; skip rows whose props didn't.
export default memo(HabitRow)
