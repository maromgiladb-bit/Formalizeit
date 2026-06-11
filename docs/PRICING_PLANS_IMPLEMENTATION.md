# Pricing Plans & Free Tier Limits - Implementation Guide

## Overview
Implemented a 3-tier pricing system (Free, Pro, Enterprise) with usage limits for free users. Free users are limited to 3 NDAs, and when they try to create a 4th, they see a modal prompting them to upgrade to Pro.

## Pricing Tiers

### 1. **Free Plan** - $0/mo
- ✅ Up to 3 NDAs (hard limit)
- ✅ Basic templates
- ✅ Email support
- ✅ E-signature support

### 2. **Pro Plan** - $19.99/mo (Popular)
- ✅ **Unlimited NDAs**
- ✅ All templates
- ✅ Priority support
- ✅ Advanced tracking
- ✅ E-signature support

### 3. **Enterprise Plan** - Custom Pricing
- ✅ Unlimited everything
- ✅ Custom templates
- ✅ Dedicated support
- ✅ API access
- ✅ Account manager
- ✅ Custom integrations
- 📞 **Contact button** instead of price

## Database Schema Changes

### Added to `users` table:
```prisma
model users {
  id           String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  external_id  String         @unique
  email        String         @unique @db.Citext
  plan         user_plan?     @default(FREE)  // ← NEW FIELD
  created_at   DateTime?      @default(now()) @db.Timestamptz(6)
  ...
}

enum user_plan {
  FREE
  PRO
  ENTERPRISE
}
```

### Migration Required:
```bash
# Run after schema update
npx prisma generate
npx prisma migrate dev --name add_user_plans
```

## API Endpoints

### 1. Check User Limit - `GET /api/user/check-limit`

**Purpose**: Check if user can create more NDAs

**Response**:
```json
{
  "plan": "FREE",
  "ndaCount": 2,
  "limit": 3,
  "canCreate": true,
  "remaining": 1
}
```

**Usage**:
```typescript
const response = await fetch('/api/user/check-limit')
const { canCreate, remaining, plan } = await response.json()

if (!canCreate) {
  showUpgradeModal()
}
```

### 2. Create Draft with Limit Check - `POST /api/ndas/drafts`

**Changes**: Now checks free plan limit before creating new drafts

**Logic**:
```typescript
if (userPlan === 'FREE') {
  const ndaCount = await prisma.nda_drafts.count({
    where: { created_by_id: dbUser.id }
  })
  
  if (ndaCount >= 3) {
    return NextResponse.json({
      error: 'Free plan limit reached',
      message: 'You have reached the free plan limit of 3 NDAs...',
      limitReached: true
    }, { status: 403 })
  }
}
```

**Error Response** (when limit reached):
```json
{
  "error": "Free plan limit reached",
  "message": "You have reached the free plan limit of 3 NDAs. Upgrade to Pro for unlimited NDAs.",
  "limitReached": true
}
```

## UI Components

### LimitExceededModal Component

**File**: `src/components/LimitExceededModal.tsx`

**Features**:
- 🚨 Shows when user hits free plan limit
- 📋 Lists Pro plan benefits
- 💰 Shows $19.99/month price
- 🔗 "Upgrade to Pro" button → redirects to `/plans`
- ❌ "Maybe Later" button → closes modal

**Usage**:
```typescript
import LimitExceededModal from '@/components/LimitExceededModal'

const [showLimitModal, setShowLimitModal] = useState(false)

// When save/create fails with 403
const response = await fetch('/api/ndas/drafts', {
  method: 'POST',
  body: JSON.stringify({ ... })
})

if (response.status === 403) {
  const { limitReached } = await response.json()
  if (limitReached) {
    setShowLimitModal(true)
  }
}

// Render modal
<LimitExceededModal 
  isOpen={showLimitModal} 
  onClose={() => setShowLimitModal(false)} 
/>
```

### Plans Page Updates

**File**: `src/app/plans/page.tsx`

**Changes**:
- ✅ 3 plans instead of previous layout
- ✅ Free plan: $0, "Up to 3 NDAs"
- ✅ Pro plan: $19.99, "Unlimited NDAs" (highlighted as Popular)
- ✅ Enterprise: "Custom" pricing, "Contact Sales" button

**Features**:
- Responsive grid layout (1 column mobile, 3 columns desktop)
- Pro plan scaled up (transform scale-105) with "Popular" badge
- Contact Sales link for Enterprise (`/contact` page)

## Implementation Files

### Created:
1. `src/app/api/user/check-limit/route.ts` - Check user's remaining NDA limit
2. `src/components/LimitExceededModal.tsx` - Modal component for limit reached

### Modified:
1. `prisma/schema.prisma` - Added `plan` field and `user_plan` enum
2. `src/app/plans/page.tsx` - Updated pricing tiers
3. `src/app/api/ndas/drafts/route.ts` - Added limit check on create

## User Workflows

### Scenario 1: Free User Creates 3 NDAs (Within Limit)
1. User creates NDA #1 → ✅ Success
2. User creates NDA #2 → ✅ Success
3. User creates NDA #3 → ✅ Success
4. Dashboard shows "2 remaining" or similar indicator (optional enhancement)

### Scenario 2: Free User Tries to Create 4th NDA (Limit Exceeded)
1. User clicks "New NDA" or "Save" on 4th NDA
2. API returns 403 error with `limitReached: true`
3. Frontend shows `LimitExceededModal`:
   - "Free Plan Limit Reached" header
   - "You've used all 3 free NDAs"
   - Lists Pro plan benefits
   - Two buttons: "Maybe Later" | "Upgrade to Pro"
4. User clicks "Upgrade to Pro" → Redirects to `/plans`
5. User sees pricing page with Pro highlighted

