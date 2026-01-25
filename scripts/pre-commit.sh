#!/bin/bash

echo "Running pre-commit checks..."

# Run linter
echo "Running ESLint..."
yarn lint
if [ $? -ne 0 ]; then
  echo "✗ Linting failed. Please fix the errors before committing."
  exit 1
fi

# Run formatter check
echo "Checking code formatting..."
yarn format:check
if [ $? -ne 0 ]; then
  echo "✗ Code formatting check failed. Run 'yarn format' to fix."
  exit 1
fi

# Run tests
echo "Running tests..."
yarn test
if [ $? -ne 0 ]; then
  echo "✗ Tests failed. Please fix the failing tests before committing."
  exit 1
fi

echo "✓ All pre-commit checks passed!"
exit 0
