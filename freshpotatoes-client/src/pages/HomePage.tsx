// src/pages/HomePage.tsx
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MovieCard from "../components/MovieCard";
import SkeletonCard from "../components/SkeletonCard";
import ErrorState from "../components/ErrorState";
import { fetchMovies, createMovie } from "../services/api";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    year: "2026",
    rated: "PG-13",
    runtime: "120 min",
    genre: "Action, Sci-Fi",
    director: "",
    actors: "",
    plot: "",
    poster: "https://placehold.co/400x600/B0BA99/3D1F0E?text=Movie+Poster",
    imdbRating: "8.0",
  });

  const {
    data: movies = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["movies", "", selectedGenre],
    queryFn: () => fetchMovies("", selectedGenre),
  });

  const createMutation = useMutation({
    mutationFn: createMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setIsAddOpen(false);
      setForm({
        title: "",
        year: "2026",
        rated: "PG-13",
        runtime: "120 min",
        genre: "Action, Sci-Fi",
        director: "",
        actors: "",
        plot: "",
        poster: "https://placehold.co/400x600/B0BA99/3D1F0E?text=Movie+Poster",
        imdbRating: "8.0",
      });
    },
  });

  function handleAddSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-base-content">
          Recommended Movies
        </h1>

        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-sm"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="All">All Genres</option>
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="Drama">Drama</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Thriller">Thriller</option>
            <option value="Animation">Animation</option>
          </select>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn btn-sm btn-primary"
          >
            + Add Movie
          </button>
        </div>
      </div>

      {/* Movie grid — 5 columns matching design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
              />
            ))}
      </div>

      {/* Error fallback */}
      {isError && (
        <ErrorState
          message={error?.message || "Failed to load movies from server."}
          isRetrying={isFetching}
          onRetry={() => void refetch()}
        />
      )}

      {/* Modal เพิ่มหนังใหม่ (Create Movie) */}
      {isAddOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-100 text-base-content max-w-lg">
            <h3 className="font-bold text-lg mb-3">Add New Movie</h3>
            <form onSubmit={handleAddSubmit} className="space-y-2.5">
              <input
                type="text"
                placeholder="Title *"
                className="input input-bordered input-sm w-full"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Year *"
                  className="input input-bordered input-sm"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Rated (PG-13)"
                  className="input input-bordered input-sm"
                  value={form.rated}
                  onChange={(e) => setForm({ ...form, rated: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Runtime (120 min)"
                  className="input input-bordered input-sm"
                  value={form.runtime}
                  onChange={(e) =>
                    setForm({ ...form, runtime: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Genre * (Action, Drama)"
                  className="input input-bordered input-sm"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="IMDb Rating (8.5)"
                  className="input input-bordered input-sm"
                  value={form.imdbRating}
                  onChange={(e) =>
                    setForm({ ...form, imdbRating: e.target.value })
                  }
                />
              </div>
              <input
                type="text"
                placeholder="Director"
                className="input input-bordered input-sm w-full"
                value={form.director}
                onChange={(e) => setForm({ ...form, director: e.target.value })}
              />
              <input
                type="text"
                placeholder="Actors"
                className="input input-bordered input-sm w-full"
                value={form.actors}
                onChange={(e) => setForm({ ...form, actors: e.target.value })}
              />
              <input
                type="url"
                placeholder="Poster URL *"
                className="input input-bordered input-sm w-full"
                value={form.poster}
                onChange={(e) => setForm({ ...form, poster: e.target.value })}
                required
              />
              <textarea
                placeholder="Plot *"
                className="textarea textarea-bordered textarea-sm w-full"
                rows={3}
                value={form.plot}
                onChange={(e) => setForm({ ...form, plot: e.target.value })}
                required
              />
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  {createMutation.isPending ? "Saving..." : "Save Movie"}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setIsAddOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
