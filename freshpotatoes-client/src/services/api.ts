const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ==================== TYPES ====================
export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  userId: number;
  movieId: number;
  createdAt: string;
  user?: {
    id: number;
    name?: string;
    email: string;
  };
}

export interface Movie {
  id: number;
  title: string;
  year: string;
  rated?: string;
  runtime?: string;
  genre: string;
  director?: string;
  actors?: string;
  plot: string;
  poster: string;
  imdbRating?: string;
  reviews?: Review[];
}

export interface CollectionItem {
  id: number;
  userId: number;
  movieId: number;
  movie: Movie;
}

// ==================== 1. AUTH ====================
export const loginUser = async (payload: {
  email: string;
  name?: string;
  password?: string;
}): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  return res.json();
};

// ==================== 2. MOVIES (CRUD) ====================
export const fetchMovies = async (
  search = "",
  genre = "All",
): Promise<Movie[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (genre && genre !== "All") params.append("genre", genre);

  const res = await fetch(`${API_URL}/movies?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  return res.json();
};

export const fetchMovieById = async (id: string | number): Promise<Movie> => {
  const res = await fetch(`${API_URL}/movies/${id}`);
  if (!res.ok) throw new Error("Failed to fetch movie details");
  return res.json();
};

export const createMovie = async (
  movieData: Omit<Movie, "id" | "reviews">,
): Promise<Movie> => {
  const res = await fetch(`${API_URL}/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData),
  });
  if (!res.ok) throw new Error("Failed to create movie");
  return res.json();
};

export const updateMovie = async (
  id: number,
  movieData: Partial<Movie>,
): Promise<Movie> => {
  const res = await fetch(`${API_URL}/movies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movieData),
  });
  if (!res.ok) throw new Error("Failed to update movie");
  return res.json();
};

export const deleteMovie = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/movies/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete movie");
};

// ==================== 3. REVIEWS (CRUD) ====================
export const createReview = async (data: {
  rating: number;
  comment: string;
  userId: number;
  movieId: number;
}): Promise<Review> => {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create review");
  return res.json();
};

export const updateReview = async (
  id: number,
  data: { rating: number; comment: string },
): Promise<Review> => {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update review");
  return res.json();
};

export const deleteReview = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete review");
};

// ==================== 4. PERSONAL COLLECTION ====================
export const fetchCollections = async (
  userId: number,
): Promise<CollectionItem[]> => {
  const res = await fetch(`${API_URL}/collections/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
};

export const addToCollection = async (
  userId: number,
  movieId: number,
): Promise<CollectionItem> => {
  const res = await fetch(`${API_URL}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, movieId }),
  });
  if (!res.ok) throw new Error("Failed to add to collection");
  return res.json();
};

export const removeFromCollection = async (
  userId: number,
  movieId: number,
): Promise<void> => {
  const res = await fetch(`${API_URL}/collections/${userId}/${movieId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove from collection");
};
