# PRADA Project Memory

## Architecture
- 3-level abstraction: Ready solution → Building blocks → Primitives
- Main package: `@blysspeak/prada` (backend)
- UI package: `@blysspeak/prada-ui` (React components)

## Customization System (v2)
- **PradaConfig** — single config object for all UI customization
- **PradaProvider** — React context wrapping the app
- **Field registry** — custom form fields (byType/byName/byModelField), resolution via useFieldComponent hook
- **Cell registry** — custom table cells, same pattern via useCellRenderer hook
- **Data hooks** — useModelList, useModelRecord, useModelCreate, useModelUpdate, useModelDelete
- **Page overrides** — dashboard, modelList, modelForm, modelView, login
- **Slot system** — listHeader/listFooter, formHeader/formFooter, viewHeader/viewFooter, sidebar, header
- **Custom routes** — injected into React Router, optionally appear in sidebar
- **Sidebar config** — extraItems, hiddenModels, modelLabels, custom logo
- **Action overrides** — rowActions per model, hideActions per model
- **Module system (backend)** — PradaModule with routes callback receiving PradaContext (prisma, schema, router, authMiddleware)
- **Multi-file schema** — parser supports directory of .prisma files

## Key Files
- `src/server.ts` - createPradaServer with modules support
- `src/api/handler.ts` - createApiHandler with hooks
- `src/api/operations/*.ts` - Individual CRUD operations
- `src/auth/*.ts` - JWT, password, middleware, routes
- `src/schema/parser.ts` - Prisma DMMF parsing (single file + directory)
- `packages/ui/src/customization/` - PradaProvider, types, hooks
- `packages/ui/src/hooks/useModelData.ts` - Data hooks
- `packages/ui/src/components/Form/FieldRenderer.tsx` - Field resolution wrapper
- `packages/ui/src/components/DataTable/CellValue.tsx` - Cell resolution wrapper

## Code Patterns
- Use `getModelClient()` from sanitizer.ts for Prisma client access
- Hooks pattern: `hooks?.['*']?.hookName` for global, `hooks?.[modelName]?.hookName` for model-specific
- Express routes: use `Router()` factories that return middleware
- UI customization: usePrada() hook reads PradaConfig from context
- Field resolution: model+field → field name → field type → default component

## TypeScript Notes
- Prisma DMMF types are readonly - cast via `unknown` first
- Use custom interfaces (RawModel, RawField) to avoid complex Prisma types
- PrismaClient interface uses `Record<string, unknown>` not `any`
- TranslationKey type must be used (not string) for t() function

## Build
```bash
pnpm build:main  # Backend only
pnpm build:ui    # UI only
pnpm build       # Both
```

## Related Projects
- portugalets-gift-bot at ~/workSpace/project/portugalets-gift-bot — reference admin panel built on PRADA
