import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

// Defina os tipos para o estado e ações do store de autenticação
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signInWithPassword: (email_value: string, password_value: string) => Promise<void>;
  signUpWithPassword: (email_value: string, password_value: string, user_metadata?: object) => Promise<void>;
  signOut: () => Promise<void>;
  listenToAuthChanges: () => { data: { subscription: any } }; // Ajustado para o tipo correto
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true, // Começa como true para carregar a sessão inicial
      error: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      clearError: () => set({ error: null }),

      signInWithPassword: async (email_value, password_value) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email_value,
            password: password_value,
          });
          if (error) throw error;
          if (data.user) set({ user: data.user, session: data.session, isLoading: false });
          else set({ isLoading: false }); // Caso não haja usuário, mas sem erro explícito
        } catch (error: any) {
          console.error('Error signing in:', error);
          set({ error, isLoading: false, user: null, session: null });
        }
      },

      signUpWithPassword: async (email_value, password_value, user_metadata = {}) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email_value,
            password: password_value,
            options: {
              data: user_metadata, // Para nome, etc.
            },
          });
          if (error) throw error;
          // O Supabase pode enviar um email de confirmação, o usuário não estará logado imediatamente
          // ou pode estar se a confirmação automática estiver habilitada.
          // Atualizamos o estado com base na resposta.
          if (data.user) {
            set({ user: data.user, session: data.session, isLoading: false });
          } else {
            // Pode ser que o usuário precise confirmar o email.
            // Você pode querer um estado específico para "aguardando confirmação"
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Error signing up:', error);
          set({ error, isLoading: false, user: null, session: null });
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, session: null, isLoading: false });
        } catch (error: any) {
          console.error('Error signing out:', error);
          set({ error, isLoading: false });
        }
      },

      listenToAuthChanges: () => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            console.log('Auth event:', event, session);
            set({ session, user: session?.user ?? null, isLoading: false });
          }
        );
        // Carregar a sessão inicial ao iniciar o listener
        supabase.auth.getSession().then(({ data: { session } }) => {
            set({ session, user: session?.user ?? null, isLoading: false });
        });
        return authListener;
      },
    }),
    {
      name: 'auth-storage', // Nome da chave no localStorage
      storage: createJSONStorage(() => localStorage), // Usar localStorage para persistência
      partialize: (state) => ({ user: state.user, session: state.session }), // Apenas persistir user e session
    }
  )
);

// Chamar listenToAuthChanges uma vez quando o store é importado pela primeira vez
// Isso garante que o listener seja configurado assim que a aplicação carregar o store.
// No Next.js, isso geralmente acontece no _app.tsx ou em um layout global.
// Para evitar múltiplas chamadas, pode-se usar um HOC ou um provider.
// Por simplicidade aqui, vamos assumir que será chamado em um local apropriado.
// Exemplo: Em um componente de layout global:
// useEffect(() => {
//   const { data: { subscription } } = useAuthStore.getState().listenToAuthChanges();
//   return () => subscription.unsubscribe();
// }, []);

