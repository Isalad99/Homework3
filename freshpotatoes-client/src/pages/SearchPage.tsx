// src/pages/SearchPage.tsx
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import SkeletonCard from "../components/SkeletonCard";
import ErrorState from "../components/ErrorState";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const {
    data: movies = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["movies", "search", query],
    queryFn: () => fetchMovies(query, "All"),
    enabled: query.trim().length > 0,
  });

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-base-content/50">
        <span className="text-6xl">🔍</span>
        <p className="text-lg font-medium">Type a movie title to search</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold text-base-content">Search Results</h1>
        {!isLoading && !isError && (
          <p className="text-sm text-base-content/60">
            "{query}" — Found {movies.length} items
          </p>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <ErrorState
          message={error.message || "Search failed. Please try again."}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* Grid */}
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

      {/* No results */}
      {!isLoading && !isError && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-base-content/50">
          <span className="text-5xl">🎬</span>
          <p className="text-base font-medium">Movie not found</p>
        </div>
      )}
    </div>
  );
}
