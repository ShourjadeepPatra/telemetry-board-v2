import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Apply saved theme immediately on load
const saved = localStorage.getItem('aeroaqua-theme') ?? 'dark';
document.documentElement.classList.add(saved);

createRoot(document.getElementById('root')!).render(<App />);