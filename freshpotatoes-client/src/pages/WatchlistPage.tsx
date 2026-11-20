// src/pages/WatchlistPage.tsx
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { fetchCollections, removeFromCollection } from "../services/api";

export default function WatchlistPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (movieId: number) => removeFromCollection(user!.id, movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
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
        <p className="text-sm text-base-content/60">
          Your personal watch list ({user.name || user.email})
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-base-content/60">Loading watchlist...</p>
      ) : collections.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-base-content/70">No movies in Watch list</p>
          <Link to="/" className="btn btn-sm btn-secondary">
            Go add movies
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {collections.map(({ id, movie }) => (
            <li
              key={id}
              className="rounded-xl bg-accent p-2 shadow-sm flex flex-col"
            >
              <Link to={`/movie/${movie.id}`} className="block">
                <img
                  src={movie.poster}
                  alt={`Poster of ${movie.title}`}
                  className="w-full aspect-[2/3] object-cover rounded-sm"
                  loading="lazy"
                />
              </Link>
              <div className="mt-2 flex-1 flex flex-col justify-between gap-2">
                <Link
                  to={`/movie/${movie.id}`}
                  className="text-xs font-semibold text-neutral truncate"
                  title={movie.title}
                >
                  {movie.title} ({movie.year})
                </Link>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(movie.id)}
                  disabled={removeMutation.isPending}
                  className="btn btn-xs btn-error w-full"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
