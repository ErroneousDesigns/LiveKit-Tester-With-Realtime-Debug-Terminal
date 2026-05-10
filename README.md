# LiveKit Tester - Advanced Streaming Testing Tool

A comprehensive LiveKit testing application built with React, TypeScript, and Tailwind CSS. This tool enables quick configuration testing for LiveKit streaming with real-time debugging capabilities, multiple participant modes, and fully customizable themes.

Want to test it without cloning? 

Click Here: https://erroneous.dev

## Features

### 🎥 Dual Participant Modes

- **Streamer Mode**: Publish audio/video with full camera and microphone controls
- **Viewer Mode**: Watch-only mode for testing streaming reception
- Automatic token generation with configurable permissions
- Switch modes seamlessly with auto-generated usernames

### 🔧 Configuration Options

- **Client-side Token Generation**: Quick testing with API key/secret
- **Token Server Mode**: Production-ready server-side token generation
- Room name and participant name customization
- Persistent configuration storage

### 🎨 Fully Customizable Theming

- Real-time theme editor with color pickers
- Customizable primary, background, text, and accent colors
- Theme persistence across sessions
- Live preview of color changes

### 💬 Overlay Chat System

- Transparent overlay chat with backdrop blur effects
- Customizable font size, timestamps, and compact mode
- Real-time messaging using LiveKit data channels
- Message history with auto-scroll
- Expandable/collapsible interface

### 🐛 Real-Time Debug Terminal

- Terminal-style debug console with green-on-black aesthetic
- Real-time stream statistics monitoring:
  - **Ping/Latency**: Updates every 5 seconds with color-coded warnings
  - **Bitrate**: Upload (streamer) or download (viewer) speeds
  - **FPS**: Current frames per second
  - **Resolution**: Active video resolution
  - **Packet Loss**: Network quality indicator
  - **Jitter**: Network stability metric
- Network quality rating (EXCELLENT/GOOD/FAIR/POOR)
- Filterable logs by type (info, chat, participant, track, connection, error)
- Event logging for all room activities
- Automatic alerts for network issues
- Expandable/minimizable interface

### 📊 Video Quality Controls

- Multiple quality presets: 4K, 1080p, 720p, 540p, 360p, 240p
- One-click quality switching (streamer mode only)
- Bandwidth requirement indicators

### 🪟 Multi-Window Testing

- **Setup Page**: Open multiple viewer windows/tabs
- **Streamer Room**:
  - Open single viewer window/tab
  - Open multiple viewer windows/tabs for load testing
- **Viewer Room**: Open streamer window/tab for testing both modes
- Each window/tab gets a unique auto-generated username
- Perfect for testing concurrent connections

### 📐 Layout Options

- Grid view for multiple participants
- Speaker view for focused streaming
- Customizable participant name display
- Connection quality indicators

## Screenshots

![](Screenshots/Screenshot%202026-04-25%20005058.png)

![](Screenshots/Screenshot%202026-04-25%20005736.png)

![](Screenshots/Screenshot%202026-05-09%20214540.png)

![](Screenshots/Screenshot%202026-05-09%20214701.png)

![](Screenshots/Screenshot%202026-05-09%20214730.png)

![](Screenshots/Screenshot%202026-05-09%20214750.png)

![](Screenshots/Screenshot%202026-05-09%20215210.png)

![](Screenshots/Screenshot%202026-05-09%20215232.png)

## Tech Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Styling**: Tailwind CSS v4.1.12
- **LiveKit SDK**:
  - @livekit/components-react ^2.9.20
  - livekit-client ^2.17.3
- **Routing**: react-router 7.13.0
- **Token Generation**: jose ^6.2.1 (browser-compatible JWT)
- **Icons**: lucide-react 0.487.0
- **Package Manager**: pnpm

## Installation

