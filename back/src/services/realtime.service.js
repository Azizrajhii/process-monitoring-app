import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { corsOrigin } from '../config/cors.js';

let ioInstance = null;
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('La variable JWT_SECRET est requise.');
  }
  return secret;
};

export const initRealtime = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Missing auth token'));
      }

      const decoded = jwt.verify(token, getJwtSecret());
      socket.user = decoded;
      return next();
    } catch (_error) {
      return next(new Error('Invalid auth token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    if (socket.user?.role) {
      socket.join(`role:${socket.user.role}`);
    }
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }
  });

  return ioInstance;
};

export const emitRealtimeEvent = (eventName, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(eventName, payload);
};
