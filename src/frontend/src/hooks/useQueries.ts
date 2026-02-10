import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type { Habit, Completion, UserProfile, Category } from "../backend";

// Get caller's user profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  // Return custom state that properly reflects actor dependency
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// Save caller's user profile
export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Get all habits
export function useHabits() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHabits();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

// Get completions for a specific habit
export function useHabitCompletions(habitId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<Completion[]>({
    queryKey: ["completions", habitId],
    queryFn: async () => {
      if (!actor) return [];
      const completions = await actor.getHabitCompletions(habitId);
      // Get the most recent completion for each date
      const completionMap = new Map<string, Completion>();
      completions.forEach((completion) => {
        const existing = completionMap.get(completion.date);
        if (!existing || completion.completed !== existing.completed) {
          completionMap.set(completion.date, completion);
        }
      });
      return Array.from(completionMap.values());
    },
    enabled: !!actor && !isFetching && !!habitId && isAuthenticated,
  });
}

// Create a new habit
export function useCreateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color, category }: { name: string; color: string; category: Category }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createHabit(name, color, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

// Update habit details
export function useUpdateHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
      category,
    }: {
      id: string;
      name: string;
      color: string;
      category: Category;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHabit(id, name, color, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

// Mark habit completion with optimistic updates
export function useMarkCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.markCompletion(habitId, date, completed);
      return { result, habitId, date, completed };
    },
    onMutate: async ({ habitId, date, completed }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["completions", habitId] });

      // Snapshot the previous value
      const previousCompletions = queryClient.getQueryData<Completion[]>([
        "completions",
        habitId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Completion[]>(
        ["completions", habitId],
        (old = []) => {
          // Create a map of existing completions by date
          const completionMap = new Map<string, Completion>();
          old.forEach((completion) => {
            completionMap.set(completion.date, completion);
          });

          // Update or add the completion for this date
          const newCompletion: Completion = {
            habitId,
            date,
            completed,
          };
          completionMap.set(date, newCompletion);

          return Array.from(completionMap.values());
        },
      );

      // Return a context object with the snapshotted value
      return { previousCompletions, habitId };
    },
    onSuccess: (data, variables) => {
      // Update the cache with the successful result to ensure consistency
      queryClient.setQueryData<Completion[]>(
        ["completions", variables.habitId],
        (old = []) => {
          const completionMap = new Map<string, Completion>();
          old.forEach((completion) => {
            completionMap.set(completion.date, completion);
          });

          // Ensure the successful completion is in the cache
          const successfulCompletion: Completion = {
            habitId: variables.habitId,
            date: variables.date,
            completed: variables.completed,
          };
          completionMap.set(variables.date, successfulCompletion);

          return Array.from(completionMap.values());
        },
      );
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCompletions) {
        queryClient.setQueryData(
          ["completions", context.habitId],
          context.previousCompletions,
        );
      }

      // Show error feedback to user
      console.error("Failed to update habit completion:", err);
    },
    // Remove onSettled to prevent automatic invalidation that could cause UI reversion
  });
}

// Delete a habit
export function useDeleteHabit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
