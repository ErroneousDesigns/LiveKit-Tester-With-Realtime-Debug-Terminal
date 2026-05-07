import { useEffect, useState } from "react";
import {
  useRoomContext,
  useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { CustomVideoRoom } from "./CustomVideoRoom";
import { RoomTheme } from "../utils/livekit";

interface RoomWrapperProps {
  theme: RoomTheme;
  participantName: string;
  participantMode: "streamer" | "viewer";
}

export function RoomWrapper({
  theme,
  participantName,
  participantMode,
}: RoomWrapperProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && room) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [connectionState, room]);

  if (
    !isReady ||
    connectionState !== ConnectionState.Connected
  ) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="text-xl mb-2"
            style={{ color: theme.textColor }}
          >
            {connectionState === ConnectionState.Connecting
              ? "Connecting to room..."
              : connectionState === ConnectionState.Reconnecting
                ? "Reconnecting..."
                : "Establishing connection..."}
          </div>
          <div
            className="text-sm opacity-60"
            style={{ color: theme.textColor }}
          >
            Please wait
          </div>
        </div>
      </div>
    );
  }

  return (
    <CustomVideoRoom
      theme={theme}
      participantName={participantName}
      participantMode={participantMode}
    />
  );
}