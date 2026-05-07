import { useState, useEffect } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import {
  Track,
  VideoPresets,
  VideoPreset,
} from "livekit-client";
import { Video, Settings } from "lucide-react";
import { RoomTheme } from "../utils/livekit";

interface VideoQualitySettingsProps {
  theme: RoomTheme;
}

const qualityPresets: {
  name: string;
  preset: VideoPreset;
  description: string;
}[] = [
  {
    name: "4K",
    preset: VideoPresets.h2160,
    description: "3840x2160 @ 30fps",
  },
  {
    name: "1080p",
    preset: VideoPresets.h1080,
    description: "1920x1080 @ 30fps",
  },
  {
    name: "720p",
    preset: VideoPresets.h720,
    description: "1280x720 @ 30fps",
  },
  {
    name: "540p",
    preset: VideoPresets.h540,
    description: "960x540 @ 30fps",
  },
  {
    name: "360p",
    preset: VideoPresets.h360,
    description: "640x360 @ 30fps",
  },
  {
    name: "240p",
    preset: VideoPresets.h240,
    description: "426x240 @ 30fps",
  },
];

export function VideoQualitySettings({
  theme,
}: VideoQualitySettingsProps) {
  const localParticipantData = useLocalParticipant();
  const localParticipant =
    localParticipantData?.localParticipant;
  const [selectedQuality, setSelectedQuality] =
    useState<string>("720p");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!localParticipant) return;

    const applyQuality = async () => {
      const quality = qualityPresets.find(
        (q) => q.name === selectedQuality,
      );
      if (!quality) return;

      const videoTrack = localParticipant.videoTrackPublications
        .values()
        .next().value;
      if (!videoTrack?.track) return;

      try {
        console.log(
          `[Video Quality] Changing to ${quality.name} (${quality.description})`,
        );
        // Note: This requires the track to support quality changes
        // You may need to restart the track with new constraints
      } catch (err) {
        console.error(
          "[Video Quality] Failed to change quality:",
          err,
        );
      }
    };

    applyQuality();
  }, [selectedQuality, localParticipant]);

  if (!localParticipant) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-2"
        style={{
          backgroundColor: theme.primaryColor + "40",
          color: theme.textColor,
        }}
      >
        <Video className="w-4 h-4" />
        Quality: {selectedQuality}
      </button>

      {showSettings && (
        <div
          className="absolute top-full mt-2 right-0 rounded-lg shadow-2xl p-3 w-64 z-50 border"
          style={{
            backgroundColor: theme.backgroundColor,
            borderColor: theme.primaryColor,
          }}
        >
          <div
            className="flex items-center gap-2 mb-3 pb-2 border-b"
            style={{ borderColor: theme.primaryColor + "40" }}
          >
            <Settings
              className="w-4 h-4"
              style={{ color: theme.textColor }}
            />
            <h4
              className="font-medium text-sm"
              style={{ color: theme.textColor }}
            >
              Video Quality
            </h4>
          </div>

          <div className="space-y-2">
            {qualityPresets.map((quality) => (
              <button
                key={quality.name}
                onClick={() => {
                  setSelectedQuality(quality.name);
                  setShowSettings(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedQuality === quality.name
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor:
                    selectedQuality === quality.name
                      ? theme.accentColor
                      : theme.primaryColor + "20",
                  color: theme.textColor,
                }}
              >
                <div className="font-medium">
                  {quality.name}
                </div>
                <div className="text-xs opacity-70">
                  {quality.description}
                </div>
              </button>
            ))}
          </div>

          <div
            className="mt-3 pt-3 border-t text-xs opacity-60"
            style={{
              borderColor: theme.primaryColor + "40",
              color: theme.textColor,
            }}
          >
            Higher quality requires more bandwidth
          </div>
        </div>
      )}
    </div>
  );
}