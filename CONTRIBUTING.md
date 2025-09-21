# Contributing Guide

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-name>
   ```

2. **Install dependencies**
   ```bash
   make install
   # or individually:
   npm install
   uv sync --dev
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run quality checks**
   ```bash
   make dev-flow  # format + lint + test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow our [commit message conventions](#commit-message-format).

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

### Python
- Use [Black](https://black.readthedocs.io/) for formatting
- Use [Ruff](https://ruff.rs/) for linting
- Use [MyPy](https://mypy.readthedocs.io/) for type checking
- Follow [PEP 8](https://pep8.org/) conventions
- Use type hints for all functions

### JavaScript/TypeScript
- Use [Prettier](https://prettier.io/) for formatting
- Use [ESLint](https://eslint.org/) for linting
- Use TypeScript for all new code
- Follow functional programming patterns where possible

### Documentation
- Use docstrings for Python functions and classes
- Use JSDoc comments for TypeScript functions
- Update README.md for user-facing changes
- Add inline comments for complex logic

## Testing

### Python Tests
```bash
make py-test          # Run all Python tests
make py-test-fast     # Run with minimal output
uv run pytest -k "test_name"  # Run specific test
```

### JavaScript/TypeScript Tests
```bash
make js-test          # Run all JS/TS tests
npm test -- --watch  # Run in watch mode
npm test -- test_name # Run specific test
```

### Test Guidelines
- Write tests for all new functionality
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Aim for high code coverage

## Pull Request Process

1. **Before submitting:**
   - Run `make check` to ensure all quality checks pass
   - Update documentation if needed
   - Add tests for new functionality
   - Ensure your branch is up to date with main

2. **PR Requirements:**
   - Clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Mark as draft if work in progress

3. **Review Process:**
   - At least one approval required
   - All CI checks must pass
   - Address reviewer feedback promptly

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]

[optional footer]
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:
```
feat: add user authentication system
fix: resolve memory leak in data processing
docs: update API documentation
test: add unit tests for user service
```

## Project Structure

```
├── src/                 # Source code
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   ├── types/          # Type definitions
│   └── services/       # API services
├── tests/              # Test files
├── docs/               # Documentation
├── docker/             # Docker configuration
└── scripts/            # Build/deployment scripts
```

## Getting Help

- Check existing [issues](../../issues) and [discussions](../../discussions)
- Create a new issue for bugs or feature requests
- Join our community chat (if applicable)
- Review the [README.md](README.md) for basic usage

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on the code, not the person

Thank you for contributing! 🎉