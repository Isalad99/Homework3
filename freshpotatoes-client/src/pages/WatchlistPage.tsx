// src/pages/WatchlistPage.tsx
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import WatchlistCard from "../components/WatchlistCard";
import { useAuthStore } from "../store/useAuthStore";
import {
  fetchCollections,
  removeFromCollection,
  setWatched,
} from "../services/api";

export default function WatchlistPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });

  const removeMutation = useMutation({
    mutationFn: (movieId: number) => removeFromCollection(user!.id, movieId),
    onSuccess: refresh,
  });

  const watchedMutation = useMutation({
    mutationFn: ({ movieId, watched }: { movieId: number; watched: boolean }) =>
      setWatched(user!.id, movieId, watched),
    onSuccess: refresh,
  });

  if (!user) {
    return (
      <section className="py-16 text-center space-y-3">
        <h1 className="text-xl font-bold text-base-content">Watch lists</h1>
        <p className="text-base-content/70">
          กรุณาเข้าสู่ระบบ (Login) ที่มุมขวาบนเพื่อดูรายการโปรดของคุณ
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Watch list" className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-base-content">Watch lists</h1>
        <p className="text-sm text-base-content/60">Your personal watch list</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-base-content/60">Loading watchlist...</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-base-content/70">No movies in Watch list</p>
          <Link to="/" className="btn btn-sm btn-secondary">
            Go add movies
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              disabled={removeMutation.isPending || watchedMutation.isPending}
              onRemove={() => removeMutation.mutate(item.movieId)}
              onToggleWatched={() =>
                watchedMutation.mutate({
                  movieId: item.movieId,
                  watched: !item.watched,
                })
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
