/**
 * APC Campaign Seeder
 *
 * Creates realistic APC (All Progressives Congress) campaign data:
 * - Users with Nigerian names matching their geopolitical zones
 * - APC movement and organization hierarchy at all levels
 * - Political posts appropriate for each location level
 *
 * Usage:
 *   yarn prisma:seed:apc
 *   or
 *   npx ts-node prisma/seeders/seed-apc-campaign.ts
 */

import { PrismaClient, Gender, OrgLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const BATCH_SIZE = 100;

// ============================================
// NIGERIAN NAMES BY GEOPOLITICAL ZONE
// ============================================

const NAMES_BY_ZONE: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  // SOUTH-WEST (Yoruba)
  SOUTH_WEST: {
    firstNames: [
      'Adebayo', 'Oluwaseun', 'Temitope', 'Ayodeji', 'Olumide', 'Funmilayo', 'Adaeze',
      'Oluwafemi', 'Titilayo', 'Babatunde', 'Yetunde', 'Oluwakemi', 'Adewale', 'Folake',
      'Olamide', 'Bukola', 'Adeola', 'Kehinde', 'Taiwo', 'Omolara', 'Adebola', 'Oluwaseyi',
      'Ayomide', 'Oluwadamilola', 'Inioluwa', 'Tolulope', 'Oluwatobiloba', 'Moyosore',
      'Oluwanifemi', 'Adesola', 'Oluwagbemiga', 'Morenike', 'Oluwayemisi', 'Adejoke',
      'Boluwatife', 'Oluwatimilehin', 'Adetola', 'Olayinka', 'Oluwatosin', 'Damilare',
      'Adeyemi', 'Olufunke', 'Adekunle', 'Olayemi', 'Aderonke', 'Olasunkanmi', 'Adunni',
    ],
    lastNames: [
      'Ogundimu', 'Adeyemi', 'Bakare', 'Adeleke', 'Oladipo', 'Akinwale', 'Oyelaran',
      'Adegoke', 'Fashola', 'Olowokere', 'Ajayi', 'Ogunyemi', 'Akindele', 'Olusanya',
      'Ogundipe', 'Adekunle', 'Oyeleke', 'Adebisi', 'Oyedepo', 'Afolabi', 'Olayinka',
      'Adeniyi', 'Ogunlana', 'Akintola', 'Odunsi', 'Oyewole', 'Oguntade', 'Ademola',
      'Olatunde', 'Ayodele', 'Ogunleye', 'Adegbite', 'Oshodi', 'Animashaun', 'Balogun',
      'Ojo', 'Adeoye', 'Onifade', 'Falade', 'Oduya', 'Akinyemi', 'Adewoye', 'Odeyemi',
    ],
  },
  // NORTH-WEST (Hausa/Fulani)
  NORTH_WEST: {
    firstNames: [
      'Abubakar', 'Fatima', 'Muhammed', 'Aisha', 'Ibrahim', 'Zainab', 'Usman',
      'Amina', 'Suleiman', 'Halima', 'Abdullahi', 'Maryam', 'Yusuf', 'Hafsat',
      'Bashir', 'Sadiya', 'Aliyu', 'Bilkisu', 'Ismail', 'Hadiza', 'Nasiru', 'Rahinatu',
      'Kabiru', 'Hauwa', 'Salisu', 'Asmau', 'Garba', 'Salamatu', 'Musa', 'Khadija',
      'Hamza', 'Safiya', 'Ahmad', 'Rukayya', 'Dauda', 'Jamila', 'Nuhu', 'Hassana',
      'Sanusi', 'Firdausi', 'Bello', 'Rabi', 'Tanimu', 'Laraba', 'Shehu', 'Asabe',
    ],
    lastNames: [
      'Abdullahi', 'Bello', 'Danjuma', 'Sani', 'Mohammed', 'Yusuf', 'Ibrahim',
      'Abubakar', 'Shehu', 'Umar', 'Lawal', 'Garba', 'Musa', 'Isah', 'Adamu',
      'Suleiman', 'Aliyu', 'Yakubu', 'Isa', 'Ahmad', 'Idris', 'Tanko', 'Waziri',
      'Dikko', 'Ringim', 'Fagge', 'Gwandu', 'Sokoto', 'Kebbi', 'Zamfara', 'Gusau',
    ],
  },
  // NORTH-EAST (Hausa/Kanuri)
  NORTH_EAST: {
    firstNames: [
      'Bukar', 'Falmata', 'Kyari', 'Fatima', 'Modu', 'Aisha', 'Shettima',
      'Zara', 'Babagana', 'Hauwa', 'Kashim', 'Kaltumi', 'Grema', 'Bintu',
      'Zulum', 'Yagana', 'Tijjani', 'Maimuna', 'Baba', 'Fati', 'Mala', 'Kaka',
      'Mustapha', 'Amina', 'Bulama', 'Hadiza', 'Lawan', 'Zainab', 'Abba', 'Gana',
    ],
    lastNames: [
      'Shettima', 'Kyari', 'Bukar', 'Modu', 'Kachallah', 'Mala', 'Zulum',
      'Bama', 'Konduga', 'Gwoza', 'Dikwa', 'Maiduguri', 'Yerwa', 'Kaga',
      'Monguno', 'Ngala', 'Marte', 'Kukawa', 'Mobbar', 'Abadam', 'Guzamala',
      'Gubio', 'Magumeri', 'Jere', 'Damboa', 'Chibok', 'Askira', 'Hawul',
    ],
  },
  // NORTH-CENTRAL (Middle Belt)
  NORTH_CENTRAL: {
    firstNames: [
      'Danjuma', 'Ladi', 'Bulus', 'Laraba', 'Yakubu', 'Talatu', 'Istifanus',
      'Jummai', 'Bitrus', 'Rahila', 'Danladi', 'Saratu', 'Gideon', 'Deborah',
      'Sani', 'Martha', 'Peter', 'Grace', 'Samuel', 'Ruth', 'Joseph', 'Esther',
      'David', 'Hannah', 'Moses', 'Rebecca', 'John', 'Mary', 'James', 'Sarah',
      'Daniel', 'Naomi', 'Stephen', 'Lydia', 'Paul', 'Rachel', 'Simon', 'Priscilla',
      'Bawa', 'Larai', 'Mallam', 'Hauwa', 'Adamu', 'Zainab',
    ],
    lastNames: [
      'Dung', 'Chollom', 'Gyang', 'Davou', 'Bot', 'Pam', 'Gotom', 'Dalyop',
      'Mangut', 'Rwang', 'Msen', 'Akiga', 'Iorkaa', 'Tyokyaa', 'Igba', 'Chia',
      'Akaaer', 'Gbor', 'Ukuma', 'Ogbu', 'Onoja', 'Ameh', 'Idoko', 'Okwu',
      'Attah', 'Ocheja', 'Sule', 'Adaji', 'Enemali', 'Okolo', 'Audu', 'Oche',
    ],
  },
  // SOUTH-EAST (Igbo)
  SOUTH_EAST: {
    firstNames: [
      'Chukwuemeka', 'Ngozi', 'Obiora', 'Adaeze', 'Nnamdi', 'Chinelo', 'Obinna',
      'Chiamaka', 'Ikechukwu', 'Chidinma', 'Uchenna', 'Amara', 'Chinedu', 'Oluchi',
      'Emeka', 'Nneka', 'Kenechukwu', 'Chioma', 'Tobenna', 'Ifeoma', 'Chidi', 'Adanna',
      'Ebuka', 'Chinyere', 'Uzoma', 'Nkechi', 'Obianuju', 'Kelechi', 'Somto', 'Munachi',
      'Chukwudi', 'Onyinye', 'Nzube', 'Amarachi', 'Lotanna', 'Ginika', 'Tochukwu', 'Kosiso',
      'Ekene', 'Ujunwa', 'Chukwuka', 'Nneoma', 'Ifeanyi', 'Ogechi', 'Ugochukwu', 'Chisom',
    ],
    lastNames: [
      'Okafor', 'Eze', 'Nwosu', 'Okeke', 'Onyeka', 'Nwachukwu', 'Obi', 'Uzoma',
      'Igwe', 'Chukwu', 'Agu', 'Okoro', 'Nwankwo', 'Ibe', 'Okonkwo', 'Aneke',
      'Nnadi', 'Okolie', 'Ogbu', 'Nwafor', 'Ikenna', 'Obasi', 'Emenike', 'Azubuike',
      'Nnamdi', 'Ugwu', 'Onuoha', 'Mbah', 'Ezeji', 'Iwu', 'Anyanwu', 'Uchenna',
    ],
  },
  // SOUTH-SOUTH (Niger Delta)
  SOUTH_SOUTH: {
    firstNames: [
      'Efiong', 'Ima', 'Okon', 'Aniekan', 'Ubong', 'Idara', 'Emem', 'Nsikan',
      'Edidiong', 'Mfoniso', 'Aniebiet', 'Uduak', 'Ekom', 'Itoro', 'Abasifreke',
      'Enobong', 'Imaobong', 'Nseobong', 'Otoabasi', 'Ememobong', 'Utibe', 'Akpan',
      'Ekemini', 'Idongesit', 'Mbakara', 'Odudu', 'Bassey', 'Effiom', 'Edet', 'Ita',
      'Akaninyene', 'Anietie', 'Enefiok', 'Ifiok', 'Ime', 'Inyang', 'Itohowo', 'Mfon',
      'Kufre', 'Iniobong', 'Ekom', 'Imoh', 'Ofonime', 'Uyai', 'Arit', 'Atim',
    ],
    lastNames: [
      'Etim', 'Bassey', 'Ekpo', 'Okon', 'Effiong', 'Udoh', 'Akpan', 'Edet',
      'Udo', 'Essien', 'Inyang', 'Ekong', 'Ita', 'Obot', 'Nse', 'Amos',
      'Offiong', 'Asuquo', 'Umoh', 'Ukpong', 'Archibong', 'Ekanem', 'Inwang',
      'Udofia', 'Umanah', 'Enyong', 'Ntuk', 'Akpabio', 'Ekere', 'Udosen',
    ],
  },
};

