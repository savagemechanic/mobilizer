import { PrismaClient, Gender, OrgLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedLocations } from './seeders/locations-batch';

const prisma = new PrismaClient();

// Check if we should seed full locations from SQL file
const SEED_FULL_LOCATIONS = process.env.SEED_FULL_LOCATIONS === 'true' || process.argv.includes('--full-locations');

async function main() {
  console.log('Starting seed...');

  // ============================================
  // LOCATIONS - NIGERIA
  // ============================================

  if (SEED_FULL_LOCATIONS) {
    console.log('\n🌍 Full location seeding enabled (this may take 10-15 minutes)...\n');
    await seedLocations();
  }

  // Always create Nigeria for sample data and test users
  console.log('\n📍 Creating sample location data for test users...\n');

  // Create Nigeria
  const nigeria = await prisma.country.upsert({
    where: { code: 'NG' },
    update: {},
    create: {
      name: 'Nigeria',
      code: 'NG',
    },
  });
  console.log('Created country:', nigeria.name);

  // Create Nigerian States (sample)
  const statesData = [
    { name: 'Lagos', code: 'LA' },
    { name: 'Abuja (FCT)', code: 'FC' },
    { name: 'Kano', code: 'KN' },
    { name: 'Rivers', code: 'RV' },
    { name: 'Oyo', code: 'OY' },
    { name: 'Kaduna', code: 'KD' },
    { name: 'Delta', code: 'DT' },
    { name: 'Enugu', code: 'EN' },
    { name: 'Anambra', code: 'AN' },
    { name: 'Ogun', code: 'OG' },
  ];

  const states: Record<string, any> = {};
  for (const stateData of statesData) {
    const state = await prisma.state.upsert({
      where: { countryId_code: { countryId: nigeria.id, code: stateData.code } },
      update: {},
      create: {
        countryId: nigeria.id,
        name: stateData.name,
        code: stateData.code,
      },
    });
    states[stateData.code] = state;
  }
  console.log('Created', Object.keys(states).length, 'states');

  // Create LGAs for Lagos
  const lagosLGAs = [
    { name: 'Ikeja', code: 'IKJ' },
    { name: 'Lagos Island', code: 'LGI' },
    { name: 'Victoria Island', code: 'VI' },
    { name: 'Surulere', code: 'SUR' },
    { name: 'Lekki', code: 'LEK' },
    { name: 'Ikoyi', code: 'IKY' },
    { name: 'Yaba', code: 'YAB' },
    { name: 'Mushin', code: 'MSN' },
  ];

  const lgas: Record<string, any> = {};
  for (const lgaData of lagosLGAs) {
    const lga = await prisma.lGA.upsert({
      where: { stateId_code: { stateId: states['LA'].id, code: lgaData.code } },
      update: {},
      create: {
        stateId: states['LA'].id,
        name: lgaData.name,
        code: lgaData.code,
      },
    });
    lgas[lgaData.code] = lga;
  }
  console.log('Created', Object.keys(lgas).length, 'LGAs for Lagos');

  // Create Wards for Ikeja
  const ikejaWards = [
    { name: 'Alausa Ward', code: 'ALS' },
    { name: 'GRA Ward', code: 'GRA' },
    { name: 'Oregun Ward', code: 'ORG' },
    { name: 'Opebi Ward', code: 'OPB' },
  ];

  const wards: Record<string, any> = {};
  for (const wardData of ikejaWards) {
    const ward = await prisma.ward.upsert({
      where: { lgaId_code: { lgaId: lgas['IKJ'].id, code: wardData.code } },
      update: {},
      create: {
        lgaId: lgas['IKJ'].id,
        name: wardData.name,
        code: wardData.code,
      },
    });
    wards[wardData.code] = ward;
  }
  console.log('Created', Object.keys(wards).length, 'Wards for Ikeja');

  // Create Polling Units for Alausa Ward
  const pollingUnitsData = [
    { name: 'PU 001 - Alausa Primary School', code: 'PU001' },
    { name: 'PU 002 - Alausa Market', code: 'PU002' },
    { name: 'PU 003 - Secretariat', code: 'PU003' },
    { name: 'PU 004 - Alausa Community Hall', code: 'PU004' },
  ];

  const pollingUnits: Record<string, any> = {};
  for (const puData of pollingUnitsData) {
    const pu = await prisma.pollingUnit.upsert({
      where: { wardId_code: { wardId: wards['ALS'].id, code: puData.code } },
      update: {},
      create: {
        wardId: wards['ALS'].id,
        name: puData.name,
        code: puData.code,
      },
    });
    pollingUnits[puData.code] = pu;
  }
  console.log('Created', Object.keys(pollingUnits).length, 'Polling Units');

  // ============================================
  // ROLES
  // ============================================

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
      permissions: ['*'],
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator for movement',
      permissions: ['admin:*', 'movement:*'],
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user',
      permissions: ['read', 'write'],
    },
  });

  console.log('Created roles');

  // ============================================
  // USERS
  // ============================================

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Platform Admin (God Mode)
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'platform@mobilizer.ng' },
    update: { isPlatformAdmin: true },
    create: {
      email: 'platform@mobilizer.ng',
      password: hashedPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      displayName: 'Platform Admin',
      isEmailVerified: true,
      isPlatformAdmin: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      gender: Gender.MALE,
    },
  });
  console.log('Created Platform Admin:', platformAdmin.email);

  // Super Admin User
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@mobilizer.ng' },
    update: {},
    create: {
      email: 'superadmin@mobilizer.ng',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      isEmailVerified: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      lgaId: lgas['IKJ'].id,
      gender: Gender.MALE,
      dateOfBirth: new Date('1985-05-15'),
    },
  });
  console.log('Created Super Admin:', superAdminUser.email);

  // Regular Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mobilizer.ng' },
    update: {},
    create: {
      email: 'admin@mobilizer.ng',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin User',
      isEmailVerified: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      lgaId: lgas['IKJ'].id,
      wardId: wards['ALS'].id,
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1990-03-20'),
    },
  });
  console.log('Created Admin User:', adminUser.email);

  // Regular Test Users
  const testUsers = [];
  const genders = [Gender.MALE, Gender.FEMALE, Gender.OTHER, Gender.PREFER_NOT_TO_SAY];
  const birthYears = [1975, 1982, 1990, 1995, 2000, 1988, 1970, 1998];

  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@mobilizer.ng` },
      update: {},
      create: {
        email: `user${i}@mobilizer.ng`,
        password: hashedPassword,
        firstName: `User${i}`,
        lastName: 'Test',
        displayName: `Test User ${i}`,
        isEmailVerified: true,
        countryId: nigeria.id,
        stateId: states[statesData[i % statesData.length].code].id,
        lgaId: i % 3 === 0 ? lgas['IKJ'].id : null,
        wardId: i % 5 === 0 ? wards['ALS'].id : null,
        gender: genders[i % genders.length],
        dateOfBirth: new Date(`${birthYears[i % birthYears.length]}-${(i % 12) + 1}-${(i % 28) + 1}`),
      },
    });
    testUsers.push(user);
  }
  console.log('Created', testUsers.length, 'test users');

  // ============================================
  // MOVEMENTS
  // ============================================

  const movement1 = await prisma.movement.upsert({
    where: { slug: 'youth-empowerment-movement' },
    update: {},
    create: {
      name: 'Youth Empowerment Movement',
      slug: 'youth-empowerment-movement',
      description: 'A national movement focused on empowering Nigerian youth through education, skills development, and civic engagement.',
      isActive: true,
      createdById: platformAdmin.id,
    },
  });
  console.log('Created Movement:', movement1.name);

  const movement2 = await prisma.movement.upsert({
    where: { slug: 'womens-development-coalition' },
    update: {},
    create: {
      name: "Women's Development Coalition",
      slug: 'womens-development-coalition',
      description: 'A coalition dedicated to advancing women\'s rights, education, and economic opportunities across Nigeria.',
      isActive: true,
      createdById: platformAdmin.id,
    },
  });
  console.log('Created Movement:', movement2.name);

  const movement3 = await prisma.movement.upsert({
    where: { slug: 'community-health-initiative' },
    update: {},
    create: {
      name: 'Community Health Initiative',
      slug: 'community-health-initiative',
      description: 'A grassroots movement improving healthcare access and health education in rural and urban communities.',
      isActive: true,
      createdById: platformAdmin.id,
    },
  });
  console.log('Created Movement:', movement3.name);

  // Assign Super Admin to movements
  await prisma.movementAdmin.upsert({
    where: {
      movementId_userId: {
        movementId: movement1.id,
        userId: superAdminUser.id,
      },
    },
    update: {},
    create: {
      movementId: movement1.id,
      userId: superAdminUser.id,
      assignedBy: platformAdmin.id,
    },
  });

  await prisma.movementAdmin.upsert({
    where: {
      movementId_userId: {
        movementId: movement2.id,
        userId: superAdminUser.id,
      },
    },
    update: {},
    create: {
      movementId: movement2.id,
      userId: superAdminUser.id,
      assignedBy: platformAdmin.id,
    },
  });
  console.log('Assigned Super Admin to movements');

  // ============================================
  // SUPPORT GROUPS (ORGANIZATIONS)
  // ============================================

  // National level support group
  const nationalOrg = await prisma.organization.upsert({
    where: { slug: 'yem-national' },
    update: {},
    create: {
      name: 'YEM National Headquarters',
      slug: 'yem-national',
      description: 'National headquarters for the Youth Empowerment Movement',
      level: OrgLevel.NATIONAL,
      movementId: movement1.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      memberCount: 5,
    },
  });
  console.log('Created National Support Group:', nationalOrg.name);

  // State level support groups
  const lagosStateOrg = await prisma.organization.upsert({
    where: { slug: 'yem-lagos-state' },
    update: {},
    create: {
      name: 'YEM Lagos State Chapter',
      slug: 'yem-lagos-state',
      description: 'Lagos State chapter of the Youth Empowerment Movement',
      level: OrgLevel.STATE,
      movementId: movement1.id,
      parentId: nationalOrg.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      memberCount: 10,
    },
  });
  console.log('Created State Support Group:', lagosStateOrg.name);

  const kanoStateOrg = await prisma.organization.upsert({
    where: { slug: 'yem-kano-state' },
    update: {},
    create: {
      name: 'YEM Kano State Chapter',
      slug: 'yem-kano-state',
      description: 'Kano State chapter of the Youth Empowerment Movement',
      level: OrgLevel.STATE,
      movementId: movement1.id,
      parentId: nationalOrg.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      stateId: states['KN'].id,
      memberCount: 8,
    },
  });
  console.log('Created State Support Group:', kanoStateOrg.name);

  // LGA level support groups
  const ikejaLGAOrg = await prisma.organization.upsert({
    where: { slug: 'yem-ikeja-lga' },
    update: {},
    create: {
      name: 'YEM Ikeja LGA',
      slug: 'yem-ikeja-lga',
      description: 'Ikeja LGA chapter of the Youth Empowerment Movement',
      level: OrgLevel.LGA,
      movementId: movement1.id,
      parentId: lagosStateOrg.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      lgaId: lgas['IKJ'].id,
      memberCount: 15,
    },
  });
  console.log('Created LGA Support Group:', ikejaLGAOrg.name);

  // Ward level support group
  const alausaWardOrg = await prisma.organization.upsert({
    where: { slug: 'yem-alausa-ward' },
    update: {},
    create: {
      name: 'YEM Alausa Ward',
      slug: 'yem-alausa-ward',
      description: 'Alausa Ward chapter of the Youth Empowerment Movement',
      level: OrgLevel.WARD,
      movementId: movement1.id,
      parentId: ikejaLGAOrg.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      lgaId: lgas['IKJ'].id,
      wardId: wards['ALS'].id,
      memberCount: 20,
    },
  });
  console.log('Created Ward Support Group:', alausaWardOrg.name);

  // Polling Unit level support group
  const pu001Org = await prisma.organization.upsert({
    where: { slug: 'yem-pu001' },
    update: {},
    create: {
      name: 'YEM PU001 Alausa Primary',
      slug: 'yem-pu001',
      description: 'Polling Unit 001 chapter at Alausa Primary School',
      level: OrgLevel.POLLING_UNIT,
      movementId: movement1.id,
      parentId: alausaWardOrg.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      stateId: states['LA'].id,
      lgaId: lgas['IKJ'].id,
      wardId: wards['ALS'].id,
      pollingUnitId: pollingUnits['PU001'].id,
      memberCount: 25,
    },
  });
  console.log('Created Polling Unit Support Group:', pu001Org.name);

  // Support groups for Movement 2
  const wdcNational = await prisma.organization.upsert({
    where: { slug: 'wdc-national' },
    update: {},
    create: {
      name: 'WDC National Headquarters',
      slug: 'wdc-national',
      description: 'National headquarters for the Women\'s Development Coalition',
      level: OrgLevel.NATIONAL,
      movementId: movement2.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      memberCount: 3,
    },
  });
  console.log('Created WDC National Support Group:', wdcNational.name);

  // ============================================
  // ORG MEMBERSHIPS
  // ============================================

  // Add admins to organizations
  await prisma.orgMembership.upsert({
    where: { userId_orgId: { userId: superAdminUser.id, orgId: nationalOrg.id } },
    update: {},
    create: {
      userId: superAdminUser.id,
      orgId: nationalOrg.id,
      isAdmin: true,
      approvedAt: new Date(),
    },
  });

  await prisma.orgMembership.upsert({
    where: { userId_orgId: { userId: adminUser.id, orgId: lagosStateOrg.id } },
    update: {},
    create: {
      userId: adminUser.id,
      orgId: lagosStateOrg.id,
      isAdmin: true,
      approvedAt: new Date(),
    },
  });

  // Add test users to organizations
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const orgs = [nationalOrg, lagosStateOrg, ikejaLGAOrg, alausaWardOrg, pu001Org];
    const org = orgs[i % orgs.length];

    await prisma.orgMembership.upsert({
      where: { userId_orgId: { userId: user.id, orgId: org.id } },
      update: {},
      create: {
        userId: user.id,
        orgId: org.id,
        isAdmin: false,
        approvedAt: new Date(),
      },
    });
  }
  console.log('Created org memberships');

  // ============================================
  // POSTS
  // ============================================

  const postContents = [
    'Exciting news! Our community outreach program is launching next week. Join us to make a difference!',
    'Thank you to everyone who participated in our town hall meeting today. Your voices matter!',
    'Registration for the skills development workshop is now open. Limited slots available!',
    'Great turnout at our youth empowerment seminar! The future is bright.',
    'Important announcement: General meeting scheduled for this Saturday at 10 AM.',
    'Congratulations to our members who completed the leadership training program!',
    'We are growing stronger together! 100 new members joined this month.',
    'Health awareness campaign starts tomorrow. Bring your family and friends!',
  ];

  const posts = [];
  const orgsForPosts = [nationalOrg, lagosStateOrg, ikejaLGAOrg, alausaWardOrg];
  const postAuthors = [superAdminUser, adminUser, ...testUsers.slice(0, 5)];

  for (let i = 0; i < postContents.length; i++) {
    const post = await prisma.post.create({
      data: {
        content: postContents[i],
        authorId: postAuthors[i % postAuthors.length].id,
        orgId: orgsForPosts[i % orgsForPosts.length].id,
        type: i === 3 ? 'POLL' : 'TEXT',
        isPublished: true,
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 200),
      },
    });
    posts.push(post);
  }
  console.log('Created', posts.length, 'posts');

  // Create a poll
  const pollPost = posts.find(p => p.type === 'POLL');
  if (pollPost) {
    await prisma.poll.create({
      data: {
        postId: pollPost.id,
        question: 'What topic should our next workshop focus on?',
        options: {
          create: [
            { text: 'Leadership Skills', voteCount: 15 },
            { text: 'Financial Literacy', voteCount: 22 },
            { text: 'Digital Marketing', voteCount: 18 },
            { text: 'Public Speaking', voteCount: 12 },
          ],
        },
      },
    });
    console.log('Created poll');
  }

  // ============================================
  // EVENTS
  // ============================================

  const eventsData = [
    {
      title: 'Youth Empowerment Summit 2024',
      description: 'Annual summit bringing together young leaders from across Nigeria.',
      type: 'RALLY',
      startTime: new Date('2024-03-15T09:00:00'),
      endTime: new Date('2024-03-15T17:00:00'),
      location: 'Lagos Convention Centre',
    },
    {
      title: 'Skills Development Workshop',
      description: 'Hands-on workshop focusing on practical skills for employment.',
      type: 'WORKSHOP',
      startTime: new Date('2024-02-20T10:00:00'),
      endTime: new Date('2024-02-20T15:00:00'),
      location: 'Ikeja City Mall',
    },
    {
      title: 'Monthly Town Hall Meeting',
      description: 'Open forum for members to discuss community issues.',
      type: 'TOWN_HALL',
      startTime: new Date('2024-02-10T14:00:00'),
      endTime: new Date('2024-02-10T16:00:00'),
      location: 'Community Hall, Alausa',
      isVirtual: false,
    },
    {
      title: 'Digital Skills Webinar',
      description: 'Online webinar on essential digital skills for the modern workforce.',
      type: 'WEBINAR',
      startTime: new Date('2024-02-25T11:00:00'),
      endTime: new Date('2024-02-25T13:00:00'),
      isVirtual: true,
      virtualLink: 'https://zoom.us/j/example',
    },
  ];

  for (const eventData of eventsData) {
    await prisma.event.create({
      data: {
        ...eventData,
        type: eventData.type as any,
        creatorId: superAdminUser.id,
        orgId: nationalOrg.id,
        isPublished: true,
      },
    });
  }
  console.log('Created', eventsData.length, 'events');

  // ============================================
  // WALLETS
  // ============================================

  // Create movement wallet
  await prisma.movementWallet.upsert({
    where: { movementId: movement1.id },
    update: {},
    create: {
      movementId: movement1.id,
      balance: 500000,
      ledgerBalance: 500000,
      status: 'ACTIVE',
    },
  });

  await prisma.movementWallet.upsert({
    where: { movementId: movement2.id },
    update: {},
    create: {
      movementId: movement2.id,
      balance: 250000,
      ledgerBalance: 250000,
      status: 'ACTIVE',
    },
  });
  console.log('Created movement wallets');

  // Create user wallets
  const allUsers = [platformAdmin, superAdminUser, adminUser, ...testUsers];
  for (const user of allUsers) {
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: Math.floor(Math.random() * 10000),
        ledgerBalance: 0,
        status: 'ACTIVE',
      },
    });
  }
  console.log('Created user wallets');

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n========================================');
  console.log('SEED COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log('\nTest Accounts:');
  console.log('- Platform Admin: platform@mobilizer.ng / password123');
  console.log('- Super Admin: superadmin@mobilizer.ng / password123');
  console.log('- Admin: admin@mobilizer.ng / password123');
  console.log('- Test Users: user1@mobilizer.ng through user20@mobilizer.ng / password123');
  console.log('\nMovements Created:');
  console.log('- Youth Empowerment Movement');
  console.log("- Women's Development Coalition");
  console.log('- Community Health Initiative');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
