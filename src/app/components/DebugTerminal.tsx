import { useState, useEffect, useRef } from 'react';
import { useParticipants, useRoomContext, useConnectionState } from '@livekit/components-react';
import { Terminal, X, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { RoomTheme } from '../utils/livekit';
import { ConnectionState } from 'livekit-client';
import { Video, Settings, PlayCircle, Shield, Users, Eye, Disc } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: number;
  type: 'info' | 'chat' | 'participant' | 'track' | 'connection' | 'error';
  message: string;
}

interface StreamStats {
  ping: number;
  bitrate: number;
  packetLoss: number;
  jitter: number;
  fps: number;
  resolution: string;
}

interface DebugTerminalProps {
  theme: RoomTheme;
  participantName: string;
  participantMode: 'streamer' | 'viewer';
}

export function DebugTerminal({ theme, participantName, participantMode }: DebugTerminalProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [streamStats, setStreamStats] = useState<StreamStats>({
    ping: 0,
    bitrate: 0,
    packetLoss: 0,
    jitter: 0,
    fps: 0,
    resolution: '0x0',
  });
  const [lastNetworkQuality, setLastNetworkQuality] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const participants = useParticipants();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: DebugLog['type'], message: string) => {
    const log: DebugLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-99), log]); // Keep last 100 logs
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs]);

  useEffect(() => {
    addLog('info', '='.repeat(60));
    addLog('info', `LiveKit Debug Terminal - Session Started`);
    addLog('info', `Participant: ${participantName}`);
    addLog('info', `Mode: ${participantMode.toUpperCase()}`);
    addLog('info', `Monitoring: ${participantMode === 'streamer' ? 'Outbound (Publishing)' : 'Inbound (Receiving)'} streams`);
    addLog('info', `Timestamp: ${new Date().toLocaleString()}`);
    addLog('info', '='.repeat(60));

    // Intercept console logs
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      if (message.includes('[Chat]')) {
        addLog('chat', message.replace('[Chat]', '').trim());
      } else if (message.includes('[Room Settings]') || message.includes('[Layout]')) {
        addLog('info', message);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLog('error', message);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, [participantName, participantMode]);

  useEffect(() => {
    const stateNames = {
      [ConnectionState.Disconnected]: 'Disconnected',
      [ConnectionState.Connecting]: 'Connecting',
      [ConnectionState.Connected]: 'Connected',
      [ConnectionState.Reconnecting]: 'Reconnecting',
    };
    addLog('connection', `Connection state: ${stateNames[connectionState]}`);
  }, [connectionState]);

  useEffect(() => {
    addLog('participant', `Participants count: ${participants.length} (You + ${participants.length} others)`);
    participants.forEach((p) => {
      const tracks = p.videoTrackPublications.size + p.audioTrackPublications.size;
      addLog('participant', `→ ${p.identity} | Tracks: ${tracks} | Speaking: ${p.isSpeaking ? 'Yes' : 'No'}`);
    });
  }, [participants.length]);

  useEffect(() => {
    if (!room) return;

    const logRoomStats = () => {
      const localTracks = room.localParticipant.videoTrackPublications.size + room.localParticipant.audioTrackPublications.size;
      addLog('info', `Local tracks published: ${localTracks}`);
      addLog('info', `Room name: ${room.name} | SID: ${room.sid}`);
    };

    const timer = setTimeout(logRoomStats, 1000);
    return () => clearTimeout(timer);
  }, [room]);

  // Ping monitoring
  useEffect(() => {
    if (!room) return;

    let lastPing = 0;

    const measurePing = async () => {
      const start = performance.now();
      try {
        // Use room's RTT if available
        const rtt = await room.engine.client.getRTT();
        const ping = Math.round(rtt);
        setStreamStats(prev => ({ ...prev, ping }));

        // Log significant ping changes
        if (Math.abs(ping - lastPing) > 50 && lastPing > 0) {
          addLog('connection', `Ping changed: ${lastPing}ms → ${ping}ms`);
        }

        if (ping > 200) {
          addLog('connection', `High latency: ${ping}ms`);
        } else if (ping < 50) {
          if (lastPing > 200) {
            addLog('connection', `Latency improved: ${ping}ms`);
          }
        }

        lastPing = ping;
      } catch (err) {
        // Fallback: estimate ping
        const end = performance.now();
        const estimatedPing = Math.round((end - start) / 2);
        setStreamStats(prev => ({ ...prev, ping: estimatedPing }));
      }
    };

    addLog('connection', 'Starting latency monitoring...');
    measurePing(); // Initial measurement
    pingIntervalRef.current = setInterval(measurePing, 5000); // Every 5 seconds

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [room]);

  // Stream stats monitoring
  useEffect(() => {
    if (!room) return;

    let lastBitrate = 0;
    let lastResolution = '0x0';

    const updateStreamStats = async () => {
      const localParticipant = room.localParticipant;

      // For viewers, monitor remote tracks instead of local tracks
      let videoTrack;
      if (participantMode === 'viewer') {
        // Get first remote video track
        const remoteParticipants = Array.from(room.remoteParticipants.values());
        if (remoteParticipants.length > 0) {
          videoTrack = Array.from(remoteParticipants[0].videoTrackPublications.values())[0];
        }
      } else {
        // For streamers, monitor local video track
        videoTrack = Array.from(localParticipant.videoTrackPublications.values())[0];
      }

      if (videoTrack?.track) {
        try {
          const stats = await videoTrack.track.getRTCStatsReport();
          let totalBitrate = 0;
          let packetLoss = 0;
          let jitter = 0;
          let fps = 0;
          let resolution = '0x0';

          stats.forEach((stat: any) => {
            // For streamers: monitor outbound-rtp
            if (participantMode === 'streamer' && stat.type === 'outbound-rtp' && stat.mediaType === 'video') {
              if (stat.bytesSent) {
                totalBitrate = Math.round((stat.bytesSent * 8) / 1000); // kbps
              }
              if (stat.frameWidth && stat.frameHeight) {
                resolution = `${stat.frameWidth}x${stat.frameHeight}`;
              }
              if (stat.framesPerSecond) {
                fps = Math.round(stat.framesPerSecond);
              }
            }

            // For viewers: monitor inbound-rtp
            if (participantMode === 'viewer' && stat.type === 'inbound-rtp' && stat.mediaType === 'video') {
              if (stat.bytesReceived) {
                totalBitrate = Math.round((stat.bytesReceived * 8) / 1000); // kbps
              }
              if (stat.frameWidth && stat.frameHeight) {
                resolution = `${stat.frameWidth}x${stat.frameHeight}`;
              }
              if (stat.framesPerSecond) {
                fps = Math.round(stat.framesPerSecond);
              }
              if (stat.packetsLost && stat.packetsReceived) {
                packetLoss = Math.round((stat.packetsLost / (stat.packetsLost + stat.packetsReceived)) * 100);
              }
              if (stat.jitter) {
                jitter = Math.round(stat.jitter * 1000); // ms
              }
            }

            // For streamers: get packet loss from remote-inbound-rtp
            if (participantMode === 'streamer' && stat.type === 'remote-inbound-rtp' && stat.mediaType === 'video') {
              if (stat.packetsLost && stat.packetsReceived) {
                packetLoss = Math.round((stat.packetsLost / (stat.packetsLost + stat.packetsReceived)) * 100);
              }
              if (stat.jitter) {
                jitter = Math.round(stat.jitter * 1000); // ms
              }
            }
          });

          setStreamStats(prev => ({
            ...prev,
            bitrate: totalBitrate,
            packetLoss,
            jitter,
            fps,
            resolution,
          }));

          // Log significant changes
          if (resolution !== lastResolution && resolution !== '0x0') {
            addLog('track', `Resolution changed: ${resolution} @ ${fps}fps`);
            lastResolution = resolution;
          }

          if (Math.abs(totalBitrate - lastBitrate) > 500 && totalBitrate > 0) {
            addLog('track', `Bits changed: ${totalBitrate}kb`);
            lastBitrate = totalBitrate;
          }

          if (packetLoss > 5) {
            addLog('error', `High packet loss: ${packetLoss}%`);
          }

          if (fps < 15 && fps > 0) {
            addLog('track', `Low FPS warning: ${fps}fps`);
          }

          if (jitter > 50) {
            addLog('connection', `High jitter detected: ${jitter}ms`);
          }
        } catch (err) {
          console.error('[Stats] Failed to get stream stats:', err);
        }
      }
    };

    addLog('track', `Starting stream statistics monitoring (${participantMode} mode)...`);
    const statsInterval = setInterval(updateStreamStats, 6000); // Every 6 seconds
    updateStreamStats(); // Initial update

    // Periodic stats summary (every 60 seconds)
    const summaryInterval = setInterval(() => {
      const stats = streamStats;
      if (stats.bitrate > 0 || stats.fps > 0) {
        addLog('info', `Stats Summary | Ping: ${stats.ping}ms | Bits: ${stats.bitrate}kb | FPS: ${stats.fps} | Loss: ${stats.packetLoss}%`);
      }
    }, 60000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(summaryInterval);
    };
  }, [room, streamStats, participantMode]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const data = JSON.parse(decoded);
        addLog('chat', `[${participant?.identity || 'Unknown'}]: ${data.message || JSON.stringify(data)}`);
      } catch (err) {
        addLog('error', `Failed to decode data: ${err}`);
      }
    };

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      addLog('track', `Track subscribed: ${publication.kind} from ${participant.identity}`);
    };

    const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      addLog('track', `Track unsubscribed: ${publication.kind} from ${participant.identity}`);
    };

    room.on('dataReceived', handleDataReceived);
    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);

    return () => {
      room.off('dataReceived', handleDataReceived);
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [room]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  };

  const getTypeColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'info': return '#3b82f6';
      case 'chat': return '#10b981';
      case 'participant': return '#f59e0b';
      case 'track': return '#8b5cf6';
      case 'connection': return '#06b6d4';
      case 'error': return '#ef4444';
      default: return theme.textColor;
    }
  };

  const getNetworkQuality = (): { level: string; color: string; description: string } => {
    if (streamStats.ping < 50 && streamStats.packetLoss < 1 && streamStats.jitter < 20) {
      return { level: 'EXCELLENT', color: '#00ff00', description: 'Optimal streaming conditions' };
    } else if (streamStats.ping < 80 && streamStats.packetLoss < 2 && streamStats.jitter < 30) {
      return { level: 'GOOD', color: '#00ff00', description: 'Good streaming quality' };
    } else if (streamStats.ping < 150 && streamStats.packetLoss < 5) {
      return { level: 'FAIR', color: '#ffaa00', description: 'Acceptable with minor issues' };
    } else {
      return { level: 'POOR', color: '#ff0000', description: 'Network issues detected' };
    }
  };

  // Monitor network quality changes
  useEffect(() => {
    const quality = getNetworkQuality();
    if (quality.level !== lastNetworkQuality && lastNetworkQuality !== '') {
      addLog('connection', `Network quality changed: ${lastNetworkQuality} → ${quality.level}`);
    }
    setLastNetworkQuality(quality.level);
  }, [streamStats.ping, streamStats.packetLoss, streamStats.jitter]);

  const filteredLogs = filter === 'all' ? logs : logs.filter((log) => log.type === filter);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 right-4 rounded-lg shadow-lg px-4 py-2 transition-all hover:scale-105 flex items-center gap-3 z-50 border-2"
        style={{
          backgroundColor: '#0a0a0a',
          borderColor: '#00ff00',
          color: '#00ff00',
        }}
      >
        <Terminal className="w-5 h-5" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium font-mono">DEBUG_TERMINAL</span>
          <span className="text-xs font-mono opacity-70">
            {streamStats.ping}ms | {logs.length} logs
          </span>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: streamStats.ping < 80 ? '#00ff00' : streamStats.ping < 150 ? '#ffaa00' : '#ff0000'
          }}
        />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 w-[450px] shadow-2xl rounded-lg border-2 z-50"
        style={{ backgroundColor: '#0a0a0a', borderColor: '#00ff00' }}
      >
        <div
          className="cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ backgroundColor: '#1a1a1a', borderColor: '#00ff00' }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" style={{ color: '#00ff00' }} />
              <span className="text-sm font-medium font-mono" style={{ color: '#00ff00' }}>
                DEBUG_TERMINAL
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: '#00ff00', color: '#0a0a0a' }}>
                {logs.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                className="p-1 rounded hover:bg-white/10"
              >
                <Maximize2 className="w-4 h-4" style={{ color: '#00ff00' }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" style={{ color: '#00ff00' }} />
              </button>
            </div>
          </div>
          <div className="px-3 py-2 grid grid-cols-3 gap-2 text-xs font-mono" style={{ backgroundColor: '#0f0f0f' }}>
            <div className="flex items-baseline gap-1">
              <span className="opacity-50" style={{ color: '#00ff00' }}>PING:</span>
              <span style={{ color: streamStats.ping > 150 ? '#ff0000' : streamStats.ping > 80 ? '#ffaa00' : '#00ff00' }}>
                {streamStats.ping}ms
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="opacity-50" style={{ color: '#00ff00' }}>FPS:</span>
              <span style={{ color: '#00ff00' }}>{streamStats.fps || 'N/A'}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="opacity-50" style={{ color: '#00ff00' }}>LOSS:</span>
              <span style={{ color: streamStats.packetLoss > 5 ? '#ff0000' : '#00ff00' }}>{streamStats.packetLoss}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-[600px] h-[500px] shadow-2xl rounded-lg border-2 flex flex-col z-50"
      style={{ backgroundColor: '#0a0a0a', borderColor: '#00ff00' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b-2"
        style={{ backgroundColor: '#1a1a1a', borderColor: '#00ff00' }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" style={{ color: '#00ff00' }} />
          <span className="text-sm font-medium font-mono" style={{ color: '#00ff00' }}>
            DEBUG_TERMINAL
          </span>
          <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: '#00ff00', color: '#0a0a0a' }}>
            {participantMode.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLogs([])}
            className="p-1 rounded hover:bg-white/10 transition"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" style={{ color: '#00ff00' }} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-white/10 transition"
          >
            <Minimize2 className="w-4 h-4" style={{ color: '#00ff00' }} />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" style={{ color: '#00ff00' }} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-2 py-2 border-b flex-wrap" style={{ borderColor: '#333', backgroundColor: '#0f0f0f' }}>
        {['all', 'info', 'chat', 'participant', 'track', 'connection', 'error'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded text-xs font-mono transition ${filter === f ? 'opacity-100' : 'opacity-50'}`}
            style={{
              backgroundColor: filter === f ? '#00ff00' : '#222',
              color: filter === f ? '#0a0a0a' : '#00ff00',
              border: filter === f ? '1px solid #00ff00' : '1px solid #333',
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stream Stats Panel */}
      <div
        className="px-3 py-2 border-b"
        style={{ borderColor: '#333', backgroundColor: '#1a1a1a' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono opacity-60" style={{ color: '#00ff00' }}>STREAM STATISTICS</span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#0a0a0a', color: '#00ff00' }}>
              {participantMode === 'streamer' ? '↑ OUT' : '↓ IN'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono opacity-60" style={{ color: '#00ff00' }}>
              {getNetworkQuality().description}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: '#0a0a0a' }}>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: getNetworkQuality().color }}
              />
              <span className="text-xs font-mono font-semibold" style={{ color: getNetworkQuality().color }}>
                {getNetworkQuality().level}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="flex items-baseline gap-1">
            <span className="opacity-50" style={{ color: '#00ff00' }}>PING:</span>
            <span className="font-semibold" style={{ color: streamStats.ping > 150 ? '#ff0000' : streamStats.ping > 80 ? '#ffaa00' : '#00ff00' }}>
              {streamStats.ping}ms
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="opacity-50" style={{ color: '#00ff00' }}>BITS:</span>
            <span className="font-semibold" style={{ color: '#00ff00' }}>
              {streamStats.bitrate > 0 ? `${streamStats.bitrate}kb` : 'N/A'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="opacity-50" style={{ color: '#00ff00' }}>FPS:</span>
            <span className="font-semibold" style={{ color: streamStats.fps < 20 && streamStats.fps > 0 ? '#ffaa00' : '#00ff00' }}>
              {streamStats.fps > 0 ? streamStats.fps : 'N/A'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="opacity-50" style={{ color: '#00ff00' }}>RES:</span>
            <span className="font-semibold" style={{ color: '#00ff00' }}>
              {streamStats.resolution !== '0x0' ? streamStats.resolution : 'N/A'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="opacity-50" style={{ color: '#00ff00' }}>LOSS:</span>
            <span className="font-semibold" style={{ color: streamStats.packetLoss > 5 ? '#ff0000' : streamStats.packetLoss > 2 ? '#ffaa00' : '#00ff00' }}>
              {streamStats.packetLoss}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="opacity-50" style={{ color: '#00ff00' }}>JITTER:</span>
            <span className="font-semibold" style={{ color: streamStats.jitter > 30 ? '#ffaa00' : '#00ff00' }}>
              {streamStats.jitter}ms
            </span>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div
        className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full opacity-50" style={{ color: '#00ff00' }}>
            <div className="text-center">
              <div className="mb-2">{'> '}_</div>
              <div>Waiting for logs...</div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 px-1 py-0.5 opacity-60 border-b border-gray-700 mb-2">
              <span style={{ color: '#888' }}>{'>'} LiveKit Debug Terminal v1.0</span>
            </div>
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-2 hover:bg-white/5 px-1 py-0.5 rounded">
                <span className="opacity-50" style={{ color: '#666' }}>
                  {formatTime(log.timestamp)}
                </span>
                <span
                  className="font-semibold uppercase"
                  style={{ color: getTypeColor(log.type), minWidth: '80px' }}
                >
                  [{log.type}]
                </span>
                <span style={{ color: '#e5e5e5' }}>{log.message}</span>
              </div>
            ))}
            <div className="flex gap-2 px-1 py-0.5 mt-2 border-t border-gray-700">
              <span style={{ color: '#00ff00' }}>{'>'}</span>
              <span className="animate-pulse" style={{ color: '#00ff00' }}>_</span>
            </div>
          </>
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer Stats */}
      <div
        className="px-3 py-2 border-t flex items-center justify-between text-xs font-mono"
        style={{ borderColor: theme.primaryColor + '40', backgroundColor: '#1a1a1a', color: '#00ff00' }}
      >
        <div className="flex items-center gap-4">
          <div>LOGS: {logs.length}/100</div>
          <div>|</div>
          <div>PARTICIPANTS: {participants.length}</div>
          <div>|</div>
          <div>MODE: {participantMode.toUpperCase()}</div>
          <div>|</div>
          <div className="truncate max-w-[120px]">USER: {participantName}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs opacity-60">
            {participantMode === 'streamer' ? 'OUTBOUND' : 'INBOUND'}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full text-red-500 animate-ping">
            <Disc className="w-8 h-8 animate-ping text-red-500" />
            </div>
            <span>LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
