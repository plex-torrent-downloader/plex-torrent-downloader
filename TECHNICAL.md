# Technical Documentation

## Technology Stack

### Core Framework
- **Remix.js** - Full-stack React framework for server-side rendering and routing
- **Express.js** - HTTP server managing security, middleware, and request handling
- **React 17** - UI component library
- **TypeScript** - Type-safe development

### Database & ORM
- **Prisma** - Modern ORM for database management and type-safe queries
- **Prisma Client** - Auto-generated database client

### Frontend
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Icon library
- **Sass** - CSS preprocessor for custom styles

### Torrent Management
- **WebTorrent** - Streaming torrent client for downloading and seeding

### Security & Authentication
- **bcrypt/bcryptjs** - Password hashing
- **jsonwebtoken (JWT)** - Token-based authentication
- **cookie-parser** - Cookie parsing middleware for Express

### Real-time Communication
- **Socket.io** - WebSocket library for real-time updates (client & server)

### Web Scraping & HTTP
- **Axios** - HTTP client for API requests
- **Cheerio** - jQuery-like HTML parsing for torrent site scraping
- **fzstd** - Fast compression library

### Testing
- **Cypress** - End-to-end testing framework

### Development Tools
- **ts-node** - TypeScript execution environment
- **nodemon** - Auto-restart during development

### Utilities
- **moment.js** - Date/time manipulation

## Architecture

### Server Architecture
The application uses a custom Express.js server (`server.ts`) that integrates with Remix:

1. **Express.js** handles:
   - Security middleware
   - Scheduled Downloads
   - Cookie parsing
   - Custom routes
   - API Features
   - Socket.io integration

2. **Remix** handles:
   - Server-side rendering
   - Routing
   - Data loading
   - Form handling

### Database
Prisma provides:
- Type-safe database queries
- Schema migrations
- Database seeding
- Support for multiple database engines

### Real-time Updates
Socket.io enables:
- Live download progress updates
- Torrent status changes
- System notifications

## Development Workflow

### Available Scripts
- `npm run dev` - Development server with auto-reload
- `npm run build` - Production build
- `npm run start` - Start production server
- `cypress run/cypress open` - Run unit tests

### Build Process
1. Prisma generates database client
2. Tailwind CSS compiles styles
3. Remix builds server and client bundles
4. TypeScript compiles to JavaScript

## System Requirements
- **Node.js**: >= v18
- **npm** or **yarn** package manager
- Supported databases: PostgreSQL, MySQL, SQLite (configured via Prisma)

## Security Features
- Password hashing with bcrypt
- JWT-based authentication
- HTTP-only cookies for session management
- Express middleware for request validation
- Basic auth support for web UI

## Performance Considerations
- Server-side rendering for fast initial page loads
- WebTorrent streaming (download while watching)
- Socket.io for efficient real-time updates
- Tailwind CSS for optimized stylesheet size
