// src/components/Navbar.tsx
import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, type FormEvent } from "react";
import UserIcon from "./UserIcon";
import { useAuthStore } from "../store/useAuthStore";
import { loginUser } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // เชื่อมต่อ Auth Store สำหรับ Simple Login
  const { user, setUser, logout } = useAuthStore();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("noppachet@example.com");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const userData = await loginUser({ email: email.trim(), password });
      setUser(userData);
      setIsLoginOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="h-14 bg-primary text-primary-content flex items-center px-4 gap-4 shrink-0 sticky top-0 z-50">
        {/* Logo area */}
        <Link
          to="/"
          id="navbar-logo"
          className="flex items-center gap-2 min-w-[130px] hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-primary-content/20 flex items-center justify-center text-lg select-none">
            🥔
          </div>
          <span className="text-xs font-black leading-tight uppercase tracking-wide">
            Fresh
            <br />
            Potatoes
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
          <label
            className="input input-sm bg-base-100/10 border-primary-content/30 text-primary-content
            placeholder:text-primary-content/50 w-full flex items-center gap-2 rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 opacity-60 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7 7 0 1110 3a7 7 0 016.65 13.65z"
              />
            </svg>
            <input
              id="navbar-search"
              type="search"
              placeholder="Search your movie"
              className="grow bg-transparent outline-none text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link
            to="/about"
            id="navbar-about"
            className="text-sm font-medium hover:opacity-80 transition-opacity hidden sm:block"
          >
            About Us
          </Link>

          {/* Profile / Auth Action */}
          {user ? (
            <div className="dropdown dropdown-end">
              <button
                tabIndex={0}
                id="navbar-profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-content/20 hover:bg-primary-content/30 transition-colors cursor-pointer"
                title={user.email}
              >
                <UserIcon className="h-4 w-4" />
                <span className="text-xs font-semibold max-w-[90px] truncate hidden md:inline">
                  {user.name || user.email.split("@")[0]}
                </span>
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 text-base-content rounded-box z-[60] w-52 p-2 shadow-lg mt-2"
              >
                <li className="menu-title text-xs truncate">{user.email}</li>
                <li>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-error font-medium"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <button
              id="navbar-profile"
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-content/20 hover:bg-primary-content/30 transition-colors cursor-pointer"
              title="Login"
              aria-label="Login"
            >
              <UserIcon className="h-4 w-4 opacity-90" />
              <span className="text-xs font-semibold">Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Simple Login Modal */}
      {isLoginOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-100 text-base-content">
            <h3 className="font-bold text-lg mb-1">
              เข้าสู่ระบบ FreshPotatoes
            </h3>
            <p className="text-xs opacity-70 mb-4">
              กรอกอีเมลเพื่อเข้าสู่ระบบ (หากยังไม่มีบัญชี
              ระบบจะสร้างให้อัตโนมัติ)
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="เช่น noppachet@example.com"
                  className="input input-bordered input-sm w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">
                    Password (ไม่บังคับ)
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="เช่น 1234"
                  className="input input-bordered input-sm w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-error text-xs">{error}</p>}

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                >
                  {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setIsLoginOpen(false)}
          />
        </div>
      )}
    </>
  );
}
