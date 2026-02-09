# TinaCMS Setup with Docusaurus

This guide describes the steps taken to configure TinaCMS for this project.

## 1. Dependency Installation

We installed TinaCMS and its CLI, along with Node types to avoid editor errors:

```bash
npm install tinacms @tinacms/cli
npm install --save-dev @types/node
```

## 2. Tina Initialization

We initialized TinaCMS at the project root:

```bash
npx @tinacms/cli@latest init
```

- Selected **Other** as the framework.
- Confirmed the use of **TypeScript**.
- Defined the public assets folder as **static** (Docusaurus default).

## 3. Schema Configuration (`tina/config.ts`)

We configured the `tina/config.ts` file to reflect the Docusaurus structure:

- **Media**: Changed `mediaRoot` to `"img"` so images are saved in `static/img`.
- **Collections**:
  - **Docs**: Mapped to the `docs` folder. Removed the reserved `id` field and ensured `title` and `body` fields are present.
  - **Blog**: Mapped to the `blog` folder.

## 4. Scripts (`package.json`)

We added a script to run TinaCMS alongside Docusaurus:

```json
"scripts": {
  "dev": "tinacms dev -c 'docusaurus start'",
  ...
}
```

## 5. Content Migration

For TinaCMS to work correctly with Docusaurus:

1.  **File Extension**: We renamed all `.md` files to `.mdx`. TinaCMS prefers `.mdx` to explicitly support React components.
2.  **Frontmatter**: We added the `title` field to the header (frontmatter) of all files, as it is mandatory in our schema.

> A `migrate_content.js` script was used to automate this.

## 6. How to Run

To start the project in development mode with the Tina editor:

```bash
npm run dev
```

- **Site**: [http://localhost:3000](http://localhost:3000)
- **Editor**: [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)
