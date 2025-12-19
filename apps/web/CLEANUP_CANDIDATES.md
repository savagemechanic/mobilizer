# Cleanup Candidates - Files for Potential Removal

This document lists files that have been identified as candidates for removal during Phase 8 of the refactoring process. These files appear to be duplicates or have been replaced by the new modular structure.

**IMPORTANT:** Do not delete these files without thorough verification that they are truly unused.

## Duplicate Components - Old vs New Modular Structure

### Chat Components
**Old location:** `src/components/chat/`
**New location:** `src/modules/chat/components/`

- [ ] `src/components/chat/chat-list.tsx` → Replaced by `src/modules/chat/components/ChatList.tsx`
- [ ] `src/components/chat/chat-window.tsx` → Replaced by `src/modules/chat/components/ChatWindow.tsx`
- [ ] `src/components/chat/message-bubble.tsx` → Replaced by `src/modules/chat/components/MessageBubble.tsx`

### Feed Components
**Old location:** `src/components/feed/`
**New location:** `src/modules/feed/components/`

- [ ] `src/components/feed/feed-card.tsx` → Replaced by `src/modules/feed/components/FeedCard.tsx`
- [ ] `src/components/feed/post-creator.tsx` → Replaced by `src/modules/feed/components/PostCreator.tsx`

### Admin Components
**Old location:** `src/components/admin/` and `src/components/permissions/`
**New location:** `src/modules/admin/components/`

- [ ] `src/components/admin/dashboard-filters.tsx` → Replaced by `src/modules/admin/components/DashboardFilters.tsx`
- [ ] `src/components/permissions/PermissionMatrix.tsx` → Replaced by `src/modules/admin/components/PermissionMatrix.tsx`

## Layout Components - Naming Inconsistencies

These files appear to be duplicates due to PascalCase vs kebab-case naming. The PascalCase versions are the new standard.

**Keep (New):** PascalCase versions
**Remove (Old):** kebab-case versions

- [ ] `src/components/layout/admin-header.tsx` (kebab-case) → Use `src/components/layout/AdminHeader.tsx` (PascalCase)
- [ ] `src/components/layout/admin-sidebar.tsx` (kebab-case) → Use `src/components/layout/AdminSidebar.tsx` (PascalCase)
- [ ] `src/components/layout/header.tsx` (kebab-case) → Use `src/components/layout/UserHeader.tsx` (PascalCase)
- [ ] `src/components/layout/sidebar.tsx` (kebab-case) → Use `src/components/layout/UserSidebar.tsx` (PascalCase)

**Note:** The `src/components/layout/index.ts` currently exports both for backward compatibility. Once the old versions are removed, the legacy exports should also be removed from the index file.

## ✅ VERIFICATION COMPLETE (2025-12-19)

**All old import paths have been successfully updated!**

Verification results:
- Old chat component imports: **0 found**
- Old feed component imports: **0 found**
- Old admin component imports: **0 found**
- Old permissions component imports: **0 found**
- Kebab-case layout imports: **0 found**

**Status:** ✅ **SAFE TO REMOVE** - All files listed below are no longer referenced in the codebase.

## Verification Steps Before Removal

Before removing any of the above files, perform the following checks:

1. **Search for imports:**
   ```bash
   cd apps/web
   grep -r "from '@/components/chat'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/feed'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/admin'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/permissions'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/layout/admin-header'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/layout/admin-sidebar'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/layout/header'" src --include="*.tsx" --include="*.ts"
   grep -r "from '@/components/layout/sidebar'" src --include="*.tsx" --include="*.ts"
   ```

2. **Run tests:**
   ```bash
   yarn test
   ```

3. **Run build:**
   ```bash
   yarn build
   ```

4. **Check TypeScript:**
   ```bash
   npx tsc --noEmit
   ```

## Summary

- **Total files identified:** 13
- **Chat components:** 3
- **Feed components:** 2
- **Admin components:** 2
- **Layout components:** 4 (kebab-case versions)
- **Legacy exports in index:** 2 (to be removed after file removal)

## Next Steps

1. Verify all files are truly unused (see verification steps above)
2. Update any remaining imports to use the new modular structure
3. Remove the files listed above
4. Clean up legacy exports from `src/components/layout/index.ts`
5. Run full test suite to ensure nothing breaks
6. Commit changes with detailed commit message
