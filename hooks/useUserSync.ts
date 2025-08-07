export function useUserSync(options?: { autoSync?: boolean }) {
  return {
    syncUser: (user?: any) => Promise.resolve({ success: true, error: null, profile: null }),
    forceSync: (user?: any) => Promise.resolve({ success: true, error: null }),
    isSyncing: false
  }
}
