# Narrative Matrix

A user study platform for exploring different narrative visualization approaches, designed to compare various storytelling techniques in data visualization.

## Project Overview

Narrative Matrix is a Next.js application that provides different narrative visualization approaches for user studies. The platform allows researchers to compare how users interact with and understand data through different visualization techniques, including pure text narratives and interactive visualizations.

## Technologies Used

### Frontend Framework

- **Next.js 15** - React framework with App Router for server and client components
- **React 19** - UI library for building component-based interfaces
- **TypeScript** - Static type checking for JavaScript

### State Management

- **Zustand** - Lightweight state management solution
- **React Context** - For component-specific state sharing

### UI Components and Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI components
- **Lucide React** - Icon library
- **clsx/tailwind-merge** - For conditional class name composition

### Data Visualization

- **D3.js** - Data visualization library
- **Cytoscape** - Graph visualization library
- **Cytoscape-dagre** - Layout extension for directed graphs
- **Cytoscape-popper** - For tooltips in graph visualizations

### Development Tools

- **TypeScript** - For type safety and better developer experience
- **ESLint** - For code linting
- **Tailwind Typography** - For styling rich text content

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

## Project Structure

```
narrative_subway/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Authentication routes
│   │   │   └── login/       # Login page
│   │   ├── (scenarios)/     # Scenario routes
│   │   │   ├── pure-text/   # Text-based narrative visualization
│   │   │   └── visualization/ # Interactive visualization
│   │   ├── api/             # API routes
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── features/        # Feature-specific components
│   │   ├── layouts/         # Layout components
│   │   ├── shared/          # Shared components
│   │   └── ui/              # UI components
│   ├── contexts/            # React contexts
│   │   ├── auth-context.tsx # Authentication context
│   │   ├── center-control-context.tsx # Control panel context
│   │   └── tooltip-context.tsx # Tooltip management
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   │   ├── api/             # API utilities
│   │   └── utils/           # Helper functions
│   ├── types/               # TypeScript type definitions
│   └── back/                # Backend utilities
├── tailwind.config.ts       # Tailwind CSS configuration
├── next.config.ts           # Next.js configuration
└── tsconfig.json            # TypeScript configuration
```

## Application Routes

- `/` - Home page with redirection based on user role
- `/login` - Authentication page
- `/pure-text` - Text-based narrative visualization
- `/visualization` - Interactive visualization dashboard

## User Roles and Access Control

- **Domain Expert**: Has access to all scenarios and can switch between different visualization modes
- **Normal User**: Automatically directed to their assigned visualization mode

## Key Features

1. **Authentication System**

   - Role-based access control
   - Persistent sessions

2. **Multiple Visualization Approaches**

   - Pure text narrative
   - Interactive graph visualization
   - Hybrid approaches

3. **Interactive Components**

   - Graph visualization with node exploration
   - Tooltips for additional information
   - Resizable panels

4. **Responsive Design**
   - Mobile-friendly layouts
   - Adaptive visualization components

## State Management

The application uses a combination of:

- **Zustand** for global state management
- **React Context** for component-specific state
- **Context Providers** for feature-specific state (auth, tooltips, control panel)

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## OpenAI Chat Integration

This project includes an AI assistant powered by OpenAI's API to help analyze narratives.

### Setup

1. Create a `.env.local` file in the root directory of the project
2. Add your OpenAI API key to the file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Replace `your_openai_api_key_here` with your actual OpenAI API key

### Usage

The AI assistant is available in the chat interface and can help with:

- Analyzing narrative events
- Understanding character relationships
- Identifying themes and patterns
- Answering questions about the narrative

The assistant has context about the narrative events and can provide insights based on the selected event.

### Message Limit

There is a limit of 20 messages per session to manage API usage. The remaining message count is displayed in the chat interface.

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [D3.js](https://d3js.org/)
- [Cytoscape.js](https://js.cytoscape.org/)
