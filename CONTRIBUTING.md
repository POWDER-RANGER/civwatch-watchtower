# Contributing to CIVWATCH: WATCHTOWER

We welcome contributions to the CIVWATCH: WATCHTOWER project! By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### 1. Fork the Repository

First, fork the `civwatch-watchtower` repository to your GitHub account.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/civwatch-watchtower.git
cd civwatch-watchtower
```

### 3. Create a New Branch

Create a new branch for your feature or bug fix. Use a descriptive name:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

### 4. Set Up Your Local Environment

Follow the instructions in the main [README.md](README.md) to set up your local development environment.

### 5. Make Your Changes

- **Coding Standards**: Adhere to the existing coding style and conventions. We use Prettier for code formatting, so please run `pnpm format` before committing.
- **Testing**: Write unit and integration tests for your changes. Ensure all existing tests pass.
- **Documentation**: Update relevant documentation (e.g., `README.md`, `PIPELINES.md`, `ROADMAP.md`, or `docs/adr/`) for any new features or significant changes.

### 6. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for your commit messages. This helps us generate changelogs and understand the purpose of each commit.

Examples:

```
git commit -m "feat: add new map layer for incidents"
git commit -m "fix: resolve authentication bug"
docs: update roadmap with new phase
```

### 7. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 8. Create a Pull Request (PR)

- Open a Pull Request from your branch to the `main` branch of the original `civwatch-watchtower` repository.
- Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) thoroughly.
- Describe your changes clearly and provide context.
- Link to any relevant issues.

## Code Review

Your PR will be reviewed by maintainers. Please be responsive to feedback and be prepared to make further changes if requested.

## Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly by following the guidelines in [SECURITY.md](SECURITY.md).

Thank you for contributing to CIVWATCH: WATCHTOWER!
