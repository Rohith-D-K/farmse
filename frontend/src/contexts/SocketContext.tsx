import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL === undefined ? 'http://localhost:3000' : import.meta.env.VITE_API_URL;

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        if (!socketRef.current) {
            socketRef.current = io(API_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                console.log('Global socket connected');
                if (user) {
                    socketRef.current?.emit('join_user_room', user.id);
                }
            });
        }

        return () => {
            // We keep the socket alive during the session, 
            // but we could disconnect on unmount if needed.
            // For a global provider, we usually don't disconnect until logout.
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};
