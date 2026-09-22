import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["favorite-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session ?? null;
    },
    staleTime: 60_000,
  });

  const userId = sessionQuery.data?.user?.id ?? null;

  const favoritesQuery = useQuery({
    queryKey: ["favorites", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favoritos")
        .select("produto_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((row: any) => row.produto_id as string));
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async ({ produtoId, favorite }: { produtoId: string; favorite: boolean }) => {
      if (!userId) throw new Error("AUTH_REQUIRED");

      if (favorite) {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: userId, produto_id: produtoId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", userId)
          .eq("produto_id", produtoId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
    },
  });

  return {
    userId,
    favoriteIds: favoritesQuery.data ?? new Set<string>(),
    loading: sessionQuery.isLoading || favoritesQuery.isLoading,
    toggleFavorite: async (produtoId: string) => {
      const favorite = !(favoritesQuery.data?.has(produtoId) ?? false);
      await mutation.mutateAsync({ produtoId, favorite });
      return favorite;
    },
  };
}
