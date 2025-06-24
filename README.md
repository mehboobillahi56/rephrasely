# Rephrasely 

A powerful AI-powered desktop application for rephrasing text with system-wide hotkey support. Built with Next.js, Electron, and multiple AI providers.

## Features

- **AI-Powered Rephrasing** - Advanced text rephrasing using AI models
- **System-wide Hotkeys** - Quick access from anywhere in your system 
- **Multiple Profiles** - Create and manage different rephrasing styles
- **Dark/Light Mode** - Built-in theme support

## Tech Stack

- **Frontend**: 
  - Next.js 15.3.3
  - React 18+
  - TypeScript
  - Tailwind CSS
  - Mantine UI

- **Desktop**:
  - Electron 28.3.3
  - Electron Builder

- **Styling**:
  - Tailwind CSS
  - PostCSS
  - CSS Modules

- **Development Tools**:
  - ESLint
  - Prettier
  - Webpack

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rephrasely.git
   cd rephrasely
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, start Electron:
   ```bash
   npm run electron:dev
   ```

### Building for Production

1. Build the Next.js app:
   ```bash
   npm run build
   ```

2. Package for your platform:
   - Windows: `npm run pack:win`
   - macOS: `npm run pack:mac`
   - Linux: `npm run pack:linux`

## Project Structure

```
rephrasely/
├── src/                 # Source code
│   ├── app/            # Next.js app directory
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts
│   └── styles/         # Global styles
├── electron/           # Electron main process
├── public/             # Static assets
└── scripts/            # Build and utility scripts
```

## Usage

1. **Set up API keys** in the Settings page
2. **Create profiles** with custom prompts for different use cases
3. **Select text anywhere** on your system
4. **Press the hotkey** (`Ctrl+R` )
5. **Get rephrased text** automatically 