// Map states to geopolitical zones
const STATE_TO_ZONE: Record<string, string> = {
  // South-West
  'Lagos': 'SOUTH_WEST', 'Oyo': 'SOUTH_WEST', 'Ogun': 'SOUTH_WEST', 'Ondo': 'SOUTH_WEST',
  'Ekiti': 'SOUTH_WEST', 'Osun': 'SOUTH_WEST',
  // North-West
  'Kano': 'NORTH_WEST', 'Kaduna': 'NORTH_WEST', 'Katsina': 'NORTH_WEST', 'Sokoto': 'NORTH_WEST',
  'Zamfara': 'NORTH_WEST', 'Kebbi': 'NORTH_WEST', 'Jigawa': 'NORTH_WEST',
  // North-East
  'Borno': 'NORTH_EAST', 'Yobe': 'NORTH_EAST', 'Adamawa': 'NORTH_EAST', 'Bauchi': 'NORTH_EAST',
  'Gombe': 'NORTH_EAST', 'Taraba': 'NORTH_EAST',
  // North-Central
  'Plateau': 'NORTH_CENTRAL', 'Benue': 'NORTH_CENTRAL', 'Nasarawa': 'NORTH_CENTRAL',
  'Kogi': 'NORTH_CENTRAL', 'Niger': 'NORTH_CENTRAL', 'Kwara': 'NORTH_CENTRAL',
  'Abuja': 'NORTH_CENTRAL', 'FCT': 'NORTH_CENTRAL', 'Federal Capital Territory': 'NORTH_CENTRAL',
  // South-East
  'Enugu': 'SOUTH_EAST', 'Anambra': 'SOUTH_EAST', 'Imo': 'SOUTH_EAST', 'Abia': 'SOUTH_EAST', 'Ebonyi': 'SOUTH_EAST',
  // South-South
  'Rivers': 'SOUTH_SOUTH', 'Delta': 'SOUTH_SOUTH', 'Bayelsa': 'SOUTH_SOUTH',
  'Cross River': 'SOUTH_SOUTH', 'Akwa Ibom': 'SOUTH_SOUTH', 'Edo': 'SOUTH_SOUTH',
};

