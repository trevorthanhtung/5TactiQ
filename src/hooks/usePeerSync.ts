import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { exportData } from '../lib/sync';

export function usePeerSync(onDataReceived?: (dataStr: string) => void) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'ready' | 'connecting' | 'connected' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const initHost = () => {
    setStatus('initializing');
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peer = new Peer(`katfc-${randomId}`);

    peer.on('open', (id) => {
      const code = id.replace('katfc-', '');
      setPeerId(code);
      setStatus('ready');
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setStatus('connected');

      conn.on('open', () => {
        // Automatically send data when someone connects
        const data = exportData();
        conn.send(data);
        setStatus('success');
      });

      conn.on('error', (err) => {
        setStatus('error');
        setErrorMsg(err.message);
      });
    });

    peer.on('error', (err) => {
      setStatus('error');
      setErrorMsg(err.message);
    });

    peerRef.current = peer;
  };

  const connectToHost = (hostCode: string) => {
    setStatus('connecting');
    const peer = new Peer();

    peer.on('open', () => {
      const conn = peer.connect(`katfc-${hostCode.toUpperCase()}`);
      connRef.current = conn;

      conn.on('open', () => {
        setStatus('connected');
      });

      conn.on('data', (data: unknown) => {
        if (typeof data === 'string') {
          if (onDataReceived) {
            onDataReceived(data);
          } else {
             setStatus('success');
          }
        }
      });

      conn.on('error', (err) => {
        setStatus('error');
        setErrorMsg(err.message);
      });
    });

    peer.on('error', (err) => {
      setStatus('error');
      setErrorMsg(err.message);
    });

    peerRef.current = peer;
  };

  const reset = () => {
    if (connRef.current) connRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
    setPeerId(null);
    setStatus('idle');
    setErrorMsg('');
  };

  useEffect(() => {
    return () => {
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  return { peerId, status, errorMsg, initHost, connectToHost, reset, setStatus };
}
