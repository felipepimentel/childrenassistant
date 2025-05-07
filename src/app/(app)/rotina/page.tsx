"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Esquema de validação para o formulário da tarefa
const taskSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Task {
  id: string;
  routine_id?: string; 
  user_id: string;
  child_id: string;
  description: string;
  is_completed: boolean;
  order: number;
  created_at?: string;
}

// Componente SortableTaskItem
function SortableTaskItem({ task, onToggleCompletion, onOpenModal, onDeleteTask }: { task: Task, onToggleCompletion: (task: Task) => void, onOpenModal: (task: Task) => void, onDeleteTask: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="mb-3">
        <Card className="dark:bg-gray-700 flex items-center p-3 shadow-sm hover:shadow-md transition-shadow">
            <button {...listeners} className="mr-2 p-1 cursor-grab touch-none">
                 <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
            <Checkbox
                id={`task-${task.id}`}
                checked={task.is_completed}
                onCheckedChange={() => onToggleCompletion(task)}
                className="mr-3 data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-600 border-gray-400 dark:border-gray-500"
            />
            <label htmlFor={`task-${task.id}`} className={`flex-grow cursor-pointer ${task.is_completed ? "line-through text-gray-500 dark:text-gray-400" : "dark:text-gray-100"}`}>
                {task.description}
            </label>
            <div className="flex items-center space-x-2 ml-2">
                <Button variant="outline" size="icon" onClick={() => onOpenModal(task)} className="dark:hover:bg-gray-600 h-8 w-8">
                    <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-gray-900">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir a tarefa "{task.description}"? Esta ação não poderá ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteTask(task.id)} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Card>
    </div>
  );
}

export default function RotinaPage() {
  const { user } = useAuthStore();
  const { selectedChildId, childrenProfiles } = useProfileStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Permite clique normal sem iniciar drag imediatamente
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      description: "",
    },
  });

  const fetchTasks = async () => {
    if (!user || !selectedChildId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("routine_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("child_id", selectedChildId)
        .order("order", { ascending: true });
      if (error) throw error;
      setTasks(data as Task[] || []);
    } catch (error: any) {
      console.error("Erro ao buscar tarefas da rotina:", error);
      toast({ title: "Erro ao buscar tarefas", description: error.message || "Não foi possível carregar as tarefas.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && selectedChildId) {
      fetchTasks();
    }
  }, [user, selectedChildId]);

  const handleOpenTaskModal = (task: Task | null = null) => {
    setEditingTask(task);
    if (task) {
      form.reset({ description: task.description, id: task.id });
    } else {
      form.reset({ description: "" , id: undefined});
    }
    setIsTaskModalOpen(true);
  };

  async function onSubmitTask(values: TaskFormValues) {
    if (!user || !selectedChildId) {
      toast({ title: "Erro", description: "Usuário ou perfil da criança não selecionado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingTask) {
        const { error } = await supabase
          .from("routine_tasks")
          .update({ description: values.description })
          .eq("id", editingTask.id)
          .eq("user_id", user.id);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Tarefa atualizada com sucesso." });
      } else {
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : -1;
        const { error } = await supabase.from("routine_tasks").insert([
          {
            description: values.description,
            child_id: selectedChildId,
            user_id: user.id,
            is_completed: false,
            order: maxOrder + 1,
          },
        ]);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Tarefa adicionada com sucesso." });
      }
      form.reset({ description: "", id: undefined });
      setIsTaskModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error("Erro ao salvar tarefa:", error);
      toast({ title: "Erro ao salvar tarefa", description: error.message || "Não foi possível salvar a tarefa.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }

  const toggleTaskCompletion = async (task: Task) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("routine_tasks")
        .update({ is_completed: !task.is_completed })
        .eq("id", task.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Tarefa ${!task.is_completed ? "concluída" : "marcada como pendente"}.` });
      fetchTasks();
    } catch (error: any) {
      console.error("Erro ao atualizar status da tarefa:", error);
      toast({ title: "Erro ao atualizar tarefa", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("routine_tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Tarefa excluída com sucesso." });
      fetchTasks();
    } catch (error: any) {
      console.error("Erro ao excluir tarefa:", error);
      toast({ title: "Erro ao excluir tarefa", description: error.message, variant: "destructive" });
    }
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const newTasksOrder = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasksOrder);

      // Atualizar a ordem no Supabase
      const updates = newTasksOrder.map((task, index) => ({
        id: task.id,
        order: index,
      }));

      try {
        const { error } = await supabase.from("routine_tasks").upsert(updates);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Ordem das tarefas atualizada." });
      } catch (error: any) {
        console.error("Erro ao atualizar ordem das tarefas:", error);
        toast({ title: "Erro ao reordenar", description: "Não foi possível salvar a nova ordem.", variant: "destructive" });
        fetchTasks(); // Reverter para a ordem anterior em caso de erro
      }
    }
  }

  const selectedProfile = childrenProfiles.find(p => p.child_id === selectedChildId);

  if (!selectedChildId) {
    return (
      <div className="p-4 md:p-6">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Quadro de Rotina</CardTitle>
            <CardDescription>Selecione um perfil de criança no Dashboard para visualizar ou gerenciar a rotina.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-6">
      <Card className="dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quadro de Rotina - {selectedProfile?.nome_crianca || "Criança"}</CardTitle>
            <CardDescription>Organize as tarefas e atividades diárias. Arraste para reordenar.</CardDescription>
          </div>
          <Button onClick={() => handleOpenTaskModal()} className="dark:bg-blue-600 dark:hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center py-4">Carregando rotina...</p>}
          {!isLoading && tasks.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada. Adicione a primeira!</p>
          )}
          {!isLoading && tasks.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0"> {/* Removido space-y-3 para controle pelo SortableTaskItem */}
                  {tasks.map((task) => (
                    <SortableTaskItem key={task.id} task={task} onToggleCompletion={toggleTaskCompletion} onOpenModal={handleOpenTaskModal} onDeleteTask={handleDeleteTask} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Modal para Adicionar/Editar Tarefa */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarefa" : "Adicionar Nova Tarefa"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Modifique os detalhes da tarefa abaixo." : "Preencha os detalhes da nova tarefa."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitTask)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Tarefa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Escovar os dentes" {...field} className="dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="dark:hover:bg-gray-700">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                  {isSubmitting ? "Salvando..." : (editingTask ? "Salvar Alterações" : "Adicionar Tarefa")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