// ============================================
// POLITICAL POSTS BY LOCATION LEVEL
// ============================================

// National level posts (elevated, philosophical, broad)
const NATIONAL_POSTS = [
  "Fellow Nigerians, our Renewed Hope agenda is bearing fruit! Under President Tinubu's leadership, we are witnessing transformative policies that will secure our nation's future. APC is the party for progress! 🇳🇬",
  "The APC administration has removed fuel subsidy - a bold move that will save trillions for critical infrastructure. Short-term pain for long-term gain. Our grandchildren will thank us!",
  "To all our support groups across the 36 states and FCT: Your dedication to the cause of nation-building is noticed and appreciated. Together, we move Nigeria forward!",
  "Important announcement from National Working Committee: All State chapters should intensify grassroots mobilization. 2027 is closer than we think. Let's consolidate our gains!",
  "President Bola Ahmed Tinubu's economic reforms are attracting foreign investment. The naira will stabilize. Have faith in the process, fellow Nigerians!",
  "The opposition's ADC thinks they can challenge our structure? They're dreaming! APC has the most robust political machinery in Nigeria. From Ward to National - we are everywhere!",
  "Today we celebrate our party's anniversary. From 2015 to now, we have transformed Nigeria's political landscape. This is just the beginning!",
  "National Women Leader's message: Our women wing has been instrumental in securing victory. We are not just supporters - we are leaders! APC women, continue to shine!",
  "Youth engagement is key to our continued success. To the APC Youth Wing: You are not the future - you are the present. Your voice matters in our party!",
  "Security improvements continue across the nation. Banditry is reducing, farms are returning to productivity. The Renewed Hope agenda is working!",
  "Education reform is coming. Student loans, improved ASUU engagement, better infrastructure. APC delivers on its promises!",
  "Infrastructure development: Lagos-Calabar coastal highway, Sokoto-Badagry highway - these are not just roads, they're corridors of prosperity!",
  "To those spreading fake news about our government: We will not be distracted. Our focus is on building a Nigeria that works for all!",
  "The merger that created APC was the best political decision in Nigeria's history. Unity in diversity - that's our strength!",
  "As we approach 2027, let's remember why we chose this path. A prosperous, united, and progressive Nigeria. That's the APC promise!",
];

// State level posts (coordination, state-specific issues)
const STATE_POSTS = [
  "State Executive Committee meeting tomorrow at the Secretariat, 10am sharp. All LGA chairmen must attend. Important directives from National to discuss.",
  "Congratulations to our state on the successful conduct of the local council elections! APC swept the board - 100% LGAs won! This is people's mandate!",
  "Fellow party members in this state: Let's maintain unity. Any disputes should be resolved through party mechanisms, not social media. We are one family!",
  "State Women's Conference coming up next month. All LGA Women Leaders should submit their delegates list by Friday. Big things coming!",
  "Our governor's 100 days in office: New roads, hospital equipment, bursary for students. This is what APC governance looks like!",
  "To all Ward coordinators: Membership revalidation exercise continues. Ensure all members in your ward are captured. Leave no one behind!",
  "The opposition ADC is trying to poach our members with false promises. Stay firm! Remember who brought development to this state - APC!",
  "State Youth Wing rally this Saturday at the Township Stadium. All LGA Youth Leaders should mobilize at least 200 youths each. Let's show our strength!",
  "Our state chapter is leading in membership drive. Over 500,000 new members this quarter alone! Thank you for believing in the APC vision!",
  "Important: All aspirants for the upcoming local council elections should collect forms at the State Secretariat. Deadline is next week Friday!",
  "Governor's visit to our local council today was a success! He promised more development projects. APC delivers even at the grassroots!",
  "State caucus has resolved the leadership tussle in some LGAs. Party supremacy prevails. Let's move forward as one!",
  "Training workshop for polling unit agents next Monday. Venue: State Secretariat. All LGA coordinators should nominate 50 persons each.",
  "The President visited our state and commissioned three projects! Federal presence is real with APC in power at all levels!",
  "To the good people of this state: Thank you for your continued support. 2027, we go again! APC all the way!",
];

