# Rephrasely 

A powerful AI-powered desktop application for rephrasing text with system-wide hotkey support. Built with Next.js, Electron, and multiple AI providers.

![Rephrasely Demo](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-0.1.0-orange)

## Features

- **System-wide hotkeys** - Rephrase text anywhere with `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux)
- **Multiple AI providers** - Support for Anthropic Claude and Google Gemini models
- **Intelligent fallback** - Automatically switches between models if one fails
- **Profile management** - Save and switch between different rephrasing profiles
- **Customizable settings** - Configure hotkeys, AI models, and prompts
- **Modern UI** - Clean, Mac-friendly interface built with Mantine
- **Standalone desktop app** - No browser required, works offline once configured

## Quick Start

### Download & Install

1. **Download** the latest release for your platform:
   - **macOS (Intel)**: `Rephrasely-0.1.0.dmg`
   - **macOS (Apple Silicon)**: `Rephrasely-0.1.0-arm64.dmg`
   - **Windows**: `Rephrasely Setup 0.1.0.exe`
   - **Linux**: `Rephrasely-0.1.0.AppImage`

2. **Install** by double-clicking the installer
3. **Launch** from Applications (macOS) or Start Menu (Windows)
4. **Configure** your API keys in Settings

### Usage

1. **Set up API keys** in the Settings page
2. **Create profiles** with custom prompts for different use cases
3. **Select text anywhere** on your system
4. **Press the hotkey** (`Cmd+Shift+R` or `Ctrl+Shift+R`)
5. **Get rephrased text** automatically copied to clipboard

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python (for native module compilation)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rephrasely.git
cd rephrasely

# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron in development mode
npm run electron:dev
```

### Building

```bash
# Build for current platform
npm run pack:mac     # macOS
npm run pack:win     # Windows  
npm run pack:linux   # Linux

# Build for all platforms
npm run pack:all
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Framework**: Mantine, Tailwind CSS
- **Desktop**: Electron
- **AI Integration**: Google Genkit
- **AI Providers**: Anthropic Claude, Google Gemini
- **State Management**: React Hooks, Local Storage
- **Build Tool**: Electron Builder

## Project Structure

```
src/
├── ai/                 # AI integration and flows
│   ├── flows/         # Genkit flows for text processing
│   └── genkit.ts      # AI provider configuration
├── app/               # Next.js app router pages
├── components/        # React components
│   ├── profiles/      # Profile management
│   ├── settings/      # Settings UI
│   └── tools/         # Rephraser tool
├── lib/               # Utilities and schemas
├── renderer/          # Electron renderer process
└── types/             # TypeScript type definitions

electron/
├── main.js           # Electron main process
└── preload.js        # Electron preload script
```

## Configuration

### API Keys

Configure your AI provider API keys in the Settings page:

- **Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
- **Google**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Hotkeys

Default hotkeys can be customized in Settings:
- **macOS**: `Cmd+Shift+R`
- **Windows/Linux**: `Ctrl+Shift+R`

### Profiles

Create custom profiles with:
- **Name**: Profile identifier
- **Prompt**: Custom rephrasing instructions
- **AI Provider**: Anthropic or Google
- **Model**: Specific AI model to use

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Electron](https://electronjs.org/) - Desktop app framework
- [Mantine](https://mantine.dev/) - UI components
- [Google Genkit](https://firebase.google.com/docs/genkit) - AI integration
- [Anthropic](https://anthropic.com/) - Claude AI models
- [Google AI](https://ai.google/) - Gemini AI models

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/rephrasely/issues) page
2. Create a new issue with detailed information
3. Include your OS, app version, and error messages

---

**Made with for productivity enthusiasts**
