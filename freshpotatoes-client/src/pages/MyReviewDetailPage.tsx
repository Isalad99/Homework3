import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookmarkCheckIcon, EyeIcon } from "../components/icons";
import StarRating from "../components/StarRating";
import { useAuthStore } from "../store/useAuthStore";
import {
  addToCollection,
  deleteMyReview,
  fetchCollections,
  fetchMovieById,
  fetchUserReviews,
  removeFromCollection,
  saveMyReview,
  setWatched,
  type Movie,
  type User,
} from "../services/api";
import "./style.css";

function ReviewEditor({ movie, user }: { movie: Movie; user: User }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ข้อมูลถูกโหลดเสร็จแล้วจาก MyReviewDetailPage (กัน state เริ่มต้นว่างเปล่า)
  const { data: collections = [] } = useQuery({
    queryKey: ["collections", user.id],
    queryFn: () => fetchCollections(user.id),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["userReviews", user.id],
    queryFn: () => fetchUserReviews(user.id),
  });

  const review = reviews.find((r) => r.movieId === movie.id);
  const watchItem = collections.find((c) => c.movieId === movie.id);
  const watched = watchItem?.watched ?? false;
  const inWatchlist = Boolean(watchItem);

  const [editing, setEditing] = useState(!review);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [text, setText] = useState(review?.comment ?? "");

  const refreshCollections = () =>
    queryClient.invalidateQueries({ queryKey: ["collections", user.id] });
  const refreshReviews = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["userReviews", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["movie", String(movie.id)] }),
    ]);

  const watchedMutation = useMutation({
    mutationFn: (next: boolean) => setWatched(user.id, movie.id, next),
    onSuccess: refreshCollections,
  });

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (inWatchlist) {
        await removeFromCollection(user.id, movie.id);
      } else {
        await addToCollection(user.id, movie.id);
      }
    },
    onSuccess: refreshCollections,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveMyReview(user.id, movie.id, { rating, comment: text.trim() }),
    onSuccess: async () => {
      await refreshReviews();
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMyReview(user.id, movie.id),
    onSuccess: async () => {
      await refreshReviews();
      navigate("/my-ratings");
    },
  });

  const handleSave = () => {
    if (rating <= 0) return;
    saveMutation.mutate();
  };

  const handleCancel = () => {
    if (review) {
      setRating(review.rating);
      setText(review.comment);
      setEditing(false);
    } else {
      navigate("/my-ratings");
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this review?")) return;
    deleteMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Link
        to="/my-ratings"
        aria-label="Back to My Reviews"
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
      </Link>

      <article className="rounded-2xl bg-base-200 p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-neutral">My Review</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-bold text-neutral hover:opacity-70 transition-opacity"
              onClick={() => watchedMutation.mutate(!watched)}
              aria-pressed={watched}
              title="Switch watched status"
            >
              {watched ? "Watched" : "Unwatched"}
              <EyeIcon watched={watched} className="w-6 h-6" />
            </button>

            <button
              type="button"
              className={`hover:opacity-70 transition-opacity ${
                inWatchlist ? "text-neutral" : "text-neutral/30"
              }`}
              onClick={() => watchlistMutation.mutate()}
              aria-pressed={inWatchlist}
              title={
                inWatchlist
                  ? "In Watch list (click to remove)"
                  : "Add to Watch list"
              }
              aria-label={
                inWatchlist ? "Remove from Watch list" : "Add to Watch list"
              }
            >
              <BookmarkCheckIcon className="w-6 h-8" checkColor="#fff" />
            </button>
          </div>
        </header>

        <div className="mt-4 review-layout">
          {/* Poster + title */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <img
              src={movie.poster}
              alt={`Poster of ${movie.title}`}
              className="review-poster shadow-md"
            />
            <p className="font-bold text-neutral">
              {movie.title} ({movie.year})
            </p>
          </div>

          {/* Review area */}
          <div className="review-main flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-neutral">
                {editing ? "Write your review" : "Your review"}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral tabular-nums">
                  {rating.toFixed(1)}
                </span>
                <StarRating
                  value={rating}
                  onChange={editing ? setRating : undefined}
                />
              </div>
            </div>

            {editing ? (
              <textarea
                className="textarea w-full min-h-64 md:min-h-80 flex-1 bg-base-100 text-base-content"
                placeholder="Write your review here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Your review"
              />
            ) : (
              <div className="w-full min-h-64 md:min-h-80 flex-1 rounded-lg bg-base-100 p-4 text-sm sm:text-base leading-relaxed whitespace-pre-line break-words text-base-content">
                {review?.comment || (
                  <span className="text-base-content/50">
                    (No review text written)
                  </span>
                )}
              </div>
            )}

            {/* Buttons */}
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {review ? (
                  <button
                    type="button"
                    className="btn btn-error"
                    onClick={handleDelete}
                  >
                    Delete my review
                  </button>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleSave}
                  disabled={rating <= 0 || saveMutation.isPending}
                  title={
                    rating <= 0
                      ? "Please rate the movie before saving"
                      : undefined
                  }
                >
                  Save my review
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => setEditing(true)}
                >
                  Edit my review
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function MyReviewDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const {
    data: movie,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => fetchMovieById(id),
    enabled: !!user && id.length > 0,
  });

  // โหลด watchlist + review ให้เสร็จก่อน แล้วค่อยแสดงฟอร์ม
  // (ไม่งั้น rating/text เริ่มต้นเป็นค่าว่าง และไม่อัปเดตตามรีวิวเดิมที่โหลดมาทีหลัง)
  const collectionsQuery = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
    refetchOnMount: "always",
  });
  const reviewsQuery = useQuery({
    queryKey: ["userReviews", user?.id],
    queryFn: () => fetchUserReviews(user!.id),
    enabled: !!user,
    refetchOnMount: "always",
  });

  if (!user) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-base-content/70">
          กรุณาเข้าสู่ระบบ (Login) ที่มุมขวาบนเพื่อเขียนรีวิว
        </p>
      </div>
    );
  }

  if (
    isLoading ||
    (user && (collectionsQuery.isPending || reviewsQuery.isPending))
  ) {
    return <p className="text-sm text-base-content/60">Loading...</p>;
  }

  if (isError || !movie) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-base-content/70">ไม่พบหนังเรื่องนี้</p>
        <Link to="/my-ratings" className="btn btn-sm btn-secondary">
          Back to My review
        </Link>
      </div>
    );
  }

  return <ReviewEditor key={movie.id} movie={movie} user={user} />;
}
