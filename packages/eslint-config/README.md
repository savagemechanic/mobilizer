# @mobilizer/eslint-config

Shared ESLint configuration for Mobilizer v2 monorepo.

## Usage

### For Backend (Node.js)

```js
// apps/backend/.eslintrc.js
module.exports = {
  extends: ['@mobilizer/eslint-config/node'],
};
```

### For Frontend (React)

```js
// apps/web/.eslintrc.js
module.exports = {
  extends: ['@mobilizer/eslint-config/react'],
};
```

### For Shared Packages

```js
// packages/shared/.eslintrc.js
module.exports = {
  extends: ['@mobilizer/eslint-config'],
};
```

## Configurations

- **index.js** - Base TypeScript configuration
- **node.js** - Node.js specific rules
- **react.js** - React specific rules with hooks support
