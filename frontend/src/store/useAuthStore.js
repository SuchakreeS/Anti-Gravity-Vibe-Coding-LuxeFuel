import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      rememberMe: false,
      login: (user, token, rememberMe) => set({ 
        user, 
        token, 
        rememberMe 
      }),
      logout: () => {
        set({ user: null, token: null, rememberMe: false });
        window.location.href = '/login';
      },
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      // Role & Plan helpers
      isAdmin: () => {
        const user = get().user;
        return user?.role === 'ADMIN' || user?.role === 'admin';
      },
      isDriver: () => get().user?.role === 'DRIVER',
      isOrgUser: () => ['ADMIN', 'DRIVER', 'USER', 'admin', 'user'].includes(get().user?.role),
      isIndividual: () => get().user?.role === 'INDIVIDUAL' || !get().user?.role || get().user?.role === 'individual',
      isOrgMember: () => get().isOrgUser(),
      
      // Feature Gating
      hasPlan: (requiredPlan) => {
        const user = get().user;
        const currentPlan = (user?.orgPlan || user?.plan || 'FREE').toUpperCase();
        const plans = ['FREE', 'PRO', 'ENTERPRISE'];
        return plans.indexOf(currentPlan) >= plans.indexOf(requiredPlan.toUpperCase());
      },
      canAccessMaintenance: () => get().hasPlan('PRO'),
      canExportPDF: () => get().hasPlan('PRO'),
      canAccessAuditLog: () => get().hasPlan('ENTERPRISE') && get().isAdmin(),
    }),
    {
      name: 'luxefuel-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
