import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/history', label: 'History', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { theme, toggle } = useTheme();

  return (
    <aside className="w-56 shrink-0 border-r border-white/10 bg-ocean-950/50 backdrop-blur-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <span className="text-2xl">🌊</span>
        <div>
          <h1 className="text-sm font-bold tracking-wide">AEROAQUA</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Telemetry</p>
        </div>
      </div>

      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`
          }
        >
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      ))}

      <div className="mt-auto pt-4">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-3">
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </span>
          <span
            className={`w-10 h-5 rounded-full relative transition ${
              theme === 'dark' ? 'bg-[#00E5FF]/30' : 'bg-black/10'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                theme === 'dark' ? 'left-5 bg-[#00E5FF]' : 'left-0.5 bg-[#0A0E1A]'
              }`}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}