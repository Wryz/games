# Games Collection

A modern Next.js website template featuring a curated collection of games built with TypeScript and Tailwind CSS.

## Features

- 🎮 **Game Collection**: Browse and discover amazing games across different categories
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔍 **Advanced Filtering**: Search and filter games by category, difficulty, rating, and more
- 📱 **Mobile Responsive**: Optimized for all screen sizes
- ⚡ **Fast Performance**: Built with Next.js 14 and optimized for speed
- 🌙 **Dark Mode**: Support for light and dark themes
- 🎯 **TypeScript**: Fully typed for better development experience
- 📊 **Game Details**: Detailed game pages with ratings, screenshots, and information

## Game Categories

- Action ⚡
- Adventure 🗺️
- Puzzle 🧩
- Strategy ♟️
- RPG ⚔️
- Sports ⚽
- Racing 🏎️
- Simulation 🏗️
- Arcade 🕹️
- Casual 🎯

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
games/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── loading.tsx       # Loading component
│   ├── not-found.tsx     # 404 page
│   ├── about/            # About page
│   ├── games/            # Games pages
│   │   ├── page.tsx      # All games page
│   │   └── [id]/         # Individual game pages
│   └── categories/       # Category pages
├── components/           # Reusable components
│   ├── Header.tsx       # Navigation header
│   ├── Footer.tsx       # Site footer
│   ├── GameCard.tsx     # Game card component
│   ├── GameGrid.tsx     # Games grid layout
│   └── GameFilters.tsx  # Filtering component
├── data/                # Sample data
│   └── games.ts         # Games data and utilities
├── types/               # TypeScript type definitions
│   └── game.ts          # Game-related types
└── public/              # Static assets
```

## Customization

### Adding New Games

Edit `data/games.ts` to add new games to the collection:

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
