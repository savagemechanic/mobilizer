# Audit Module Installation Guide

## Required Dependencies

The Audit module requires the following npm packages:

```bash
cd /Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/backend

# Install required dependencies
npm install graphql-type-json csv-writer

# Install TypeScript type definitions
npm install --save-dev @types/csv-writer
```

## Package Details

### graphql-type-json
- **Purpose**: Provides GraphQL JSON scalar type for storing arbitrary JSON metadata in audit logs
- **Version**: Latest stable
- **Used in**: `entities/audit-log.entity.ts` for the `metadata` field

### csv-writer
- **Purpose**: Enables exporting audit logs to CSV format
- **Version**: Latest stable
- **Used in**: `audit.service.ts` for the `exportToCsv()` method

## Verification

After installing the dependencies, verify the installation:

```bash
# Check if packages are installed
npm list graphql-type-json csv-writer

# Build the project to ensure no errors
npm run build
```

## Alternative: Using Yarn

If your project uses Yarn instead of npm:

```bash
cd /Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/backend

# Install required dependencies
yarn add graphql-type-json csv-writer

# Install TypeScript type definitions
yarn add --dev @types/csv-writer
```

## Post-Installation

1. **Generate Prisma Client**: Ensure the Prisma client is up to date with the AuditLog model:
   ```bash
   npm run prisma:generate
   ```

2. **Run Migrations**: If you haven't already, run the Prisma migrations to create the audit_logs table:
   ```bash
   npm run prisma:migrate
   ```

3. **Build the Application**:
   ```bash
   npm run build
   ```

4. **Start the Development Server**:
   ```bash
   npm run start:dev
   ```

## Troubleshooting

### Issue: "Cannot find module 'graphql-type-json'"

**Solution**: Ensure you've installed the package:
```bash
npm install graphql-type-json
```

### Issue: "Cannot find module 'csv-writer'"

**Solution**: Install the csv-writer package:
```bash
npm install csv-writer
```

### Issue: GraphQL schema generation fails

**Solution**:
1. Restart the development server after installing dependencies
2. Clear the generated schema file and regenerate:
   ```bash
   rm src/schema.gql
   npm run start:dev
   ```

### Issue: TypeScript errors about missing types

**Solution**: Install the TypeScript definitions:
```bash
npm install --save-dev @types/csv-writer
```

## Module Already Registered

The AuditModule is already registered in `app.module.ts` as a global module. You don't need to import it in other modules to use the AuditService.

## Next Steps

After installation, refer to the [README.md](./README.md) for usage instructions and examples.
