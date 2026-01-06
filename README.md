# Banana-Studio

[简体中文](./README_CN.md) | **English**

A modern, AI-powered image editor based on Next.js 16, utilizing Google's Gemini models and Meta's SAM-2 for a seamless creative experience.

![Banana Studio Demo](./demo.png)

## Features

- 🎨 **AI-Powered Image Editing**: Modify images naturally using text prompts (e.g., "turn the sky purple").
- ✨ **Image Generation**: Create high-quality visual assets from scratch using Google Gemini 2.5/3.0.
- 🪄 **Magic Segmentation**: Instantly segment and extract objects into layers using Meta SAM-2.
- 🖼️ **Professional Layer System**: Full layering support with visibility, reordering, and blending modes.
- ✂️ **Local Editing Tools**: Built-in crop, rotate, and comprehensive filter presets (Vintage, Noir, Cinematic).
- ⚡ **High Performance**: Built on Next.js App Router and React 19 Server Actions for blazing fast responses.

## Prerequisites

- **Node.js**: v20+
- **API Keys**:
  - Google Gemini API Key ([Get here](https://aistudio.google.com/app/apikey))
  - Replicate API Token ([Get here](https://replicate.com/account/api-tokens))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/banana-studio.git
   cd banana-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```bash
   GOOGLE_API_KEY=your_google_key
   REPLICATE_API_TOKEN=your_replicate_token
   ```
   *(See [SETUP.md](./SETUP.md) for detailed configuration)*

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to start creating.

## Usage

### Generative Mode
1. Select "Generate" from the canvas.
2. Enter a descriptive prompt (e.g., "cyberpunk city street at night").
3. Click "Run Generate" to create a new layer.

### Edit Mode
1. Upload an image or select a layer.
2. Use the "Magic" tool to segment objects if needed.
3. Type an edit instruction (e.g., "make it look like a painting").
4. Apply filters from the "Filters" panel.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Database**: SQLite (`better-sqlite3`)
- **AI Integration**:
  - Google GenAI SDK (Gemini)
  - Replicate SDK (SAM-2)
- **Internationalization**: `next-intl`

## Project Structure

```
src/
├── app/                 # Next.js App Router & Server Actions
├── components/          # React UI Components
│   ├── studio/          # Core Editor Components (Canvas, Layers)
│   └── ui/              # Shared UI Kit
├── lib/                 # Utilities & Database Logic
├── messages/            # i18n Translation Files
└── ...
```
*(See [DEVELOPMENT.md](./DEVELOPMENT.md) for architecture details)*

## Code Quality

- **Type Safety**: Fully typed with TypeScript.
- **Secure**: Server-side API calls prevent key leakage; Parameterized SQL queries prevent injection.
- **Optimized**: Server Actions for efficient backend logic execution.

## License

MIT
