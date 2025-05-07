import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from './authStore';

// Tipos para o perfil da criança e do store
export interface ChildProfile {
  child_id: string; // UUID
  user_id: string; // UUID do usuário pai/responsável
  nome_crianca: string;
  data_nascimento: string; // Formato YYYY-MM-DD
  diagnostico_tdah: boolean;
  grau_tdah?: string; // Leve, Moderado, Severo
  informacoes_adicionais?: string;
  avatar_url?: string;
  created_at?: string;
}

interface ProfileState {
  childrenProfiles: ChildProfile[];
  selectedChildId: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchChildrenProfiles: () => Promise<void>;
  addChildProfile: (profileData: Omit<ChildProfile, 'child_id' | 'user_id' | 'created_at'>) => Promise<ChildProfile | null>;
  updateChildProfile: (child_id: string, profileData: Partial<Omit<ChildProfile, 'child_id' | 'user_id' | 'created_at'>>) => Promise<ChildProfile | null>;
  deleteChildProfile: (child_id: string) => Promise<void>;
  setSelectedChildId: (child_id: string | null) => void;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  childrenProfiles: [],
  selectedChildId: null,
  isLoading: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchChildrenProfiles: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      // set({ childrenProfiles: [], isLoading: false, error: new Error('Usuário não autenticado.') });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id)
        .order('nome_crianca', { ascending: true });
      if (error) throw error;
      set({ childrenProfiles: data || [], isLoading: false });
      // Se houver perfis e nenhum selecionado, seleciona o primeiro por padrão
      if (data && data.length > 0 && !get().selectedChildId) {
        set({ selectedChildId: data[0].child_id });
      }
    } catch (error: any) {
      console.error('Error fetching children profiles:', error);
      set({ error, isLoading: false, childrenProfiles: [] });
    }
  },

  addChildProfile: async (profileData) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: new Error('Usuário não autenticado para adicionar perfil.') });
      return null;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('children')
        .insert([{ ...profileData, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        set((state) => ({
          childrenProfiles: [...state.childrenProfiles, data],
          isLoading: false,
        }));
        // Se for o primeiro perfil adicionado, seleciona-o
        if (get().childrenProfiles.length === 1) {
            set({ selectedChildId: data.child_id });
        }
        return data;
      }
      return null;
    } catch (error: any) {
      console.error('Error adding child profile:', error);
      set({ error, isLoading: false });
      return null;
    }
  },

  updateChildProfile: async (child_id, profileData) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: new Error('Usuário não autenticado para atualizar perfil.') });
      return null;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('children')
        .update(profileData)
        .eq('child_id', child_id)
        .eq('user_id', user.id) // Garante que o usuário só atualize seus próprios perfis
        .select()
        .single();
      if (error) throw error;
      if (data) {
        set((state) => ({
          childrenProfiles: state.childrenProfiles.map((p) =>
            p.child_id === child_id ? data : p
          ),
          isLoading: false,
        }));
        return data;
      }
      return null;
    } catch (error: any) {
      console.error('Error updating child profile:', error);
      set({ error, isLoading: false });
      return null;
    }
  },

  deleteChildProfile: async (child_id) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: new Error('Usuário não autenticado para deletar perfil.') });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('child_id', child_id)
        .eq('user_id', user.id);
      if (error) throw error;
      set((state) => ({
        childrenProfiles: state.childrenProfiles.filter((p) => p.child_id !== child_id),
        isLoading: false,
        // Se o perfil deletado era o selecionado, deseleciona ou seleciona outro
        selectedChildId: state.selectedChildId === child_id 
            ? (state.childrenProfiles.filter((p) => p.child_id !== child_id)[0]?.child_id || null) 
            : state.selectedChildId,
      }));
    } catch (error: any) {
      console.error('Error deleting child profile:', error);
      set({ error, isLoading: false });
    }
  },

  setSelectedChildId: (child_id) => set({ selectedChildId: child_id }),
}));

// Opcional: Chamar fetchChildrenProfiles quando o usuário loga
// Isso pode ser feito no listener do authStore ou em um componente de layout
useAuthStore.subscribe(
  (state, prevState) => {
    // Se o usuário acabou de logar (user não era nulo e agora é, ou vice-versa)
    if (state.user && !prevState.user) {
      useProfileStore.getState().fetchChildrenProfiles();
    }
    // Se o usuário deslogou
    if (!state.user && prevState.user) {
      useProfileStore.setState({ childrenProfiles: [], selectedChildId: null, isLoading: false });
    }
  }
);

