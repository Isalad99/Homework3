import { Link } from "react-router";
import type { CollectionItem } from "../services/api";
import { BookmarkCheckIcon, EyeIcon } from "./icons";

interface WatchlistCardProps {
  item: CollectionItem;
  onRemove: () => void;
  onToggleWatched: () => void;
  disabled?: boolean;
}

export default function WatchlistCard({
  item,
  onRemove,
  onToggleWatched,
  disabled = false,
}: WatchlistCardProps) {
  const { movie, watched } = item;

  return (
    <li className="rounded-xl bg-accent p-2 shadow-sm">
      <Link to={`/movie/${movie.id}`} className="block">
        <img
          src={movie.poster}
          alt={`Poster of ${movie.title}`}
          className="w-full aspect-[2/3] object-cover rounded-sm"
          loading="lazy"
        />
      </Link>

      <div className="mt-2 flex items-center gap-1">
        <p
          className="flex-1 min-w-0 truncate text-xs text-neutral"
          title={movie.title}
        >
          {movie.title}
        </p>

        <button
          type="button"
          className="text-accent-content hover:opacity-70 transition-opacity"
          onClick={onRemove}
          disabled={disabled}
          title="Added to Watch list (click to remove)"
          aria-label={`Remove ${movie.title} from Watch list`}
        >
          <BookmarkCheckIcon />
        </button>

        <button
          type="button"
          className={`transition-opacity hover:opacity-70 ${
            watched ? "text-accent-content" : "text-accent-content/60"
          }`}
          onClick={onToggleWatched}
          disabled={disabled}
          aria-pressed={watched}
          title={
            watched
              ? "Watched (click to unmark)"
              : "Not watched (click to mark as watched)"
          }
          aria-label={watched ? "Unmark as watched" : "Mark as watched"}
        >
          <EyeIcon watched={watched} />
        </button>
      </div>
    </li>
  );
}
