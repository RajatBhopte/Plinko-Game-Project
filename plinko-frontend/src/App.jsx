import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Game from "./pages/Game";
import Verify from "./pages/Verify";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🎲</div>
                <h1 className="text-2xl font-bold text-white">Plinko Game</h1>
              </div>

              <div className="flex gap-4">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-6 py-2.5 rounded-lg font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500 text-gray-900 shadow-lg"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`
                  }
                >
                  🎮 Play Game
                </NavLink>
                <NavLink
                  to="/verify"
                  className={({ isActive }) =>
                    `px-6 py-2.5 rounded-lg font-semibold transition-all ${
                      isActive
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`
                  }
                >
                  🔍 Verify
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Game />} />
            <Route path="/verify" element={<Verify />} />
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center h-screen">
                  <div className="text-center">
                    <h2 className="text-6xl font-bold text-white mb-4">404</h2>
                    <p className="text-gray-400 text-xl mb-8">Page Not Found</p>
                    <NavLink
                      to="/"
                      className="px-6 py-3 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-400 transition"
                    >
                      Back to Game
                    </NavLink>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
