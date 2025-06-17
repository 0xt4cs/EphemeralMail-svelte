# EphemeralMail - Svelte Frontend

<div align="center">
  <img src="https://raw.githubusercontent.com/tacssuki/EphemeralMail-svelte/main/public/eemail.png" alt="EphemeralMail Logo" width="128" height="128">
  <h3>🎨 Modern Frontend for Temporary Email</h3>
  <p>A sleek, responsive web interface for the EphemeralMail backend service</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

## Overview

A modern, responsive frontend for the **[EphemeralMail Backend](https://github.com/tacssuki/EphemeralMail)** - providing a beautiful user interface for managing temporary email addresses.

### Key Features

- 🎨 **Modern Design** - Clean, intuitive interface
- 📱 **Mobile-First** - Responsive design that works on all devices
- ⚡ **Lightning Fast** - Built with Svelte and Vite for optimal performance
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📧 **Real-time Updates** - Live email checking and updates
- 💾 **Smart Storage** - Local storage with backend synchronization
- 🔄 **PWA Ready** - Progressive Web App capabilities
- 🎯 **Smart Navigation** - Three-panel layout optimized for all screen sizes

### Backend Requirement

This frontend requires the **[EphemeralMail Backend](https://github.com/tacssuki/EphemeralMail)** to function. Please set up the backend first.
## Quick Start

### Prerequisites

- Node.js 18+ 
- [EphemeralMail Backend](https://github.com/tacssuki/EphemeralMail) running

### Installation

```bash
# Clone the repository
git clone https://github.com/tacssuki/EphemeralMail-svelte.git
cd EphemeralMail-svelte

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:4173` to access the application.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to static hosting (Netlify, Vercel, etc.)
npm run deploy
```
- **Accessible**: High contrast in both light and dark modes

## Layout

### Left Panel: Generated Emails (320px width)
- List of all generated temporary email addresses
- Click to select and view emails for that address
- Copy email address to clipboard
- Generate new email addresses
- Dark mode toggle (desktop)

### Middle Panel: Email Inbox (320px width)
- Shows emails received for the selected email address
- Email preview with subject, sender, and timestamp
- Unread email indicators (blue dots)
- Refresh and delete options
- Dark mode support

### Right Panel: Email Viewer (Remaining space)
- Full email content display with maximum space
- Support for both HTML and text emails
- Attachment information
- Email metadata (from, to, date)
- Dark mode optimized typography

## Setup

### Prerequisites
- [EphemeralMail backend](https://github.com/tacssuki/EphemeralMail) running on port 4444
- Node.js (version 16 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tacssuki/EphemeralMail-svelte.git
   cd EphemeralMail-svelte
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint** (optional)
   - The frontend is pre-configured to connect to `http://localhost:4444`
   - To change this, edit the `.env` file:
   ```env
   VITE_API_BASE_URL=http://your-backend-url:4444
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:4173`

   Alternative ports:
   ```bash
   npm run dev:3000  # Run on port 3000
   npm run dev:5173  # Run on port 5173
   ```

### Dark Mode
The application automatically detects your system's dark mode preference. You can also manually toggle between light and dark modes using the moon/sun icon in the header.

### Production Build

```bash
npm run build
npm run preview
```

## Usage with EphemeralMail Backend

### 1. Start the Backend
First, ensure your EphemeralMail backend is running:

```bash
cd /path/to/EphemeralMail
npm run dev
# or
npm start
```

The backend should be accessible at `http://localhost:4444`

### 2. Start the Frontend
In a separate terminal:

```bash
cd /path/to/EphemeralMail-svelte
npm run dev
```

### 3. Using the Interface

1. **Generate Email**: Click "Generate New Email" to create a temporary email address
2. **Select Email**: Click on any generated email in the left panel to view its inbox
3. **View Messages**: Click on any email in the middle panel to view its content
4. **Copy Address**: Use the copy button to copy email addresses to clipboard
5. **Manage Emails**: Use refresh and delete buttons to manage your emails

## API Integration

This frontend integrates with the EphemeralMail API endpoints:

- `POST /api/emails/generate` - Generate new email address
- `GET /api/emails/{address}` - Get emails for an address
- `GET /api/emails/message/{id}` - Get specific email content
- `DELETE /api/emails/{address}` - Delete all emails for an address
- `DELETE /api/emails/message/{id}` - Delete specific email

## Development

### Project Structure
```
src/
├── lib/
│   ├── EmailApp.svelte          # Main 3-panel layout component
│   └── api.js                   # API service for backend communication
├── App.svelte                   # Root component
├── main.js                      # Application entry point
└── app.css                      # Global styles and Tailwind imports
```

### Adding Features
The modular structure makes it easy to extend:
- **Add new panels**: Create new Svelte components
- **Enhance API**: Extend `api.js` service
- **Customize styling**: Modify Tailwind classes or add custom CSS

## Configuration

### Environment Variables
- `VITE_API_BASE_URL`: EphemeralMail backend URL (default: `http://localhost:4444`)

### CORS Setup
The EphemeralMail backend is pre-configured to allow requests from:
- `http://localhost:4173` (frontend dev server)
- `http://localhost:3000` (alternative dev server port)
- `http://localhost:5173` (alternative dev server port)

## Deployment

### With Backend
If deploying both frontend and backend together:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Serve the `dist` folder using a web server (nginx, Apache, etc.)

3. Update `VITE_API_BASE_URL` to point to your production backend

### Standalone
The frontend can be deployed independently to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Just ensure the `VITE_API_BASE_URL` points to your EphemeralMail backend instance.

## Technologies Used

- **[Svelte](https://svelte.dev/)**: Reactive frontend framework
- **[Vite](https://vitejs.dev/)**: Fast build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Lucide Svelte](https://lucide.dev/)**: Beautiful SVG icons
- **[Axios](https://axios-http.com/)**: HTTP client for API requests

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the EphemeralMail backend
5. Submit a pull request

## Related Projects

- **[EphemeralMail](https://github.com/tacssuki/EphemeralMail)**: The backend API service
- Other frontend implementations (React, Vue, etc.) can be built using the same API

## Support

For issues related to:
- **Frontend**: Create an issue in this repository
- **Backend/API**: Create an issue in the [EphemeralMail repository](https://github.com/tacssuki/EphemeralMail)
- **Integration**: Check both repositories or create an issue in the relevant one
