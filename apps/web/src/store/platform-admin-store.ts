import { create } from 'zustand'

interface Movement {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  banner?: string
  website?: string
  isActive: boolean
  supportGroupsCount: number
  membersCount: number
  superAdmins?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string
  }>
  createdAt: string
  updatedAt?: string
}

interface PlatformStats {
  totalMovements: number
  totalSupportGroups: number
  totalUsers: number
  totalPosts: number
  totalEvents: number
  activeUsersToday: number
  newUsersThisWeek: number
  movementSummaries: Array<{
    id: string
    name: string
    supportGroupsCount: number
    membersCount: number
  }>
}

interface PlatformAdminState {
  movements: Movement[]
  selectedMovement: Movement | null
  platformStats: PlatformStats | null
  setMovements: (movements: Movement[]) => void
  setSelectedMovement: (movement: Movement | null) => void
  setPlatformStats: (stats: PlatformStats) => void
  addMovement: (movement: Movement) => void
  updateMovement: (id: string, updates: Partial<Movement>) => void
  removeMovement: (id: string) => void
}

export const usePlatformAdminStore = create<PlatformAdminState>((set) => ({
  movements: [],
  selectedMovement: null,
  platformStats: null,
  setMovements: (movements) => set({ movements }),
  setSelectedMovement: (movement) => set({ selectedMovement: movement }),
  setPlatformStats: (stats) => set({ platformStats: stats }),
  addMovement: (movement) =>
    set((state) => ({ movements: [...state.movements, movement] })),
  updateMovement: (id, updates) =>
    set((state) => ({
      movements: state.movements.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
      selectedMovement:
        state.selectedMovement?.id === id
          ? { ...state.selectedMovement, ...updates }
          : state.selectedMovement,
    })),
  removeMovement: (id) =>
    set((state) => ({
      movements: state.movements.filter((m) => m.id !== id),
      selectedMovement:
        state.selectedMovement?.id === id ? null : state.selectedMovement,
    })),
}))
