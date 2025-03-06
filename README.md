# Narrative Matrix

A user study platform for exploring different narrative visualization approaches.

## Login Credentials

All accounts use the same password: `study`

| User Type               | Username   | Role   | Description                                 |
| ----------------------- | ---------- | ------ | ------------------------------------------- |
| Domain Expert           | `domain`   | domain | Access to all scenarios and dashboards      |
| Text User               | `text`     | normal | Access to pure text visualization           |
| Visualization User      | `viz`      | normal | Access to visualization dashboard           |
| Text Chat User          | `textchat` | normal | Access to text with chat interface          |
| Visualization Chat User | `vizchat`  | normal | Access to visualization with chat interface |

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser
5. Log in using one of the credentials above

## User Roles

- **Domain Expert**: Has access to all scenarios and can switch between different visualization modes
- **Normal User**: Automatically directed to their assigned visualization mode

## Application Structure

- Authentication system with role-based access
- Multiple visualization scenarios
- Chat interface for interactive exploration
- Data visualization components

## Development

This is a [Next.js](https://nextjs.org/) project using:

- React
- TypeScript
- Tailwind CSS

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