// LGA level posts (local coordination, meetings)
const LGA_POSTS = [
  "LGA Executive meeting this Friday by 4pm at the Council Secretariat. All ward chairmen should attend with their secretaries. Refreshments will be served.",
  "Congratulations to all our councillors-elect! You represent the will of the people. Serve with integrity and bring development to your wards!",
  "Ward tour begins next week. I will visit all wards to assess our readiness for the next elections. Prepare your reports!",
  "The LGA chairman has approved N500,000 for each ward to conduct member welfare programs. Collect from the treasury by month end.",
  "To all our teeming supporters in this LGA: Your loyalty is not forgotten. When we share, everyone will benefit. APC for all!",
  "Stakeholders meeting with traditional rulers tomorrow. We need their continued support for our candidates. Attendance is mandatory for all excos!",
  "Market women association visited the secretariat to pledge support. Women are the backbone of our party. We appreciate you!",
  "Youth empowerment program: 50 beneficiaries from this LGA selected for skills acquisition. APC cares for the youth!",
  "Dispute between Ward 3 and Ward 7 has been resolved amicably. No victor, no vanquished. We are stronger together!",
  "The opposition is weak in this LGA. Let's keep it that way! Continue the good work in your various wards. Victory is certain!",
  "Contribution for the upcoming rally: N5,000 per ward. Submit to the LGA treasurer before Friday. Let's make it a grand event!",
  "Agricultural support: Fertilizers arriving next week. All registered farmers in party wards should submit their names to ward chairmen.",
  "Road rehabilitation project in Wards 2, 5, and 8 - directly facilitated by our LGA party leadership. This is what we do!",
  "Emergency meeting called for tomorrow 2pm. Matter affecting the party. All ward leaders must attend. No excuses accepted!",
  "Ramadan/Christmas welfare packages ready for distribution. Each ward gets 100 bags of rice and 50 cartons of oil. Collect and share fairly!",
];

// Ward level posts (mobilization, local activities)
const WARD_POSTS = [
  "Brothers and sisters of this ward, meeting tonight at 7pm by Alhaji Musa's compound. We need to discuss the upcoming rally. Everyone must come!",
  "Tomorrow we go house-to-house! Meet at the market junction by 8am with your APC caps and t-shirts. Bring your voter registration slips for identification.",
  "Congrats to Mama Tinu for her new appointment as Ward Women Leader! She has worked hard for the party. Well deserved!",
  "The youth in this ward have shown remarkable commitment. Special recognition to Emeka's team for painting the party secretariat free of charge!",
  "Those that collected forms and haven't returned them - this is final reminder. Return to me before weekend or your slot goes to someone else!",
  "ADC people dem dey try campaign for our ward. Make we show dem say na APC territory here! Wear your party colors every day!",
  "Small palava between Baba Oloja group and the youth wing don settle. Na one family we be. Make we focus on the election!",
  "Polling unit agents training tomorrow at Primary School hall. All selected agents must attend. Bring your writing materials!",
  "Contribution time! N200 per member for the upcoming campaign materials. See Brother Chika or Sister Amina to submit.",
  "Our ward target is 2,000 votes for the gubernatorial candidate. Last time we delivered 1,800. Let's exceed expectations this time!",
  "Meeting with the village head confirmed for Sunday after service. We need his blessing for our campaign activities in the community.",
  "Women meeting every Thursday at 4pm will continue. All our women supporters should attend. Unity is strength!",
  "Thanks to everyone that attended the rally yesterday! We were the most colorful ward there. LGA chairman specially commended us!",
  "Food items from the party: Rice, beans, and oil for distribution. Come to my house tomorrow evening with your membership card.",
  "Youths! Football match against Ward 5 this Saturday. After the game, we will discuss party matters. Sports and politics na 5 and 6!",
  "E get reason why APC dey win for this ward every time - na because we dey united! Make we continue like that. No division!",
  "Oga Chairman don provide transport money for the State rally on Saturday. N1,500 per person. Register with the secretary!",
  "Problem with the opposition woman spreading lies about our party don solve. We talk to am and she don understand. Dialogue works!",
  "Candidates' visitation to our ward next week. Clean the environment, prepare songs, and let's show them we mean business!",
  "Volunteers needed for door-to-door campaign. Young, energetic people. We go pay transport and give lunch. Register with me!",
];

