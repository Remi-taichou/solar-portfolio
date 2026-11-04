import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Starts the app. StrictMode is left out on purpose: in development it would run
// the rocket launch and rebuild the whole 3D scene twice.
createRoot(document.getElementById('root')).render(<App />);