### Scenario 3: Pro User Creates Unlimited NDAs
1. User on Pro plan creates NDA
2. API checks `dbUser.plan === 'PRO'`
3. Skips limit check
4. Creates NDA successfully ✅

### Scenario 4: Editing Existing NDAs (No Limit)
1. User opens existing draft for editing
2. API recognizes `draftId` exists
3. Updates draft (no limit check)
4. Save successful ✅
   - **Why**: Editing doesn't count toward limit, only new creations

## Edge Cases Handled

### 1. Updating Existing Draft
- ✅ No limit check when `draftId` provided
- Only new drafts count toward limit

### 2. User Has No Plan Set
- ✅ Defaults to `FREE` plan via `dbUser.plan || 'FREE'`
- Schema default: `@default(FREE)`

### 3. Database User Creation
- ✅ New users automatically get `plan: 'FREE'`
- Prisma handles default value

### 4. Counting NDAs
- Counts ALL drafts regardless of status (DRAFT, SENT, SIGNED, VOID)
- Consider enhancement: only count DRAFT + SENT statuses?

## Future Enhancements

### 1. Stripe Integration
```typescript
// Pro upgrade button
<button onClick={() => handleStripeCheckout('pro')}>
  Upgrade to Pro
</button>

async function handleStripeCheckout(plan: string) {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan })
  })
  const { url } = await response.json()
  window.location.href = url
}
```

### 2. Usage Dashboard
Show users their current usage:
```tsx
<div className="bg-blue-50 p-4 rounded-lg">
  <p className="text-sm text-blue-900">
    📊 NDAs Created: {ndaCount} / {plan === 'FREE' ? '3' : '∞'}
  </p>
  {plan === 'FREE' && remaining === 1 && (
    <p className="text-xs text-blue-700 mt-1">
      ⚠️ Only 1 NDA remaining on free plan
    </p>
  )}
</div>
```

### 3. Soft Limit Warning
Show warning before hitting hard limit:
```typescript
if (plan === 'FREE' && remaining === 1) {
  showToast('⚠️ Last free NDA! Upgrade to Pro for unlimited.')
}
```

### 4. Status-Based Counting
Only count active NDAs:
```typescript
const ndaCount = await prisma.nda_drafts.count({
  where: { 
    created_by_id: dbUser.id,
    status: { in: ['DRAFT', 'SENT'] } // Exclude VOID, SIGNED
  }
})
```

### 5. Plan Badge in Header
```tsx
{user.plan === 'FREE' && (
  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
    Free ({remaining} left)
  </span>
)}
{user.plan === 'PRO' && (
  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
    Pro
  </span>
)}
```

## Testing Checklist

### Free Plan Limit
- [ ] New user defaults to FREE plan
- [ ] Can create 3 NDAs successfully
- [ ] 4th NDA creation fails with 403 error
- [ ] Modal appears with correct messaging
- [ ] "Upgrade to Pro" button redirects to `/plans`
- [ ] "Maybe Later" button closes modal
- [ ] Can still edit existing 3 NDAs after hitting limit

### Pro Plan
- [ ] Pro users can create unlimited NDAs
- [ ] No limit modal appears for Pro users
- [ ] Plans page shows Pro as "Popular"
- [ ] Pro price displays as $19.99/mo

### Enterprise Plan
- [ ] Enterprise section shows "Custom" pricing
- [ ] "Contact Sales" button links to `/contact`
- [ ] Lists all enterprise features

### API Endpoints
- [ ] `GET /api/user/check-limit` returns correct data
- [ ] `POST /api/ndas/drafts` enforces limit for FREE users
- [ ] `POST /api/ndas/drafts` allows unlimited for PRO users
- [ ] Updating existing drafts doesn't trigger limit

## Files Reference

```
📁 Project Structure
├── prisma/
│   └── schema.prisma                          # ← Modified (added user_plan enum)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ndas/
│   │   │   │   └── drafts/
│   │   │   │       └── route.ts               # ← Modified (added limit check)
│   │   │   └── user/
│   │   │       └── check-limit/
│   │   │           └── route.ts               # ← Created (check user limits)
│   │   └── plans/
│   │       └── page.tsx                       # ← Modified (3-tier pricing)
│   └── components/
│       └── LimitExceededModal.tsx             # ← Created (limit modal)
```

## Environment Variables
No new environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- Clerk auth variables (existing)

## Deployment Steps

1. **Update Schema**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name add_user_plans
   ```

2. **Deploy Migration** (Production):
   ```bash
   npx prisma migrate deploy
   ```

3. **Test Locally**:
   - Create 3 NDAs as free user
   - Verify modal appears on 4th attempt
   - Check `/plans` page displays correctly

4. **Deploy to Production**:
   - Push code changes
   - Run migration on production DB
   - Test with real Clerk users

## Known Limitations

1. **No Payment Processing**: Pro upgrade button doesn't actually process payment (needs Stripe integration)
2. **Manual Plan Assignment**: Plans must be manually updated in database currently
3. **No Plan Downgrade Logic**: Users can't self-service downgrade
4. **Hard Deletion**: If user deletes NDAs, count decreases (might want soft deletes)

## Support & Troubleshooting

### Issue: User stuck at limit after deleting NDAs
**Solution**: Count is based on ALL drafts. If user deletes drafts, count decreases automatically.

### Issue: Modal doesn't appear
**Check**:
1. API returns `limitReached: true` in response
2. Frontend checks `response.status === 403`
3. `LimitExceededModal` component is imported and rendered

### Issue: Wrong plan showing
**Check**:
1. Database user record has correct `plan` value
2. Prisma client regenerated after schema change
3. Migration applied to database

---

**Status**: ✅ Implemented
**Last Updated**: January 2025
**Version**: 1.0
