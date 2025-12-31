/**
 * Demo Posts Seeder - Full Coverage
 *
 * Creates realistic demo posts for ALL polling units with:
 * - Nigerian names matching regional locations
 * - Conversational post content in Nigerian Pidgin/English
 * - 2-3 posts per polling unit
 *
 * Expected scale:
 * - ~120,000 polling units
 * - ~240,000-360,000 posts
 * - ~120,000 demo users
 *
 * Usage:
 *   yarn prisma:seed:demo-posts
 *
 * NOTE: This will take 30-60 minutes to complete.
 */

import { PrismaClient, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Configure Prisma with connection pool settings for long-running operations
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['warn', 'error'],
});

// Smaller batch sizes to prevent connection timeouts
const USER_BATCH_SIZE = 100;
const POST_BATCH_SIZE = 200;

// Helper to execute with retry on connection errors
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = error?.code === 'P1017' || error?.code === 'P1001' || error?.code === 'P1002';
      if (isConnectionError && attempt < maxRetries) {
        console.log(`   ⚠️  Connection error, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        // Reconnect
        await prisma.$disconnect();
        await prisma.$connect();
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Nigerian names by region/ethnicity
const NAMES_BY_REGION: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  YORUBA: {
    firstNames: [
      'Adebayo', 'Oluwaseun', 'Temitope', 'Ayodeji', 'Olumide', 'Funmilayo', 'Adaeze',
      'Oluwafemi', 'Titilayo', 'Babatunde', 'Yetunde', 'Oluwakemi', 'Adewale', 'Folake',
      'Olamide', 'Bukola', 'Adeola', 'Kehinde', 'Taiwo', 'Omolara', 'Adebola', 'Oluwaseyi',
      'Ayomide', 'Oluwadamilola', 'Inioluwa', 'Tolulope', 'Oluwatobiloba', 'Moyosore',
      'Oluwanifemi', 'Adesola', 'Oluwagbemiga', 'Morenike', 'Oluwayemisi', 'Adejoke',
      'Boluwatife', 'Oluwatimilehin', 'Adetola', 'Olayinka', 'Oluwatosin', 'Damilare'
    ],
    lastNames: [
      'Ogundimu', 'Adeyemi', 'Bakare', 'Adeleke', 'Oladipo', 'Akinwale', 'Oyelaran',
      'Adegoke', 'Fashola', 'Olowokere', 'Ajayi', 'Ogunyemi', 'Akindele', 'Olusanya',
      'Ogundipe', 'Adekunle', 'Oyeleke', 'Adebisi', 'Oyedepo', 'Afolabi', 'Olayinka',
      'Adeniyi', 'Ogunlana', 'Akintola', 'Odunsi', 'Oyewole', 'Oguntade', 'Ademola',
      'Olatunde', 'Ayodele', 'Ogunleye', 'Adegbite', 'Oshodi', 'Animashaun', 'Balogun'
    ]
  },
  HAUSA: {
    firstNames: [
      'Abubakar', 'Fatima', 'Muhammed', 'Aisha', 'Ibrahim', 'Zainab', 'Usman',
      'Amina', 'Suleiman', 'Halima', 'Abdullahi', 'Maryam', 'Yusuf', 'Hafsat',
      'Bashir', 'Sadiya', 'Aliyu', 'Bilkisu', 'Ismail', 'Hadiza', 'Nasiru', 'Rahinatu',
      'Kabiru', 'Hauwa', 'Salisu', 'Asmau', 'Garba', 'Salamatu', 'Musa', 'Khadija',
      'Hamza', 'Safiya', 'Ahmad', 'Rukayya', 'Dauda', 'Jamila', 'Nuhu', 'Hassana',
      'Sanusi', 'Firdausi', 'Bello', 'Rabi', 'Tanimu', 'Laraba', 'Shehu', 'Asabe'
    ],
    lastNames: [
      'Abdullahi', 'Bello', 'Danjuma', 'Sani', 'Mohammed', 'Yusuf', 'Ibrahim',
      'Abubakar', 'Shehu', 'Umar', 'Lawal', 'Garba', 'Musa', 'Isah', 'Adamu',
      'Suleiman', 'Aliyu', 'Yakubu', 'Isa', 'Ahmad', 'Idris', 'Tanko', 'Waziri',
      'Dikko', 'Ringim', 'Fagge', 'Kano', 'Zaria', 'Sokoto', 'Kebbi', 'Gwandu'
    ]
  },
  IGBO: {
    firstNames: [
      'Chukwuemeka', 'Ngozi', 'Obiora', 'Adaeze', 'Nnamdi', 'Chinelo', 'Obinna',
      'Chiamaka', 'Ikechukwu', 'Chidinma', 'Uchenna', 'Amara', 'Chinedu', 'Oluchi',
      'Emeka', 'Nneka', 'Kenechukwu', 'Chioma', 'Tobenna', 'Ifeoma', 'Chidi', 'Adanna',
      'Ebuka', 'Chinyere', 'Uzoma', 'Nkechi', 'Obianuju', 'Kelechi', 'Somto', 'Munachi',
      'Chukwudi', 'Onyinye', 'Nzube', 'Amarachi', 'Lotanna', 'Ginika', 'Tochukwu', 'Kosiso',
      'Ekene', 'Ujunwa', 'Chukwuka', 'Nneoma', 'Ifeanyi', 'Ogechi', 'Ugochukwu', 'Chisom'
    ],
    lastNames: [
      'Okafor', 'Eze', 'Nwosu', 'Okeke', 'Onyeka', 'Nwachukwu', 'Obi', 'Uzoma',
      'Igwe', 'Chukwu', 'Agu', 'Okoro', 'Nwankwo', 'Ibe', 'Okonkwo', 'Aneke',
      'Nnadi', 'Okolie', 'Ogbu', 'Nwafor', 'Ikenna', 'Obasi', 'Emenike', 'Azubuike',
      'Nnamdi', 'Ugwu', 'Onuoha', 'Mbah', 'Ezeji', 'Iwu', 'Anyanwu', 'Uchenna'
    ]
  },
  NIGER_DELTA: {
    firstNames: [
      'Efiong', 'Ima', 'Okon', 'Aniekan', 'Ubong', 'Idara', 'Emem', 'Nsikan',
      'Edidiong', 'Mfoniso', 'Aniebiet', 'Uduak', 'Ekom', 'Itoro', 'Abasifreke',
      'Enobong', 'Imaobong', 'Nseobong', 'Otoabasi', 'Ememobong', 'Utibe', 'Akpan',
      'Ekemini', 'Idongesit', 'Mbakara', 'Odudu', 'Bassey', 'Effiom', 'Edet', 'Ita',
      'Akaninyene', 'Anietie', 'Enefiok', 'Ifiok', 'Ime', 'Inyang', 'Itohowo', 'Mfon'
    ],
    lastNames: [
      'Etim', 'Bassey', 'Ekpo', 'Okon', 'Effiong', 'Udoh', 'Akpan', 'Edet',
      'Udo', 'Essien', 'Inyang', 'Ekong', 'Ita', 'Obot', 'Nse', 'Amos',
      'Offiong', 'Asuquo', 'Umoh', 'Ukpong', 'Archibong', 'Ekanem', 'Inwang',
      'Udofia', 'Umanah', 'Enyong', 'Ntuk', 'Akpabio', 'Ekere', 'Udosen'
    ]
  },
  MIDDLE_BELT: {
    firstNames: [
      'Danjuma', 'Ladi', 'Bulus', 'Laraba', 'Yakubu', 'Talatu', 'Istifanus',
      'Jummai', 'Bitrus', 'Rahila', 'Danladi', 'Saratu', 'Gideon', 'Deborah',
      'Sani', 'Martha', 'Peter', 'Grace', 'Samuel', 'Ruth', 'Joseph', 'Esther',
      'David', 'Hannah', 'Moses', 'Rebecca', 'John', 'Mary', 'James', 'Sarah',
      'Daniel', 'Naomi', 'Stephen', 'Lydia', 'Paul', 'Rachel', 'Simon', 'Priscilla'
    ],
    lastNames: [
      'Dung', 'Chollom', 'Gyang', 'Davou', 'Bot', 'Pam', 'Gotom', 'Dalyop',
      'Mangut', 'Rwang', 'Msen', 'Akiga', 'Iorkaa', 'Tyokyaa', 'Igba', 'Chia',
      'Akaaer', 'Gbor', 'Ukuma', 'Ogbu', 'Onoja', 'Ameh', 'Idoko', 'Okwu',
      'Attah', 'Ocheja', 'Sule', 'Adaji', 'Enemali', 'Okolo', 'Audu', 'Oche'
    ]
  }
};

// Map states to regions
const STATE_TO_REGION: Record<string, string> = {
  'Lagos': 'YORUBA', 'Oyo': 'YORUBA', 'Ogun': 'YORUBA', 'Ondo': 'YORUBA',
  'Ekiti': 'YORUBA', 'Osun': 'YORUBA', 'Kwara': 'YORUBA',
  'Kano': 'HAUSA', 'Kaduna': 'HAUSA', 'Katsina': 'HAUSA', 'Sokoto': 'HAUSA',
  'Zamfara': 'HAUSA', 'Kebbi': 'HAUSA', 'Jigawa': 'HAUSA', 'Bauchi': 'HAUSA',
  'Gombe': 'HAUSA', 'Yobe': 'HAUSA', 'Borno': 'HAUSA', 'Adamawa': 'HAUSA',
  'Enugu': 'IGBO', 'Anambra': 'IGBO', 'Imo': 'IGBO', 'Abia': 'IGBO', 'Ebonyi': 'IGBO',
  'Rivers': 'NIGER_DELTA', 'Delta': 'NIGER_DELTA', 'Bayelsa': 'NIGER_DELTA',
  'Cross River': 'NIGER_DELTA', 'Akwa Ibom': 'NIGER_DELTA', 'Edo': 'NIGER_DELTA',
  'Plateau': 'MIDDLE_BELT', 'Benue': 'MIDDLE_BELT', 'Nasarawa': 'MIDDLE_BELT',
  'Kogi': 'MIDDLE_BELT', 'Niger': 'MIDDLE_BELT', 'Taraba': 'MIDDLE_BELT',
  'Abuja': 'HAUSA', 'FCT': 'HAUSA', 'Federal Capital Territory': 'HAUSA'
};

// Conversational post templates - Nigerian style
const POSTS = [
  // Community vibes
  "My people, how una dey this morning? Just checking in on everyone. Hope say everything dey go well for una side. 🙏",
  "Good morning neighbors! Who else hear that loud music last night? Abeg make we respect each other o!",
  "Bros and sis, we need to talk about the water situation for this our area. Na three days now wey tap no dey run.",
  "Shoutout to everyone wey help clean the drainage yesterday! Una try well well. Community spirit still dey alive! 💪",
  "Abeg who sabi where dem dey do voter registration around here? Make I go update my details.",
  "Finally! Dem don fix that pothole for our junction. No more suffer for bike riders.",
  "Who else noticed say crime don reduce since vigilante start night patrol? Una dey try!",
  "The children football team from our area won their match yesterday! These pikin go make us proud. ⚽",
  "Community meeting na tomorrow 4pm for town hall. Important matters to discuss. Make una show face!",
  "Big thanks to the women association for organizing that health talk. Very informative!",

  // Daily life
  "This heat ehn! Who else feel like say sun want finish us today? Stay hydrated people!",
  "Morning hustle begins! Who dey go market today? Make we go together save transport money.",
  "Weekend vibes! 🎉 Who dey go that owambe for Chief compound tomorrow?",
  "Just buy fresh fish from that new woman for junction. Very reasonable price and the fish fresh well well!",
  "Traffic for our road this morning no be here! We need traffic warden for that junction ASAP.",
  "Happy Sunday family! Wishing everyone peaceful day wherever you dey worship. 🙏",
  "School don resume. Parents, how much una pay school fees this term? Them increase again?",
  "This cold Harmattan wind no dey play o! Make sure una wear something warm.",
  "NEPA bring light! 🎉 After four days of darkness. Make we use am well before dem take am.",
  "Who know good barber/hairdresser around here? I need fresh cut before weekend.",

  // Helpful posts
  "PSA: Dem dey give free immunization for children at the health center till Friday. Carry your pikin go!",
  "Just dey come from that new pharmacy for junction. Dem get drugs and price reasonable.",
  "Fire outbreak for Area B yesterday. Make we all get fire extinguisher for house. Prevention better than cure!",
  "Warning: I hear say some boys dey snatch phone for that dark corner by evening. Make una dey careful!",
  "Good news! Dem open new borehole for community. Water free for now. Carry your jerricans!",
  "The agriculture officer dey come tomorrow to teach us new farming methods. Farmers make una come out!",
  "For anyone wey dey find work: that new company for industrial area dey recruit. Go with your CV.",
  "Electrician wey fix my AC charge fair price and do quality work. Make I share him number?",
  "Blood donation exercise for General Hospital on Saturday. Let's save lives! 🩸",
  "Free JAMB form registration for indigent students at LGA office. Tell anyone wey need am.",

  // Questions
  "Please who know good plumber around? My pipe burst this morning and water everywhere! 😫",
  "Abeg make somebody help me. Which hospital dey good for delivery around here?",
  "Looking for lesson teacher for my daughter. JSS2 level. Who get recommendation?",
  "Where I fit buy original building materials around here? No want fake cement o!",
  "Any lawyer for this community? I need advice on land matter. DM me please.",
  "Who get the number of PHCN people? Light issue wey need urgent attention.",
  "Best place to fix phone screen around here? Cracked my screen this morning 😢",
  "Where dem dey sell gas around here? My cylinder don empty since morning.",
  "Anybody know mechanic wey honest? My car dey give me issues.",
  "Who fit recommend good tailor/fashion designer? Wedding coming up!",

  // Celebrations
  "Congratulations to our own Dr. Amaka on her graduation! You did it! We're proud of you! 🎓",
  "It's a boy! 👶 Welcome to the world little one. Mama and baby doing fine. God is good!",
  "Wedding bells! 💒 Chioma and Emeka finally tying the knot next Saturday. Love wins!",
  "Happy birthday to Baba Landlord! May you live long in good health. 🎂",
  "Our son just passed his WAEC with flying colors! All A's and B's! Hard work pays! 📚",
  "Congratulations to the new couple! May your union be blessed with joy and prosperity!",
  "Naming ceremony was beautiful! Welcome baby Aisha to our community. 🍼",
  "Chief just completed his new house. From grass to grace! Inspiring story!",
  "Graduation party this Saturday! Our daughter finished university. Invitation open!",
  "We thank God! Mama finally discharged from hospital. Your prayers worked! 🙏",

  // Concerns and issues
  "That abandoned building dey become hideout for hoodlums. We need to report to authorities.",
  "Roads flooded again after small rain. When dem go fix proper drainage?",
  "Fuel scarcity wahala! Where una dey see fuel around here? Share info please.",
  "Electricity bill wey dem bring this month ehn! Na so we dey use light? Something fishy!",
  "Noise pollution from that bar too much. Some of us get early morning work na!",
  "Dem dey dump refuse for that corner again. This is health hazard! Who we report to?",
  "Street lights no dey work for two weeks now. Night movement don become risky.",
  "Water from the tap dey look somehow. Brown color. We need answers!",
  "Stray dogs plenty for area. Dem fit bite somebody pikin. Animal control needed!",
  "Price of foodstuff don increase again. This economy hard o! How we go survive?",

  // Political/Civic
  "Fellow citizens, election dey come. Make sure una collect PVC. Our vote na our power!",
  "Attended the town hall meeting yesterday. We raised issue of bad roads. They promised action.",
  "Local government chairman visited yesterday. At least dem still remember us.",
  "Voter education: Nobody fit force you vote for anybody. Your vote na secret ballot!",
  "Ward development committee meeting on Friday. All stakeholders should attend.",
  "New councillor don assume office. Let's work with am for community development.",
  "Budget for our constituency don come out. Make we monitor how dem spend am.",
  "Political rally coming to our area tomorrow. Maintain peace. No violence!",
  "Democracy Day celebration! Let's appreciate our freedom. Use it responsibly.",
  "Town union election results out. Congratulations to the new executives!",

  // Appreciation
  "Big thanks to Alhaji Musa for fixing the mosque roof. Community service at its best! 🕌",
  "Appreciation to the youth volunteers wey organize environmental sanitation. Una well done!",
  "God bless everyone wey contribute to Mama Chinyere medical bills. She dey recover well.",
  "Shoutout to our vigilante group for keeping us safe. Real community heroes!",
  "Thanks to the women's group for the successful fundraising. ₦500k raised for the school!",
  "We appreciate Chief for sponsoring 10 students' WAEC fees. God go bless you!",
  "Thank you nurses and doctors at the health center. You people dey try for us!",
  "Big ups to everyone wey help during the flood last week. That na true community!",
  "Appreciation post for our teachers. Your dedication no dey go unnoticed! ❤️",
  "Thanks to LASTMA officials for managing traffic during the construction. Professional work!",

  // Announcements
  "📢 NOTICE: Environmental sanitation tomorrow. Stay indoors till 10am. No movement!",
  "🚨 Security Alert: Be vigilant! Reports of suspicious movements at night.",
  "📣 Meeting: All landlords to meet at community hall, Saturday 11am. Important!",
  "📢 Market day tomorrow! Support our local traders. Fresh produce available!",
  "⚡ Power outage scheduled for maintenance: Tuesday 9am-4pm. Plan accordingly!",
  "🏥 Free medical outreach this weekend at primary school. Bring your family!",
  "📣 Scholarship opportunity! Apply at ward office before month end. Don't miss!",
  "📢 Water supply: Tanker coming tomorrow morning. Prepare your containers!",
  "🎉 Cultural festival next week! Food, music, dance. Everyone welcome!",
  "📣 Job fair at LGA headquarters next Monday. Graduates come with your CV!",

  // Random relatable
  "Who else no fit sleep because of generator noise from neighbor? Abeg! 😴",
  "This network ehn! Can't even make simple call. All networks dey misbehave!",
  "Petrol price increase again! Na only poor people dey suffer for this country.",
  "Finally found parking space! If you know this area, you know say na achievement 🚗",
  "Power holding don take light when match just dey interesting. Classic! ⚽",
  "That akara woman by the junction, her akara too sweet! Who don taste am?",
  "Rain don start falling. All my clothes dey outside! Who fit help? 😅",
  "Monday morning traffic already giving me high BP. We move still! 💪",
  "Finally weekend! Body need rest after this long week. Happy weekend all!",
  "Neighbors rooster wake me 4am every day. Abeg who get solution? 🐓",
];

// Helper functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRegion(stateName: string): string {
  // Try exact match first
  if (STATE_TO_REGION[stateName]) return STATE_TO_REGION[stateName];

  // Try partial match
  for (const [key, value] of Object.entries(STATE_TO_REGION)) {
    if (stateName.toLowerCase().includes(key.toLowerCase())) return value;
  }

  // Default to Yoruba if not found
  return 'YORUBA';
}

function generateName(region: string): { firstName: string; lastName: string } {
  const names = NAMES_BY_REGION[region] || NAMES_BY_REGION.YORUBA;
  return {
    firstName: getRandomItem(names.firstNames),
    lastName: getRandomItem(names.lastNames)
  };
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${cleanFirst}.${cleanLast}${index}${random}@${getRandomItem(domains)}`;
}

async function main() {
  console.log('========================================');
  console.log('FULL DEMO POSTS SEEDER');
  console.log('========================================\n');
  console.log('⚠️  This will create posts for ALL polling units!');
  console.log('   Expected: ~120,000 polling units');
  console.log('   Creating: 2-3 posts per polling unit');
  console.log('   Total: ~300,000 posts');
  console.log('\n⏱️  Estimated time: 30-60 minutes\n');
  console.log('Starting in 5 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  const startTime = Date.now();
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const genders = [Gender.MALE, Gender.FEMALE];

  // Establish connection
  console.log('🔌 Connecting to database...');
  await prisma.$connect();
  console.log('✓ Connected!\n');

  // Get Nigeria
  const nigeria = await withRetry(async () => {
    return prisma.country.findFirst({ where: { code: 'NG' } });
  });
  if (!nigeria) {
    console.error('❌ Nigeria not found! Run the main seed first.');
    return;
  }

  // Get all states with their full hierarchy
  console.log('📍 Loading location hierarchy...');
  const states = await withRetry(async () => {
    return prisma.state.findMany({
      where: { countryId: nigeria.id },
      include: {
        lgas: {
          include: {
            wards: {
              include: {
                pollingUnits: true
              }
            }
          }
        }
      }
    });
  });

  console.log(`📍 Found ${states.length} states\n`);

  let totalUsers = 0;
  let totalPosts = 0;
  let userBatch: any[] = [];
  let postBatch: any[] = [];

  // Process each state
  for (const state of states) {
    const region = getRegion(state.name);
    console.log(`\n🏛️  Processing ${state.name} (${region})`);
    console.log(`   LGAs: ${state.lgas.length}`);

    let stateUsers = 0;
    let statePosts = 0;

    for (const lga of state.lgas) {
      for (const ward of lga.wards) {
        for (const pu of ward.pollingUnits) {
          // Create 2-3 posts per polling unit
          const numPosts = 2 + Math.floor(Math.random() * 2);

          for (let i = 0; i < numPosts; i++) {
            const name = generateName(region);
            const email = generateEmail(name.firstName, name.lastName, totalUsers);

            // Add user to batch
            userBatch.push({
              email,
              password: hashedPassword,
              firstName: name.firstName,
              lastName: name.lastName,
              displayName: `${name.firstName} ${name.lastName}`,
              isEmailVerified: true,
              isActive: true,
              gender: getRandomItem(genders),
              countryId: nigeria.id,
              stateId: state.id,
              lgaId: lga.id,
              wardId: ward.id,
              pollingUnitId: pu.id,
            });

            totalUsers++;
            stateUsers++;

            // Flush user batch if full
            if (userBatch.length >= USER_BATCH_SIZE) {
              const batchEmails = userBatch.map(u => u.email);

              await withRetry(async () => {
                await prisma.user.createMany({
                  data: userBatch,
                  skipDuplicates: true,
                });
              });

              // Get created users for posts
              const createdUsers = await withRetry(async () => {
                return prisma.user.findMany({
                  where: {
                    email: { in: batchEmails }
                  },
                  select: { id: true, email: true, stateId: true, lgaId: true, wardId: true, pollingUnitId: true }
                });
              });

              // Create posts for these users
              for (const user of createdUsers) {
                postBatch.push({
                  content: getRandomItem(POSTS),
                  authorId: user.id,
                  stateId: user.stateId,
                  lgaId: user.lgaId,
                  wardId: user.wardId,
                  pollingUnitId: user.pollingUnitId,
                  type: 'TEXT',
                  isPublished: true,
                  likeCount: Math.floor(Math.random() * 50),
                  commentCount: Math.floor(Math.random() * 20),
                  shareCount: Math.floor(Math.random() * 10),
                  viewCount: Math.floor(Math.random() * 200),
                });
                totalPosts++;
                statePosts++;
              }

              // Flush post batch if full
              if (postBatch.length >= POST_BATCH_SIZE) {
                await withRetry(async () => {
                  await prisma.post.createMany({ data: postBatch });
                });
                postBatch = [];
              }

              userBatch = [];

              // Progress update
              if (totalPosts % 5000 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                console.log(`   📝 Progress: ${totalPosts.toLocaleString()} posts, ${totalUsers.toLocaleString()} users (${elapsed} mins)`);
              }
            }
          }
        }
      }
    }

    console.log(`   ✓ ${state.name}: ${statePosts.toLocaleString()} posts, ${stateUsers.toLocaleString()} users`);
  }

  // Flush remaining batches
  if (userBatch.length > 0) {
    const batchEmails = userBatch.map(u => u.email);

    await withRetry(async () => {
      await prisma.user.createMany({
        data: userBatch,
        skipDuplicates: true,
      });
    });

    const createdUsers = await withRetry(async () => {
      return prisma.user.findMany({
        where: {
          email: { in: batchEmails }
        },
        select: { id: true, email: true, stateId: true, lgaId: true, wardId: true, pollingUnitId: true }
      });
    });

    for (const user of createdUsers) {
      postBatch.push({
        content: getRandomItem(POSTS),
        authorId: user.id,
        stateId: user.stateId,
        lgaId: user.lgaId,
        wardId: user.wardId,
        pollingUnitId: user.pollingUnitId,
        type: 'TEXT',
        isPublished: true,
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 20),
        shareCount: Math.floor(Math.random() * 10),
        viewCount: Math.floor(Math.random() * 200),
      });
      totalPosts++;
    }
  }

  if (postBatch.length > 0) {
    await withRetry(async () => {
      await prisma.post.createMany({ data: postBatch });
    });
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n========================================');
  console.log('✅ DEMO POSTS SEEDING COMPLETE!');
  console.log('========================================');
  console.log(`\n📊 Summary:`);
  console.log(`   - Users created: ${totalUsers.toLocaleString()}`);
  console.log(`   - Posts created: ${totalPosts.toLocaleString()}`);
  console.log(`   - Time taken: ${totalTime} minutes`);
  console.log(`\n🔑 Demo password for all users: demo123`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
