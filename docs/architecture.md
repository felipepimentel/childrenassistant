# Arquitetura do Projeto TDAH Companheiro (Next.js)

Data: 07/05/2025

## 1. Visão Geral

Este documento descreve a arquitetura planejada para o frontend do projeto "TDAH Companheiro", reconstruído com Next.js, React, Zustand, Tailwind CSS e Shadcn/UI. O objetivo é criar uma aplicação modular, escalável, de fácil manutenção e com uma excelente experiência de usuário.

## 2. Estrutura de Pastas Principal (Dentro de `/home/ubuntu/tdah_companheiro_nextjs/src`)

```
src/
├── app/                # Rotas e Páginas (Next.js App Router)
│   ├── (auth)/           # Rotas de autenticação (ex: login, cadastro)
│   │   ├── login/
│   │   └── cadastro/
│   ├── (app)/            # Rotas protegidas da aplicação principal
│   │   ├── dashboard/
│   │   ├── diario/
│   │   ├── rotina/
│   │   ├── lembretes/
│   │   ├── perfil-familiar/
│   │   ├── configuracoes/
│   │   └── layout.tsx      # Layout principal da aplicação
│   ├── api/              # Rotas de API do Next.js (se necessário para backend-for-frontend)
│   └── layout.tsx        # Layout raiz
├── components/         # Componentes React
│   ├── ui/               # Componentes Shadcn/UI (gerenciados pelo CLI)
│   ├── layouts/          # Componentes de Layout (ex: AppShell, Sidebar, Header)
│   ├── shared/           # Componentes genéricos reutilizáveis (ex: CustomButton, Modal, LoadingSpinner)
│   └── features/         # Componentes específicos de uma funcionalidade/módulo
│       ├── auth/
│       ├── diary/
│       ├── routine/
│       └── ... (outros módulos)
├── hooks/              # Hooks React personalizados
│   ├── useAuth.ts
│   ├── useSupabaseQuery.ts
│   └── ... (outros hooks para lógica de UI, dados, etc.)
├── lib/                # Funções utilitárias e clientes de serviços
│   ├── supabaseClient.ts # Configuração do cliente Supabase
│   ├── utils.ts          # Funções utilitárias gerais
│   └── shadcn.ts         # Configuração relacionada ao Shadcn (geralmente gerado)
├── stores/             # Stores Zustand para gerenciamento de estado global
│   ├── authStore.ts
│   ├── profileStore.ts
│   ├── uiStore.ts
│   └── ... (outros stores específicos por feature, se necessário)
├── types/              # Definições TypeScript
│   ├── index.ts
│   ├── supabase.ts       # Tipos gerados pelo Supabase (se aplicável)
│   └── ... (tipos para entidades, props, etc.)
└── styles/             # Estilos globais (global.css, tailwind.config.js)
    ├── globals.css
```

## 3. Componentes (`src/components`)

*   **`ui/`**: Contém os componentes da biblioteca Shadcn/UI, adicionados via CLI (`pnpm dlx shadcn@latest add [component-name]`). Estes são blocos de construção fundamentais para a UI.
*   **`layouts/`**: Componentes responsáveis pela estrutura visual principal das páginas. Ex: `AppLayout.tsx` (incluindo Sidebar, Header, Footer para páginas autenticadas), `AuthLayout.tsx` (para páginas de login/cadastro).
*   **`shared/`**: Componentes de UI genéricos e reutilizáveis em toda a aplicação, que não são específicos de uma feature. Ex: `Avatar.tsx`, `ConfirmDialog.tsx`, `DataGrid.tsx`, `PageHeader.tsx`.
*   **`features/[featureName]/`**: Componentes específicos para uma determinada funcionalidade ou módulo da aplicação. Ex: `features/diary/DiaryEntryForm.tsx`, `features/routine/RoutineTaskList.tsx`. Isso ajuda a manter a coesão e facilita a localização de componentes relacionados a um módulo específico.

## 4. Hooks (`src/hooks`)

*   Hooks personalizados para encapsular lógica reutilizável.
*   **Exemplos:**
    *   `useAuth()`: Para acessar informações do usuário logado e funções de login/logout.
    *   `useProfile()`: Para gerenciar dados do perfil familiar e dos filhos.
    *   `useMediaQuery()`: Para lógica responsiva em componentes.
    *   `useForm()`: Um hook genérico para gerenciamento de formulários (se não usar uma lib específica como React Hook Form).
    *   Hooks específicos para buscar dados do Supabase, encapsulando a lógica de fetch, estado de loading e erros (ex: `useDiaryEntries(childId)`).