\`\`\`bash

# Clone the repository

git clone <repository-url>

# Install dependencies

pnpm install

# Start development server

npm run dev

## Usage

### Quick Start

1. **Enter LiveKit Credentials**:
   - LiveKit Server URL (e.g., \`wss://your-project.livekit.cloud\`)
   - Choose between client-side or token server mode
   - For client-side: Enter API Key and Secret
   - For token server: Enter token server URL

2. **Select Participant Mode**:
   - **Streamer**: Publish video/audio
   - **Viewer**: Watch-only mode

3. **Customize Theme** (Optional):
   - Click "Customize" under Room Theme
   - Adjust colors using color pickers

4. **Join Room**:
   - Click "Join Room" to enter the streaming session

### Multi-Window Testing

- **From Setup Page**: "Open Multiple Viewer Windows/Tabs" to launch concurrent viewers
- **From Viewer Room**: Click "Streamer" to open a streamer window/tab

### Debug Terminal

- Click the "DEBUG_TERMINAL" button in bottom-right
- View real-time statistics and logs
- Filter logs by type
- Monitor network quality and stream health
- Clear logs with trash icon
- Minimize or close as needed

## Configuration Options

### Token Generation Modes

**Client-Side (Quick Testing)**:
\`\`\`typescript
{
url: "wss://your-project.livekit.cloud",
apiKey: "APIxxxxxxxxxx",
apiSecret: "your-secret",
roomName: "test-room",
participantName: "Streamer-1234",
participantMode: "streamer",
useTokenServer: false
}
\`\`\`

**Token Server (Production)**:
\`\`\`typescript
{
url: "wss://your-project.livekit.cloud",
tokenServerUrl: "https://your-server.com/api/token",
roomName: "test-room",
participantName: "Viewer-5678",
participantMode: "viewer",
useTokenServer: true
}
\`\`\`

### Theme Configuration

All themes are customizable with:

- Primary Color (buttons, headers)
- Background Color (main background)
- Text Color (all text elements)
- Accent Color (highlights, badges)

## Features In Detail

### Stream Statistics Monitoring

The debug terminal provides comprehensive real-time metrics:

- **Ping Monitoring**: Every 5 seconds, color-coded (green <80ms, yellow <150ms, red >150ms)
- **Bitrate Tracking**: Real-time upload/download speeds in kbps
- **Frame Rate**: Current FPS with low-FPS warnings (<15fps)
- **Resolution**: Active video dimensions
- **Packet Loss**: Percentage with alerts when >5%
- **Jitter**: Network stability in milliseconds
- **Network Quality**: Overall rating based on combined metrics

### Auto-Logging

The terminal automatically logs:

- Connection state changes
- Participant joins/leaves
- Track subscriptions/unsubscriptions
- Chat messages
- Resolution changes
- Bitrate fluctuations
- Network quality transitions
- High packet loss alerts
- Low FPS warnings

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (WebRTC support required)

## Security Notes

⚠️ **Important**: For production, always use a token server.

## Project Structure

\`\`\`
src/
├── app/
│ ├── components/
│ │ ├── CustomVideoRoom.tsx # Main video room interface
│ │ ├── LiveKitChat.tsx # Overlay chat component
│ │ ├── DebugTerminal.tsx # Real-time debug console
│ │ ├── VideoQualitySettings.tsx # Quality presets
│ │ └── RoomWrapper.tsx # Connection state handler
│ ├── pages/
│ │ ├── SetupPage.tsx # Configuration page
│ │ └── RoomPage.tsx # Streaming room
│ ├── utils/
│ │ ├── livekit.ts # Token generation & config
│ │ └── windowHelper.ts # Multi-window management
│ └── routes.tsx # React Router setup
└── styles/
└── theme.css # Tailwind theme
\`\`\`

## Development

This project is built by Erroneous Designs and uses a custom build environment.

## Contributing

Contributions are welcome! Please ensure:

- Code follows TypeScript best practices
- Components are properly typed
- New features include appropriate logging in debug terminal
- UI changes maintain theme consistency

## License

Copyright © Erroneous Designs 2026 - Designing Your World, Your Way!

Erroneous Designs is a daughter company of:
Erroneous Holdings LLC - https://erroneous.biz

## Credits

Built with:

- [LiveKit](https://livekit.io/) - Real-time video/audio infrastructure
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icon library

---

**Need Help?** Check the debug terminal for real-time diagnostics and error messages. All connection issues, track problems, and network alerts are automatically logged.