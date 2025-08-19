# Document Control

A Next.js application with Tailwind CSS and shadcn/ui components.

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Lucide React** - Icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## shadcn/ui Setup

This project is configured with shadcn/ui. The setup includes:

- ✅ Tailwind CSS with custom configuration
- ✅ CSS variables for theming (light/dark mode support)
- ✅ Component aliases (`@/components`, `@/lib/utils`)
- ✅ Button component example
- ✅ Utility functions for class merging

### Adding New Components

To add new shadcn/ui components, you can either:

1. **Manual Installation**: Copy components from [ui.shadcn.com](https://ui.shadcn.com) to `src/components/ui/`

2. **Using CLI** (if available):
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

### Project Structure

```
src/
├── app/
│   ├── globals.css      # Tailwind directives and CSS variables
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   └── ui/              # shadcn/ui components
│       └── button.tsx   # Example button component
└── lib/
    └── utils.ts         # Utility functions (cn helper)
```

### Customization

- **Colors**: Modify CSS variables in `src/app/globals.css`
- **Components**: Customize component variants in `src/components/ui/`
- **Tailwind Config**: Update `tailwind.config.ts` for theme extensions

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