// Polling unit level posts (very local, intimate, pidgin mix)
const POLLING_UNIT_POSTS = [
  "My people of this unit, how una dey? Tomorrow morning make we meet for Iya Basira shop to plan our activities. 8am sharp!",
  "Agent training don finish! Kudos to Malam Sani, Aunty Rose, and Brother Tayo wey go represent us on election day. We trust you!",
  "Na only 350 registered voters we get for this unit. We must deliver 300 minimum for our candidate. House to house na the strategy!",
  "Abeg who still never collect PVC? This week Friday na final collection date. No PVC, no vote. Don't waste our efforts!",
  "Thank you to Chief Okonkwo for the umbrella for our makeshift secretariat. God go bless you! Small small, we dey build!",
  "Meeting tonight by 8pm for Baba Landlord's place. Serious matter! Election just dey corner, make we no sleep!",
  "Mama Ngozi don agree to cook food for our campaign team! All the women wey wan help, meet her tomorrow morning.",
  "ADC people come try talk rubbish for our area yesterday. We politely told them say dem waste their time. This na APC fortress!",
  "Oya now, who get extra party flag or banner? The one wey we hang for junction don tear. We need replacement ASAP!",
  "Registration of new members: If you know anybody wey ready to join APC, bring them come. More members = more power!",
  "Contribution of N100 per person for our agent's welfare on election day. See Iya Beji to submit. No amount too small!",
  "Bros Abdul, your matter don settle o! No more quarrel with the youth leader. Una be brothers. Party first!",
  "Reminder: Our polling unit get 4 voting points. Agent assignment - Voting Point A: Chinedu, B: Fatima, C: Hassan, D: Yemi. Confirm!",
  "Tonight devotion/prayer meeting for our polling unit. Both Muslims and Christians welcome. We dey pray for peaceful elections and APC victory!",
  "The Total filling station go be our meeting point on election day morning. From there, we march to the polling booth together!",
  "Who still dey find agent appointment? One slot remain. Must be somebody wey sabi write and count. Speak now!",
  "Shoutout to the barber boys for free haircut to party members before the rally! That's the spirit. APC first!",
  "Mama Biodun just born baby boy! Congratulations to her. When she recover, we go organize small naming ceremony for am.",
  "VERY IMPORTANT: Movement of result sheet from polling unit to collation center - we need 10 volunteers to follow our agents. Security!",
  "After election, we go do small party for all of us. Celebrate our hard work. But first, let's deliver the votes!",
  "Opposition dey promise heaven and earth. Ask them: wetin dem don do before? Nothing! APC dey show, no be mouth talk.",
  "Wetin concern us with their ADC? Dem never even organize meeting for this area. We dey ground, dem dey cloud!",
  "Special thanks to everybody wey contribute for the campaign materials. We don print posters and flyers. Collection starts today!",
  "Make person no come fight for here o! We be one family. Any misunderstanding, we settle am inside. Party first!",
  "Tomorrow na our turn to clean the party secretariat. Youth volunteers, show up by 7am with your broom and mop!",
  "President Tinubu's achievement wey we go highlight tomorrow: Fuel subsidy removal and the saved money going to infrastructure. Facts!",
  "For those asking about the promised grinding machine - it will come after elections. For now, focus on the campaign!",
  "Baba Aliyu don donate his shop front for us to use as information point. Volunteers wey wan sit there, register with me!",
  "Night patrol schedule: Monday - Chika's team, Wednesday - Abdul's team, Friday - Tunde's team. Keep our area safe!",
  "Na we go decide who become Senator, Governor, President! Our vote count. Make everybody come out on election day!",
];

// Disagreements and resolutions (for realism)
const DISAGREEMENT_POSTS = [
  "I think we should focus more on women empowerment in this ward. Others disagree but I stand by my position. Let's discuss!",
  "The issue of who becomes polling agent should be merit-based, not by connection! I've raised this in our meeting.",
  "Some people dey hoard party materials for this unit. This is wrong! Everything should be shared equally. I don report!",
  "Baba Kola's complaint about being sidelined don reach my ears. Please, let's carry everyone along. No exclusion!",
  "Youth leader and women leader misunderstanding has been brewing. I'm calling a mediation meeting tomorrow. We must resolve this!",
  "The allocation of rice was not fair last time. I propose we create a transparent committee for future distributions.",
  "Why some wards dey get more attention than others? We contributed equally to party fund. This no fair! Chairman should address!",
  "I disagree with the strategy of night campaigns. It's dangerous. Let's focus on daytime door-to-door. Safety first!",
  "The financial report for last quarter is unclear. As a member, I deserve to know how our contributions were spent!",
  "Reconciliation meeting was successful! All parties have agreed to work together. Unity restored! APC above personal interests!",
];

// Donation and material calls
const DONATION_POSTS = [
  "Call for donations! We need canopies for the ward rally. If you can contribute or loan, please contact the secretary.",
  "Urgent: Sound system needed for Saturday's campaign. Chief Emeka, can we borrow yours? We will return in good condition!",
  "Special thanks to Alhaji Bello for donating 50 bags of pure water for our last campaign. May Allah bless him abundantly!",
  "Campaign vehicle needed! If anyone has a pickup truck or bus we can use for mobilization, please volunteer. Fuel will be provided!",
  "Printing cost for 1000 flyers is N15,000. We've raised N8,000. Need N7,000 more. Every N100 helps. Contribute today!",
  "Iya Adeola just donated 2 coolers of zobo and puff puff for the meeting tonight! God bless her business!",
  "Generator for the secretariat needed. The one we have don spoil. If you know where to get cheap fairly-used one, let us know!",
  "Appreciation to Brother Johnson for repairing our megaphone free of charge! That's the APC spirit - selfless service!",
  "Materials we need for election day: Umbrellas (10), chairs (20), table (5), refreshments. Volunteers to provide, please come forward!",
  "Chief Ogbonna has promised to provide lunch for all our agents on election day. A true patriot! May you prosper!",
];

