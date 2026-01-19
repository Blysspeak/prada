# PRADA — PRisma ADmin

Universal open-source admin panel for any Prisma ORM project.
Automatically generates CRUD interface from your `schema.prisma`.

## Features

- 🚀 **Auto-generated CRUD** — No manual endpoint creation
- 🔐 **JWT Authentication** — Secure admin access out of the box
- 📊 **TanStack Table** — Sorting, pagination, search
- 📝 **Dynamic Forms** — Auto-generated from Prisma schema
- 🎨 **Modern UI** — React 18 + TailwindCSS + Geist Font
- 🌙 **Dark/Light Theme** — With smooth View Transitions API animation
- 🌍 **i18n Support** — Russian and English out of the box
- ⚙️ **Settings** — Customizable appearance, table options, auto-refresh
- ⚡ **Type-safe** — Full TypeScript support

## Documentation

For detailed information, see our documentation:

- [Installation and Integration Guide](./docs/installation_integration.md) — How to install and integrate PRADA with your project
- [Full Documentation](./docs/documentation.md) — Comprehensive guide to all features and capabilities

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Geist Font
- **Backend**: Express, Prisma Client
- **Auth**: JWT + bcrypt
- **State**: TanStack Query
- **Tables**: TanStack Table
- **Forms**: React Hook Form
- **Theming**: CSS Variables + View Transitions API

## Project Structure

```
prada/
├── packages/
│   ├── core/           # Schema parser, API generator, auth
│   ├── server/         # Express middleware
│   └── ui/             # React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── DataTable/
│       │   │   ├── Form/
│       │   │   ├── Fields/
│       │   │   ├── Layout/
│       │   │   └── Settings/
│       │   ├── i18n/           # Translations
│       │   ├── pages/
│       │   ├── providers/
│       │   └── index.css       # CSS Variables
│       └── package.json
├── docs/               # Documentation files
├── package.json
└── pnpm-workspace.yaml
```

## Theming

PRADA uses CSS Variables for consistent theming. All colors are defined in `packages/ui/src/index.css`:

```css
:root, [data-theme="dark"] {
  --bg-base: #0a0f1a;
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #e2e8f0;
  --primary: #3b82f6;
  /* ... more variables */
}

[data-theme="light"] {
  --bg-base: #f1f5f9;
  --bg-primary: #ffffff;
  /* ... light theme overrides */
}
```

To customize colors, simply override the CSS variables.

## Internationalization (i18n)

PRADA supports multiple languages. Currently available:
- 🇷🇺 Russian (ru)
- 🇬🇧 English (en)

Language can be changed in Settings. Translations are stored in `packages/ui/src/i18n/translations.ts`.

To add a new language:
1. Add translations to `translations.ts`
2. Update the language selector in Settings

## Supported Field Types

| Prisma Type | UI Component |
|-------------|--------------|
| String | Text input |
| Int, Float, Decimal, BigInt | Number input |
| Boolean | Checkbox |
| DateTime | Datetime picker |
| Enum | Select dropdown |
| Json | JSON textarea |
| Relations | View/link (read-only) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/api/schema` | Get all models metadata |
| GET | `/admin/api/:model` | List records (paginated) |
| GET | `/admin/api/:model/:id` | Get single record |
| POST | `/admin/api/:model` | Create record |
| PUT | `/admin/api/:model/:id` | Update record |
| DELETE | `/admin/api/:model/:id` | Delete record |
| POST | `/admin/api/auth/login` | Login |
| POST | `/admin/api/auth/logout` | Logout |
| GET | `/admin/api/auth/me` | Current user |

### Query Parameters

- `page` — Page number (default: 1)
- `limit` — Records per page (default: 20, max: 100)
- `sort` — Sort field
- `order` — Sort order (asc/desc)
- `search` — Search query
- `include` — Relations to include (comma-separated)

## Changelog

### v1.1.0
- Added dark/light theme with View Transitions API
- Added i18n support (Russian, English)
- Added Settings modal (appearance, tables, data)
- Implemented CSS Variables system for theming
- Added Geist font family
- Full Russian localization

### v1.0.0
- Initial release
- Auto-generated CRUD from Prisma schema
- JWT authentication
- TanStack Table with sorting, pagination
- Dynamic forms with validation

## License

MIT