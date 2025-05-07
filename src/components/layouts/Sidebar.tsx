"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, ListChecks, Bell, User, Settings, LogOut, Grip, Library, Users, AlertOctagon, School, MessageSquare, BarChart3, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/diario", label: "Diário de Bordo", icon: CalendarDays },
  { href: "/rotina", label: "Quadro de Rotina", icon: ListChecks },
  { href: "/lembretes", label: "Lembretes", icon: Bell },
  { href: "/perfil-familiar", label: "Perfil Familiar", icon: User },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/atividades", label: "Atividades", icon: Grip },
  { href: "/crises", label: "Gerenciar Crises", icon: AlertOctagon },
  { href: "/escola", label: "Escola", icon: School },
  { href: "/experiencias", label: "Experiências", icon: MessageSquare }, // Adicionado ícone genérico
  { href: "/medicacao", label: "Medicação", icon: Bot }, // Ícone placeholder, idealmente um ícone de pílula/remédio
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/assistente-ia", label: "Assistente IA", icon: Bot },
];

const bottomNavItems = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  const handleSignOut = async () => {
    await signOut();
    // O redirecionamento será tratado pelo AppLayout ou pela página de login
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col`}
    >
      <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          TDAH Comp.
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => { if (isSidebarOpen) toggleSidebar()} } // Fecha sidebar no mobile ao clicar
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150
                ${isActive
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                }`}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 space-y-2">
        {bottomNavItems.map((item) => {
           const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => { if (isSidebarOpen) toggleSidebar()} }
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150
              ${isActive
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full flex items-center justify-start px-3 py-2.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          Sair
        </Button>
      </div>
    </aside>
  );
}