## 5. Stores Zustand (`src/stores`)

*   Para gerenciamento de estado global ou estados que precisam ser compartilhados entre componentes distantes na árvore.
*   **Exemplos de Stores:**
    *   `authStore.ts`: Armazena o estado da sessão do usuário (logado/deslogado), informações do usuário (`User` do Supabase).
    *   `profileStore.ts`: Armazena os perfis dos filhos, o perfil familiar selecionado.
    *   `uiStore.ts`: Armazena estados relacionados à interface do usuário, como estado de modais globais, tema (claro/escuro), estado do menu lateral (aberto/fechado em mobile).
    *   Poderão ser criados stores específicos para features complexas se necessário, para evitar sobrecarregar stores globais.

## 6. Integração com Supabase

*   **Cliente Supabase (`src/lib/supabaseClient.ts`):**
    *   O cliente Supabase será inicializado neste arquivo, utilizando variáveis de ambiente para a URL do projeto e a chave anônima pública (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
*   **Autenticação:**
    *   Utilizará o `supabase-js` para interagir com o Supabase Auth.
    *   A lógica de autenticação (login, cadastro, logout, gerenciamento de sessão) será encapsulada no `authStore` e/ou `useAuth` hook.
    *   Rotas de API do Next.js (`src/app/api/auth/...`) podem ser usadas para lidar com callbacks de OAuth ou operações server-side relacionadas à autenticação, se necessário.
*   **Operações de Dados (CRUD):**
    *   As interações com as tabelas do Supabase (diário, rotina, lembretes, etc.) serão feitas através de funções assíncronas, possivelmente encapsuladas em hooks específicos (ex: `useDiaryService`) ou diretamente nos componentes/páginas server-side (Server Components) ou Client Components que necessitem dos dados.
    *   Tipos para as tabelas do Supabase podem ser gerados usando `supabase gen types typescript > src/types/supabase.ts` para garantir type safety.

## 7. Páginas e Rotas (`src/app`)

*   Utilização do **App Router** do Next.js.
*   **Layouts de Rota:**
    *   `src/app/layout.tsx`: Layout raiz global (inclui `<html>`, `<body>`, provedores globais).
    *   `src/app/(app)/layout.tsx`: Layout para as páginas autenticadas da aplicação (inclui `AppLayout` com sidebar, header, etc.).
    *   `src/app/(auth)/layout.tsx`: Layout para as páginas de autenticação.
*   **Convenções:**
    *   `page.tsx`: Componente principal da rota.
    *   `loading.tsx`: UI de carregamento para a rota (usando Suspense).
    *   `error.tsx`: UI de erro para a rota.
*   **Server Components e Client Components:** Utilizar Server Components por padrão para buscar dados e renderizar no servidor sempre que possível. Usar Client Components (`'use client'`) para interatividade, hooks de estado (useState, useEffect) e acesso a APIs do navegador.

## 8. Tipos (`src/types`)

*   `index.ts`: Exporta todos os tipos principais.
*   `supabase.ts`: Tipos gerados a partir do schema do Supabase (via CLI).
*   Arquivos específicos para tipos de entidades da aplicação (ex: `User.ts`, `DiaryEntry.ts`, `RoutineTask.ts`) e props de componentes complexos.

## 9. Estilização

*   **Tailwind CSS:** Principal ferramenta para estilização utilitária.
*   **Shadcn/UI:** Biblioteca de componentes pré-construídos e customizáveis, baseados em Tailwind CSS e Radix UI.
*   **`src/styles/globals.css`:** Para estilos globais mínimos, customizações de base do Tailwind e variáveis CSS (se necessário).
*   **`tailwind.config.js`:** Configuração do Tailwind CSS (temas, plugins).

## 10. Próximos Passos Imediatos (Pós-Arquitetura)

1.  Criar a estrutura de pastas conforme definido.
2.  Configurar o `supabaseClient.ts`.
3.  Implementar o `authStore.ts` com Zustand.
4.  Criar os layouts básicos (`AppLayout`, `AuthLayout`).
5.  Começar a implementação das páginas de autenticação (`login`, `cadastro`).

