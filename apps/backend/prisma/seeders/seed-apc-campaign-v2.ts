/**
 * APC Campaign Seeder V2 - Enhanced Localized Political Content
 *
 * Creates realistic APC (All Progressives Congress) campaign data with:
 * - Users with Nigerian names matching their geopolitical zones
 * - Localized political posts appropriate to each location level
 * - Dynamic name references in posts matching the location
 * - Pidgin/English mix for authenticity
 * - Political organizing, campaigns, opposition banter, etc.
 *
 * Usage:
 *   npx ts-node prisma/seeders/seed-apc-campaign-v2.ts
 */

import { PrismaClient, Gender, OrgLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ============================================
// NIGERIAN NAMES BY GEOPOLITICAL ZONE
// ============================================

interface NamesByZone {
  firstNames: { male: string[]; female: string[] };
  lastNames: string[];
  localTitles: { male: string[]; female: string[] };
  localTerms: string[]; // Local greetings/terms
}

const NAMES_BY_ZONE: Record<string, NamesByZone> = {
  SOUTH_WEST: {
    firstNames: {
      male: [
        'Adebayo', 'Oluwaseun', 'Ayodeji', 'Olumide', 'Oluwafemi', 'Babatunde',
        'Adewale', 'Olamide', 'Adeola', 'Kehinde', 'Taiwo', 'Adebola', 'Oluwaseyi',
        'Ayomide', 'Damilare', 'Adeyemi', 'Adekunle', 'Olasunkanmi', 'Temitayo',
        'Oladipo', 'Oluwole', 'Gbenga', 'Segun', 'Kunle', 'Tunde', 'Femi', 'Bayo',
        'Jide', 'Lanre', 'Wale', 'Dele', 'Niyi', 'Biodun', 'Kayode', 'Rotimi',
      ],
      female: [
        'Temitope', 'Funmilayo', 'Titilayo', 'Yetunde', 'Oluwakemi', 'Folake',
        'Bukola', 'Omolara', 'Tolulope', 'Moyosore', 'Morenike', 'Oluwayemisi',
        'Adejoke', 'Boluwatife', 'Adetola', 'Olayinka', 'Oluwatosin', 'Olufunke',
        'Aderonke', 'Adunni', 'Shade', 'Ronke', 'Bimpe', 'Titi', 'Yemi', 'Lola',
        'Bunmi', 'Sade', 'Nike', 'Toyin', 'Bisi', 'Peju', 'Dupe', 'Tope',
      ],
    },
    lastNames: [
      'Ogundimu', 'Adeyemi', 'Bakare', 'Adeleke', 'Oladipo', 'Akinwale', 'Oyelaran',
      'Adegoke', 'Fashola', 'Olowokere', 'Ajayi', 'Ogunyemi', 'Akindele', 'Olusanya',
      'Ogundipe', 'Adekunle', 'Oyeleke', 'Adebisi', 'Oyedepo', 'Afolabi', 'Olayinka',
      'Adeniyi', 'Ogunlana', 'Akintola', 'Odunsi', 'Oyewole', 'Oguntade', 'Ademola',
      'Olatunde', 'Ayodele', 'Ogunleye', 'Ojo', 'Adeoye', 'Onifade', 'Balogun',
    ],
    localTitles: {
      male: ['Baba', 'Chief', 'Alhaji', 'Otunba', 'Baale', 'Oga'],
      female: ['Mama', 'Iya', 'Alhaja', 'Yeye', 'Chief Mrs.'],
    },
    localTerms: ['E kaaro', 'Se daadaa ni', 'Eko o ni baje', 'Omo Eko', 'Ara ilu'],
  },

  NORTH_WEST: {
    firstNames: {
      male: [
        'Abubakar', 'Muhammed', 'Ibrahim', 'Usman', 'Suleiman', 'Abdullahi',
        'Yusuf', 'Bashir', 'Aliyu', 'Ismail', 'Nasiru', 'Kabiru', 'Salisu',
        'Garba', 'Musa', 'Hamza', 'Ahmad', 'Dauda', 'Nuhu', 'Sanusi', 'Bello',
        'Tanimu', 'Shehu', 'Aminu', 'Sadiq', 'Faruk', 'Umar', 'Idris', 'Lawal',
      ],
      female: [
        'Fatima', 'Aisha', 'Zainab', 'Amina', 'Halima', 'Maryam', 'Hafsat',
        'Sadiya', 'Bilkisu', 'Hadiza', 'Rahinatu', 'Hauwa', 'Asmau', 'Salamatu',
        'Khadija', 'Safiya', 'Rukayya', 'Jamila', 'Hassana', 'Firdausi', 'Rabi',
        'Laraba', 'Asabe', 'Binta', 'Zulai', 'Talatu',
      ],
    },
    lastNames: [
      'Abdullahi', 'Bello', 'Danjuma', 'Sani', 'Mohammed', 'Yusuf', 'Ibrahim',
      'Abubakar', 'Shehu', 'Umar', 'Lawal', 'Garba', 'Musa', 'Isah', 'Adamu',
      'Suleiman', 'Aliyu', 'Yakubu', 'Isa', 'Ahmad', 'Idris', 'Tanko', 'Waziri',
      'Dikko', 'Ringim', 'Fagge', 'Gwandu', 'Gusau', 'Bunza',
    ],
    localTitles: {
      male: ['Alhaji', 'Malam', 'Sarkin', 'Dan', 'Baban'],
      female: ['Hajiya', 'Malama', 'Yar', 'Maman'],
    },
    localTerms: ['Sannu', 'Ina kwana', 'Allah ya kara', 'Yauwa', 'Dan uwa'],
  },

  NORTH_EAST: {
    firstNames: {
      male: [
        'Bukar', 'Kyari', 'Modu', 'Shettima', 'Babagana', 'Kashim', 'Grema',
        'Zulum', 'Tijjani', 'Baba', 'Mala', 'Mustapha', 'Bulama', 'Lawan', 'Abba',
        'Goni', 'Kaka', 'Ali', 'Mohammed', 'Usman', 'Ibrahim', 'Yusuf',
      ],
      female: [
        'Falmata', 'Fatima', 'Aisha', 'Zara', 'Hauwa', 'Kaltumi', 'Bintu',
        'Yagana', 'Maimuna', 'Fati', 'Amina', 'Hadiza', 'Zainab', 'Gana',
        'Hussaina', 'Binta', 'Laraba', 'Asabe',
      ],
    },
    lastNames: [
      'Shettima', 'Kyari', 'Bukar', 'Modu', 'Kachallah', 'Mala', 'Zulum',
      'Bama', 'Konduga', 'Gwoza', 'Dikwa', 'Maiduguri', 'Yerwa', 'Kaga',
      'Monguno', 'Ngala', 'Marte', 'Kukawa', 'Mobbar', 'Gubio', 'Jere',
    ],
    localTitles: {
      male: ['Alhaji', 'Malam', 'Shehu', 'Goni', 'Bulama'],
      female: ['Hajiya', 'Malama', 'Nana'],
    },
    localTerms: ['Sannu', 'Ina kwana', 'Nagode', 'Yauwa'],
  },

  NORTH_CENTRAL: {
    firstNames: {
      male: [
        'Danjuma', 'Bulus', 'Yakubu', 'Istifanus', 'Bitrus', 'Danladi', 'Gideon',
        'Sani', 'Peter', 'Samuel', 'Joseph', 'David', 'Moses', 'John', 'James',
        'Daniel', 'Stephen', 'Paul', 'Simon', 'Bawa', 'Adamu', 'Sunday', 'Monday',
        'Emmanuel', 'Clement', 'Patrick', 'Francis', 'Augustine',
      ],
      female: [
        'Ladi', 'Laraba', 'Talatu', 'Jummai', 'Rahila', 'Saratu', 'Deborah',
        'Martha', 'Grace', 'Ruth', 'Esther', 'Hannah', 'Rebecca', 'Mary', 'Sarah',
        'Naomi', 'Lydia', 'Rachel', 'Priscilla', 'Larai', 'Hauwa', 'Zainab',
        'Blessing', 'Comfort', 'Patience', 'Charity', 'Victoria',
      ],
    },
    lastNames: [
      'Dung', 'Chollom', 'Gyang', 'Davou', 'Bot', 'Pam', 'Gotom', 'Dalyop',
      'Mangut', 'Rwang', 'Msen', 'Akiga', 'Iorkaa', 'Tyokyaa', 'Igba', 'Chia',
      'Akaaer', 'Gbor', 'Ukuma', 'Ogbu', 'Onoja', 'Ameh', 'Idoko', 'Okwu',
      'Attah', 'Ocheja', 'Sule', 'Adaji', 'Audu', 'Oche', 'Tiv', 'Agbo',
    ],
    localTitles: {
      male: ['Chief', 'Malam', 'Pastor', 'Elder', 'Baba'],
      female: ['Mama', 'Deaconess', 'Mrs.', 'Maman'],
    },
    localTerms: ['How una dey', 'God bless', 'Na so', 'Make we'],
  },

  SOUTH_EAST: {
    firstNames: {
      male: [
        'Chukwuemeka', 'Obiora', 'Nnamdi', 'Obinna', 'Ikechukwu', 'Uchenna',
        'Chinedu', 'Emeka', 'Kenechukwu', 'Tobenna', 'Chidi', 'Ebuka', 'Uzoma',
        'Kelechi', 'Somto', 'Chukwudi', 'Nzube', 'Lotanna', 'Tochukwu', 'Ekene',
        'Chukwuka', 'Ifeanyi', 'Ugochukwu', 'Chibueze', 'Onyeka', 'Ndubuisi',
        'Okechukwu', 'Chijioke', 'Obiajulu', 'Azubuike',
      ],
      female: [
        'Ngozi', 'Adaeze', 'Chinelo', 'Chiamaka', 'Chidinma', 'Amara', 'Oluchi',
        'Nneka', 'Chioma', 'Ifeoma', 'Adanna', 'Chinyere', 'Nkechi', 'Obianuju',
        'Munachi', 'Onyinye', 'Amarachi', 'Ginika', 'Kosiso', 'Ujunwa', 'Nneoma',
        'Ogechi', 'Chisom', 'Adaora', 'Uju', 'Chika', 'Uche', 'Ada',
      ],
    },
    lastNames: [
      'Okafor', 'Eze', 'Nwosu', 'Okeke', 'Onyeka', 'Nwachukwu', 'Obi', 'Uzoma',
      'Igwe', 'Chukwu', 'Agu', 'Okoro', 'Nwankwo', 'Ibe', 'Okonkwo', 'Aneke',
      'Nnadi', 'Okolie', 'Ogbu', 'Nwafor', 'Ikenna', 'Obasi', 'Emenike', 'Azubuike',
      'Nnamdi', 'Ugwu', 'Onuoha', 'Mbah', 'Ezeji', 'Iwu', 'Anyanwu', 'Uchenna',
    ],
    localTitles: {
      male: ['Chief', 'Nze', 'Ichie', 'Obi', 'Igwe', 'Eze'],
      female: ['Lolo', 'Mrs.', 'Madam', 'Ada', 'Chief Mrs.'],
    },
    localTerms: ['Ndewo', 'Kedu', 'Dalu', 'Nna', 'Nne', 'Umu nna', 'Igbo kwenu'],
  },

  SOUTH_SOUTH: {
    firstNames: {
      male: [
        'Efiong', 'Okon', 'Aniekan', 'Ubong', 'Nsikan', 'Edidiong', 'Aniebiet',
        'Ekom', 'Abasifreke', 'Nseobong', 'Otoabasi', 'Utibe', 'Akpan', 'Ekemini',
        'Mbakara', 'Odudu', 'Bassey', 'Effiom', 'Edet', 'Ita', 'Akaninyene',
        'Anietie', 'Enefiok', 'Ifiok', 'Ime', 'Inyang', 'Kufre', 'Imoh',
      ],
      female: [
        'Ima', 'Idara', 'Emem', 'Mfoniso', 'Uduak', 'Itoro', 'Enobong',
        'Imaobong', 'Ememobong', 'Idongesit', 'Iniobong', 'Ofonime', 'Uyai',
        'Arit', 'Atim', 'Mfon', 'Anwang', 'Ekaette', 'Unwana', 'Afiong',
      ],
    },
    lastNames: [
      'Etim', 'Bassey', 'Ekpo', 'Okon', 'Effiong', 'Udoh', 'Akpan', 'Edet',
      'Udo', 'Essien', 'Inyang', 'Ekong', 'Ita', 'Obot', 'Nse', 'Amos',
      'Offiong', 'Asuquo', 'Umoh', 'Ukpong', 'Archibong', 'Ekanem', 'Inwang',
      'Udofia', 'Umanah', 'Enyong', 'Ntuk', 'Akpabio', 'Ekere', 'Udosen',
    ],
    localTitles: {
      male: ['Chief', 'Obong', 'Etubom', 'Mbre', 'Elder'],
      female: ['Eka', 'Chief Mrs.', 'Madam', 'Mrs.'],
    },
    localTerms: ['Abasi sosongo', 'Emem', 'Ufok', 'Mbok', 'Sosongo'],
  },
};

// Map states to geopolitical zones
const STATE_TO_ZONE: Record<string, string> = {
  // South-West
  'LAGOS': 'SOUTH_WEST', 'OYO': 'SOUTH_WEST', 'OGUN': 'SOUTH_WEST', 'ONDO': 'SOUTH_WEST',
  'EKITI': 'SOUTH_WEST', 'OSUN': 'SOUTH_WEST',
  // North-West
  'KANO': 'NORTH_WEST', 'KADUNA': 'NORTH_WEST', 'KATSINA': 'NORTH_WEST', 'SOKOTO': 'NORTH_WEST',
  'ZAMFARA': 'NORTH_WEST', 'KEBBI': 'NORTH_WEST', 'JIGAWA': 'NORTH_WEST',
  // North-East
  'BORNO': 'NORTH_EAST', 'YOBE': 'NORTH_EAST', 'ADAMAWA': 'NORTH_EAST', 'BAUCHI': 'NORTH_EAST',
  'GOMBE': 'NORTH_EAST', 'TARABA': 'NORTH_EAST',
  // North-Central
  'PLATEAU': 'NORTH_CENTRAL', 'BENUE': 'NORTH_CENTRAL', 'NASARAWA': 'NORTH_CENTRAL',
  'KOGI': 'NORTH_CENTRAL', 'NIGER': 'NORTH_CENTRAL', 'KWARA': 'NORTH_CENTRAL',
  'FCT': 'NORTH_CENTRAL', 'ABUJA': 'NORTH_CENTRAL',
  // South-East
  'ENUGU': 'SOUTH_EAST', 'ANAMBRA': 'SOUTH_EAST', 'IMO': 'SOUTH_EAST', 'ABIA': 'SOUTH_EAST', 'EBONYI': 'SOUTH_EAST',
  // South-South
  'RIVERS': 'SOUTH_SOUTH', 'DELTA': 'SOUTH_SOUTH', 'BAYELSA': 'SOUTH_SOUTH',
  'CROSS RIVER': 'SOUTH_SOUTH', 'AKWA IBOM': 'SOUTH_SOUTH', 'EDO': 'SOUTH_SOUTH',
};

// ============================================
// POST TEMPLATE GENERATORS
// ============================================

type PostGenerator = (zone: string, names: NamesByZone, locationName: string) => string;

// Helper to get random items
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

function getRandomMaleName(names: NamesByZone): string {
  return `${getRandomItem(names.firstNames.male)} ${getRandomItem(names.lastNames)}`;
}

function getRandomFemaleName(names: NamesByZone): string {
  return `${getRandomItem(names.firstNames.female)} ${getRandomItem(names.lastNames)}`;
}

function getRandomTitledMale(names: NamesByZone): string {
  return `${getRandomItem(names.localTitles.male)} ${getRandomItem(names.firstNames.male)}`;
}

function getRandomTitledFemale(names: NamesByZone): string {
  return `${getRandomItem(names.localTitles.female)} ${getRandomItem(names.firstNames.female)}`;
}

// ============================================
// NATIONAL LEVEL POSTS (Elevated, Philosophical)
// ============================================

const NATIONAL_POSTS: PostGenerator[] = [
  () => "Fellow Nigerians, our Renewed Hope agenda is bearing fruit! Under President Tinubu's leadership, we are witnessing transformative policies that will secure our nation's future. APC is the party for progress! 🇳🇬",

  () => "The APC administration has removed fuel subsidy - a bold move that will save trillions for critical infrastructure. Short-term adjustments for long-term prosperity. Our grandchildren will thank us!",

  () => "To all our support groups across the 36 states and FCT: Your dedication to the cause of nation-building is noticed and appreciated. Together, we move Nigeria forward! 💪",

  () => "Important announcement from National Working Committee: All State chapters should intensify grassroots mobilization. 2027 is closer than we think. Let's consolidate our gains!",

  () => "President Bola Ahmed Tinubu's economic reforms are attracting foreign investment. The naira WILL stabilize. Have faith in the process, fellow Nigerians!",

  () => "The opposition ADC thinks they can challenge our structure? They're dreaming! APC has the most robust political machinery in Nigeria. From Ward to National - we are everywhere!",

  () => "Today we celebrate our party's anniversary. From 2015 to now, we have transformed Nigeria's political landscape. This is just the beginning! 🎉",

  () => "National Women Leader's message: Our women wing has been instrumental in securing victories. We are not just supporters - we are leaders! APC women, continue to shine!",

  () => "Youth engagement is key to our continued success. To the APC Youth Wing: You are not the future - you are the present. Your voice matters in our party!",

  () => "Security improvements continue across the nation. Banditry is reducing, farms are returning to productivity. The Renewed Hope agenda is working!",

  () => "Education reform is coming. Student loans implementation, improved ASUU engagement, better infrastructure. APC delivers on its promises! 📚",

  () => "Infrastructure development: Lagos-Calabar coastal highway, Sokoto-Badagry highway - these are not just roads, they're corridors of prosperity!",

  () => "To those spreading fake news about our government: We will not be distracted. Our focus is on building a Nigeria that works for all citizens!",

  () => "The merger that created APC in 2013 was the best political decision in Nigeria's history. Unity in diversity - that's our strength! One Nigeria!",

  () => "As we approach 2027, let's remember why we chose this path. A prosperous, united, and progressive Nigeria. That's the APC promise! Forward ever!",

  () => "President Tinubu's cabinet is working tirelessly. From Agriculture to Technology, every sector is getting attention. Results will speak louder than critics!",

  () => "INEC has commended our party for internal democracy. When others are fighting, we are building. That's the APC difference!",

  () => "To our teeming supporters in the diaspora: Your remittances and support are valued. Nigeria's development is a collective effort. Thank you! 🌍",
];

// ============================================
// STATE LEVEL POSTS (Coordination, State Issues)
// ============================================

const STATE_POSTS: PostGenerator[] = [
  (zone, names) => `State Executive Committee meeting tomorrow at the Secretariat, 10am sharp. All LGA chairmen must attend. ${getRandomTitledMale(names)} will be presiding. Important directives from National!`,

  (zone, names, locationName) => `Congratulations to ${locationName} State on the successful conduct of local council elections! APC swept the board - this is the people's mandate! ${getRandomTitledMale(names)} has shown excellent leadership.`,

  (zone, names) => `Fellow party members: Let's maintain unity. Any disputes should be resolved through party mechanisms, not social media. We are one family! ${getRandomTitledFemale(names)} has been appointed to head reconciliation committee.`,

  (zone, names) => `State Women's Conference coming up next month. All LGA Women Leaders should submit their delegates list. ${getRandomTitledFemale(names)} is coordinating. Big things coming! 💪`,

  (zone, names, locationName) => `Our governor's achievements in 100 days: New roads, hospital equipment, bursary for students. This is what APC governance looks like in ${locationName}!`,

  (zone, names) => `To all Ward coordinators: Membership revalidation exercise continues. Ensure all members in your ward are captured. ${getRandomMaleName(names)} from State Secretariat will assist.`,

  () => "The opposition ADC is trying to poach our members with false promises. Stay firm! Remember who brought development to this state - APC! Don't be deceived!",

  (zone, names) => `State Youth Wing rally this Saturday at the Township Stadium. All LGA Youth Leaders should mobilize at least 200 youths each. ${getRandomMaleName(names)} is the rally coordinator.`,

  (zone, names, locationName) => `Our ${locationName} State chapter is leading in membership drive. Over 500,000 new members this quarter alone! Thank you for believing in the APC vision!`,

  (zone, names) => `Important: All aspirants for upcoming council elections should collect forms at State Secretariat. ${getRandomFemaleName(names)} at the admin office will assist. Deadline is next week Friday!`,

  (zone, names) => `Governor's visit to LGAs today was successful! He promised more development projects. Special thanks to ${getRandomTitledMale(names)} for the excellent coordination.`,

  (zone, names) => `State caucus has resolved the leadership tussle in some LGAs. ${getRandomTitledMale(names)} led the mediation. Party supremacy prevails. Let's move forward!`,

  (zone, names) => `Training workshop for polling unit agents next Monday at State Secretariat. ${getRandomFemaleName(names)} is the resource person. All LGA coordinators should nominate 50 persons each.`,

  (zone, names, locationName) => `The President visited ${locationName} and commissioned three projects! Federal presence is real with APC in power at all levels! This is development!`,

  (zone, names, locationName) => `To the good people of ${locationName} State: Thank you for your continued support. 2027, we go again! APC all the way! Forward ever!`,
];

// ============================================
// LGA LEVEL POSTS (Local Coordination)
// ============================================

const LGA_POSTS: PostGenerator[] = [
  (zone, names) => `LGA Executive meeting this Friday by 4pm at the Council Secretariat. All ward chairmen should attend with their secretaries. ${getRandomTitledMale(names)} will address us. Refreshments will be served! 🍽️`,

  (zone, names) => `Congratulations to all our councillors-elect! Special mention to ${getRandomMaleName(names)} and ${getRandomFemaleName(names)}. You represent the will of the people. Serve with integrity!`,

  (zone, names) => `Ward tour begins next week. ${getRandomTitledMale(names)} will visit all wards to assess our readiness for elections. Prepare your reports and membership lists!`,

  (zone, names) => `The LGA chairman ${getRandomTitledMale(names)} has approved N500,000 for each ward for member welfare programs. Collect from the treasury before month end.`,

  (zone, names) => `To all our teeming supporters in this LGA: Your loyalty is not forgotten. ${getRandomTitledFemale(names)} is coordinating the appreciation program. When we share, everyone will benefit. APC for all!`,

  (zone, names) => `Stakeholders meeting with traditional rulers tomorrow. We need their continued support. ${getRandomTitledMale(names)} and ${getRandomTitledFemale(names)} will represent the party. Attendance is mandatory for all excos!`,

  (zone, names) => `Market women association led by ${getRandomTitledFemale(names)} visited the secretariat to pledge support. Women are the backbone of our party. We appreciate you! 🙏`,

  (zone, names) => `Youth empowerment program: 50 beneficiaries from this LGA selected for skills acquisition. ${getRandomMaleName(names)} coordinated the selection. APC cares for the youth!`,

  (zone, names) => `Dispute between Ward 3 and Ward 7 has been resolved amicably by ${getRandomTitledMale(names)}. No victor, no vanquished. We are stronger together!`,

  () => "The opposition is weak in this LGA. Let's keep it that way! ADC has nothing to offer. Continue the good work in your various wards. Victory is certain!",

  (zone, names) => `Contribution for the upcoming rally: N5,000 per ward. Submit to the LGA treasurer ${getRandomMaleName(names)} before Friday. Let's make it a grand event!`,

  (zone, names) => `Agricultural support: Fertilizers arriving next week. ${getRandomTitledMale(names)} facilitated this from the Ministry. All registered farmers in party wards should submit names.`,

  (zone, names) => `Road rehabilitation project in Wards 2, 5, and 8 - directly facilitated by ${getRandomTitledMale(names)} our LGA chairman. This is what APC does!`,

  (zone, names) => `Emergency meeting called for tomorrow 2pm. Matter affecting the party. ${getRandomTitledMale(names)} says all ward leaders must attend. No excuses!`,

  (zone, names) => `Welfare packages ready for distribution. ${getRandomTitledFemale(names)} is coordinating. Each ward gets 100 bags of rice and 50 cartons of oil. Collect and share fairly!`,
];

// ============================================
// WARD LEVEL POSTS (Mobilization, Local Activities)
// ============================================

const WARD_POSTS: PostGenerator[] = [
  (zone, names) => `Brothers and sisters of this ward, meeting tonight at 7pm by ${getRandomTitledMale(names)}'s compound. We need to discuss the upcoming rally. Everyone must come o!`,

  (zone, names) => `Tomorrow we go house-to-house! Meet at the market junction by 8am with your APC caps and t-shirts. ${getRandomMaleName(names)} and ${getRandomFemaleName(names)} will lead the teams.`,

  (zone, names) => `Congrats to ${getRandomTitledFemale(names)} for her new appointment as Ward Women Leader! She has worked hard for the party. Well deserved! 👏`,

  (zone, names) => `The youth in this ward have shown remarkable commitment. Special recognition to ${getRandomMaleName(names)}'s team for painting the party secretariat free of charge!`,

  (zone, names) => `Those that collected forms and haven't returned them - this is final reminder. Return to ${getRandomMaleName(names)} before weekend or your slot goes to someone else!`,

  () => "ADC people dem dey try campaign for our ward. Make we show dem say na APC territory here! Wear your party colors every day! No dulling!",

  (zone, names) => `Small palava between ${getRandomTitledMale(names)}'s group and the youth wing don settle. Na one family we be. Make we focus on the election!`,

  (zone, names) => `Polling unit agents training tomorrow at Primary School hall. ${getRandomMaleName(names)} is the trainer. All selected agents must attend. Bring writing materials!`,

  (zone, names) => `Contribution time! N200 per member for campaign materials. See ${getRandomMaleName(names)} or ${getRandomFemaleName(names)} to submit. Every kobo counts!`,

  () => "Our ward target is 2,000 votes for the gubernatorial candidate. Last time we delivered 1,800. Make we exceed expectations this time! We fit do am!",

  (zone, names) => `Meeting with the village head confirmed for Sunday after service. ${getRandomTitledMale(names)} will lead the delegation. We need his blessing for our activities.`,

  (zone, names) => `Women meeting every Thursday at 4pm by ${getRandomTitledFemale(names)}'s place will continue. All our women supporters should attend. Unity is strength!`,

  (zone, names) => `Thanks to everyone that attended the rally yesterday! We were the most colorful ward there. LGA chairman ${getRandomTitledMale(names)} specially commended us! 🎉`,

  (zone, names) => `Food items from the party: Rice, beans, and oil for distribution. Come to ${getRandomTitledMale(names)}'s house tomorrow evening with your membership card.`,

  (zone, names) => `Youths! Football match against Ward 5 this Saturday. ${getRandomMaleName(names)} is the captain. After the game, we will discuss party matters. Sports and politics na 5 and 6! ⚽`,

  () => "E get reason why APC dey win for this ward every time - na because we dey united! Make we continue like that. No division! One ward, one voice!",

  (zone, names) => `${getRandomTitledMale(names)} don provide transport money for the State rally on Saturday. N1,500 per person. Register with the secretary ${getRandomFemaleName(names)}!`,

  (zone, names) => `Problem with that opposition woman spreading lies about our party don solve. ${getRandomTitledFemale(names)} talk to her and she don understand. Dialogue works!`,

  (zone, names) => `Candidates' visitation to our ward next week. ${getRandomMaleName(names)} and ${getRandomFemaleName(names)}, organize cleaning of the environment. Prepare songs. Let's show them we mean business!`,

  (zone, names) => `Volunteers needed for door-to-door campaign. Young, energetic people like ${getRandomMaleName(names)} and friends. We go pay transport and give lunch. Register now!`,
];

// ============================================
// POLLING UNIT LEVEL POSTS (Very Local, Intimate, Pidgin Mix)
// ============================================

const POLLING_UNIT_POSTS: PostGenerator[] = [
  (zone, names) => `My people of this unit, how una dey? Tomorrow morning make we meet for ${getRandomTitledFemale(names)} shop to plan our activities. 8am sharp!`,

  (zone, names) => `Agent training don finish! Kudos to ${getRandomMaleName(names)}, ${getRandomTitledFemale(names)}, and ${getRandomMaleName(names)} wey go represent us on election day. We trust una!`,

  (zone, names) => `Na only 350 registered voters we get for this unit. We must deliver 300 minimum! ${getRandomMaleName(names)} say house to house na the strategy!`,

  (zone, names) => `Abeg who still never collect PVC? This week Friday na final collection date. ${getRandomFemaleName(names)} can help you check your status. No PVC, no vote!`,

  (zone, names) => `Thank you to ${getRandomTitledMale(names)} for the umbrella for our makeshift secretariat. God go bless you and your family! Small small, we dey build! 🙏`,

  (zone, names) => `Meeting tonight by 8pm for ${getRandomTitledMale(names)}'s place. ${getRandomMaleName(names)} say na serious matter! Election just dey corner, make we no sleep!`,

  (zone, names) => `${getRandomTitledFemale(names)} don agree to cook food for our campaign team! All the women wey wan help, meet her tomorrow morning. God bless her!`,

  () => "ADC people come try talk their rubbish for our area yesterday. We politely told them say dem waste their time. This na APC fortress! No shaking!",

  (zone, names) => `Oya now, who get extra party flag or banner? The one wey we hang for junction don tear. See ${getRandomMaleName(names)} if you fit help!`,

  (zone, names) => `Registration of new members: If you know anybody wey ready to join APC, bring them come meet ${getRandomMaleName(names)}. More members = more power!`,

  (zone, names) => `Contribution of N100 per person for our agent's welfare on election day. See ${getRandomTitledFemale(names)} to submit. No amount too small! 💰`,

  (zone, names) => `Bros ${getRandomItem(names.firstNames.male)}, your matter don settle o! No more quarrel with the youth leader. Una be brothers. Party first!`,

  (zone, names) => `Reminder: Our polling unit get 4 voting points. Agent assignment - Point A: ${getRandomMaleName(names)}, B: ${getRandomFemaleName(names)}, C: ${getRandomMaleName(names)}, D: ${getRandomFemaleName(names)}. Confirm!`,

  () => "Tonight prayer/devotion meeting for our polling unit. Both Muslims and Christians welcome. We dey pray for peaceful elections and APC victory! 🙏",

  (zone, names) => `The Total filling station go be our meeting point on election day morning. ${getRandomMaleName(names)} say from there, we march to the polling booth together!`,

  (zone, names) => `Who still dey find agent appointment? One slot remain for this unit. Must be somebody wey sabi write and count. Talk to ${getRandomMaleName(names)}!`,

  (zone, names) => `Shoutout to the barber boys especially ${getRandomMaleName(names)} for free haircut to party members before the rally! That's the spirit. APC first! ✂️`,

  (zone, names) => `${getRandomTitledFemale(names)} just born baby boy! Congratulations to her and the family. When she recover, we go organize small naming ceremony for am. 👶`,

  (zone, names) => `VERY IMPORTANT: Movement of result sheet from polling unit to collation center - we need 10 volunteers. ${getRandomMaleName(names)} is coordinating. Security matter!`,

  () => "After election, we go do small party for all of us wey work hard. Celebrate our victory. But first, let's deliver the votes! No gree for anybody!",

  () => "Opposition dey promise heaven and earth. Ask them: wetin dem don do before? Nothing! APC dey show work, no be mouth talk. Facts over fiction!",

  () => "Wetin concern us with their ADC? Dem never even organize one single meeting for this area. We dey ground, dem dey cloud! APC forever!",

  (zone, names) => `Special thanks to ${getRandomTitledMale(names)}, ${getRandomFemaleName(names)}, and everybody wey contribute for campaign materials. We don print posters and flyers. Collection starts today!`,

  () => "Make person no come fight for here o! We be one family. Any misunderstanding, we settle am inside. Party first! Unity na power!",

  (zone, names) => `Tomorrow na our turn to clean the party secretariat. Youth volunteers, especially ${getRandomMaleName(names)} and team, show up by 7am with broom and mop!`,

  () => "President Tinubu achievement wey we go highlight: Fuel subsidy removal saving money for infrastructure, student loans, minimum wage increase. Facts only!",

  (zone, names) => `For those asking about the promised grinding machine - ${getRandomTitledMale(names)} say it will come after elections. For now, focus on the campaign!`,

  (zone, names) => `${getRandomTitledMale(names)} don donate his shop front for us to use as information point. Volunteers wey wan sit there, register with ${getRandomFemaleName(names)}!`,

  (zone, names) => `Night patrol schedule: Monday - ${getRandomMaleName(names)} team, Wednesday - ${getRandomMaleName(names)} team, Friday - ${getRandomMaleName(names)} team. Keep our area safe!`,

  () => "Na we go decide who become Senator, Governor, President! Our vote matter. Make everybody come out on election day! Your vote is your power!",
];

// ============================================
// ADDITIONAL POST CATEGORIES
// ============================================

// Disagreements and Resolutions
const DISAGREEMENT_POSTS: PostGenerator[] = [
  (zone, names) => `I think we should focus more on women empowerment in this ward. ${getRandomMaleName(names)} disagrees but I stand by my position. Let's discuss tomorrow!`,

  (zone, names) => `The issue of who becomes polling agent should be merit-based, not by connection! ${getRandomMaleName(names)} has raised this in our meeting. Fair point!`,

  (zone, names) => `Some people dey hoard party materials for this unit. ${getRandomTitledFemale(names)} say everything should be shared equally. I don report to ward chairman!`,

  (zone, names) => `${getRandomTitledMale(names)}'s complaint about being sidelined don reach my ears. Please, let's carry everyone along. No exclusion in our unit!`,

  (zone, names) => `Youth leader ${getRandomMaleName(names)} and women leader ${getRandomTitledFemale(names)} had small misunderstanding. I'm calling mediation meeting tomorrow. We must resolve this!`,

  (zone, names) => `The allocation of rice was not fair last time. ${getRandomFemaleName(names)} propose we create transparent committee for future distributions. Good idea!`,

  (zone, names) => `Why some wards dey get more attention than others? ${getRandomMaleName(names)} say we contributed equally to party fund. Chairman should address this!`,

  (zone, names) => `I disagree with the strategy of night campaigns. ${getRandomFemaleName(names)} say it's dangerous. Let's focus on daytime door-to-door. Safety first!`,

  (zone, names) => `The financial report for last quarter is unclear. As a member, ${getRandomMaleName(names)} say we deserve to know how contributions were spent. Transparency!`,

  (zone, names) => `Reconciliation meeting was successful! ${getRandomTitledMale(names)} mediated. All parties have agreed to work together. Unity restored! APC above personal interests! ✌️`,
];

// Donation and Material Requests
const DONATION_POSTS: PostGenerator[] = [
  (zone, names) => `Call for donations! We need canopies for the ward rally. ${getRandomTitledMale(names)} and ${getRandomFemaleName(names)}, can you help? Contact the secretary.`,

  (zone, names) => `Urgent: Sound system needed for Saturday's campaign. ${getRandomTitledMale(names)}, can we borrow yours? We will return in perfect condition!`,

  (zone, names) => `Special thanks to ${getRandomTitledMale(names)} for donating 50 bags of pure water for our last campaign. May God/Allah bless him abundantly! 🙏`,

  (zone, names) => `Campaign vehicle needed! ${getRandomMaleName(names)} has a pickup but we need more. If you have truck or bus for mobilization, fuel will be provided!`,

  (zone, names) => `Printing cost for 1000 flyers is N15,000. We've raised N8,000 through ${getRandomFemaleName(names)}. Need N7,000 more. Every N100 helps!`,

  (zone, names) => `${getRandomTitledFemale(names)} just donated 2 coolers of zobo and puff puff for the meeting tonight! God bless her business! 🍹`,

  (zone, names) => `Generator for the secretariat needed. The one we have don spoil. ${getRandomMaleName(names)} is looking for fairly-used one. Who fit help?`,

  (zone, names) => `Appreciation to ${getRandomMaleName(names)} for repairing our megaphone free of charge! That's the APC spirit - selfless service! 👏`,

  (zone, names) => `Materials we need for election day: Umbrellas (10), chairs (20), table (5). ${getRandomTitledFemale(names)} is coordinating. Volunteers to provide, come forward!`,

  (zone, names) => `${getRandomTitledMale(names)} has promised to provide lunch for all our agents on election day. A true patriot! May God prosper your business! 🍛`,
];

// Volunteer and Agent Recruitment
const VOLUNTEER_POSTS: PostGenerator[] = [
  (zone, names) => `URGENT: We need 5 more polling agents for this unit. Requirements: Must be a registered voter, literate, patient. See ${getRandomMaleName(names)} to apply!`,

  (zone, names) => `Calling all youths! Volunteer for door-to-door campaign. ${getRandomMaleName(names)} needs your energy and enthusiasm. Register with the Youth Leader!`,

  (zone, names) => `Women volunteers needed for market sensitization every Tuesday and Friday. ${getRandomTitledFemale(names)} is coordinating. If you can spare 2 hours, join us!`,

  (zone, names) => `Transport volunteers with bikes or cars - we need your help on rally days. ${getRandomMaleName(names)} says fuel will be reimbursed. Sign up!`,

  (zone, names) => `Social media volunteers! If you can post, share, and engage online, ${getRandomFemaleName(names)} needs you. Digital campaign is important too! 📱`,

  (zone, names) => `Cooks and servers needed for stakeholders meeting. ${getRandomTitledFemale(names)} is coordinating the women's wing. 50 guests expected!`,

  (zone, names) => `Security volunteers for the ward secretariat. Night shift available. ${getRandomMaleName(names)} says small stipend provided. Serious persons only!`,

  (zone, names) => `Voter education volunteers - help your neighbors understand the voting process. ${getRandomFemaleName(names)} will provide training!`,

  (zone, names) => `Music and entertainment team for rally - if you can drum, dance, or sing, join ${getRandomMaleName(names)}'s mobilization squad! 🎵`,

  (zone, names) => `Logistics volunteers needed - help with setting up venues, arranging chairs, decorating. ${getRandomMaleName(names)} needs strong, able-bodied persons!`,
];

// Meeting Calls
const MEETING_POSTS: PostGenerator[] = [
  (zone, names) => `MEETING ALERT: Ward executive meeting tomorrow 5pm at ${getRandomTitledMale(names)}'s place. All excos must attend. No representative accepted!`,

  (zone, names) => `Emergency meeting tonight 8pm! ${getRandomTitledMale(names)} has important information from LGA. Drop whatever you're doing and come!`,

  (zone, names) => `Women's wing meeting postponed to next Thursday due to ${getRandomTitledFemale(names)}'s family event. Accept our congratulations to the family!`,

  (zone, names) => `Youth meeting every Sunday by 4pm at ${getRandomMaleName(names)}'s center will resume. All youth members should attend. Bring a friend!`,

  (zone, names) => `Stakeholders meeting with House of Reps candidate this Friday. ${getRandomTitledMale(names)} says all unit leaders should attend with 3 followers each.`,

  (zone, names) => `Monthly general meeting holds next Saturday 10am at ${getRandomTitledMale(names)}'s compound. Attendance is COMPULSORY. Absentees will explain to disciplinary committee!`,

  (zone, names) => `Special meeting to resolve the zoning issue. ${getRandomTitledMale(names)} wants all aspirants and their supporters to come with open minds!`,

  () => "Prayer meeting before the election - Muslims at Juma'at mosque 2pm, Christians at the church 3pm. Same purpose: APC victory and peaceful elections! 🙏",

  (zone, names) => `Strategy meeting for the final week of campaigns. Only inner caucus members. ${getRandomTitledMale(names)} will communicate venue privately.`,

  (zone, names) => `Feedback meeting after the election. Win or learn, we will review our performance. ${getRandomMaleName(names)} says all members should attend!`,
];

// Tinubu Achievement Posts
const ACHIEVEMENT_POSTS: PostGenerator[] = [
  () => "Na fact: President Tinubu increased minimum wage to N70,000. Opposition dey shout but workers dey smile. APC delivers! 💰",

  () => "Student loan bill signed into law! Our children can now access education without financial burden. This na legacy! Thank you BAT! 📚",

  () => "CNG conversion program for vehicles - cheaper fuel alternative. Tinubu is thinking long-term while critics only see short-term. Visionary leadership!",

  () => "Foreign direct investment increasing! Companies are coming to Nigeria because of Tinubu's reforms. The economy WILL bounce back!",

  () => "Removal of multiple exchange rates - now we have unified forex. Short-term pain, long-term gain. Economists agree this is the right path!",

  () => "Agricultural sector getting attention! Fertilizer subsidy reaching farmers directly. Food security is priority. APC cares for farmers! 🌾",

  () => "Federal roads being fixed across the country. Lagos-Ibadan, Abuja-Kaduna, Port Harcourt-Aba. Infrastructure development is real!",

  () => "Healthcare improvements: More doctors being recruited, equipment for hospitals. President Tinubu is investing in our health! 🏥",

  () => "Oil sector reforms attracting investment. Production increasing. Nigeria's economy depends on this and APC is handling it well!",

  () => "Security operations yielding results. Bandits being neutralized daily. Our military is getting support they need. Peace is returning!",
];

// Opposition Banter
const OPPOSITION_POSTS: PostGenerator[] = [
  () => "ADC think say na only to shout 'change' dem go win? Where their structure? Where their grassroots? Nothing! APC is everywhere!",

  () => "The opposition still dey dream of 2027. Meanwhile APC don already start campaigns for polling units. We no dey sleep! 😂",

  () => "When ADC people come to your area, ask them: what is your manifesto? Watch them stutter! No plan, no vision, just noise!",

  () => "Opposition dey use social media to spread lies. But on ground, na APC dey. Twitter no be reality. Polling unit is reality!",

  () => "They said APC will lose. We won! They said we can't govern. We are governing! They say 2027... we will show them again! 💪",

  () => "ADC leader wey no fit even win his own ward dey talk about presidency. Comedy! Focus on your polling unit first! 😂",

  () => "The opposition is so weak, dem dey fight themselves. PDP remnants vs new parties. Meanwhile APC dey focused on development!",

  () => "When last ADC hold rally in your LGA? Can't remember? Me too! Because they don't exist on ground. APC owns the grassroots!",

  () => "Opposition think insults and fake news go win election. We use development and good governance. Let's see who wins!",

  () => "I pity ADC supporters. Their leaders collect money from them and deliver nothing. APC leaders at least bring projects to our areas!",
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getZone(stateName: string): string {
  const upperName = stateName.toUpperCase().replace(/\s+/g, ' ').trim();
  if (STATE_TO_ZONE[upperName]) return STATE_TO_ZONE[upperName];
  for (const [key, value] of Object.entries(STATE_TO_ZONE)) {
    if (upperName.includes(key) || key.includes(upperName)) return value;
  }
  return 'SOUTH_WEST';
}

function generateName(zone: string, gender: 'male' | 'female'): { firstName: string; lastName: string } {
  const names = NAMES_BY_ZONE[zone] || NAMES_BY_ZONE.SOUTH_WEST;
  return {
    firstName: getRandomItem(names.firstNames[gender]),
    lastName: getRandomItem(names.lastNames),
  };
}

function generateUsername(firstName: string, lastName: string): string {
  const random = Math.floor(Math.random() * 9999);
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${random}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${cleanFirst}.${cleanLast}.apc${index}${random}@${getRandomItem(domains)}`;
}

function getPostsForLevel(level: 'NATIONAL' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT'): PostGenerator[] {
  switch (level) {
    case 'NATIONAL':
      return [...NATIONAL_POSTS, ...ACHIEVEMENT_POSTS, ...OPPOSITION_POSTS];
    case 'STATE':
      return [...STATE_POSTS, ...ACHIEVEMENT_POSTS.slice(0, 3)];
    case 'LGA':
      return [...LGA_POSTS, ...MEETING_POSTS.slice(0, 3)];
    case 'WARD':
      return [...WARD_POSTS, ...VOLUNTEER_POSTS, ...MEETING_POSTS];
    case 'POLLING_UNIT':
      return [
        ...POLLING_UNIT_POSTS,
        ...DISAGREEMENT_POSTS,
        ...DONATION_POSTS,
        ...VOLUNTEER_POSTS,
        ...MEETING_POSTS,
        ...OPPOSITION_POSTS.slice(0, 5),
      ];
  }
}

function generatePost(
  level: 'NATIONAL' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT',
  zone: string,
  locationName: string
): string {
  const generators = getPostsForLevel(level);
  const generator = getRandomItem(generators);
  const names = NAMES_BY_ZONE[zone] || NAMES_BY_ZONE.SOUTH_WEST;
  return generator(zone, names, locationName);
}

// Helper to execute with retry
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = error?.code === 'P1017' || error?.code === 'P1001' || error?.code === 'P1002';
      if (isConnectionError && attempt < maxRetries) {
        console.log(`   ⚠️  Connection error, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        await prisma.$disconnect();
        await prisma.$connect();
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================
// MAIN SEEDER
// ============================================

async function main() {
  console.log('========================================');
  console.log('APC CAMPAIGN SEEDER V2');
  console.log('Enhanced Localized Political Content');
  console.log('========================================\n');

  const startTime = Date.now();
  const hashedPassword = await bcrypt.hash('apc2027', 10);
  const genders: Gender[] = [Gender.MALE, Gender.FEMALE];

  console.log('🔌 Connecting to database...');
  await prisma.$connect();
  console.log('✓ Connected!\n');

  // ============================================
  // STEP 1: CLEAR EXISTING DATA
  // ============================================
  console.log('🧹 Clearing existing posts and related data...');

  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.share.deleteMany({});
  await prisma.post.deleteMany({});

  console.log('✓ Posts cleared!\n');

  // Clear existing APC organizations
  console.log('🧹 Clearing existing APC organizations...');
  const existingApcOrgs = await prisma.organization.findMany({
    where: {
      OR: [
        { slug: { startsWith: 'apc-' } },
        { inviteCode: 'APC' },
      ],
    },
    select: { id: true },
  });

  if (existingApcOrgs.length > 0) {
    const orgIds = existingApcOrgs.map(o => o.id);
    await prisma.orgMembership.deleteMany({ where: { orgId: { in: orgIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    console.log(`   Deleted ${existingApcOrgs.length} existing APC organizations`);
  }

  // Delete seeded users
  console.log('🧹 Clearing seeded APC users...');
  await prisma.user.deleteMany({ where: { email: { contains: '.apc' } } });
  console.log('✓ Users cleared!\n');

  // ============================================
  // STEP 2: GET NIGERIA AND LOCATIONS
  // ============================================
  console.log('📍 Loading location hierarchy...');

  const nigeria = await prisma.country.findFirst({ where: { code: 'NG' } });
  if (!nigeria) {
    console.error('❌ Nigeria not found! Run: yarn prisma:seed --full-locations');
    return;
  }

  const states = await prisma.state.findMany({
    where: { countryId: nigeria.id },
    include: {
      lgas: {
        include: {
          wards: {
            include: {
              pollingUnits: true,
            },
          },
        },
      },
    },
  });

  console.log(`✓ Found ${states.length} states\n`);

  if (states.length === 0) {
    console.error('❌ No states found! Run: yarn prisma:seed --full-locations');
    return;
  }

  // ============================================
  // STEP 3: GET OR CREATE PLATFORM ADMIN
  // ============================================
  console.log('👤 Setting up Platform Admin...');

  let platformAdmin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });

  if (!platformAdmin) {
    platformAdmin = await prisma.user.create({
      data: {
        email: 'platform@mobilizer.ng',
        password: hashedPassword,
        firstName: 'Platform',
        lastName: 'Admin',
        displayName: 'Platform Admin',
        isEmailVerified: true,
        isPlatformAdmin: true,
        countryId: nigeria.id,
        gender: Gender.MALE,
      },
    });
    console.log('   Created Platform Admin');
  } else {
    console.log('   Using existing Platform Admin');
  }

  // ============================================
  // STEP 4: CREATE APC MOVEMENT
  // ============================================
  console.log('\n🏛️ Creating APC Movement...');

  let apcMovement = await prisma.movement.findFirst({ where: { slug: 'apc-national' } });

  if (!apcMovement) {
    apcMovement = await prisma.movement.create({
      data: {
        name: 'All Progressives Congress',
        slug: 'apc-national',
        description: 'The All Progressives Congress (APC) is the ruling political party in Nigeria, with President Bola Ahmed Tinubu at the helm.',
        isActive: true,
        createdById: platformAdmin.id,
      },
    });

    await prisma.movementWallet.create({
      data: {
        movementId: apcMovement.id,
        balance: 10000000,
        ledgerBalance: 10000000,
        status: 'ACTIVE',
      },
    });
  }

  console.log('✓ APC Movement ready:', apcMovement.name);

  // ============================================
  // STEP 5: CREATE SINGLE APC ORGANIZATION
  // ============================================
  console.log('\n🏢 Creating APC Organization...');

  const apcOrg = await prisma.organization.create({
    data: {
      name: 'All Progressives Congress',
      slug: 'apc-national-hq',
      description: 'All Progressives Congress - The ruling party of the Federal Republic of Nigeria. Join with invite code: APC',
      level: OrgLevel.NATIONAL,
      movementId: apcMovement.id,
      isVerified: true,
      isActive: true,
      countryId: nigeria.id,
      inviteCode: 'APC',
      memberCount: 0,
    },
  });

  console.log('✓ Organization created:', apcOrg.name);
  console.log('   Invite Code:', apcOrg.inviteCode);

  // ============================================
  // STEP 6: CREATE USERS AND POSTS
  // ============================================
  console.log('\n📝 Creating users and posts by location level...\n');

  let totalUsers = 0;
  let totalPosts = 0;
  let totalMemberships = 0;

  // National level users and posts
  console.log('🌍 Creating national level content...');

  for (let i = 0; i < 8; i++) {
    const zone = getRandomItem(Object.keys(NAMES_BY_ZONE));
    const gender = getRandomItem(['male', 'female'] as const);
    const name = generateName(zone, gender);
    const email = generateEmail(name.firstName, name.lastName, totalUsers);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name.firstName,
        lastName: name.lastName,
        displayName: `${name.firstName} ${name.lastName}`,
        username: generateUsername(name.firstName, name.lastName),
        isEmailVerified: true,
        countryId: nigeria.id,
        gender: gender === 'male' ? Gender.MALE : Gender.FEMALE,
      },
    });

    await prisma.orgMembership.create({
      data: {
        userId: user.id,
        orgId: apcOrg.id,
        isAdmin: i < 2,
        approvedAt: new Date(),
      },
    });
    totalMemberships++;

    // Create national posts
    const numPosts = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numPosts; j++) {
      const content = generatePost('NATIONAL', zone, 'Nigeria');
      await prisma.post.create({
        data: {
          content,
          authorId: user.id,
          orgId: apcOrg.id,
          locationLevel: 'NATIONAL',
          countryId: nigeria.id,
          type: 'TEXT',
          isPublished: true,
          likeCount: Math.floor(Math.random() * 500),
          commentCount: Math.floor(Math.random() * 100),
          viewCount: Math.floor(Math.random() * 5000),
        },
      });
      totalPosts++;
    }
    totalUsers++;
  }
  console.log(`   ✓ National: ${totalUsers} users, ${totalPosts} posts`);

  // Process each state
  for (const state of states) {
    const zone = getZone(state.name);
    console.log(`\n🏛️ Processing ${state.name} (${zone})`);

    let stateUsers = 0;
    let statePosts = 0;

    // State level users (4-6)
    const numStateUsers = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numStateUsers; i++) {
      const gender = getRandomItem(['male', 'female'] as const);
      const name = generateName(zone, gender);
      const email = generateEmail(name.firstName, name.lastName, totalUsers);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: name.firstName,
          lastName: name.lastName,
          displayName: `${name.firstName} ${name.lastName}`,
          username: generateUsername(name.firstName, name.lastName),
          isEmailVerified: true,
          countryId: nigeria.id,
          stateId: state.id,
          gender: gender === 'male' ? Gender.MALE : Gender.FEMALE,
        },
      });

      await prisma.orgMembership.create({
        data: {
          userId: user.id,
          orgId: apcOrg.id,
          isAdmin: false,
          approvedAt: new Date(),
        },
      });
      totalMemberships++;

      // State posts
      const numPosts = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numPosts; j++) {
        const content = generatePost('STATE', zone, state.name);
        await prisma.post.create({
          data: {
            content,
            authorId: user.id,
            orgId: apcOrg.id,
            stateId: state.id,
            countryId: nigeria.id,
            locationLevel: 'STATE',
            type: 'TEXT',
            isPublished: true,
            likeCount: Math.floor(Math.random() * 200),
            commentCount: Math.floor(Math.random() * 50),
            viewCount: Math.floor(Math.random() * 1000),
          },
        });
        statePosts++;
        totalPosts++;
      }
      stateUsers++;
      totalUsers++;
    }

    // Process LGAs (limit for reasonable seed time)
    const lgasToProcess = state.lgas.slice(0, 5);

    for (const lga of lgasToProcess) {
      // LGA users (2-3)
      const numLgaUsers = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numLgaUsers; i++) {
        const gender = getRandomItem(['male', 'female'] as const);
        const name = generateName(zone, gender);
        const email = generateEmail(name.firstName, name.lastName, totalUsers);

        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: name.firstName,
            lastName: name.lastName,
            displayName: `${name.firstName} ${name.lastName}`,
            username: generateUsername(name.firstName, name.lastName),
            isEmailVerified: true,
            countryId: nigeria.id,
            stateId: state.id,
            lgaId: lga.id,
            gender: gender === 'male' ? Gender.MALE : Gender.FEMALE,
          },
        });

        await prisma.orgMembership.create({
          data: { userId: user.id, orgId: apcOrg.id, isAdmin: false, approvedAt: new Date() },
        });
        totalMemberships++;

        const numPosts = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numPosts; j++) {
          const content = generatePost('LGA', zone, lga.name);
          await prisma.post.create({
            data: {
              content,
              authorId: user.id,
              orgId: apcOrg.id,
              stateId: state.id,
              lgaId: lga.id,
              countryId: nigeria.id,
              locationLevel: 'LGA',
              type: 'TEXT',
              isPublished: true,
              likeCount: Math.floor(Math.random() * 100),
              commentCount: Math.floor(Math.random() * 30),
              viewCount: Math.floor(Math.random() * 500),
            },
          });
          statePosts++;
          totalPosts++;
        }
        stateUsers++;
        totalUsers++;
      }

      // Process Wards (limit to first 3)
      const wardsToProcess = lga.wards.slice(0, 3);

      for (const ward of wardsToProcess) {
        // Ward users (3-5)
        const numWardUsers = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numWardUsers; i++) {
          const gender = getRandomItem(['male', 'female'] as const);
          const name = generateName(zone, gender);
          const email = generateEmail(name.firstName, name.lastName, totalUsers);

          const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              firstName: name.firstName,
              lastName: name.lastName,
              displayName: `${name.firstName} ${name.lastName}`,
              username: generateUsername(name.firstName, name.lastName),
              isEmailVerified: true,
              countryId: nigeria.id,
              stateId: state.id,
              lgaId: lga.id,
              wardId: ward.id,
              gender: gender === 'male' ? Gender.MALE : Gender.FEMALE,
            },
          });

          await prisma.orgMembership.create({
            data: { userId: user.id, orgId: apcOrg.id, isAdmin: false, approvedAt: new Date() },
          });
          totalMemberships++;

          const numPosts = 3 + Math.floor(Math.random() * 3);
          for (let j = 0; j < numPosts; j++) {
            const content = generatePost('WARD', zone, ward.name);
            await prisma.post.create({
              data: {
                content,
                authorId: user.id,
                orgId: apcOrg.id,
                stateId: state.id,
                lgaId: lga.id,
                wardId: ward.id,
                countryId: nigeria.id,
                locationLevel: 'WARD',
                type: 'TEXT',
                isPublished: true,
                likeCount: Math.floor(Math.random() * 50),
                commentCount: Math.floor(Math.random() * 20),
                viewCount: Math.floor(Math.random() * 200),
              },
            });
            statePosts++;
            totalPosts++;
          }
          stateUsers++;
          totalUsers++;
        }

        // Process Polling Units (limit to first 3)
        const pusToProcess = ward.pollingUnits.slice(0, 3);

        for (const pu of pusToProcess) {
          // PU users (4-7 for intimate feel)
          const numPuUsers = 4 + Math.floor(Math.random() * 4);
          for (let i = 0; i < numPuUsers; i++) {
            const gender = getRandomItem(['male', 'female'] as const);
            const name = generateName(zone, gender);
            const email = generateEmail(name.firstName, name.lastName, totalUsers);

            const user = await prisma.user.create({
              data: {
                email,
                password: hashedPassword,
                firstName: name.firstName,
                lastName: name.lastName,
                displayName: `${name.firstName} ${name.lastName}`,
                username: generateUsername(name.firstName, name.lastName),
                isEmailVerified: true,
                countryId: nigeria.id,
                stateId: state.id,
                lgaId: lga.id,
                wardId: ward.id,
                pollingUnitId: pu.id,
                gender: gender === 'male' ? Gender.MALE : Gender.FEMALE,
              },
            });

            await prisma.orgMembership.create({
              data: { userId: user.id, orgId: apcOrg.id, isAdmin: false, approvedAt: new Date() },
            });
            totalMemberships++;

            // More posts for polling units (more intimate)
            const numPosts = 4 + Math.floor(Math.random() * 4);
            for (let j = 0; j < numPosts; j++) {
              const content = generatePost('POLLING_UNIT', zone, pu.name);
              await prisma.post.create({
                data: {
                  content,
                  authorId: user.id,
                  orgId: apcOrg.id,
                  stateId: state.id,
                  lgaId: lga.id,
                  wardId: ward.id,
                  pollingUnitId: pu.id,
                  countryId: nigeria.id,
                  locationLevel: 'POLLING_UNIT',
                  type: 'TEXT',
                  isPublished: true,
                  likeCount: Math.floor(Math.random() * 30),
                  commentCount: Math.floor(Math.random() * 15),
                  viewCount: Math.floor(Math.random() * 100),
                },
              });
              statePosts++;
              totalPosts++;
            }
            stateUsers++;
            totalUsers++;
          }
        }
      }
    }

    console.log(`   ✓ ${state.name}: ${stateUsers} users, ${statePosts} posts`);

    // Progress and reconnect
    if (totalPosts % 500 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      console.log(`\n   📊 Progress: ${totalPosts.toLocaleString()} posts, ${totalUsers.toLocaleString()} users (${elapsed} mins)\n`);
    }

    await prisma.$disconnect();
    await prisma.$connect();
  }

  // Update member count
  console.log('\n📊 Updating organization member count...');
  await prisma.organization.update({
    where: { id: apcOrg.id },
    data: { memberCount: totalMemberships },
  });

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n========================================');
  console.log('✅ APC CAMPAIGN SEEDING V2 COMPLETE!');
  console.log('========================================');
  console.log(`\n📊 Summary:`);
  console.log(`   - Users created: ${totalUsers.toLocaleString()}`);
  console.log(`   - Posts created: ${totalPosts.toLocaleString()}`);
  console.log(`   - Memberships: ${totalMemberships.toLocaleString()}`);
  console.log(`   - Organization: All Progressives Congress`);
  console.log(`   - Time taken: ${totalTime} minutes`);
  console.log(`\n🔑 Password for all APC users: apc2027`);
  console.log(`🏛️ Movement: All Progressives Congress`);
  console.log(`📋 Organization invite code: APC`);
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
