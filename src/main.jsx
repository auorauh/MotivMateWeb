import { createRoot } from 'react-dom/client';
import App from '../App';
import './index.css';
import { registerPushServiceWorker } from '../platform/push';

registerPushServiceWorker();
createRoot(document.getElementById('root')).render(<App />);
