// client/src/test-dependencies.js
import axios from 'axios';
import io from 'socket.io-client';
import { Sparkles } from 'lucide-react';

console.log('All dependencies loaded successfully!');
console.log('Axios version:', axios.VERSION);
console.log('Socket.io-client available:', !!io);
console.log('Lucide-react available:', !!Sparkles);