// Volunteer and agent recruitment
const VOLUNTEER_POSTS = [
  "URGENT: We need 5 more polling agents for this unit. Requirements: Must be a registered voter, literate, patient. Apply now!",
  "Calling all youths! Volunteer for door-to-door campaign. We need your energy and enthusiasm. Register with the Youth Leader!",
  "Women volunteers needed for market sensitization. Every Tuesday and Friday. If you can spare 2 hours, join us!",
  "Transport volunteers with bikes or cars - we need your help on rally days. Fuel will be reimbursed. Sign up!",
  "Social media volunteers! If you can post, share, and engage online, we need you. Digital campaign is important too!",
  "Cooks and servers needed for the upcoming stakeholders meeting. Women's wing, please coordinate. 50 guests expected!",
  "Security volunteers for the ward secretariat. Night shift available. Small stipend provided. Serious persons only!",
  "Voter education volunteers - help your neighbors understand the voting process. Training will be provided!",
  "Music and entertainment team for rally - if you can drum, dance, or sing, join the mobilization squad!",
  "Logistics volunteers - help with setting up venues, arranging chairs, decorating. Strong able-bodied persons needed!",
];

// Meeting calls
const MEETING_POSTS = [
  "MEETING ALERT: Ward executive meeting tomorrow 5pm at the usual place. All excos must attend. No representative accepted!",
  "Emergency meeting tonight 8pm! The chairman has important information from LGA. Drop whatever you're doing and come!",
  "Women's wing meeting postponed to next week Thursday due to the funeral. Accept our condolences, Mama Nkechi's family.",
  "Youth meeting every Sunday by 4pm will resume. All youth members should endeavor to attend. Bring a friend!",
  "Stakeholders meeting with the House of Reps candidate this Friday. All unit leaders should attend with 3 followers each.",
  "Monthly general meeting holds next Saturday 10am. Attendance is COMPULSORY. Absentees will explain to the disciplinary committee!",
  "Special meeting to resolve the zoning controversy. All aspirants and their supporters should come with open minds!",
  "Prayer meeting before the election - Muslims at Juma'at mosque 2pm, Christians at St. Michael's 3pm. Same purpose: APC victory!",
  "Strategy meeting for the final week of campaigns. Only inner caucus members. Venue will be communicated privately.",
  "Feedback meeting after the election. Win or learn, we will review our performance. All members should attend!",
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

function getZone(stateName: string): string {
  if (STATE_TO_ZONE[stateName]) return STATE_TO_ZONE[stateName];
  for (const [key, value] of Object.entries(STATE_TO_ZONE)) {
    if (stateName.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return 'SOUTH_WEST'; // Default
}

function generateName(zone: string): { firstName: string; lastName: string } {
  const names = NAMES_BY_ZONE[zone] || NAMES_BY_ZONE.SOUTH_WEST;
  return {
    firstName: getRandomItem(names.firstNames),
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

function getPostsForLevel(level: 'NATIONAL' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT'): string[] {
  switch (level) {
    case 'NATIONAL': return NATIONAL_POSTS;
    case 'STATE': return STATE_POSTS;
    case 'LGA': return LGA_POSTS;
    case 'WARD': return WARD_POSTS;
    case 'POLLING_UNIT':
      // Mix polling unit posts with other local content
      return [
        ...POLLING_UNIT_POSTS,
        ...DISAGREEMENT_POSTS,
        ...DONATION_POSTS,
        ...VOLUNTEER_POSTS,
        ...MEETING_POSTS,
      ];
  }
}

async function generateUniqueInviteCode(usedCodes: Set<string>): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Array.from({ length: 3 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');

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
  throw new Error('Failed to generate unique invite code');
}

// ============================================
// MAIN SEEDER
// ============================================

async function main() {
  console.log('========================================');
  console.log('APC CAMPAIGN SEEDER');
  console.log('========================================\n');

  const startTime = Date.now();
  const hashedPassword = await bcrypt.hash('apc2027', 10);
  const genders = [Gender.MALE, Gender.FEMALE];
  const usedInviteCodes = new Set<string>();

  // Connect
  console.log('🔌 Connecting to database...');
  await prisma.$connect();
  console.log('✓ Connected!\n');

  // ============================================
  // STEP 1: CLEAR EXISTING POSTS
  // ============================================
  console.log('🧹 Clearing existing posts and related data...');

  // Delete in correct order due to foreign keys
  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.share.deleteMany({});
  await prisma.post.deleteMany({});

  console.log('✓ All posts cleared!\n');

  // ============================================
  // STEP 2: GET NIGERIA AND LOCATIONS
  // ============================================
  console.log('📍 Loading location hierarchy...');

  const nigeria = await prisma.country.findFirst({ where: { code: 'NG' } });
  if (!nigeria) {
    console.error('❌ Nigeria not found! Run the main seed first with --full-locations.');
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

  let platformAdmin = await prisma.user.findFirst({
    where: { isPlatformAdmin: true },
  });

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
    console.log('✓ Created Platform Admin');
  } else {
    console.log('✓ Using existing Platform Admin');
  }

  // ============================================
  // STEP 4: CREATE APC MOVEMENT
  // ============================================
  console.log('\n🏛️ Creating APC Movement...');

  let apcMovement = await prisma.movement.findFirst({
    where: { slug: 'apc-national' },
  });

  if (!apcMovement) {
    apcMovement = await prisma.movement.create({
      data: {
        name: 'All Progressives Congress',
        slug: 'apc-national',
        description: 'The All Progressives Congress (APC) is a political party in Nigeria formed in 2013. It is currently the ruling party, with President Bola Ahmed Tinubu at the helm.',
        isActive: true,
        createdById: platformAdmin.id,
      },
    });

    // Create movement wallet
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
  // STEP 5: CREATE NATIONAL APC ORGANIZATION
  // ============================================
  console.log('\n🏢 Creating APC National Organization...');

  let apcNational = await prisma.organization.findFirst({
    where: { slug: 'apc-national-hq' },
  });

  if (!apcNational) {
    apcNational = await prisma.organization.create({
      data: {
        name: 'APC National Headquarters',
        slug: 'apc-national-hq',
        description: 'All Progressives Congress - National Headquarters. The ruling party of the Federal Republic of Nigeria.',
        level: OrgLevel.NATIONAL,
        movementId: apcMovement.id,
        isVerified: true,
        isActive: true,
        countryId: nigeria.id,
        inviteCode: 'APC',
        memberCount: 0,
      },
    });
    usedInviteCodes.add('APC');
  }

  console.log('✓ APC National HQ ready:', apcNational.name);

  // ============================================
  // STEP 6: CREATE USERS AND POSTS
  // ============================================
  console.log('\n👥 Creating users and posts by location level...\n');

  let totalUsers = 0;
  let totalPosts = 0;
  let totalMemberships = 0;
  const createdOrgs: Record<string, any> = { national: apcNational };

  // Create national level posts first
  console.log('📝 Creating national level posts...');

  // Create some national-level users
  for (let i = 0; i < 5; i++) {
    const zone = getRandomItem(Object.keys(NAMES_BY_ZONE));
    const name = generateName(zone);
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
        gender: getRandomItem(genders),
      },
    });

    // Add to national org
    await prisma.orgMembership.create({
      data: {
        userId: user.id,
        orgId: apcNational.id,
        isAdmin: i < 2, // First 2 are admins
        approvedAt: new Date(),
      },
    });
    totalMemberships++;

    // Create national posts
    const numPosts = 2 + Math.floor(Math.random() * 3);
    const nationalPostContent = getRandomItems(NATIONAL_POSTS, numPosts);

    for (const content of nationalPostContent) {
      await prisma.post.create({
        data: {
          content,
          authorId: user.id,
          orgId: apcNational.id,
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

    // Create state organization
    const stateSlug = `apc-${state.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    let stateOrg = await prisma.organization.findFirst({ where: { slug: stateSlug } });

    if (!stateOrg) {
      stateOrg = await prisma.organization.create({
        data: {
          name: `APC ${state.name} State`,
          slug: stateSlug,
          description: `All Progressives Congress - ${state.name} State Chapter`,
          level: OrgLevel.STATE,
          movementId: apcMovement.id,
          parentId: apcNational.id,
          isVerified: true,
          isActive: true,
          countryId: nigeria.id,
          stateId: state.id,
          inviteCode: await generateUniqueInviteCode(usedInviteCodes),
          memberCount: 0,
        },
      });
    }
    createdOrgs[state.id] = stateOrg;

    // Create state level users (3-5)
    const numStateUsers = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numStateUsers; i++) {
      const name = generateName(zone);
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
          gender: getRandomItem(genders),
        },
      });

      // Add to state org
      await prisma.orgMembership.create({
        data: {
          userId: user.id,
          orgId: stateOrg.id,
          isAdmin: i === 0,
          approvedAt: new Date(),
        },
      });
      totalMemberships++;

      // Create state posts
      const numPosts = 2 + Math.floor(Math.random() * 2);
      const statePostContent = getRandomItems(STATE_POSTS, numPosts);

      for (const content of statePostContent) {
        await prisma.post.create({
          data: {
            content,
            authorId: user.id,
            orgId: stateOrg.id,
            stateId: state.id,
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

    // Process LGAs (limit to first 5 for reasonable seed time)
    const lgasToProcess = state.lgas.slice(0, 5);

    for (const lga of lgasToProcess) {
      // Create LGA organization
      const lgaSlug = `apc-${state.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${lga.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      let lgaOrg = await prisma.organization.findFirst({ where: { slug: lgaSlug } });

      if (!lgaOrg) {
        lgaOrg = await prisma.organization.create({
          data: {
            name: `APC ${lga.name} LGA`,
            slug: lgaSlug,
            description: `All Progressives Congress - ${lga.name} Local Government Area, ${state.name} State`,
            level: OrgLevel.LGA,
            movementId: apcMovement.id,
            parentId: stateOrg.id,
            isVerified: true,
            isActive: true,
            countryId: nigeria.id,
            stateId: state.id,
            lgaId: lga.id,
            inviteCode: await generateUniqueInviteCode(usedInviteCodes),
            memberCount: 0,
          },
        });
      }

      // Create LGA users (2-3)
      const numLgaUsers = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numLgaUsers; i++) {
        const name = generateName(zone);
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
            gender: getRandomItem(genders),
          },
        });

        await prisma.orgMembership.create({
          data: {
            userId: user.id,
            orgId: lgaOrg.id,
            isAdmin: i === 0,
            approvedAt: new Date(),
          },
        });
        totalMemberships++;

        // Create LGA posts
        const numPosts = 1 + Math.floor(Math.random() * 2);
        const lgaPostContent = getRandomItems(LGA_POSTS, numPosts);

        for (const content of lgaPostContent) {
          await prisma.post.create({
            data: {
              content,
              authorId: user.id,
              orgId: lgaOrg.id,
              stateId: state.id,
              lgaId: lga.id,
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
        // Create Ward organization
        const wardSlug = `apc-${lga.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ward.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        let wardOrg = await prisma.organization.findFirst({ where: { slug: wardSlug } });

        if (!wardOrg) {
          wardOrg = await prisma.organization.create({
            data: {
              name: `APC ${ward.name}`,
              slug: wardSlug,
              description: `All Progressives Congress - ${ward.name}, ${lga.name} LGA`,
              level: OrgLevel.WARD,
              movementId: apcMovement.id,
              parentId: lgaOrg.id,
              isVerified: true,
              isActive: true,
              countryId: nigeria.id,
              stateId: state.id,
              lgaId: lga.id,
              wardId: ward.id,
              inviteCode: await generateUniqueInviteCode(usedInviteCodes),
              memberCount: 0,
            },
          });
        }

        // Create Ward users (2-4)
        const numWardUsers = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numWardUsers; i++) {
          const name = generateName(zone);
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
              gender: getRandomItem(genders),
            },
          });

          await prisma.orgMembership.create({
            data: {
              userId: user.id,
              orgId: wardOrg.id,
              isAdmin: i === 0,
              approvedAt: new Date(),
            },
          });
          totalMemberships++;

          // Create Ward posts
          const numPosts = 2 + Math.floor(Math.random() * 3);
          const wardPostContent = getRandomItems(WARD_POSTS, numPosts);

          for (const content of wardPostContent) {
            await prisma.post.create({
              data: {
                content,
                authorId: user.id,
                orgId: wardOrg.id,
                stateId: state.id,
                lgaId: lga.id,
                wardId: ward.id,
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
          // Create PU organization
          const puSlug = `apc-${ward.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${pu.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          let puOrg = await prisma.organization.findFirst({ where: { slug: puSlug } });

          if (!puOrg) {
            puOrg = await prisma.organization.create({
              data: {
                name: `APC ${pu.name}`,
                slug: puSlug,
                description: `All Progressives Congress - ${pu.name}, ${ward.name}`,
                level: OrgLevel.POLLING_UNIT,
                movementId: apcMovement.id,
                parentId: wardOrg.id,
                isVerified: true,
                isActive: true,
                countryId: nigeria.id,
                stateId: state.id,
                lgaId: lga.id,
                wardId: ward.id,
                pollingUnitId: pu.id,
                inviteCode: await generateUniqueInviteCode(usedInviteCodes),
                memberCount: 0,
              },
            });
          }

          // Create PU users (3-6 for more intimate feel)
          const numPuUsers = 3 + Math.floor(Math.random() * 4);
          for (let i = 0; i < numPuUsers; i++) {
            const name = generateName(zone);
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
                gender: getRandomItem(genders),
              },
            });

            await prisma.orgMembership.create({
              data: {
                userId: user.id,
                orgId: puOrg.id,
                isAdmin: i === 0,
                approvedAt: new Date(),
              },
            });
            totalMemberships++;

            // Create PU posts (more posts for polling units - more intimate)
            const numPosts = 3 + Math.floor(Math.random() * 4);
            const allPuPosts = getPostsForLevel('POLLING_UNIT');
            const puPostContent = getRandomItems(allPuPosts, numPosts);

            for (const content of puPostContent) {
              await prisma.post.create({
                data: {
                  content,
                  authorId: user.id,
                  orgId: puOrg.id,
                  stateId: state.id,
                  lgaId: lga.id,
                  wardId: ward.id,
                  pollingUnitId: pu.id,
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

    // Progress update
    if (totalPosts % 500 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      console.log(`\n   📊 Progress: ${totalPosts.toLocaleString()} posts, ${totalUsers.toLocaleString()} users (${elapsed} mins)\n`);
    }
  }

  // Update member counts for all organizations
  console.log('\n📊 Updating organization member counts...');
  const orgs = await prisma.organization.findMany({
    where: { movementId: apcMovement.id },
    select: { id: true },
  });

  for (const org of orgs) {
    const count = await prisma.orgMembership.count({
      where: { orgId: org.id, isActive: true },
    });
    await prisma.organization.update({
      where: { id: org.id },
      data: { memberCount: count },
    });
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n========================================');
  console.log('✅ APC CAMPAIGN SEEDING COMPLETE!');
  console.log('========================================');
  console.log(`\n📊 Summary:`);
  console.log(`   - Users created: ${totalUsers.toLocaleString()}`);
  console.log(`   - Posts created: ${totalPosts.toLocaleString()}`);
  console.log(`   - Memberships: ${totalMemberships.toLocaleString()}`);
  console.log(`   - Organizations: ${orgs.length.toLocaleString()}`);
  console.log(`   - Time taken: ${totalTime} minutes`);
  console.log(`\n🔑 Password for all APC users: apc2027`);
  console.log(`🏛️ Movement: All Progressives Congress`);
  console.log(`📍 Organization code: APC`);
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
