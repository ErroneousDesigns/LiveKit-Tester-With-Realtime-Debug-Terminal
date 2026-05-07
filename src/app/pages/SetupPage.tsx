import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Video,
  Settings,
  PlayCircle,
  Shield,
  Users,
  Eye,
} from "lucide-react";
import {
  LiveKitConfig,
  saveConfig,
  loadConfig,
  RoomTheme,
  saveTheme,
  loadTheme,
  DEFAULT_THEME,
} from "../utils/livekit";

const generateRandomUsername = (
  mode: "streamer" | "viewer",
) => {
  const prefix = mode === "streamer" ? "Streamer" : "Viewer";
  return `${prefix}-${Math.floor(Math.random() * 10000)}`;
};

export function SetupPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LiveKitConfig>({
    url: "",
    apiKey: "",
    apiSecret: "",
    roomName: "test-room",
    participantName: generateRandomUsername("streamer"),
    useTokenServer: false,
    tokenServerUrl: "",
    participantMode: "streamer",
  });
  const [theme, setTheme] = useState<RoomTheme>(DEFAULT_THEME);
  const [showThemeCustomizer, setShowThemeCustomizer] =
    useState(false);

  useEffect(() => {
    const saved = loadConfig();
    if (saved) {
      // Ensure all fields are present for backward compatibility
      setConfig({
        ...saved,
        useTokenServer: saved.useTokenServer ?? false,
        tokenServerUrl: saved.tokenServerUrl ?? "",
        participantMode: saved.participantMode ?? "streamer",
      });
    }
    setTheme(loadTheme());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    saveTheme(theme);
    navigate("/room");
  };

  const handleChange =
    (field: keyof LiveKitConfig) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleToggleTokenServer = () => {
    setConfig((prev) => ({
      ...prev,
      useTokenServer: !prev.useTokenServer,
    }));
  };

  const handleThemeChange = (
    field: keyof RoomTheme,
    value: string,
  ) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
  };

  const handleModeChange = (mode: "streamer" | "viewer") => {
    setConfig((prev) => ({
      ...prev,
      participantMode: mode,
      participantName: generateRandomUsername(mode),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl">
            <Video className="w-8 h-8 animate-pulse text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              LiveKit Tester
            </h1>
            <p className="text-gray-600">
              Quick configuration testing tool with debug
              terminal
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Testing Configuration
                </p>
                <p className="text-blue-700">
                  Enter your LiveKit server details below. Your
                  credentials are stored locally in your
                  browser.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LiveKit Server URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={handleChange("url")}
                placeholder="wss://your-project.livekit.cloud"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: wss://myproject-abc123.livekit.cloud
              </p>
            </div>

            {/* Participant Mode Selection */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Participant Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange("streamer")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                    config.participantMode === "streamer"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <Video
                    className={`w-6 h-6 ${config.participantMode === "streamer" ? "text-indigo-600" : "text-gray-600"}`}
                  />
                  <div className="text-center">
                    <div
                      className={`font-medium ${config.participantMode === "streamer" ? "text-indigo-900" : "text-gray-900"}`}
                    >
                      Streamer
                    </div>
                    <div className="text-xs text-gray-600">
                      Publish audio/video
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("viewer")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                    config.participantMode === "viewer"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <Eye
                    className={`w-6 h-6 ${config.participantMode === "viewer" ? "text-indigo-600" : "text-gray-600"}`}
                  />
                  <div className="text-center">
                    <div
                      className={`font-medium ${config.participantMode === "viewer" ? "text-indigo-900" : "text-gray-900"}`}
                    >
                      Viewer
                    </div>
                    <div className="text-xs text-gray-600">
                      Watch only
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Switching modes will generate a new random
                username
              </p>
            </div>

            {/* Token Generation Mode Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-900">
                    Token Generation Mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTokenServer}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.useTokenServer
                      ? "bg-indigo-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.useTokenServer
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {config.useTokenServer
                  ? "Using token server (recommended for production)"
                  : "Client-side generation (quick testing only)*"}
              </p>
            </div>

            {config.useTokenServer ? (
              // Token Server Mode
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Server URL
                  <br></br>
                  (NOTE: Firebase Functions URL Is Accepted But
                  First You Must Disable Authenticate In The
                  Function)
                </label>
                <input
                  type="text"
                  value={config.tokenServerUrl}
                  onChange={handleChange("tokenServerUrl")}
                  placeholder="https://your-server.com/api/token"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required={config.useTokenServer}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Otherwise your token server should accept POST
                  requests with room, identity, and name fields
                </p>
              </div>
            ) : (
              // Client-side Generation Mode
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={config.apiKey}
                    onChange={handleChange("apiKey")}
                    placeholder="APIxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-mono text-sm"
                    required={!config.useTokenServer}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={config.apiSecret}
                    onChange={handleChange("apiSecret")}
                    placeholder="Your API secret"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-mono text-sm"
                    required={!config.useTokenServer}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={config.roomName}
                  onChange={handleChange("roomName")}
                  placeholder="test-room"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.participantName}
                    onChange={handleChange("participantName")}
                    placeholder="User-123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleModeChange(config.participantMode)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                    title="Generate new username"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>

            {/* Theme Customization */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Room Theme
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setShowThemeCustomizer(!showThemeCustomizer)
                  }
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {showThemeCustomizer ? "Hide" : "Customize"}
                </button>
              </div>
              {showThemeCustomizer && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        handleThemeChange(
                          "primaryColor",
                          e.target.value,
                        )
                      }
                      className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Background
                    </label>
                    <input
                      type="color"
                      value={theme.backgroundColor}
                      onChange={(e) =>
                        handleThemeChange(
                          "backgroundColor",
                          e.target.value,
                        )
                      }
                      className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={theme.textColor}
                      onChange={(e) =>
                        handleThemeChange(
                          "textColor",
                          e.target.value,
                        )
                      }
                      className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) =>
                        handleThemeChange(
                          "accentColor",
                          e.target.value,
                        )
                      }
                      className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
          >
            <PlayCircle className="w-5 h-5" />
            Join Room
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {config.useTokenServer
              ? "Tokens will be fetched from your server. Ensure your server is running and accessible."
              : "*Client-side token generation is for testing only. In production, tokens should be generated server-side."}
          </p>
        </div>
        <div>
          <br></br>
          <p className="text-red-500 text-xs text-center">
            • Copyright ©{" "}
            <a
              href="http://erroneous.biz"
              target="_blank"
              className="text-black hover:text-blue-500 hover:underline"
            >
              Erroneous Designs
            </a>{" "}
            2026 • All Rights Reserved ®{" "}
            <a
              href="http://erroneous.biz"
              target="_blank"
              className="text-purple-500 hover:text-green-500 hover:underline"
            >
              Erroneous Holdings LLC
            </a>{" "}
            •<br></br>• (- Designing Your World, Your Way!™ -)
            •
          </p>
        </div>
      </div>
    </div>
  );
}