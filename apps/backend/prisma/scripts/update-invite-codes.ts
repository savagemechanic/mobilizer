/**
 * Standalone script to update all organizations with unique 3-letter invite codes
 *
 * Usage:
 *   npx ts-node prisma/scripts/update-invite-codes.ts
 *
 * Or from the backend directory:
 *   yarn ts-node prisma/scripts/update-invite-codes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a unique 3-letter uppercase invite code
 */
async function generateUniqueInviteCode(usedCodes: Set<string>): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Array.from({ length: 3 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');

    // Check if code is already used in this batch or in database
    if (!usedCodes.has(code)) {
      const existing = await prisma.organization.findUnique({
        where: { inviteCode: code },
      });

      if (!existing) {
        usedCodes.add(code);
        return code;
      }
    }
  }

  throw new Error('Failed to generate unique invite code after 100 attempts');
}

/**
 * Update all organizations with unique 3-letter invite codes
 */
async function updateAllOrganizationInviteCodes(): Promise<void> {
  console.log('\n🔑 Updating all organizations with 3-letter invite codes...\n');

  // Get all organizations
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, inviteCode: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${organizations.length} organizations\n`);

  // Track used codes to ensure uniqueness
  const usedCodes = new Set<string>();

  // First, collect any existing valid 3-letter codes
  for (const org of organizations) {
    if (org.inviteCode && /^[A-Z]{3}$/.test(org.inviteCode)) {
      usedCodes.add(org.inviteCode);
    }
  }

  console.log(`Found ${usedCodes.size} existing valid 3-letter codes\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const org of organizations) {
    // Skip if already has a valid 3-letter code
    if (org.inviteCode && /^[A-Z]{3}$/.test(org.inviteCode)) {
      console.log(`  ✓ ${org.name}: ${org.inviteCode} (already valid)`);
      skippedCount++;
      continue;
    }

    // Generate new unique code
    const newCode = await generateUniqueInviteCode(usedCodes);

    // Update organization
    await prisma.organization.update({
      where: { id: org.id },
      data: { inviteCode: newCode },
    });

    console.log(`  ✓ ${org.name}: ${org.inviteCode || '(none)'} → ${newCode}`);
    updatedCount++;
  }

  console.log('\n========================================');
  console.log('UPDATE COMPLETE');
  console.log('========================================');
  console.log(`Total organizations: ${organizations.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (already valid): ${skippedCount}`);
  console.log('========================================\n');
}

// Run the script
updateAllOrganizationInviteCodes()
  .catch((e) => {
    console.error('Error updating invite codes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
