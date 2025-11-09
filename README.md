# Brain Benchmark

A modern Next.js platform for cognitive assessment and brain training exercises built with TypeScript and Tailwind CSS.

## Features

- 🧠 **Cognitive Assessment**: Test and benchmark your mental performance across various domains
- 🎯 **Targeted Training**: Specialized exercises for aim, reaction time, memory, and attention
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 📱 **Mobile Responsive**: Optimized for all screen sizes and devices
- ⚡ **Fast Performance**: Built with Next.js 14 and optimized for speed
- 🎯 **TypeScript**: Fully typed for better development experience
- 📊 **Performance Tracking**: Detailed analytics and progress monitoring (coming soon)

## Brain Training Categories

- 🎯 **Aim Training**: Improve precision and hand-eye coordination
- ⚡ **Reaction Time**: Test and enhance your response speed
- 🧠 **Memory**: Challenge your working memory capacity
- 🔍 **Attention**: Measure focus and concentration abilities
- 🧮 **Processing Speed**: Assess cognitive processing efficiency
- 🎲 **Decision Making**: Train rapid decision-making skills

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd games
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
brain-benchmark/
├── app/                    # Next.js app directory
│   ├── tailwind.css      # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── loading.tsx       # Loading component
│   ├── not-found.tsx     # 404 page
│   └── about/            # About page
├── components/           # Reusable components
│   ├── BackgroundPattern.tsx  # Background design
│   ├── GameHeader.tsx    # Main header component
│   ├── GameFooter.tsx    # Footer component
│   └── SimpleGameGrid.tsx # Grid layout for exercises
├── games/               # Brain training exercises (coming soon)
│   └── types/           # Game type definitions
├── data/                # Exercise data
│   └── games.ts         # Exercise configurations
├── types/               # TypeScript type definitions
│   └── game.ts          # Exercise-related types
└── public/              # Static assets
    └── background/      # Background patterns
```

## Customization

### Adding New Brain Training Exercises

Edit `data/games.ts` to add new cognitive exercises to the platform:

```typescript
{
  id: 'unique-game-id',
  title: 'Game Title',
  description: 'Game description...',
  category: 'Action', // Must match GameCategory type
  image: 'https://example.com/image.jpg',
  rating: 4.5,
  players: '1-4 Players',
  difficulty: 'Medium',
  playTime: '30-60 min',
  tags: ['Tag1', 'Tag2'],
  featured: false,
  releaseDate: '2024-01-01',
  developer: 'Developer Name',
  platform: ['Web', 'Mobile']
}
```

### Styling

The project uses Tailwind CSS with custom components defined in `globals.css`. Key classes:

- `.game-card` - Styled game card component
- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.gradient-text` - Gradient text effect

### Color Scheme

The design uses a primary blue color scheme with purple accents. Customize colors in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    // Your primary color shades
  },
  secondary: {
    // Your secondary color shades
  }
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

Build the project:
```bash
npm run build
```

The built files will be in the `.next` folder.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React 18** - Latest React features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you have any questions or need help, please open an issue on GitHub.

---

Built with ❤️ for game enthusiasts
A collection of games made by My Phung
