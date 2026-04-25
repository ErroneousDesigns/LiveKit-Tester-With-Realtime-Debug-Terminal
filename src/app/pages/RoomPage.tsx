import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { Settings, LogOut, AlertCircle, Palette } from 'lucide-react';
import { LiveKitConfig, loadConfig, generateToken, clearConfig, RoomTheme, loadTheme, saveTheme } from '../utils/livekit';
import { RoomWrapper } from '../components/RoomWrapper';

export function RoomPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LiveKitConfig | null>(null);
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [theme, setTheme] = useState<RoomTheme>(loadTheme());
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  useEffect(() => {
    const saved = loadConfig();
    if (!saved) {
      navigate('/');
      return;
    }

    // Ensure backward compatibility
    const configWithDefaults = {
      ...saved,
      participantMode: saved.participantMode || 'streamer',
    };

    generateToken(configWithDefaults)
      .then((generatedToken) => {
        setConfig(configWithDefaults);
        setToken(generatedToken);
        setError('');
      })
      .catch((err) => {
        setError('Failed to generate access token. Please check your API credentials.');
        console.error('Token generation error:', err);
      });
  }, [navigate]);

  const handleLeave = () => {
    navigate('/');
  };

  const handleReconfigure = () => {
    clearConfig();
    navigate('/');
  };

  const handleThemeChange = (field: keyof RoomTheme, value: string) => {
    const newTheme = { ...theme, [field]: value };
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="rounded-xl shadow-2xl max-w-md w-full p-8" style={{ backgroundColor: theme.primaryColor + '20' }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-2xl font-bold text-red-500">Configuration Error</h2>
          </div>
          <p className="mb-6 text-red-400">{error}</p>
          <button
            onClick={handleReconfigure}
            className="w-full py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accentColor, color: theme.textColor }}
          >
            <Settings className="w-5 h-5" />
            Reconfigure
          </button>
        </div>
      </div>
    );
  }

  if (!config || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="text-xl" style={{ color: theme.textColor }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      <div
        className="fixed top-0 left-0 right-0 z-50 border-b px-4 py-3"
        style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor + '80' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg" style={{ color: theme.textColor }}>
              LiveKit Tester
            </h1>
            <div className="text-sm" style={{ color: theme.textColor + 'cc' }}>
              Room: <span className="font-medium" style={{ color: theme.textColor }}>{config.roomName}</span>
            </div>
            <div className="text-sm" style={{ color: theme.textColor + 'cc' }}>
              User: <span className="font-medium" style={{ color: theme.textColor }}>{config.participantName}</span>
            </div>
            <div
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: theme.accentColor, color: theme.textColor }}
            >
              {config.participantMode === 'streamer' ? 'Streamer' : 'Viewer'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThemeEditor(!showThemeEditor)}
              className="px-4 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2 text-sm"
              style={{ backgroundColor: theme.accentColor, color: theme.textColor }}
            >
              <Palette className="w-4 h-4" />
              Theme
            </button>
            <button
              onClick={handleReconfigure}
              className="px-4 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2 text-sm"
              style={{ backgroundColor: theme.textColor + '20', color: theme.textColor }}
            >
              <Settings className="w-4 h-4" />
              Reconfigure
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Theme Editor */}
      {showThemeEditor && (
        <div
          className="fixed top-16 right-4 z-40 rounded-lg shadow-2xl p-4 w-72"
          style={{ backgroundColor: theme.backgroundColor, border: `1px solid ${theme.primaryColor}` }}
        >
          <h3 className="font-semibold mb-3" style={{ color: theme.textColor }}>
            Customize Theme
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.textColor + 'cc' }}>
                Primary Color
              </label>
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                className="w-full h-10 rounded border cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.textColor + 'cc' }}>
                Background Color
              </label>
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                className="w-full h-10 rounded border cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.textColor + 'cc' }}>
                Text Color
              </label>
              <input
                type="color"
                value={theme.textColor}
                onChange={(e) => handleThemeChange('textColor', e.target.value)}
                className="w-full h-10 rounded border cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.textColor + 'cc' }}>
                Accent Color
              </label>
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                className="w-full h-10 rounded border cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      <div className="pt-16 h-screen">
        {token && config ? (
          <LiveKitRoom
            video={config.participantMode === 'streamer'}
            audio={config.participantMode === 'streamer'}
            token={token}
            serverUrl={config.url}
            connect={true}
            onDisconnected={handleLeave}
            onError={(error) => {
              console.error('LiveKit error:', error);
              if (error.message && !error.message.includes('Client initiated disconnect')) {
                setError(`Connection error: ${error.message}`);
              }
            }}
            className="h-full"
          >
            <RoomWrapper theme={theme} participantName={config.participantName} participantMode={config.participantMode || 'streamer'} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-xl" style={{ color: theme.textColor }}>Connecting...</div>
          </div>
        )}
      </div>
    </div>
  );
}