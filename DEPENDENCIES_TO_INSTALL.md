# Dependencies to Install (After Node.js is ready)

## Run these commands in order:

### 1. Install base dependencies
```bash
npm install
```

### 2. Install additional required packages
```bash
npm install axios react-hook-form @hookform/resolvers zod sonner next-themes lucide-react class-variance-authority clsx tailwind-merge
```

### 3. Initialize shadcn/ui (Interactive)
```bash
npx shadcn@latest init
```

When prompted, choose:
- **Style**: New York
- **Base color**: Slate
- **CSS variables**: Yes
- **React Server Components**: Yes
- **Write configuration**: Yes
- **TypeScript**: Yes
- **Aliases**: Use defaults (@/components, @/lib, etc.)

### 4. Add all shadcn/ui components
```bash
npx shadcn@latest add button card input label form sidebar separator dropdown-menu avatar toast skeleton
```

## All Dependencies List

### Production Dependencies
- `axios` - HTTP client for API calls
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation
- `sonner` - Toast notifications
- `next-themes` - Dark mode support
- `lucide-react` - Icon library
- `class-variance-authority` - CVA for variant styles
- `clsx` - Conditional className utility
- `tailwind-merge` - Tailwind class merging

### shadcn/ui Components
- `button` - Button component
- `card` - Card component
- `input` - Input field
- `label` - Label component
- `form` - Form components (with react-hook-form)
- `sidebar` - Sidebar navigation
- `separator` - Separator/divider
- `dropdown-menu` - Dropdown menus
- `avatar` - Avatar/profile picture
- `toast` - Toast notification (Sonner)
- `skeleton` - Loading skeleton

## Verification

After installation, verify:
```bash
# Check if all packages are installed
npm list axios react-hook-form zod sonner next-themes

# Check if shadcn components exist
ls src/components/ui/

# Should see: button.tsx, card.tsx, input.tsx, etc.
```

## Next Steps After Installation

Once dependencies are installed, the project is ready to run:

```bash
# Start development server
npm run dev
```

Visit: http://localhost:3000

The following will already be implemented:
- ✅ API client with axios
- ✅ Auth session management (sessionStorage)
- ✅ Auth context provider
- ✅ TypeScript types
- ✅ Kasefra purple theme in globals.css
- ✅ Utility functions

Next to implement:
- Landing page components
- Login/Signup forms and pages
- Dashboard layout and components
