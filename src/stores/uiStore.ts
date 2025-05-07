import { create } from 'zustand';

// Tipos para o estado e ações do store da UI
interface UIState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  modalState: {
    isOpen: boolean;
    modalType: string | null; // Ex: 'addReminder', 'editProfile'
    modalProps?: any; // Propriedades específicas para o modal
  };
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalType: string, modalProps?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false, // Pode ser true por padrão em desktop, gerenciado por media query ou no componente
  theme: 'system', // Padrão do sistema
  modalState: {
    isOpen: false,
    modalType: null,
    modalProps: {},
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setTheme: (theme) => {
    set({ theme });
    // Lógica para aplicar o tema no HTML (ex: adicionar/remover classe 'dark')
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
      localStorage.setItem('app-theme', theme);
    }
  },

  openModal: (modalType, modalProps = {}) => set({ modalState: { isOpen: true, modalType, modalProps } }),

  closeModal: () => set({ modalState: { isOpen: false, modalType: null, modalProps: {} } }),
}));

// Opcional: Carregar o tema do localStorage ao iniciar
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' | null;
  if (storedTheme) {
    useUIStore.getState().setTheme(storedTheme);
  }
}

