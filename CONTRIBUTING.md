# Contributing to EphemeralMail Frontend

Thank you for your interest in contributing to EphemeralMail Frontend! We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. **Use clear, descriptive titles** for bugs
3. **Include steps to reproduce** the issue
4. **Provide environment details** (browser, OS, etc.)
5. **Add screenshots** when helpful

### Suggesting Features

1. **Check if the feature already exists** or is planned
2. **Clearly describe the feature** and its benefits
3. **Explain the use case** and why it's needed
4. **Consider backward compatibility** implications

### Code Contributions

#### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/EphemeralMail-svelte.git
   cd EphemeralMail-svelte
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your EphemeralMail API endpoint
   ```

#### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following our coding standards
3. **Test your changes**:
   ```bash
   npm run dev
   npm run build
   ```
4. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add new email filtering options"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** on GitHub

#### Coding Standards

- **Use Svelte best practices** and modern JavaScript
- **Follow the existing code style** and patterns
- **Add comments** for complex logic
- **Use semantic HTML** and proper accessibility attributes
- **Keep components focused** and reusable
- **Test on multiple screen sizes** for responsiveness
- **Maintain the terminal/console theme** consistency

#### Commit Message Format

Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### Testing

Before submitting:
1. **Test the development server**: `npm run dev`
2. **Build the project**: `npm run build`
3. **Test in multiple browsers** (Chrome, Firefox, Safari, Edge)
4. **Test on mobile devices** or browser dev tools
5. **Verify accessibility** with screen readers if possible

### Pull Request Guidelines

- **Keep PRs focused** on a single feature or fix
- **Write clear descriptions** of what the PR does
- **Reference related issues** if applicable
- **Include screenshots** for UI changes
- **Ensure the build passes** before submitting
- **Be responsive** to feedback and requests for changes

## Development Environment

### Recommended Tools

- **Node.js 18+**
- **VS Code** with Svelte extensions
- **Browser dev tools** for debugging
- **Git** for version control

### Project Structure

```
src/
├── lib/
│   ├── EmailManagerTerminal.svelte  # Main terminal UI component
│   ├── EmailManager.svelte          # Alternative UI component
│   ├── api.js                      # API service layer
│   └── Notification.svelte         # Notification component
├── App.svelte                      # Root component
└── main.js                         # Application entry point
```

## Code of Conduct

- **Be respectful** and inclusive
- **Focus on constructive feedback**
- **Help newcomers** learn and contribute
- **Keep discussions on-topic**
- **Follow GitHub's community guidelines**

## Questions?

- **Open an issue** for questions about the project
- **Check existing discussions** first
- **Be specific** about what you need help with

Thank you for contributing! 🚀
