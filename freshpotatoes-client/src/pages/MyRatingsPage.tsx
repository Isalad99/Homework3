// src/pages/MyRatingsPage.tsx
import "./style.css";

import { useMemo } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, ReviewIcon } from "../components/icons";
import { useAuthStore } from "../store/useAuthStore";
import {
  fetchCollections,
  fetchUserReviews,
  setWatched,
  type Movie,
} from "../services/api";

interface Entry {
  movie: Movie;
  watched: boolean;
  reviewed: boolean;
  sortKey: number;
}

export default function MyReviewPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ["userReviews", user?.id],
    queryFn: () => fetchUserReviews(user!.id),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const watchedMutation = useMutation({
    mutationFn: ({ movieId, watched }: { movieId: number; watched: boolean }) =>
      setWatched(user!.id, movieId, watched),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] }),
  });

  // รวม "หนังที่ดูแล้ว" + "หนังที่รีวิวแล้ว" เหมือน miniProject 2
  const entries = useMemo(() => {
    const map = new Map<number, Entry>();

    for (const c of collections) {
      if (!c.watched) continue;
      map.set(c.movieId, {
        movie: c.movie,
        watched: true,
        reviewed: false,
        sortKey: new Date(c.createdAt).getTime(),
      });
    }
    for (const r of reviews) {
      const watched = collections.find((c) => c.movieId === r.movieId)?.watched;
      map.set(r.movieId, {
        movie: r.movie,
        watched: watched ?? false,
        reviewed: true,
        sortKey: new Date(r.updatedAt ?? r.createdAt).getTime(),
      });
    }
    return [...map.values()].sort((a, b) => b.sortKey - a.sortKey);
  }, [collections, reviews]);

  if (!user) {
    return (
      <section className="py-16 text-center space-y-3">
        <h1 className="text-xl font-bold text-base-content">My review</h1>
        <p className="text-base-content/70">
          กรุณาเข้าสู่ระบบ (Login) ที่มุมขวาบนเพื่อดูรีวิวของคุณ
        </p>
      </section>
    );
  }

  return (
    <section aria-label="My review" className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-base-content">My review</h1>
        <p className="text-sm text-base-content/60">
          Select watched movies to reviews
        </p>
      </div>

      {loadingCollections || loadingReviews ? (
        <p className="text-sm text-base-content/60">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-base-content/70">
            No watched or reviewed movies yet. Go to Watch list to mark movies
            as watched or write reviews.
          </p>
          <Link to="/watchlist" className="btn btn-sm btn-secondary">
            Go to Watch list
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {entries.map(({ movie, watched, reviewed }) => {
            const reviewPath = `/my-ratings/${movie.id}`;
            return (
              <li key={movie.id} className="rounded-xl bg-accent p-2 shadow-sm">
                <Link to={reviewPath} className="block">
                  <img
                    src={movie.poster}
                    alt={`Poster of ${movie.title}`}
                    className="w-full aspect-[2/3] object-cover rounded-sm"
                    loading="lazy"
                  />
                </Link>

                <div className="mt-2 flex items-center gap-1">
                  <Link
                    to={reviewPath}
                    className="flex-1 min-w-0 truncate text-xs text-neutral"
                    title={movie.title}
                  >
                    {movie.title}
                  </Link>

                  <Link
                    to={reviewPath}
                    className="text-accent-content hover:opacity-70 transition-opacity"
                    title={reviewed ? "View my review" : "Write a review"}
                    aria-label={
                      reviewed
                        ? `View review for ${movie.title}`
                        : `Write review for ${movie.title}`
                    }
                  >
                    <ReviewIcon filled={reviewed} />
                  </Link>

                  <button
                    type="button"
                    className={`transition-opacity hover:opacity-70 ${
                      watched ? "text-accent-content" : "text-accent-content/60"
                    }`}
                    onClick={() =>
                      watchedMutation.mutate({
                        movieId: movie.id,
                        watched: !watched,
                      })
                    }
                    disabled={watchedMutation.isPending}
                    aria-pressed={watched}
                    title={
                      watched
                        ? "Already watched (click to remove)"
                        : "Not watched yet (click to mark as watched)"
                    }
                    aria-label={
                      watched ? "Remove from watched list" : "Add to watched list"
                    }
                  >
                    <EyeIcon watched={watched} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
