import { Routes, Route, NavLink } from "react-router-dom";
import { Publish } from "./pages/Publish";
import { Mentions } from "./pages/Mentions";
import { Settings } from "./pages/Settings";

const NAV_ITEMS = [
  { to: "/", label: "Publish" },
  { to: "/mentions", label: "Mentions" },
  { to: "/settings", label: "Settings" },
] as const;

export function App() {
  return (
    <div className="flex h-screen">
      <nav className="w-48 shrink-0 border-r border-border bg-surface p-4 flex flex-col gap-1">
        <h1 className="text-lg font-bold mb-4 px-3">Offgrid</h1>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route path="/" element={<Publish />} />
          <Route path="/mentions" element={<Mentions />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
