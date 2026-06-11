# Development Guide

## Testing Token-Protected Pages

In development mode (`NODE_ENV=development`), the following pages are accessible without valid tokens for easier testing:

### Review Pages

#### 1. Review Changes Page
**URL:** `/review/any-token-here`

This page shows changes made by the recipient (Party B) for the NDA owner (Party A) to review.

**Example:** 
```
http://localhost:3000/review/dev-test
```

**Features:**
- View tracked changes with before/after comparison
- Add comments to specific fields
- Approve changes or request more changes
- Mock data includes sample company names and changes

#### 2. Review & Edit NDA Page
**URL:** `/review-nda/any-token-here`

This page allows Party B (recipient) to review and edit the NDA before signing.

**Example:**
```
http://localhost:3000/review-nda/dev-test
```

**Features:**
- View all NDA fields
- Edit Party B information
- Suggest changes to specific fields
- Sign the document
- Mock data includes editable sample NDA

#### 3. Review Suggestions Page
**URL:** `/review-suggestions/any-token-here`

This page allows Party A (owner) to review suggestions made by Party B.

**Example:**
```
http://localhost:3000/review-suggestions/dev-test
```

**Features:**
- View current values vs. suggested changes
- Accept or reject individual suggestions
- Apply accepted changes and send back to Party B
- Mock data includes sample suggestions

### Sign Page
**URL:** `/sign/any-token-here`

Note: The sign page directory exists but doesn't have a page.tsx yet. When implemented, add dev mode support following the same pattern.

## How It Works

When running in development mode:
1. Pages/APIs check if `process.env.NODE_ENV === 'development'`
2. If a token is not found in the database, mock data is returned instead
3. Console logs show "🔧 Development mode: Using mock data..." messages
4. All features work normally, but no database writes occur

## Production Safety

These dev mode bypasses are **only active** when:
- `NODE_ENV=development` (local development)
- Token is not found in database

In production (`NODE_ENV=production`), invalid tokens always return 404 errors as expected.

## Modified Files

The following files have dev mode support:
- `src/app/review/[token]/page.tsx` - Server component with mock sign request
- `src/app/api/ndas/review/[token]/route.ts` - API route with mock form data
- `src/app/api/ndas/review-suggestions/[token]/route.ts` - API route with mock suggestions

## Testing Tips

1. **Quick Access:** Just visit any of these URLs with any token value
2. **Different Scenarios:** Change the mock data in the source files to test different cases
3. **Database Testing:** Use actual tokens from your database to test real workflows
4. **Watch Console:** Development mode activations are logged to the console

## Need More Mock Data?

Edit the mock data objects in the respective files:
- Review page: `src/app/review/[token]/page.tsx` (lines ~36-69)
- Review-NDA API: `src/app/api/ndas/review/[token]/route.ts` (lines ~21-53)
- Review-Suggestions API: `src/app/api/ndas/review-suggestions/[token]/route.ts` (lines ~21-40)
