// src/pages/MovieDetailPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMovieById,
  updateMovie,
  deleteMovie,
  fetchCollections,
  addToCollection,
  removeFromCollection,
  createReview,
  updateReview,
  deleteReview,
  type Movie,
  type Review,
} from "../services/api";
import { useAuthStore } from "../store/useAuthStore";
import ErrorState from "../components/ErrorState";
import MovieDetailSkeleton from "../components/MovieDetailSkeleton";

const NO_POSTER = "https://placehold.co/400x600/B0BA99/3D1F0E?text=No+Poster";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-0.5 py-2">
      <dt className="text-sm font-semibold text-base-content/60">{label}</dt>
      <dd className="text-sm text-base-content break-words">{value}</dd>
    </div>
  );
}

function MovieDetailContent({ movie }: { movie: Movie }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // State สำหรับแก้ไขหนัง (Update Movie)
  const [isEditingMovie, setIsEditingMovie] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: movie.title,
    year: movie.year,
    genre: movie.genre,
    director: movie.director || "",
    actors: movie.actors || "",
    plot: movie.plot,
    poster: movie.poster,
    imdbRating: movie.imdbRating || "",
  });

  // State สำหรับเขียน/แก้ไขรีวิว (Create & Update Review)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // เช็กสถานะ Watchlist จาก Database
  const { data: collections = [] } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
  });
  const inWatchlist = collections.some((c) => c.movieId === movie.id);

  // Mutations: Watchlist
  const toggleWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login first");
      if (inWatchlist) {
        await removeFromCollection(user.id, movie.id);
      } else {
        await addToCollection(user.id, movie.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
  });

  // Mutations: Movie Update & Delete
  const updateMovieMutation = useMutation({
    mutationFn: () => updateMovie(movie.id, movieForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", String(movie.id)] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setIsEditingMovie(false);
    },
  });

  const deleteMovieMutation = useMutation({
    mutationFn: () => deleteMovie(movie.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      navigate("/");
    },
  });

  // Mutations: Reviews CRUD
  const createReviewMutation = useMutation({
    mutationFn: () =>
      createReview({
        rating,
        comment,
        userId: user!.id,
        movieId: movie.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", String(movie.id)] });
      queryClient.invalidateQueries({ queryKey: ["userReviews", user?.id] });
      setComment("");
      setRating(5);
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: (reviewId: number) =>
      updateReview(reviewId, { rating: editRating, comment: editComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", String(movie.id)] });
      queryClient.invalidateQueries({ queryKey: ["userReviews", user?.id] });
      setEditingReviewId(null);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", String(movie.id)] });
      queryClient.invalidateQueries({ queryKey: ["userReviews", user?.id] });
    },
  });

  const poster = movie.poster || NO_POSTER;
  const genres = (movie.genre || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const meta = [movie.rated, movie.runtime].filter(Boolean).join(" • ");

  function startEditReview(r: Review) {
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment);
  }

  function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    createReviewMutation.mutate();
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Title */}
      <header className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-base-content leading-tight">
          {movie.title}
        </h1>
        <p className="text-base sm:text-lg text-base-content/70">
          ({movie.year})
        </p>
        {meta && (
          <p className="text-xs sm:text-sm text-base-content/60">{meta}</p>
        )}
        {genres.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2 pt-1">
            {genres.map((g) => (
              <li key={g} className="badge badge-accent text-accent-content">
                {g}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="divider my-4" />

      {/* Poster */}
      <div className="flex justify-center">
        <img
          src={poster}
          alt={`Poster of ${movie.title}`}
          className="w-48 sm:w-60 md:w-72 rounded-lg shadow-lg object-cover"
        />
      </div>

      {/* Actions: Watchlist + Movie Edit/Delete */}
      <section className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className={`btn btn-sm ${inWatchlist ? "btn-secondary" : "btn-outline btn-secondary"}`}
          onClick={() => {
            if (!user) {
              alert("กรุณาเข้าสู่ระบบ (Login) ที่มุมขวาบนก่อนเพิ่มรายการโปรด");
              return;
            }
            toggleWatchlistMutation.mutate();
          }}
          disabled={toggleWatchlistMutation.isPending}
        >
          {inWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}
        </button>

        <button
          type="button"
          onClick={() => setIsEditingMovie(true)}
          className="btn btn-sm btn-outline btn-info"
        >
          Edit Movie
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm(`ต้องการลบเรื่อง "${movie.title}" ใช่หรือไม่?`)) {
              deleteMovieMutation.mutate();
            }
          }}
          disabled={deleteMovieMutation.isPending}
          className="btn btn-sm btn-outline btn-error"
        >
          Delete Movie
        </button>
      </section>

      <div className="divider my-6" />

      {/* Plot */}
      {movie.plot && (
        <section aria-label="Plot" className="space-y-2">
          <h2 className="text-lg font-bold text-base-content">Plot</h2>
          <p className="text-sm sm:text-base leading-relaxed text-base-content/90 whitespace-pre-line">
            {movie.plot}
          </p>
        </section>
      )}

      {/* Details */}
      <section aria-label="Additional Details" className="mt-6">
        <h2 className="text-lg font-bold text-base-content mb-1">
          Additional Details
        </h2>
        <dl className="divide-y divide-base-300">
          <InfoRow label="Director" value={movie.director} />
          <InfoRow label="Cast" value={movie.actors} />
          <InfoRow
            label="IMDb"
            value={movie.imdbRating ? `${movie.imdbRating}/10` : null}
          />
        </dl>
      </section>

      <div className="divider my-6" />

      {/* Reviews Section (CRUD) */}
      <section aria-label="Reviews" className="space-y-4">
        <h2 className="text-lg font-bold text-base-content">
          User Reviews ({movie.reviews?.length || 0})
        </h2>

        {/* Form เขียนรีวิว */}
        {user ? (
          <form
            onSubmit={handleReviewSubmit}
            className="p-4 rounded-xl bg-base-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                เขียนรีวิวในชื่อ: {user.name || user.email}
              </span>
              <select
                className="select select-bordered select-xs"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    ★ {n} / 5
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              placeholder="แสดงความคิดเห็นเกี่ยวกับภาพยนตร์เรื่องนี้..."
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {createReviewMutation.isPending ? "Posting..." : "Post Review"}
            </button>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-base-200 text-sm text-base-content/70">
            กรุณาเข้าสู่ระบบ (Login) ที่มุมขวาบนเพื่อเขียนรีวิว
          </div>
        )}

        {/* รายการรีวิวทั้งหมด */}
        <div className="space-y-3">
          {movie.reviews?.length === 0 && (
            <p className="text-sm text-base-content/60">
              ยังไม่มีรีวิวสำหรับเรื่องนี้
            </p>
          )}

          {movie.reviews?.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-base-200/60 border border-base-300"
            >
              {editingReviewId === rev.id ? (
                <div className="space-y-2">
                  <select
                    className="select select-bordered select-xs"
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        ★ {n} / 5
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="textarea textarea-bordered w-full text-sm"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateReviewMutation.mutate(rev.id)}
                      className="btn btn-primary btn-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReviewId(null)}
                      className="btn btn-ghost btn-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">
                        {rev.user?.name || rev.user?.email || "User"}
                      </span>
                      <span className="ml-2 badge badge-warning badge-sm">
                        ★ {rev.rating}/5
                      </span>
                    </div>

                    {user?.id === rev.userId && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditReview(rev)}
                          className="btn btn-ghost btn-xs text-info"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteReviewMutation.mutate(rev.id)}
                          className="btn btn-ghost btn-xs text-error"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm mt-2 text-base-content/90">
                    {rev.comment}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Modal แก้ไขข้อมูลหนัง (Update Movie) */}
      {isEditingMovie && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-100 text-base-content">
            <h3 className="font-bold text-lg mb-3">Edit Movie</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMovieMutation.mutate();
              }}
              className="space-y-2.5"
            >
              <input
                type="text"
                placeholder="Title"
                className="input input-bordered input-sm w-full"
                value={movieForm.title}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, title: e.target.value })
                }
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Year"
                  className="input input-bordered input-sm"
                  value={movieForm.year}
                  onChange={(e) =>
                    setMovieForm({ ...movieForm, year: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Genre"
                  className="input input-bordered input-sm"
                  value={movieForm.genre}
                  onChange={(e) =>
                    setMovieForm({ ...movieForm, genre: e.target.value })
                  }
                />
              </div>
              <input
                type="text"
                placeholder="Director"
                className="input input-bordered input-sm w-full"
                value={movieForm.director}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, director: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Poster URL"
                className="input input-bordered input-sm w-full"
                value={movieForm.poster}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, poster: e.target.value })
                }
              />
              <textarea
                placeholder="Plot"
                className="textarea textarea-bordered textarea-sm w-full"
                rows={3}
                value={movieForm.plot}
                onChange={(e) =>
                  setMovieForm({ ...movieForm, plot: e.target.value })
                }
              />
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setIsEditingMovie(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Update
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setIsEditingMovie(false)}
          />
        </div>
      )}
    </article>
  );
}

export default function MovieDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => fetchMovieById(id),
    enabled: !!id,
  });

  function handleBack() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="btn btn-ghost btn-sm btn-circle -ml-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>

      {isLoading && <MovieDetailSkeleton />}

      {isError && (
        <ErrorState
          message={
            error.message || "Please check your connection and try again."
          }
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {data && <MovieDetailContent movie={data} />}
    </div>
  );
}
