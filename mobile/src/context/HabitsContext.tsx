import { createContext, useContext, type ReactNode } from 'react'
import { useHabits } from '@/hooks/useHabits'

type HabitsValue = ReturnType<typeof useHabits>

const HabitsContext = createContext<HabitsValue | null>(null)

/**
 * The List and Add screens are separate routes, but they must share one
 * habits array: a habit saved on Add has to be on the List when you go back.
 * So the state lives here, above both screens, not inside either.
 */
export function HabitsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const value = useHabits(userId)
  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabitsContext(): HabitsValue {
  const context = useContext(HabitsContext)
  if (context === null) throw new Error('useHabitsContext must be called inside a <HabitsProvider>')
  return context
}
