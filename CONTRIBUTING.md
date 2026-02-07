# Contributing to Quibly

First off, thank you for considering contributing to Quibly! 🎉

It's people like you that make Quibly such a great tool. We welcome contributions from everyone, whether it's a bug report, feature suggestion, documentation improvement, or code contribution.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Issue Guidelines](#issue-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@quibly.com.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, browser, Node version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Clear and descriptive title**
- **Detailed description of the proposed feature**
- **Explain why this feature would be useful**
- **Provide examples of how it would work**
- **Include mockups or diagrams if applicable**

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write or update tests**
5. **Ensure all tests pass**
6. **Commit your changes** (see commit guidelines below)
7. **Push to your fork** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/yourusername/quibly.git
cd quibly

# Install backend dependencies
cd backend
bun install
cp .env.example .env
# Configure your .env file

# Start infrastructure
npm run docker:up

# Run migrations
npx prisma migrate dev

# Start backend
npm run dev

# In a new terminal, setup frontend
cd ../frontend
bun install
cp .env.example .env
# Configure your .env file

# Start frontend
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🔄 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** before submitting
4. **Update the CHANGELOG.md** with your changes
5. **Follow the coding standards** outlined below
6. **Keep PRs focused** - one feature/fix per PR
7. **Respond to review feedback** promptly

### PR Title Format

Use conventional commit format:
- `feat: add voice channel recording`
- `fix: resolve message duplication issue`
- `docs: update API documentation`
- `refactor: optimize database queries`
- `test: add tests for auth controller`

## 💻 Coding Standards

### JavaScript/TypeScript

- Use **ES6+ features**
- Follow **Airbnb style guide** principles
- Use **meaningful variable names**
- Write **self-documenting code**
- Add **comments for complex logic**
- Keep functions **small and focused**
- Use **async/await** over promises

### React/Next.js

- Use **functional components** with hooks
- Follow **component composition** patterns
- Keep components **small and reusable**
- Use **TypeScript** for type safety
- Implement **proper error boundaries**
- Follow **Next.js best practices**

### Database

- Write **efficient queries**
- Use **proper indexes**
- Follow **Prisma best practices**
- Document **schema changes**

### API Design

- Follow **RESTful principles**
- Use **proper HTTP methods**
- Return **appropriate status codes**
- Implement **proper error handling**
- Document **all endpoints**

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes

### Examples

```bash
feat(auth): add Google OAuth integration

Implemented Google OAuth 2.0 authentication flow
- Added Google OAuth button to login page
- Created OAuth callback handler
- Updated user model to support OAuth providers

Closes #123
```

```bash
fix(messages): resolve duplicate message issue

Fixed race condition causing messages to appear twice
when sent in quick succession

Fixes #456
```

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template and include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details

### Feature Requests

Use the feature request template and include:
- Problem description
- Proposed solution
- Alternative solutions considered
- Additional context

## 🎨 Design Contributions

- Follow existing design patterns
- Maintain consistency with current UI
- Consider accessibility (WCAG 2.1 AA)
- Test on multiple screen sizes
- Provide design mockups for major changes

## 📚 Documentation

- Update README.md for user-facing changes
- Update API documentation for endpoint changes
- Add JSDoc comments for functions
- Update CHANGELOG.md
- Include code examples where helpful

## 🧪 Testing Requirements

- Write unit tests for new functions
- Add integration tests for new features
- Ensure test coverage doesn't decrease
- Test edge cases
- Test error handling

## 🔍 Code Review Process

All submissions require review. We use GitHub pull requests for this purpose:

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge
4. Your contribution will be included in the next release

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in the project

## 💬 Getting Help

- **Discord:** Join our community server
- **GitHub Discussions:** Ask questions
- **Email:** dev@quibly.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Quibly! 🚀

*Together, we're building something amazing.*
