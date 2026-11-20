// src/pages/MyRatingsPage.tsx
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { fetchUserReviews, deleteReview } from "../services/api";

export default function MyRatingsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["userReviews", user?.id],
    queryFn: () => fetchUserReviews(user!.id),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReviews", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });

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
          Reviews written by {user.name || user.email}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-base-content/60">Loading your reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-base-content/70">No reviewed movies yet.</p>
          <Link to="/" className="btn btn-sm btn-secondary">
            Browse movies to review
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((rev) => (
            <li
              key={rev.id}
              className="rounded-xl bg-base-200 p-4 shadow-sm flex gap-3 items-start"
            >
              <Link to={`/movie/${rev.movie.id}`} className="shrink-0">
                <img
                  src={rev.movie.poster}
                  alt={rev.movie.title}
                  className="w-16 h-24 object-cover rounded"
                />
              </Link>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/movie/${rev.movie.id}`}
                    className="font-bold text-sm truncate hover:underline"
                  >
                    {rev.movie.title}
                  </Link>
                  <span className="badge badge-warning badge-sm shrink-0">
                    ★ {rev.rating}/5
                  </span>
                </div>
                <p className="text-xs text-base-content/80 line-clamp-3">
                  {rev.comment}
                </p>
                <div className="pt-2 flex gap-2">
                  <Link
                    to={`/movie/${rev.movie.id}`}
                    className="btn btn-xs btn-outline"
                  >
                    Edit on Movie Page
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(rev.id)}
                    className="btn btn-xs btn-ghost text-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
