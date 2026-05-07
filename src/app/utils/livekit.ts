import { SignJWT } from "jose";

export interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  roomName: string;
  participantName: string;
  useTokenServer: boolean;
  tokenServerUrl?: string;
  participantMode: "streamer" | "viewer";
}

export interface RoomTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

const DEFAULT_THEME: RoomTheme = {
  primaryColor: "#6366f1",
  backgroundColor: "#111827",
  textColor: "#ffffff",
  accentColor: "#8b5cf6",
};

export async function generateToken(
  config: LiveKitConfig,
): Promise<string> {
  // If using token server, fetch token from server
  if (config.useTokenServer && config.tokenServerUrl) {
    try {
      const response = await fetch(config.tokenServerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: config.roomName,
          identity: config.participantName,
          name: config.participantName,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Token server returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.token || data.accessToken || data;
    } catch (err) {
      console.error("Token server error:", err);
      throw new Error(
        `Failed to fetch token from server: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  // Validate required fields for client-side generation
  if (!config.apiKey || !config.apiSecret) {
    throw new Error(
      "API Key and Secret are required for client-side token generation",
    );
  }

  // Otherwise generate token client-side
  const isViewer = config.participantMode === "viewer";
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    iss: config.apiKey,
    nbf: Math.floor(Date.now() / 1000),
    sub: config.participantName,
    name: config.participantName,
    video: {
      room: config.roomName,
      roomJoin: true,
      canPublish: !isViewer,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const secret = new TextEncoder().encode(config.apiSecret);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);

  return token;
}

export function saveConfig(config: LiveKitConfig): void {
  localStorage.setItem(
    "livekit-config",
    JSON.stringify(config),
  );
}

export function loadConfig(): LiveKitConfig | null {
  const stored = localStorage.getItem("livekit-config");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  localStorage.removeItem("livekit-config");
}

export function saveTheme(theme: RoomTheme): void {
  localStorage.setItem("livekit-theme", JSON.stringify(theme));
}

export function loadTheme(): RoomTheme {
  const stored = localStorage.getItem("livekit-theme");
  if (!stored) return DEFAULT_THEME;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_THEME;
  }
}

export { DEFAULT_THEME };