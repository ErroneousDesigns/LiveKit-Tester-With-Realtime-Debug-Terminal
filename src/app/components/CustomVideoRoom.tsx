import { useState, useEffect } from 'react';
import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  AudioTrack,
  ParticipantTile,
  ControlBar,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Settings, Maximize2, Minimize2, Grid3x3, LayoutGrid } from 'lucide-react';
import { RoomTheme } from '../utils/livekit';
import { LiveKitChat } from './LiveKitChat';
import { DebugTerminal } from './DebugTerminal';
import { VideoQualitySettings } from './VideoQualitySettings';

interface CustomVideoRoomProps {
  theme: RoomTheme;
  participantName: string;
  participantMode: 'streamer' | 'viewer';
}

export function CustomVideoRoom({ theme, participantName, participantMode }: CustomVideoRoomProps) {
  const participants = useParticipants();
  const localParticipantData = useLocalParticipant();
  const localParticipant = localParticipantData?.localParticipant;
  const [showChat, setShowChat] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'speaker'>('grid');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    console.log('[Layout] Mode changed to:', layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    console.log('[Chat] Visibility:', showChat ? 'visible' : 'hidden');
  }, [showChat]);
  const [roomSettings, setRoomSettings] = useState({
    showParticipantNames: true,
    showConnectionQuality: true,
    chatPosition: 'right' as 'right' | 'left',
  });

  useEffect(() => {
    console.log('[Room Settings] Updated:', roomSettings);
  }, [roomSettings]);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const allParticipants = localParticipant ? [localParticipant, ...participants] : participants;

  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="flex h-full" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Chat - Left */}
      {showChat && roomSettings.chatPosition === 'left' && (
        <div className="w-80 flex-shrink-0">
          <LiveKitChat theme={theme} participantName={participantName} />
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Settings Bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: theme.primaryColor + '40' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: theme.textColor }}>
              {allParticipants.length} Tracks
            </span>
          </div>
          <div className="flex items-center gap-2">
            {participantMode === 'streamer' && <VideoQualitySettings theme={theme} />}
            <button
              onClick={() => setLayoutMode(layoutMode === 'grid' ? 'speaker' : 'grid')}
              className="px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-2"
              style={{ backgroundColor: theme.primaryColor + '40', color: theme.textColor }}
            >
              {layoutMode === 'grid' ? (
                <>
                  <Grid3x3 className="w-4 h-4" />
                  Grid
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  Speaker
                </>
              )}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-3 py-1.5 rounded-lg transition hover:opacity-80"
              style={{ backgroundColor: theme.accentColor, color: theme.textColor }}
            >
              {showChat ? 'Hide' : 'Show'} Chat
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg transition hover:opacity-80"
              style={{ backgroundColor: theme.primaryColor + '40' }}
            >
              <Settings className="w-4 h-4" style={{ color: theme.textColor }} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div
            className="p-4 border-b space-y-3"
            style={{ borderColor: theme.primaryColor + '40', backgroundColor: theme.primaryColor + '10' }}
          >
            <h4 className="font-medium text-sm" style={{ color: theme.textColor }}>
              Room Settings
            </h4>
            <div className="flex items-center justify-between">
              <label className="text-sm" style={{ color: theme.textColor + 'cc' }}>
                Show Participant Names
              </label>
              <button
                onClick={() =>
                  setRoomSettings({ ...roomSettings, showParticipantNames: !roomSettings.showParticipantNames })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                style={{ backgroundColor: roomSettings.showParticipantNames ? theme.accentColor : theme.textColor + '40' }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    roomSettings.showParticipantNames ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm" style={{ color: theme.textColor + 'cc' }}>
                Show Connection Quality
              </label>
              <button
                onClick={() =>
                  setRoomSettings({ ...roomSettings, showConnectionQuality: !roomSettings.showConnectionQuality })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                style={{ backgroundColor: roomSettings.showConnectionQuality ? theme.accentColor : theme.textColor + '40' }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    roomSettings.showConnectionQuality ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm" style={{ color: theme.textColor + 'cc' }}>
                Chat Position
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoomSettings({ ...roomSettings, chatPosition: 'left' })}
                  className={`px-3 py-1 rounded text-xs transition ${
                    roomSettings.chatPosition === 'left' ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{
                    backgroundColor: roomSettings.chatPosition === 'left' ? theme.accentColor : theme.primaryColor + '40',
                    color: theme.textColor,
                  }}
                >
                  Left
                </button>
                <button
                  onClick={() => setRoomSettings({ ...roomSettings, chatPosition: 'right' })}
                  className={`px-3 py-1 rounded text-xs transition ${
                    roomSettings.chatPosition === 'right' ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{
                    backgroundColor: roomSettings.chatPosition === 'right' ? theme.accentColor : theme.primaryColor + '40',
                    color: theme.textColor,
                  }}
                >
                  Right
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg opacity-50" style={{ color: theme.textColor }}>
                No video tracks available
              </p>
            </div>
          ) : (
            <div className={`grid ${getGridCols(tracks.length)} gap-4 h-full`}>
              {tracks
                .filter((track) => track.publication && track.participant)
                .map((track) => (
                  <div
                    key={track.publication?.trackSid || `${track.participant.identity}-${Date.now()}`}
                    className="relative rounded-lg overflow-hidden"
                    style={{ backgroundColor: theme.primaryColor + '20' }}
                  >
                    {track.publication?.kind === 'video' ? (
                      <VideoTrack
                        trackRef={track}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AudioTrack trackRef={track} />
                    )}
                    {roomSettings.showParticipantNames && track.participant && (
                      <div
                        className="absolute bottom-2 left-2 px-3 py-1 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: theme.backgroundColor + 'cc', color: theme.textColor }}
                      >
                        {track.participant.identity}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Control Bar */}
        {participantMode === 'streamer' && (
          <div className="p-4 border-t" style={{ borderColor: theme.primaryColor + '40' }}>
            <ControlBar
              variation="minimal"
              controls={{
                camera: true,
                microphone: true,
                screenShare: true,
                leave: false,
              }}
            />
          </div>
        )}
        {participantMode === 'viewer' && (
          <div className="p-4 border-t text-center" style={{ borderColor: theme.primaryColor + '40' }}>
            <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
              Viewer mode - You are watching the stream
            </p>
          </div>
        )}
      </div>

      {/* Chat - Right */}
      {showChat && roomSettings.chatPosition === 'right' && (
        <div className="w-80 flex-shrink-0">
          <LiveKitChat theme={theme} participantName={participantName} />
        </div>
      )}

      {/* Debug Terminal */}
      <DebugTerminal theme={theme} participantName={participantName} participantMode={participantMode} />
    </div>
  );
}
