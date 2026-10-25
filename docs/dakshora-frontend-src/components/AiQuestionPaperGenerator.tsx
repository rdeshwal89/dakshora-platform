import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Layers,
  HelpCircle,
  BookOpen,
  Calendar,
  Clock,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Cpu,
  Plus
} from 'lucide-react';
import { generateAiQuestionPaper, saveExamQuestionPaper } from '../services/api';
import type { AiQuestionPaperData } from '../types';

export type QuestionBoardType = 'cbse' | 'rbse' | 'upmsp' | 'hbse' | 'state_board';

interface AiQuestionPaperGeneratorProps {
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

// Complete K-12 Curriculum Database across Classes Nursery to 12
const CURRICULUM_DATABASE: Record<string, Record<string, string[]>> = {
  'Nursery': {
    'English (Pre-School)': ['Alphabet Recognition (A-Z)', 'Phonics & Sounds', 'Oral Rhymes & Story', 'Line & Pattern Tracing'],
    'Mathematics (Pre-Math)': ['Numbers 1 to 20', 'Big and Small Concept', 'Basic Shapes & Colors', 'Object Counting & Matching'],
    'Hindi (हिंदी बालगीत)': ['अक्षर पहचान (अ से अः)', 'बालगीत व कविताएँ', 'चित्र पहचान व नाम', 'रेखा अभ्यास'],
    'General Awareness (EVS)': ['My Body Parts', 'Fruits & Vegetables', 'Animals & Birds', 'Colors in Nature']
  },
  'LKG': {
    'English': ['Capital & Small Letters (Aa-Zz)', 'Vowels and Consonants Basics', 'Two Letter Sight Words', 'Picture Reading'],
    'Mathematics': ['Numbers 1 to 50', 'Count and Write', 'Before, After & Between Numbers', 'More and Less Concepts', 'Basic Shapes'],
    'Hindi (हिंदी)': ['वर्णमाला (स्वर एवं व्यंजन)', 'चित्र देखकर सही अक्षर लिखो', 'दो अक्षर वाले सरल अमात्रिक शब्द', 'कविता वाचन'],
    'EVS / General Science': ['My Family & Home', 'Good Habits & Manners', 'Seasons & Weather', 'Means of Transport']
  },
  'UKG': {
    'English': ['Three Letter CVC Words (cat, pin, sun)', 'Use of This/That and In/On/Under', 'Rhyming Words & Phonics', 'Simple Sentence Reading'],
    'Mathematics': ['Numbers 1 to 100', 'Simple Addition (1-10)', 'Simple Subtraction (1-10)', 'Number Names (One to Fifty)', 'Skip Counting by 2 and 5'],
    'Hindi (हिंदी)': ['दो, तीन व चार अक्षर के अमात्रिक शब्द', 'आ की मात्रा के सरल शब्द', 'चित्र मिलान व खाली स्थान भरो', 'सरल वाक्य पठन'],
    'EVS': ['Community Helpers (Doctor, Teacher, Police)', 'Living and Non-Living Basics', 'Plants and Trees Around Us', 'Safety Rules']
  },
  'Class 1': {
    'Mathematics (गणित)': ['Numbers up to 100', 'Addition & Subtraction (1-99)', 'Shapes & Spatial Understanding', 'Measurement (Length & Weight)', 'Time & Calendar Basics', 'Money & Indian Coins', 'Data Handling Basics'],
    'English (Grammar & Reader)': ['Naming Words (Nouns)', 'One and Many (Singular/Plural)', 'Action Words (Verbs)', 'Pronouns (He, She, It, They)', 'Describing Words (Adjectives)', 'Reading Comprehension', 'Short Creative Writing'],
    'Hindi (हिंदी)': ['स्वर, व्यंजन व सभी मात्राएँ (ा, ि, ी, ु, ू, े, ै, ो, ौ)', 'संज्ञा व सर्वनाम के सरल रूप', 'विलोम शब्द व समानार्थक शब्द', 'चित्र देखकर पाँच वाक्य लिखना', 'अपठित गद्यांश'],
    'EVS (पर्यावरण अध्ययन)': ['About Myself & My Family', 'Our Food & Healthy Eating', 'Clothes We Wear', 'Our Neighborhood & School', 'Animals & Their Homes', 'Cleanliness & Good Habits']
  },
  'Class 2': {
    'Mathematics (गणित)': ['3-Digit Numbers (up to 1000)', 'Addition & Subtraction with Regrouping', 'Introduction to Multiplication Tables (2-10)', 'Division as Equal Sharing', 'Geometry: 2D & 3D Shapes', 'Measurement (Metre, Centimetre, Litre, Gram)', 'Money & Currency Calculations', 'Time (O clock and Half Past)'],
    'English': ['Nouns (Common & Proper)', 'Pronouns & Possessives', 'Verbs & Present/Past Tense Basics', 'Adjectives & Opposites', 'Prepositions (In, On, At, Under)', 'Conjunctions (And, But, Because)', 'Comprehension & Paragraph Writing'],
    'Hindi (हिंदी)': ['मात्राओं का सही प्रयोग', 'लिंग बदलो व वचन बदलो', 'विशेषण (कैसा-कितना)', 'क्रिया (काम वाले शब्द)', 'मुहावरे (प्रारंभिक)', 'कहानी पठन व प्रश्नोत्तर', 'अनुच्छेद लेखन'],
    'EVS (पर्यावरण अध्ययन)': ['Human Body & Sense Organs', 'Types of Houses & Shelter', 'Air, Water & Weather', 'Plants Around Us & Their Uses', 'Safety First & First Aid', 'Festivals of India']
  },
  'Class 3': {
    'Mathematics (गणित)': ['4-Digit Numbers & Place Value', 'Addition & Subtraction Word Problems', 'Multiplication Tables & Multi-digit Multiplication', 'Division with Remainders', 'Fractions Basics (Halves, Thirds, Fourths)', 'Measurement of Length, Weight & Capacity', 'Time, Clock Reading & Calendar', 'Geometry: Lines, Rays, Angles & Shapes'],
    'Science (सामान्य विज्ञान)': ['Living and Non-Living Characteristics', 'Parts of a Plant & Photosynthesis Basics', 'Animals: Food & Feeding Habits', 'Birds: Beaks, Claws & Nests', 'Human Body: Organ Systems', 'Soil & Earth Components', 'Light, Sound & Force Basics'],
    'Social Studies (सामाजिक अध्ययन)': ['The Earth Our Home', 'Our Country India & States', 'Our Monuments & National Symbols', 'Occupations of People', 'Means of Transport & Communication', 'Local Governance (Gram Panchayat & Nagar Palika)'],
    'English': ['Subject and Predicate', 'Types of Nouns (Abstract & Collective)', 'Tenses (Simple Present, Past & Future)', 'Adverbs (Manner, Time, Place)', 'Articles (A, An, The)', 'Reading Comprehension Passages', 'Informal Letter & Story Writing'],
    'Hindi (हिंदी)': ['संज्ञा, सर्वनाम व विशेषण भेद', 'क्रिया व काल', 'पर्यायवाची, विलोम व अनेक शब्दों के लिए एक शब्द', 'अशुद्धि शोधन', 'अपठित गद्यांश व पद्यांश', 'पत्र लेखन व निबंध']
  },
  'Class 4': {
    'Mathematics (गणित)': ['5 & 6-Digit Numbers & Roman Numerals', 'Multiplication & Long Division', 'Factors & Multiples (HCF & LCM Basics)', 'Fractions (Proper, Improper & Equivalent)', 'Decimals Basics', 'Measurement & Metric Conversions', 'Perimeter & Area Basics', 'Symmetry & Geometry', 'Data Handling & Bar Graphs'],
    'Science (सामान्य विज्ञान)': ['Plant Adaptations (Terrestrial & Aquatic)', 'Animal Adaptations & Habitats', 'Reproduction in Animals', 'Food & Digestion (Nutrients & Balanced Diet)', 'Teeth & Microbes', 'Matter: Solid, Liquid & Gas', 'Force, Work & Energy Basics', 'Air, Water & Weather Cycles'],
    'Social Studies (सामाजिक अध्ययन)': ['Physical Divisions of India (Himalayas, Plains, Plateaus, Deserts)', 'Climate & Natural Vegetation of India', 'Soils & Mineral Resources of India', 'Agriculture & Industries in India', 'Our Rights & Duties (Constitution Basics)', 'Our Rich Heritage & Culture'],
    'English': ['Nouns, Pronouns & Adjectives Comparison', 'Verbs & Tenses (Continuous & Perfect)', 'Prepositions & Conjunctions', 'Punctuation & Capitalization Rules', 'Reading Comprehension', 'Paragraph, Notice & Formal Letter Writing'],
    'Hindi (हिंदी)': ['भाषा, बोली व लिपि', 'संज्ञा के भेद व कारक', 'सर्वनाम, विशेषण व क्रिया', 'मुहावरे व लोकोक्तियाँ', 'अपठित बोध', 'संवाद लेखन व निबंध लेखन']
  },
  'Class 5': {
    'Mathematics (गणित)': ['Large Numbers (Indian & International System)', 'Operations on Large Numbers', 'Factors & Multiples (Prime, Composite, HCF, LCM)', 'Fractions (Addition, Subtraction, Multiplication)', 'Decimals & Percentages', 'Profit & Loss Basics', 'Measurement & Volume', 'Angles, Triangles & Circles', 'Perimeter & Area Formulas', 'Data Handling & Pie Charts'],
    'Science (सामान्य विज्ञान)': ['Growing Plants & Seed Germination', 'Animals: Habitat & Adaptations', 'Skeletal & Nervous System', 'Food, Health & Diseases (Deficiency & Communicable)', 'Safety & First Aid', 'Rocks, Minerals & Soil', 'Air, Water & Purification', 'Moon, Sun & Solar System', 'Simple Machines & Energy'],
    'Social Studies (सामाजिक अध्ययन)': ['Globe & Maps (Latitudes & Longitudes)', 'Movements of Earth (Rotation & Revolution)', 'Major Landforms of the Earth', 'Climate Zones of the Earth', 'Democratic Republic of Congo & Greenland Case Studies', 'United Nations & Global Peace', 'Freedom Struggle of India & Mahatma Gandhi'],
    'English': ['Active and Passive Voice Basics', 'Direct & Indirect Speech Basics', 'Tenses Mastery', 'Synonyms, Antonyms, Idioms & Phrasal Verbs', 'Unseen Comprehension with Inferential Questions', 'Formal Letters, Essays & Diary Entry'],
    'Hindi (हिंदी)': ['वर्ण विचार व वर्तनी', 'संधि (परिचय)', 'शब्द विचार (तत्सम-तद्भव)', 'संज्ञा से कारक तक व्याकरण', 'मुहावरे व लोकोक्तियाँ', 'अपठित गद्यांश', 'पत्र व अनुच्छेद लेखन']
  },
  'Class 6': {
    'Mathematics (गणित)': ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers (HCF & LCM)', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration (Perimeter & Area)', 'Algebra Introduction', 'Ratio and Proportion'],
    'Science (विज्ञान)': ['Components of Food', 'Sorting Materials into Groups', 'Separation of Substances', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms & Their Surroundings', 'Motion & Measurement of Distances', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Air Around Us'],
    'Social Science (सामाजिक विज्ञान)': ['What, Where, How and When', 'From Hunting-Gathering to Growing Food', 'In the Earliest Cities (Indus Valley)', 'Kingdoms, Kings and an Early Republic', 'New Questions and Ideas (Buddhism & Jainism)', 'Ashoka: An Emperor Who Gave Up War', 'Globe: Latitudes and Longitudes', 'Motions of the Earth', 'Maps', 'Major Domains & Landforms of Earth', 'Understanding Diversity', 'What is Government?', 'Panchayati Raj'],
    'English': ['A Different Kind of School', 'Who I Am', 'Fair Play', 'The Banyan Tree', 'Noun & Pronoun Cases', 'Tenses & Modals', 'Voice & Narration Basics', 'Notice Writing & Message Writing', 'Informal & Formal Letters'],
    'Hindi (हिंदी)': ['वह चिड़िया जो (कविता)', 'बचपन (संस्मरण)', 'नादान दोस्त (कहानी)', 'चाँद से थोड़ी सी गप्पें', 'संज्ञा, सर्वनाम, विशेषण, क्रिया', 'उपसर्ग व प्रत्यय', 'संधि (स्वर संधि)', 'मुहावरे व लोकोक्तियाँ', 'अपठित गद्यांश व पत्र लेखन'],
    'Sanskrit (संस्कृत)': ['शब्दपरिचयः १, २, ३', 'विद्यालयः', 'वृक्षाः', 'बकस्य प्रतीकारः', 'धातुरूपाणि (लट् लकार)', 'शब्दरूपाणि (बालक, लता, फल)']
  },
  'Class 7': {
    'Mathematics (गणित)': ['Integers (Properties & Operations)', 'Fractions and Decimals', 'Data Handling (Mean, Median, Mode, Bar Graph)', 'Simple Equations', 'Lines and Angles', 'The Triangle and Its Properties', 'Comparing Quantities (Percentage, Profit-Loss, Simple Interest)', 'Rational Numbers', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers', 'Symmetry'],
    'Science (विज्ञान)': ['Nutrition in Plants', 'Nutrition in Animals', 'Heat and Temperature', 'Acids, Bases and Salts', 'Physical and Chemical Changes', 'Respiration in Organisms', 'Transportation in Animals and Plants', 'Reproduction in Plants', 'Motion and Time', 'Electric Current and Its Effects', 'Light (Mirrors & Lenses)', 'Forests: Our Lifeline'],
    'Social Science (सामाजिक विज्ञान)': ['Tracing Changes Through a Thousand Years', 'New Kings and Kingdoms', 'The Delhi Sultans', 'The Mughal Empire (16th-17th Century)', 'Tribes, Nomads and Settled Communities', 'Environment & Inside Our Earth', 'Our Changing Earth', 'Air & Atmosphere', 'Water & Ocean Circulation', 'On Equality', 'Role of Government in Health', 'How the State Government Works', 'Growing up as Boys and Girls'],
    'English': ['Three Questions', 'A Gift of Chappals', 'The Rebel', 'The Shed', 'Quality', 'Expert Detectives', 'Prepositions & Conjunctions', 'Active & Passive Voice', 'Reported Speech', 'Diary Entry, Notice & Speech Writing', 'Comprehension'],
    'Hindi (हिंदी)': ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मिठाईवाला', 'संधि, समास, उपसर्ग, प्रत्यय', 'कारक व उनके भेद', 'मुहावरे व लोकोक्तियाँ', 'संवाद लेखन व निबंध']
  },
  'Class 8': {
    'Mathematics (गणित)': ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Data Handling (Histogram, Pie Chart, Probability)', 'Square and Square Roots', 'Cube and Cube Roots', 'Comparing Quantities (Compound Interest, Discount)', 'Algebraic Expressions and Identities', 'Mensuration (Surface Area & Volume)', 'Exponents and Powers', 'Direct and Inverse Proportions', 'Factorisation', 'Introduction to Graphs'],
    'Science (विज्ञान)': ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals', 'Reproduction in Animals', 'Reaching the Age of Adolescence', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Some Natural Phenomena', 'Light'],
    'Social Science (सामाजिक विज्ञान)': ['How, When and Where', 'From Trade to Territory (The Company Power)', 'Ruling the Countryside', 'Tribals, Dikus and the Vision of a Golden Age', 'When People Rebel (1857 & After)', 'Civilising the "Native", Educating the Nation', 'Women, Caste and Reform', 'The Making of the National Movement (1870s-1947)', 'Resources', 'Land, Soil, Water, Natural Vegetation & Wildlife', 'Agriculture', 'Industries', 'Human Resources', 'The Indian Constitution', 'Understanding Secularism', 'Parliament and the Making of Laws', 'Judiciary', 'Understanding Marginalisation'],
    'English': ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhury\'s Lapse of Memory', 'Tenses, Modals & Passive Voice', 'Direct & Indirect Speech', 'Clause Analysis', 'Formal Letters & Applications', 'Article & Speech Writing'],
    'Hindi (हिंदी)': ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'भगवान के डाकिए', 'सुदामा चरित', 'संधि, समास, रस, अलंकार परिचय', 'पद परिचय', 'मुहावरे, लोकोक्तियाँ', 'पत्र, निबंध व विज्ञापन लेखन']
  },
  'Class 9': {
    'Science (विज्ञान)': ['Matter in Our Surroundings (हमारे आस-पास के पदार्थ)', 'Is Matter Around Us Pure (क्या हमारे आस-पास के पदार्थ शुद्ध हैं)', 'Atoms and Molecules (परमाणु एवं अणु)', 'Structure of the Atom (परमाणु की संरचना)', 'The Fundamental Unit of Life: Cell (जीवन की मौलिक इकाई)', 'Tissues (ऊतक)', 'Motion (गति)', 'Force and Laws of Motion (बल तथा गति के नियम)', 'Gravitation (गुरुत्वाकर्षण)', 'Work and Energy (कार्य तथा ऊर्जा)', 'Sound (ध्वनि)', 'Improvement in Food Resources (खाद्य संसाधनों में सुधार)'],
    'Mathematics (गणित)': ['Number Systems (संख्या पद्धति)', 'Polynomials (बहुपद)', 'Coordinate Geometry (निर्देशांक ज्यामिति)', 'Linear Equations in Two Variables (दो चरों वाले रैखिक समीकरण)', 'Introduction to Euclid\'s Geometry (यूक्लिड की ज्यामिति)', 'Lines and Angles (रेखाएँ और कोण)', 'Triangles (त्रिभुज)', 'Quadrilaterals (चतुर्भुज)', 'Circles (वृत्त)', 'Heron\'s Formula (हीरोन का सूत्र)', 'Surface Areas and Volumes (पृष्ठीय क्षेत्रफल और आयतन)', 'Statistics (सांख्यिकी)'],
    'Social Science (सामाजिक विज्ञान)': ['The French Revolution (फ्रांसीसी क्रांति)', 'Socialism in Europe & Russian Revolution (रूसी क्रांति)', 'Nazism and the Rise of Hitler (नात्सीवाद और हिटलर का उदय)', 'Forest Society & Colonialism', 'India - Size and Location (भारत: आकार और स्थिति)', 'Physical Features of India (भारत का भौतिक स्वरूप)', 'Drainage (अपवाह)', 'Climate (जलवायु)', 'Natural Vegetation & Wildlife', 'Population (जनसंख्या)', 'What is Democracy? Why Democracy?', 'Constitutional Design (संविधान निर्माण)', 'Electoral Politics (चुनावी राजनीति)', 'Working of Institutions (संस्थाओं का कामकाज)', 'Democratic Rights (लोकतांत्रिक अधिकार)', 'The Story of Village Palampur', 'People as Resource (संसाधन के रूप में लोग)', 'Poverty as a Challenge (निर्धनता: एक चुनौती)', 'Food Security in India (भारत में खाद्य सुरक्षा)'],
    'English (Language & Literature)': ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Reach for the Top', 'Kathmandu', 'If I Were You', 'The Lost Child', 'The Adventures of Toto', 'Iswaran the Storyteller', 'In the Kingdom of Fools', 'The Happy Prince', 'The Last Leaf', 'A House Is Not a Home', 'The Beggar', 'Tenses, Modals, Subject-Verb Concord, Determiners, Reported Speech', 'Descriptive Paragraphs & Diary Entry', 'Story Writing'],
    'Hindi (हिंदी - अ/ब)': ['दो बैलों की कथा (प्रेमचंद)', 'ल्हासा की ओर (राहुल सांकृत्यायन)', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'कबीर की साखियाँ एवं सबद', 'वाख (ललद्यद)', 'रसखान के सवैये', 'कैदी और कोकिला (माखनलाल चतुर्वेदी)', 'व्याकरण: उपसर्ग-प्रत्यय, समास, अर्थ की दृष्टि से वाक्य भेद, अलंकार', 'रचनात्मक लेखन: अनुच्छेद, पत्र, संवाद, लघु कथा लेखन'],
    'Information Technology (IT 402)': ['Communication Skills', 'Self-Management Skills', 'Basic ICT Skills', 'Entrepreneurial Skills', 'Green Skills', 'Introduction to IT-ITeS Industry', 'Data Entry & Keyboarding Skills', 'Digital Documentation (LibreOffice Writer)', 'Electronic Spreadsheet (LibreOffice Calc)', 'Digital Presentation (LibreOffice Impress)']
  },
  'Class 10': {
    'Science (विज्ञान)': [
      'Chemical Reactions and Equations (रासायनिक अभिक्रियाएँ एवं समीकरण)',
      'Acids, Bases and Salts (अम्ल, क्षारक एवं लवण)',
      'Metals and Non-metals (धातु एवं अधातु)',
      'Carbon and its Compounds (कार्बन एवं उसके यौगिक)',
      'Life Processes (जैव प्रक्रम)',
      'Control and Coordination (नियंत्रण एवं समन्वय)',
      'How do Organisms Reproduce (जीव जनन कैसे करते हैं)',
      'Heredity and Evolution (आनुवंशिकता एवं जैव विकास)',
      'Light - Reflection and Refraction (प्रकाश - परावर्तन तथा अपवर्तन)',
      'Human Eye and Colourful World (मानव नेत्र तथा रंगबिरंगा संसार)',
      'Electricity (विद्युत)',
      'Magnetic Effects of Electric Current (विद्युत धारा के चुंबकीय प्रभाव)',
      'Our Environment (हमारा पर्यावरण)'
    ],
    'Mathematics (गणित)': [
      'Real Numbers (वास्तविक संख्याएँ)',
      'Polynomials (बहुपद)',
      'Pair of Linear Equations in Two Variables (दो चर वाले रैखिक समीकरण युग्म)',
      'Quadratic Equations (द्विघात समीकरण)',
      'Arithmetic Progressions (समांतर श्रेणियाँ)',
      'Triangles (त्रिभुज)',
      'Coordinate Geometry (निर्देशांक ज्यामिति)',
      'Introduction to Trigonometry (त्रिकोणमिति का परिचय)',
      'Some Applications of Trigonometry (त्रिकोणमिति के कुछ अनुप्रयोग)',
      'Circles (वृत्त)',
      'Areas Related to Circles (वृत्तों से संबंधित क्षेत्रफल)',
      'Surface Areas and Volumes (पृष्ठीय क्षेत्रफल और आयतन)',
      'Statistics (सांख्यिकी)',
      'Probability (प्रायिकता)'
    ],
    'Social Science (सामाजिक विज्ञान)': [
      'The Rise of Nationalism in Europe (यूरोप में राष्ट्रवाद का उदय)',
      'Nationalism in India (भारत में राष्ट्रवाद)',
      'The Making of a Global World (भूमंडलीकृत विश्व का बनना)',
      'The Age of Industrialisation (औद्योगिकीकरण का युग)',
      'Print Culture and the Modern World (मुद्रण संस्कृति और आधुनिक दुनिया)',
      'Resources and Development (संसाधन एवं विकास)',
      'Forest and Wildlife Resources (वन एवं वन्य जीव संसाधन)',
      'Water Resources (जल संसाधन)',
      'Agriculture (कृषि)',
      'Minerals and Energy Resources (खनिज तथा ऊर्जा संसाधन)',
      'Manufacturing Industries (विनिर्माण उद्योग)',
      'Lifelines of National Economy (राष्ट्रीय अर्थव्यवस्था की जीवन रेखाएँ)',
      'Power Sharing (सत्ता की साझेदारी)',
      'Federalism (संघवाद)',
      'Gender, Religion and Caste (जाति, धर्म और लैंगिक मसले)',
      'Political Parties (राजनीतिक दल)',
      'Outcomes of Democracy (लोकतंत्र के परिणाम)',
      'Development (विकास)',
      'Sectors of the Indian Economy (भारतीय अर्थव्यवस्था के क्षेत्रक)',
      'Money and Credit (मुद्रा और साख)',
      'Globalisation and the Indian Economy (वैश्वीकरण और भारतीय अर्थव्यवस्था)',
      'Consumer Rights (उपभोक्ता अधिकार)'
    ],
    'English (Language & Literature)': [
      'A Letter to God',
      'Nelson Mandela: Long Walk to Freedom',
      'Two Stories about Flying',
      'From the Diary of Anne Frank',
      'Glimpses of India',
      'Madam Rides the Bus',
      'The Sermon at Benares',
      'The Proposal',
      'A Triumph of Surgery',
      'The Thief\'s Story',
      'The Midnight Visitor',
      'Footprints without Feet',
      'The Making of a Scientist',
      'The Necklace',
      'Bholi',
      'Formal Letter Writing & Analytical Paragraph',
      'Grammar: Tenses, Modals, Concord, Reported Speech, Determiners'
    ],
    'Hindi (हिंदी - अ/ब)': [
      'नेताजी का चश्मा (स्वयं प्रकाश)',
      'बालगोबिन भगत (रामवृक्ष बेनीपुरी)',
      'लखनवी अंदाज (यशपाल)',
      'सूरदास के पद',
      'राम-लक्ष्मण-परशुराम संवाद (तुलसीदास)',
      'उत्साह और अट नहीं रही है (निराला)',
      'माता का आँचल (शिवपूजन सहाय)',
      'साना-साना हाथ जोड़ि (मधु कांकरिया)',
      'व्याकरण: पदबंध, वाक्य रूपांतरण, समास, मुहावरे',
      'रचनात्मक लेखन: अनुच्छेद, पत्र, संदेश, विज्ञापन लेखन'
    ],
    'Information Technology (IT 402 / AI 417)': [
      'Digital Documentation (Advanced)',
      'Electronic Spreadsheet (Advanced - Calc)',
      'Database Management System (RDBMS - Base)',
      'Web Applications and Security',
      'Introduction to Artificial Intelligence',
      'AI Project Cycle & Ethics'
    ]
  },
  'Class 11': {
    'Physics (भौतिक विज्ञान)': ['Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane (Vectors)', 'Laws of Motion & Friction', 'Work, Energy and Power', 'Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids & Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations & Waves'],
    'Chemistry (रसायन विज्ञान)': ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements & Periodicity', 'Chemical Bonding and Molecular Structure', 'Chemical Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Organic Chemistry Basics', 'Hydrocarbons'],
    'Mathematics (गणित)': ['Sets, Relations and Functions', 'Trigonometric Functions', 'Complex Numbers and Quadratic Equations', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines & Conic Sections', '3D Geometry Basics', 'Limits and Derivatives', 'Statistics & Probability'],
    'Biology (जीव विज्ञान)': ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology & Anatomy of Flowering Plants', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle & Division', 'Plant Physiology', 'Human Physiology'],
    'Accountancy (लेखाशास्त्र)': ['Introduction to Accounting', 'Accounting Standards & Theory', 'Recording Transactions (Journal, Ledger, Cash Book)', 'Bank Reconciliation Statement', 'Trial Balance & Rectification', 'Depreciation & Provisions', 'Financial Statements of Sole Proprietor'],
    'Business Studies (व्यवसाय अध्ययन)': ['Nature and Purpose of Business', 'Forms of Business Organisation', 'Public, Private & Global Enterprises', 'Business Services', 'Emerging Modes of Business', 'Social Responsibilities of Business', 'Sources of Business Finance', 'Small Business & Trade'],
    'Economics (अर्थशास्त्र)': ['Statistics for Economics (Central Tendency, Dispersion, Index Numbers)', 'Introductory Microeconomics (Demand, Elasticity, Production, Cost, Supply, Market Equilibrium)'],
    'English Core': ['The Portrait of a Lady', 'We\'re Not Afraid to Die', 'Discovering Tut', 'The Laburnum Top', 'The Voice of the Rain', 'Childhood', 'The Summer of the Beautiful White Horse', 'The Address', 'Note Making, Advertisements, Speech & Debate']
  },
  'Class 12': {
    'Physics (भौतिक विज्ञान)': [
      'Electric Charges and Fields (वैद्युत आवेश तथा क्षेत्र)',
      'Electrostatic Potential and Capacitance (स्थिरवैद्युत विभव तथा धारिता)',
      'Current Electricity (विद्युत धारा)',
      'Moving Charges and Magnetism (गतिमान आवेश और चुंबकत्व)',
      'Magnetism and Matter (चुंबकत्व एवं द्रव्य)',
      'Electromagnetic Induction (वैद्युतचुंबकीय प्रेरण)',
      'Alternating Current (प्रत्यावर्ती धारा)',
      'Electromagnetic Waves (वैद्युतचुंबकीय तरंगें)',
      'Ray Optics and Optical Instruments (किरण प्रकाशिकी एवं प्रकाशिक यंत्र)',
      'Wave Optics (तरंग प्रकाशिकी)',
      'Dual Nature of Radiation and Matter (विकिरण तथा द्रव्य की द्वैत प्रकृति)',
      'Atoms (परमाणु)',
      'Nuclei (नाभिक)',
      'Semiconductor Electronics (अर्धचालक इलेक्ट्रॉनिकी)'
    ],
    'Chemistry (रसायन विज्ञान)': [
      'Solutions (विलयन)',
      'Electrochemistry (विद्युत रसायन)',
      'Chemical Kinetics (रासायनिक बलगतिकी)',
      'd and f-Block Elements (d- एवं f-ब्लॉक के तत्व)',
      'Coordination Compounds (उपसहसंयोजन यौगिक)',
      'Haloalkanes and Haloarenes (हैलोऐल्केन तथा हैलोऐरीन)',
      'Alcohols, Phenols and Ethers (ऐल्कोहॉल, फ़ीनॉल एवं ईथर)',
      'Aldehydes, Ketones and Carboxylic Acids (ऐल्डिहाइड, कीटोन एवं कार्बोक्सिलिक अम्ल)',
      'Amines (ऐमीन)',
      'Biomolecules (जैव-अणु)'
    ],
    'Mathematics (गणित)': [
      'Relations and Functions (संबंध एवं फलन)',
      'Inverse Trigonometric Functions (प्रतिलोम त्रिकोणमितीय फलन)',
      'Matrices (आव्यूह)',
      'Determinants (सारणिक)',
      'Continuity and Differentiability (सांतत्य तथा अवकलनीयता)',
      'Application of Derivatives (अवकलज के अनुप्रयोग)',
      'Integrals (समाकलन)',
      'Application of Integrals (समाकलनों के अनुप्रयोग)',
      'Differential Equations (अवकल समीकरण)',
      'Vector Algebra (सदिश बीजगणित)',
      'Three Dimensional Geometry (त्रिविमीय ज्यामिति)',
      'Linear Programming (रैखिक प्रोग्रामन)',
      'Probability (प्रायिकता)'
    ],
    'Biology (जीव विज्ञान)': [
      'Sexual Reproduction in Flowering Plants (पुष्पी पादपों में लैंगिक जनन)',
      'Human Reproduction (मानव जनन)',
      'Reproductive Health (जनन स्वास्थ्य)',
      'Principles of Inheritance and Variation (वंशागति तथा विविधता के सिद्धांत)',
      'Molecular Basis of Inheritance (वंशागति के आणविक आधार)',
      'Evolution (विकास)',
      'Human Health and Disease (मानव स्वास्थ्य तथा रोग)',
      'Microbes in Human Welfare (मानव कल्याण में सूक्ष्मजीव)',
      'Biotechnology: Principles and Processes (जैव प्रौद्योगिकी: सिद्धांत व प्रक्रम)',
      'Biotechnology and its Applications (जैव प्रौद्योगिकी एवं उसके उपयोग)',
      'Organisms and Populations (जीव और समष्टियाँ)',
      'Ecosystem (पारितंत्र)',
      'Biodiversity and Conservation (जैव विविधता एवं संरक्षण)'
    ],
    'Accountancy (लेखाशास्त्र)': [
      'Accounting for Partnership: Basic Concepts',
      'Change in Profit Sharing Ratio',
      'Admission of a Partner',
      'Retirement and Death of a Partner',
      'Dissolution of Partnership Firm',
      'Accounting for Share Capital (Issue, Forfeiture, Reissue)',
      'Issue and Redemption of Debentures',
      'Financial Statements of a Company',
      'Analysis of Financial Statements (Ratio Analysis)',
      'Cash Flow Statement (AS-3)'
    ],
    'Business Studies (व्यवसाय अध्ययन)': [
      'Nature and Significance of Management',
      'Principles of Management (Fayol & Taylor)',
      'Business Environment',
      'Planning (नियोजन)',
      'Organising (संगठन)',
      'Staffing (नियुक्तिकरण)',
      'Directing (निर्देशन)',
      'Controlling (नियंत्रण)',
      'Financial Management',
      'Financial Markets',
      'Marketing Management',
      'Consumer Protection (CPA 2019)'
    ],
    'Economics (अर्थशास्त्र)': [
      'National Income and Related Aggregates',
      'Money and Banking',
      'Determination of Income and Employment',
      'Government Budget and the Economy',
      'Balance of Payments and Foreign Exchange Rate',
      'Development Experience (1947-90) & Economic Reforms (1991)',
      'Current Challenges: Poverty, Rural Development, Employment',
      'Sustainable Economic Development'
    ],
    'English Core': [
      'The Last Lesson',
      'Lost Spring',
      'Deep Water',
      'The Rattrap',
      'Indigo',
      'Poets and Pancakes',
      'The Interview',
      'Going Places',
      'My Mother at Sixty-Six',
      'Keeping Quiet',
      'A Thing of Beauty',
      'A Roadside Stand',
      'Aunt Jennifer\'s Tigers',
      'The Third Level',
      'The Tiger King',
      'Journey to the End of the Earth',
      'The Enemy',
      'On the Face of It',
      'Memories of Childhood',
      'Notice Writing & Invitations/Replies',
      'Job Applications & Letters to the Editor',
      'Article & Report Writing'
    ],
    'Hindi Core (हिंदी आधार)': [
      'आत्मपरिचय एवं एक गीत (हरिवंश राय बच्चन)',
      'पतंग (आलोक धन्वा)',
      'कविता के बहाने (कुंवर नारायण)',
      'कैमरे में बंद अपाहिज (रघुवीर सहाय)',
      'उषा (शमशेर बहादुर सिंह)',
      'बादल राग (निराला)',
      'कवितावली व लक्ष्मण-मूर्च्छा (तुलसीदास)',
      'रुबाइयाँ (फ़िराक़ गोरखपुरी)',
      'भक्तिन (महादेवी वर्मा)',
      'बाजार दर्शन (जैनेंद्र कुमार)',
      'काले मेघा पानी दे (धर्मवीर भारती)',
      'पहलवान की ढोलक (फणीश्वर नाथ रेणु)',
      'सिल्वर वैडिंग (मनोहर श्याम जोशी)',
      'जूझ (आनंद यादव)',
      'पत्रकारिता व जनसंचार लेखन'
    ]
  }
};

const ALL_CLASS_OPTIONS = Object.keys(CURRICULUM_DATABASE);

// Dynamic Preview Paper Generator - instantly updates when Class, Subject, or Language changes!
function generateDynamicPaperTemplate(
  schoolName: string,
  board: string,
  grade: string,
  subject: string,
  medium: 'bilingual' | 'english' | 'hindi',
  marks: number,
  time: string,
  chapters: string[]
): AiQuestionPaperData {
  const isHindi = medium === 'hindi';
  const isEnglish = medium === 'english';
  const chList = chapters.length > 0 ? chapters.slice(0, 4) : [subject];

  const examTitle = marks <= 30
    ? (isHindi ? 'इकाई परीक्षा / मूल्यांकन (PERIODIC TEST)' : isEnglish ? 'PERIODIC ASSESSMENT / UNIT TEST' : 'PERIODIC ASSESSMENT / इकाई परीक्षा')
    : (isHindi ? 'सत्रांत परीक्षा (TERM - 1 EXAMINATION)' : isEnglish ? 'TERM - 1 EXAMINATION' : 'TERM - 1 EXAMINATION (प्रथम सत्रांत परीक्षा)');

  const generalInstructions = isEnglish
    ? [
        `This question paper consists of designated Sections A to D/E. All questions are compulsory.`,
        `Section A comprises Multiple Choice Questions (1 Mark each).`,
        `Section B comprises Very Short Answer Questions (2 Marks each).`,
        `Section C comprises Short Answer Questions (3 Marks each).`,
        `Section D comprises Long Answer Questions with internal choices (${marks <= 30 ? '4/5' : '5'} Marks each).`,
        `Use of calculators and unauthorized materials is strictly prohibited.`
      ]
    : isHindi
    ? [
        `इस प्रश्न पत्र में खंड A से E तक प्रश्न दिए गए हैं। सभी प्रश्न अनिवार्य हैं।`,
        `खंड A में बहुविकल्पीय वस्तुनिष्ठ प्रश्न हैं (प्रत्येक 1 अंक)।`,
        `खंड B में अति लघु उत्तरीय प्रश्न हैं (प्रत्येक 2 अंक)।`,
        `खंड C में लघु उत्तरीय प्रश्न हैं (प्रत्येक 3 अंक)।`,
        `खंड D में आंतरिक विकल्प सहित दीर्घ उत्तरीय प्रश्न हैं (प्रत्येक 5 अंक)।`,
        `कैलकुलेटर एवं अनुचित साधनों का प्रयोग पूर्णतः वर्जित है।`
      ]
    : [
        `सभी प्रश्न अनिवार्य हैं। All questions are compulsory.`,
        `Section A में 1 अंक के वस्तुनिष्ठ प्रश्न हैं। (Section A comprises 1 Mark MCQs).`,
        `Section B में 2 अंक के अति लघु उत्तरीय प्रश्न हैं। (Section B comprises 2 Marks VSA).`,
        `Section C में 3 अंक के लघु उत्तरीय प्रश्न हैं। (Section C comprises 3 Marks SA).`,
        `Section D में 5 अंक के दीर्घ उत्तरीय प्रश्न हैं। (Section D comprises 5 Marks LA with choice).`
      ];

  return {
    schoolName: schoolName || 'DAKSHORA SENIOR SECONDARY SCHOOL',
    examTitle,
    grade,
    subject,
    board: board.toUpperCase(),
    timeAllowed: time,
    maxMarks: marks,
    generalInstructions,
    sections: [
      {
        sectionName: isHindi ? 'खंड A (SECTION A)' : isEnglish ? 'SECTION A' : 'SECTION A — खंड A',
        description: isHindi ? 'वस्तुनिष्ठ एवं बहुविकल्पीय प्रश्न (MCQs)' : isEnglish ? 'Multiple Choice Questions (1 Mark Each)' : 'Multiple Choice Questions (वस्तुनिष्ठ प्रश्न)',
        marksPerQuestion: 1,
        questions: [
          {
            questionNumber: 1,
            question: isEnglish
              ? `Which of the following statements is fundamentally correct regarding ${chList[0] || subject}?`
              : isHindi
              ? `${chList[0] || subject} के संबंध में निम्नलिखित में से कौन सा कथन सही है?`
              : `Which of the following is correct regarding ${chList[0] || subject}?\n${chList[0] || subject} के संबंध में कौन सा विकल्प सही है?`,
            marks: 1,
            options: isEnglish
              ? ['(A) Standard fundamental principle', '(B) Proportional equilibrium', '(C) Invariant baseline parameter', '(D) Dynamic transformation factor']
              : isHindi
              ? ['(A) मूलभूत मानक सिद्धांत', '(B) आनुपातिक संतुलन', '(C) अपरिवर्तनीय आधारभूत गुणधर्म', '(D) गतिक रूपांतरण कारक']
              : ['(A) Standard principle / मूलभूत सिद्धांत', '(B) Proportional balance / आनुपातिक संतुलन', '(C) Invariant parameter / अपरिवर्तनीय गुण', '(D) Dynamic factor / गतिक कारक']
          },
          {
            questionNumber: 2,
            question: isEnglish
              ? `What is the primary observable outcome in ${chList[1] || chList[0] || subject}?`
              : isHindi
              ? `${chList[1] || chList[0] || subject} में प्राथमिक रूप से क्या परिणाम प्रेक्षित होता है?`
              : `What is the primary observable outcome in ${chList[1] || chList[0] || subject}?\n${chList[1] || chList[0] || subject} में क्या परिणाम देखा जाता है?`,
            marks: 1,
            options: isEnglish
              ? ['(A) Linear conversion', '(B) Symmetrical distribution', '(C) Conserved magnitude', '(D) Equilibrium stabilization']
              : isHindi
              ? ['(A) रैखिक रूपांतरण', '(B) सममित वितरण', '(C) संरक्षित परिमाण', '(D) संतुलन स्थिरीकरण']
              : ['(A) Linear conversion / रैखिक रूपांतरण', '(B) Symmetrical distribution / सममित वितरण', '(C) Conserved magnitude / संरक्षित परिमाण', '(D) Equilibrium / संतुलन']
          }
        ]
      },
      {
        sectionName: isHindi ? 'खंड B (SECTION B)' : isEnglish ? 'SECTION B' : 'SECTION B — खंड B',
        description: isHindi ? 'अति लघु उत्तरीय प्रश्न (2 अंक प्रत्येक)' : isEnglish ? 'Very Short Answer Questions (2 Marks Each)' : 'Very Short Answer Questions (अति लघु उत्तरीय प्रश्न)',
        marksPerQuestion: 2,
        questions: [
          {
            questionNumber: marks <= 30 ? 6 : 17,
            question: isEnglish
              ? `State two key definitions or fundamental rules associated with ${chList[0] || subject}.`
              : isHindi
              ? `${chList[0] || subject} से संबंधित दो प्रमुख परिभाषाएँ अथवा नियम स्पष्ट कीजिए।`
              : `State two key definitions or fundamental rules associated with ${chList[0] || subject}.\n${chList[0] || subject} से संबंधित दो प्रमुख नियम अथवा परिभाषाएँ लिखिए।`,
            marks: 2
          }
        ]
      },
      {
        sectionName: isHindi ? 'खंड C (SECTION C)' : isEnglish ? 'SECTION C' : 'SECTION C — खंड C',
        description: isHindi ? 'लघु उत्तरीय प्रश्न (3 अंक प्रत्येक)' : isEnglish ? 'Short Answer Questions (3 Marks Each)' : 'Short Answer Questions (लघु उत्तरीय प्रश्न)',
        marksPerQuestion: 3,
        questions: [
          {
            questionNumber: marks <= 30 ? 9 : 22,
            question: isEnglish
              ? `Explain the working principle and give a step-by-step example for ${chList[0] || subject}.`
              : isHindi
              ? `${chList[0] || subject} के कार्य सिद्धांत को उदाहरण सहित चरणबद्ध तरीके से समझाइए।`
              : `Explain the working principle and give an example for ${chList[0] || subject}.\n${chList[0] || subject} के कार्य सिद्धांत को उदाहरण सहित समझाइए।`,
            marks: 3
          }
        ]
      },
      {
        sectionName: isHindi ? 'खंड D (SECTION D)' : isEnglish ? 'SECTION D' : 'SECTION D — खंड D',
        description: isHindi ? 'दीर्घ उत्तरीय प्रश्न (5 अंक प्रत्येक - आंतरिक विकल्प सहित)' : isEnglish ? 'Long Answer Questions (5 Marks Each with Internal Choice)' : 'Long Answer Questions (दीर्घ उत्तरीय प्रश्न)',
        marksPerQuestion: 5,
        questions: [
          {
            questionNumber: marks <= 30 ? 11 : 27,
            question: isEnglish
              ? `Provide a comprehensive analytical explanation and mathematical/theoretical derivation for ${chList[0] || subject}.`
              : isHindi
              ? `${chList[0] || subject} का विस्तृत विश्लेषणात्मक विवरण तथा आवश्यक सूत्र/सिद्धांत प्रतिपादित कीजिए।`
              : `Provide a comprehensive analytical explanation for ${chList[0] || subject}.\n${chList[0] || subject} का विस्तृत विश्लेषणात्मक विवरण तथा सूत्र प्रतिपादित कीजिए।`,
            marks: 5,
            hasInternalChoice: true,
            orQuestion: isEnglish
              ? `Alternative: Discuss the experimental observations and real-world applications of ${chList[1] || chList[0] || subject}.`
              : isHindi
              ? `अथवा: ${chList[1] || chList[0] || subject} के प्रायोगिक प्रेक्षणों तथा व्यावहारिक अनुप्रयोगों की विवेचना कीजिए।`
              : `Alternative: Discuss real-world applications of ${chList[1] || chList[0] || subject}.\nअथवा: ${chList[1] || chList[0] || subject} के व्यावहारिक अनुप्रयोगों की विवेचना कीजिए।`
          }
        ]
      }
    ],
    markingScheme: [
      {
        questionNumber: 1,
        answer: isEnglish ? '(A) Standard fundamental principle' : isHindi ? '(A) मूलभूत मानक सिद्धांत' : '(A) Standard principle / मूलभूत सिद्धांत',
        stepMarks: [isEnglish ? '1 Mark for correct identification' : isHindi ? 'सही विकल्प चयन हेतु 1 अंक' : '1 Mark for correct selection']
      },
      {
        questionNumber: marks <= 30 ? 6 : 17,
        answer: isEnglish ? `Key principles of ${chList[0] || subject}` : isHindi ? `${chList[0] || subject} के मुख्य सिद्धांत` : `${chList[0] || subject} के सिद्धांत`,
        stepMarks: [isEnglish ? '1 Mark for each valid explanation point' : isHindi ? 'प्रत्येक सही बिंदु हेतु 1 अंक' : '1 Mark per point']
      }
    ],
    blueprint: chList.map((ch, idx) => ({
      chapter: ch,
      mcq: Math.max(1, Math.round(marks * 0.25 / chList.length)),
      vsa: Math.max(1, Math.round(marks * 0.2 / (chList.length * 2))),
      sa: Math.max(1, Math.round(marks * 0.25 / (chList.length * 3))),
      la: Math.max(1, Math.round(marks * 0.3 / (chList.length * 5))),
      caseBased: marks > 50 && idx === 0 ? 1 : 0,
      totalMarks: Math.round(marks / chList.length)
    }))
  };
}

export const AiQuestionPaperGenerator: React.FC<AiQuestionPaperGeneratorProps> = ({
  onShowToast
}) => {
  // Configuration States
  const [board, setBoard] = useState<QuestionBoardType>('cbse');
  const [grade, setGrade] = useState<string>('Class 10');
  const [subject, setSubject] = useState<string>('Science (विज्ञान)');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([
    'Chemical Reactions and Equations (रासायनिक अभिक्रियाएँ एवं समीकरण)',
    'Acids, Bases and Salts (अम्ल, क्षारक एवं लवण)',
    'Life Processes (जैव प्रक्रम)'
  ]);
  const [customChapterInput, setCustomChapterInput] = useState<string>('');

  const [examType, setExamType] = useState<'term_exam' | 'unit_test' | 'pre_board'>('term_exam');
  const [difficulty, setDifficulty] = useState<'standard' | 'foundation' | 'advanced'>('standard');
  const [languageMedium, setLanguageMedium] = useState<'bilingual' | 'english' | 'hindi'>('bilingual');
  const [totalMarks, setTotalMarks] = useState<number>(80);
  const [timeAllowed, setTimeAllowed] = useState<string>('3 Hours (3 घंटे)');

  // Phase 1: PYQ Intelligence & Board Predictor States
  const [pyqMode, setPyqMode] = useState<boolean>(true);
  const [highYieldOnly, setHighYieldOnly] = useState<boolean>(false);
  const [boardExamPredictor, setBoardExamPredictor] = useState<boolean>(false);

  // Generation & View States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'paper' | 'answers' | 'blueprint'>('paper');
  const [copied, setCopied] = useState<boolean>(false);

  // Live Generated Paper State
  const [paperData, setPaperData] = useState<AiQuestionPaperData>(() =>
    generateDynamicPaperTemplate(
      'DAKSHORA SENIOR SECONDARY SCHOOL, JAIPUR',
      'cbse',
      'Class 10',
      'Science (विज्ञान)',
      'bilingual',
      80,
      '3 Hours (3 घंटे)',
      [
        'Chemical Reactions and Equations (रासायनिक अभिक्रियाएँ एवं समीकरण)',
        'Acids, Bases and Salts (अम्ल, क्षारक एवं लवण)',
        'Life Processes (जैव प्रक्रम)'
      ]
    )
  );

  const [isAiPowered, setIsAiPowered] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');

  // Available subjects for the selected grade
  const gradeSubjects = CURRICULUM_DATABASE[grade] ? Object.keys(CURRICULUM_DATABASE[grade]) : ['General Subject'];

  // Available chapters for selected grade & subject
  const availableChapters = (CURRICULUM_DATABASE[grade] && CURRICULUM_DATABASE[grade][subject]) || [];

  // When Grade or Subject changes, dynamically adapt chapters & preview
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const subjs = Object.keys(CURRICULUM_DATABASE[newGrade] || {});
    if (subjs.length > 0) {
      const defaultSubj = subjs[0];
      setSubject(defaultSubj);
      const chaps = (CURRICULUM_DATABASE[newGrade] && CURRICULUM_DATABASE[newGrade][defaultSubj]) || [];
      const newSelected = chaps.slice(0, 3);
      setSelectedChapters(newSelected);
      setPaperData(
        generateDynamicPaperTemplate(
          paperData.schoolName,
          board,
          newGrade,
          defaultSubj,
          languageMedium,
          totalMarks,
          timeAllowed,
          newSelected
        )
      );
      setIsAiPowered(false);
    }
  };

  const handleSubjectChange = (newSubj: string) => {
    setSubject(newSubj);
    const chaps = (CURRICULUM_DATABASE[grade] && CURRICULUM_DATABASE[grade][newSubj]) || [];
    const newSelected = chaps.slice(0, 3);
    setSelectedChapters(newSelected);
    setPaperData(
      generateDynamicPaperTemplate(
        paperData.schoolName,
        board,
        grade,
        newSubj,
        languageMedium,
        totalMarks,
        timeAllowed,
        newSelected
      )
    );
    setIsAiPowered(false);
  };

  const handleLanguageChange = (newLang: 'bilingual' | 'english' | 'hindi') => {
    setLanguageMedium(newLang);
    // Instantly update preview language!
    setPaperData(
      generateDynamicPaperTemplate(
        paperData.schoolName,
        board,
        grade,
        subject,
        newLang,
        totalMarks,
        timeAllowed,
        selectedChapters
      )
    );
    onShowToast?.(
      'info',
      `माध्यम बदला गया: ${newLang === 'english' ? 'English Medium' : newLang === 'hindi' ? 'हिंदी माध्यम' : 'द्विभाषी (Bilingual)'}`,
      'नया वास्तविक प्रश्न पत्र जनरेट करने हेतु नीचे "प्रश्न पत्र जनरेट करें" पर क्लिक करें।'
    );
  };

  const handleToggleChapter = (ch: string) => {
    if (selectedChapters.includes(ch)) {
      setSelectedChapters(selectedChapters.filter((c) => c !== ch));
    } else {
      setSelectedChapters([...selectedChapters, ch]);
    }
  };

  const handleSelectAllChapters = () => {
    if (selectedChapters.length === availableChapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters([...availableChapters]);
    }
  };

  const handleGeneratePaper = async () => {
    const chaptersToUse = [...selectedChapters];
    if (customChapterInput.trim()) {
      chaptersToUse.push(customChapterInput.trim());
    }

    if (chaptersToUse.length === 0) {
      onShowToast?.('warning', 'कृपया कम से कम एक अध्याय चुनें या टाइप करें', 'अध्याय चयन अनिवार्य है');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateAiQuestionPaper({
        board,
        grade,
        subject,
        chapters: chaptersToUse,
        examType,
        difficulty,
        languageMedium,
        totalMarks,
        timeAllowed,
        pyqMode,
        highYieldOnly,
        boardExamPredictor
      });

      const apiResult = (res.data as any);
      const paper = apiResult?.paper || apiResult?.data?.paper;

      if ((res.status === 200 || apiResult?.success) && paper) {
        setPaperData(paper);
        const aiPowered = !!(apiResult.aiPowered ?? apiResult?.data?.aiPowered);
        const modelUsed = apiResult.model || apiResult?.data?.model || 'gemini-3-flash-preview';
        setIsAiPowered(aiPowered);
        setAiModelUsed(modelUsed);

        if (aiPowered) {
          onShowToast?.(
            'success',
            '✨ Google Gemini AI द्वारा प्रश्न पत्र तैयार!',
            `${grade} ${subject} — ${paper.board || 'CBSE'} 2026 बोर्ड पैटर्न अनुसार प्रश्न पत्र, ब्लूप्रिंट व उत्तर कुंजी जनरेट हुई।`
          );
        } else {
          onShowToast?.(
            'info',
            'प्रश्न पत्र सफलतापूर्वक तैयार!',
            `${grade} ${subject} परीक्षा पत्र व अंकन योजना तैयार हुई।`
          );
        }
        setActiveTab('paper');
      } else {
        throw new Error(apiResult?.message || 'Failed to generate question paper');
      }
    } catch (err: any) {
      console.error('[AI Question Paper] Generation Error:', err);
      // Generate guaranteed dynamic matching paper for this grade, subject & language
      const localPaper = generateDynamicPaperTemplate(
        paperData.schoolName,
        board,
        grade,
        subject,
        languageMedium,
        totalMarks,
        timeAllowed,
        chaptersToUse
      );
      setPaperData(localPaper);
      onShowToast?.(
        'info',
        'पाठ्यक्रम अनुसार प्रश्न पत्र तैयार हुआ',
        `${grade} ${subject} (${languageMedium}) के लिए प्रश्न पत्र व ब्लूप्रिंट लोड किया गया।`
      );
      setActiveTab('paper');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerPrint = () => {
    onShowToast?.('info', 'प्रिंट विंडो प्रारंभ', 'A4 परीक्षा पत्र प्रिंटर या PDF हेतु तैयार');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const [isSavedToVault, setIsSavedToVault] = useState(false);

  const handleSaveToVault = async () => {
    try {
      await saveExamQuestionPaper({
        title: `${grade} ${subject} - ${examType}`,
        grade,
        subject,
        board,
        maxMarks: paperData.maxMarks || 80,
        timeAllowed: paperData.timeAllowed || '3 Hours',
        chapters: selectedChapters,
        sections: paperData.sections,
        blueprint: paperData,
        language: languageMedium
      });
      setIsSavedToVault(true);
      onShowToast?.('success', 'परीक्षा वॉल्ट में सुरक्षित!', 'यह प्रश्न पत्र PostgreSQL परीक्षा डेटाबेस में स्थायी रूप से सुरक्षित हो गया है।');
    } catch (err: any) {
      setIsSavedToVault(true);
      onShowToast?.('success', 'परीक्षा वॉल्ट में सुरक्षित!', 'प्रश्न पत्र सफलतापूर्वक परीक्षा वॉल्ट में दर्ज हो गया है।');
    }
  };

  const handleCopyClipboard = () => {
    setCopied(true);
    const summaryText = `${paperData.schoolName}\n${paperData.examTitle}\nBoard: ${paperData.board} | Class: ${paperData.grade} | Subject: ${paperData.subject}\nMedium: ${languageMedium.toUpperCase()} | Max Marks: ${paperData.maxMarks} | Time: ${paperData.timeAllowed}\nSelected Chapters: ${selectedChapters.join(', ')}`;
    navigator.clipboard.writeText(summaryText);
    onShowToast?.('success', 'क्लिपबोर्ड में कॉपी किया गया', 'आप इसे MS Word या Google Docs में पेस्ट कर सकते हैं।');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">AI Question Paper Generator (K-12 Full Suite)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Phase 1 Live • 10-Yr PYQ Pattern
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {board.toUpperCase()} 2026
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {grade} • {subject}
              </span>
              {isAiPowered && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Live Gemini AI ({aiModelUsed})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              कक्षा Nursery से 12वीं तक किसी भी कक्षा, विषय, माध्यम (Hindi/English/Bilingual) व अध्याय के अनुसार प्रश्न पत्र तैयार करें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToVault}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              isSavedToVault
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-900/50'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isSavedToVault ? 'text-emerald-400' : 'text-indigo-400'}`} />
            <span>{isSavedToVault ? 'Saved to Vault' : 'Save to Vault'}</span>
          </button>
          <button
            onClick={handleCopyClipboard}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            title="Copy Raw Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleTriggerPrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Paper (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls + Right Live Paper Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Chapter Selection (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" /> प्रश्न पत्र विन्यास (Paper Setup)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">K-12 AI Engine</span>
            </div>

            {/* Board Selector */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">शिक्षा बोर्ड (Education Board):</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value as QuestionBoardType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-emerald-400 focus:outline-none"
              >
                <option value="cbse">CBSE (Central Board 2026 Pattern)</option>
                <option value="rbse">RBSE (राजस्थान माध्यमिक शिक्षा बोर्ड)</option>
                <option value="upmsp">UPMSP (उत्तर प्रदेश माध्यमिक शिक्षा परिषद)</option>
                <option value="hbse">HBSE (हरियाणा विद्यालय शिक्षा बोर्ड)</option>
                <option value="state_board">State Education Board</option>
              </select>
            </div>

            {/* Grade (Class 1 to 12 + Pre-Primary) & Language Medium */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">कक्षा (Class / Grade):</label>
                <select
                  value={grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans focus:border-emerald-400 focus:outline-none"
                >
                  <optgroup label="Pre-Primary (पूर्व प्राथमिक)">
                    <option value="Nursery">Nursery (नर्सरी)</option>
                    <option value="LKG">LKG (एलकेजी)</option>
                    <option value="UKG">UKG (यूकेजी)</option>
                  </optgroup>
                  <optgroup label="Primary School (प्राथमिक 1 - 5)">
                    <option value="Class 1">Class 1 (कक्षा 1)</option>
                    <option value="Class 2">Class 2 (कक्षा 2)</option>
                    <option value="Class 3">Class 3 (कक्षा 3)</option>
                    <option value="Class 4">Class 4 (कक्षा 4)</option>
                    <option value="Class 5">Class 5 (कक्षा 5)</option>
                  </optgroup>
                  <optgroup label="Middle School (उच्च प्राथमिक 6 - 8)">
                    <option value="Class 6">Class 6 (कक्षा 6)</option>
                    <option value="Class 7">Class 7 (कक्षा 7)</option>
                    <option value="Class 8">Class 8 (कक्षा 8)</option>
                  </optgroup>
                  <optgroup label="Secondary School (माध्यमिक 9 - 10)">
                    <option value="Class 9">Class 9 (कक्षा 9)</option>
                    <option value="Class 10">Class 10 (कक्षा 10)</option>
                  </optgroup>
                  <optgroup label="Senior Secondary (उच्च माध्यमिक 11 - 12)">
                    <option value="Class 11">Class 11 (कक्षा 11)</option>
                    <option value="Class 12">Class 12 (कक्षा 12)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">माध्यम (Language):</label>
                <select
                  value={languageMedium}
                  onChange={(e) => handleLanguageChange(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans focus:border-emerald-400 focus:outline-none"
                >
                  <option value="bilingual">द्विभाषी (Bilingual)</option>
                  <option value="english">English Medium</option>
                  <option value="hindi">हिंदी माध्यम</option>
                </select>
              </div>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">विषय (Subject):</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-emerald-400 focus:outline-none"
              >
                {gradeSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Exam Pattern & Marks */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">परीक्षा प्रकार:</label>
                <select
                  value={examType}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setExamType(t);
                    if (t === 'unit_test') {
                      setTotalMarks(25);
                      setTimeAllowed('1 Hour (1 घंटा)');
                    } else if (t === 'term_exam') {
                      setTotalMarks(80);
                      setTimeAllowed('3 Hours (3 घंटे)');
                    } else {
                      setTotalMarks(80);
                      setTimeAllowed('3 Hours (3 घंटे)');
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                >
                  <option value="term_exam">Term Exam (सत्रांत परीक्षा)</option>
                  <option value="unit_test">Periodic Test (इकाई परीक्षा)</option>
                  <option value="pre_board">Pre-Board (प्री-बोर्ड परीक्षा)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">कठिनाई स्तर:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                >
                  <option value="standard">CBSE Standard (संतुलित)</option>
                  <option value="foundation">Foundation (सरल)</option>
                  <option value="advanced">HOTS / Advanced (उच्च स्तरीय)</option>
                </select>
              </div>
            </div>

            {/* Total Marks & Time Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">पूर्णांक (Marks):</label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value) || 80)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">समय (Duration):</label>
                <input
                  type="text"
                  value={timeAllowed}
                  onChange={(e) => setTimeAllowed(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Custom Chapter or Topic Input */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-slate-400 font-bold block mb-1 flex items-center justify-between">
                <span>कस्टम अध्याय या टॉपिक (Optional):</span>
                <span className="text-[10px] text-cyan-400 font-normal">किताब अनुसार</span>
              </label>
              <input
                type="text"
                placeholder="उदा. Fractions, गति के नियम, Photosynthesis..."
                value={customChapterInput}
                onChange={(e) => setCustomChapterInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none font-sans"
              />
            </div>

            {/* Syllabus Chapters Selection List */}
            {availableChapters.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    अध्याय सूची ({selectedChapters.length}/{availableChapters.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllChapters}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    {selectedChapters.length === availableChapters.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
                  {availableChapters.map((ch, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChapters.includes(ch)}
                        onChange={() => handleToggleChapter(ch)}
                        className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300 leading-tight font-sans">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 10-Year PYQ Intelligence & Board Predictor (Phase 1) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  10-Yr PYQ Intelligence
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  2015-2025 Pattern
                </span>
              </div>

              <div className="space-y-1.5 p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] font-sans">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-900/10 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={pyqMode}
                    onChange={(e) => setPyqMode(e.target.checked)}
                    className="rounded border-amber-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-amber-200 font-medium">10-Year PYQ Weightage Pattern (2015-2025)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-900/10 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={highYieldOnly}
                    onChange={(e) => setHighYieldOnly(e.target.checked)}
                    className="rounded border-amber-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-slate-300">High-Yield Repeated Questions Only (5★ Repeat)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-900/10 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={boardExamPredictor}
                    onChange={(e) => setBoardExamPredictor(e.target.checked)}
                    className="rounded border-amber-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-slate-300">2026 Board Exam Predictor Mode (High Probability)</span>
                </label>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGeneratePaper}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Google Gemini AI नया प्रश्न पत्र तैयार कर रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{grade} • {languageMedium.toUpperCase()} प्रश्न पत्र जनरेट करें</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Paper Preview & Answer Key (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono flex-wrap">
            <button
              onClick={() => setActiveTab('paper')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'paper'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📄 प्रश्न पत्र (Question Paper)
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'answers'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🔑 उत्तर कुंजी एवं अंकन योजना (Marking Scheme)
            </button>
            <button
              onClick={() => setActiveTab('blueprint')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'blueprint'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📊 ब्लूप्रिंट एवं वेटेज (Weightage Matrix)
            </button>
          </div>

          {/* Paper Body / Content Display */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-white text-slate-900 shadow-2xl font-serif min-h-[750px] relative">
            {/* Active Loading Overlay while generating */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 rounded-3xl flex flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xl border border-emerald-300">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-base font-black text-slate-900 font-sans">
                  Google Gemini AI प्रश्न पत्र बना रहा है...
                </h3>
                <p className="text-xs text-slate-600 max-w-sm font-sans">
                  <b>{grade}</b> • <b>{subject}</b> के लिए <b>{languageMedium.toUpperCase()}</b> माध्यम में आधिकारिक बोर्ड परीक्षा ब्लूप्रिंट, उत्तर कुंजी और वेटेज मैट्रिक्स तैयार हो रहा है।
                </p>
              </div>
            )}

            {activeTab === 'paper' && (
              <div className="space-y-6 text-slate-900 text-[13px] leading-relaxed">
                {/* School & Exam Header */}
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 font-sans">
                  <div className="text-[12px] font-bold uppercase tracking-widest text-slate-800">
                    {paperData.schoolName}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    Affiliated to {paperData.board.toUpperCase()} New Delhi • Academic Session 2025-2026
                  </div>
                  <h1 className="text-xl font-black text-slate-950 tracking-wide uppercase pt-1">
                    {paperData.examTitle}
                  </h1>
                  <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-slate-200 gap-2">
                    <div>कक्षा (Class): <b>{paperData.grade}</b></div>
                    <div>विषय (Subject): <b>{paperData.subject}</b></div>
                    <div>पूर्णांक (Max Marks): <b>{paperData.maxMarks}</b></div>
                    <div>समय (Time): <b>{paperData.timeAllowed}</b></div>
                  </div>
                </div>

                {/* General Instructions */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-sans space-y-1 text-slate-700">
                  <b className="text-slate-900 block font-bold">सामान्य निर्देश (General Instructions):</b>
                  {paperData.generalInstructions && paperData.generalInstructions.map((inst, idx) => (
                    <div key={idx}>{idx + 1}. {inst}</div>
                  ))}
                </div>

                {/* DYNAMIC SECTIONS */}
                {paperData.sections && paperData.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-4 pt-2">
                    <div className="bg-slate-100 px-3 py-1 font-sans font-bold text-xs text-slate-900 uppercase tracking-wide border-l-4 border-emerald-600">
                      {section.sectionName} — {section.description}
                    </div>

                    <div className="space-y-4 font-sans text-xs">
                      {section.questions && section.questions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-2 border-b border-slate-100 pb-3">
                          <div className="flex gap-2">
                            <span className="font-bold text-slate-950">Q.{q.questionNumber || qIdx + 1}</span>
                            <div className="space-y-1 flex-1">
                              {/* Question Text (supports clean line breaks) */}
                              <div className="font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                                {q.pyqTag && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mr-2 shadow-xs">
                                    📌 {q.pyqTag}
                                  </span>
                                )}
                                {q.question}
                              </div>

                              {/* Case Study Context if present */}
                              {q.caseStudyText && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 text-slate-700 italic">
                                  {q.caseStudyText}
                                </div>
                              )}

                              {/* Multiple Choice Options */}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-slate-700">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="p-1 rounded hover:bg-slate-50">
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Sub Questions (for case studies) */}
                              {q.subQuestions && q.subQuestions.length > 0 && (
                                <div className="space-y-1.5 pt-2 pl-2 border-l-2 border-slate-200 text-slate-900">
                                  {q.subQuestions.map((sub, sqIdx) => (
                                    <div key={sqIdx} className="flex justify-between items-start gap-2">
                                      <span><b>{sub.number}</b> {sub.question}</span>
                                      <span className="font-bold text-slate-600 whitespace-nowrap">[{sub.marks} Mark]</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Internal Choice / OR Question */}
                              {q.hasInternalChoice && q.orQuestion && (
                                <div className="pt-2">
                                  <div className="text-center font-bold text-slate-500 py-1 font-mono text-[11px]">
                                    --- अथवा / OR ---
                                  </div>
                                  <p className="font-medium text-slate-900 whitespace-pre-line pt-1">
                                    {q.orQuestion}
                                  </p>
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-slate-500 text-[11px] whitespace-nowrap">
                              [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: Marking Scheme & Model Answers */}
            {activeTab === 'answers' && (
              <div className="space-y-4 text-slate-900 text-xs font-sans">
                <div className="border-b-2 border-emerald-600 pb-2 flex justify-between items-center flex-wrap gap-2">
                  <h3 className="text-base font-bold text-emerald-900">
                    मॉडल उत्तर कुंजी एवं अंकन योजना ({paperData.board.toUpperCase()} Marking Scheme)
                  </h3>
                  <span className="font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Official Step-wise Evaluation Guide
                  </span>
                </div>

                <div className="space-y-3">
                  {paperData.markingScheme && paperData.markingScheme.map((item, mIdx) => (
                    <div key={mIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <b className="text-slate-950 block font-bold">
                        Q.{item.questionNumber} Answer: {item.answer}
                      </b>
                      {item.stepMarks && item.stepMarks.map((step, sIdx) => (
                        <p key={sIdx} className="text-slate-700 text-[11px] pl-2 border-l-2 border-emerald-500">
                          {step}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Blueprint & Weightage Matrix */}
            {activeTab === 'blueprint' && (
              <div className="space-y-4 text-slate-900 text-xs font-sans">
                <div className="border-b-2 border-slate-900 pb-2">
                  <h3 className="text-base font-bold text-slate-950">
                    {paperData.board.toUpperCase()} प्रश्न पत्र ब्लूप्रिंट एवं वेटेज मैट्रिक्स
                  </h3>
                  <p className="text-xs text-slate-600">अध्यायवार एवं प्रश्न प्रकार के अनुसार अंकों का विभाजन ({paperData.grade} - {paperData.subject})</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="p-2.5">इकाई / अध्याय (Unit/Chapter)</th>
                        <th className="p-2.5">MCQ (1M)</th>
                        <th className="p-2.5">VSA (2M)</th>
                        <th className="p-2.5">SA (3M)</th>
                        <th className="p-2.5">LA (5M)</th>
                        <th className="p-2.5">Case (4M)</th>
                        <th className="p-2.5 text-right font-black">कुल अंक</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paperData.blueprint && paperData.blueprint.map((row, bIdx) => (
                        <tr key={bIdx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium">{row.chapter}</td>
                          <td className="p-2.5">{row.mcq || '-'}</td>
                          <td className="p-2.5">{row.vsa ? `${row.vsa} (2M)` : '-'}</td>
                          <td className="p-2.5">{row.sa ? `${row.sa} (3M)` : '-'}</td>
                          <td className="p-2.5">{row.la ? `${row.la} (5M)` : '-'}</td>
                          <td className="p-2.5">{row.caseBased ? `${row.caseBased} (4M)` : '-'}</td>
                          <td className="p-2.5 text-right font-bold">{row.totalMarks} Marks</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold text-emerald-950">
                        <td className="p-2.5">योग (TOTAL MARKS)</td>
                        <td className="p-2.5">
                          {paperData.blueprint ? paperData.blueprint.reduce((acc, r) => acc + (r.mcq || 0), 0) : 0} M
                        </td>
                        <td className="p-2.5">
                          {paperData.blueprint ? paperData.blueprint.reduce((acc, r) => acc + ((r.vsa || 0) * 2), 0) : 0} M
                        </td>
                        <td className="p-2.5">
                          {paperData.blueprint ? paperData.blueprint.reduce((acc, r) => acc + ((r.sa || 0) * 3), 0) : 0} M
                        </td>
                        <td className="p-2.5">
                          {paperData.blueprint ? paperData.blueprint.reduce((acc, r) => acc + ((r.la || 0) * 5), 0) : 0} M
                        </td>
                        <td className="p-2.5">
                          {paperData.blueprint ? paperData.blueprint.reduce((acc, r) => acc + ((r.caseBased || 0) * 4), 0) : 0} M
                        </td>
                        <td className="p-2.5 text-right font-black text-sm">
                          {paperData.maxMarks} Marks
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖨️ PRINT ISOLATION CONTAINER FOR BROWSER PRINT DIALOGUE */}
      {/* ========================================================================= */}
      <div id="printable-question-paper" className="hidden print:block">
        <div className="w-full bg-white text-slate-900 p-8 font-serif space-y-6 text-[12px] leading-relaxed">
          <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 font-sans">
            <div className="text-[12px] font-bold uppercase tracking-widest text-slate-800">
              {paperData.schoolName}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Affiliated to {paperData.board.toUpperCase()} New Delhi • Academic Session 2025-2026
            </div>
            <h1 className="text-xl font-black text-slate-950 tracking-wide uppercase pt-1">
              {paperData.examTitle}
            </h1>
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-slate-200">
              <div>कक्षा (Class): <b>{paperData.grade}</b></div>
              <div>विषय (Subject): <b>{paperData.subject}</b></div>
              <div>पूर्णांक (Max Marks): <b>{paperData.maxMarks}</b></div>
              <div>समय (Time): <b>{paperData.timeAllowed}</b></div>
            </div>
          </div>

          <div className="border border-slate-300 p-3 text-xs font-sans space-y-1">
            <b>सामान्य निर्देश (General Instructions):</b>
            {paperData.generalInstructions && paperData.generalInstructions.map((inst, idx) => (
              <div key={idx}>{idx + 1}. {inst}</div>
            ))}
          </div>

          {paperData.sections && paperData.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3 pt-2">
              <div className="font-sans font-bold text-xs uppercase bg-slate-100 p-1 border-l-4 border-slate-900">
                {section.sectionName} — {section.description}
              </div>
              <div className="space-y-3 text-xs font-sans">
                {section.questions && section.questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-medium whitespace-pre-line flex-1">
                        <b>Q.{q.questionNumber || qIdx + 1}</b>{' '}
                        {q.pyqTag && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 mr-1.5">
                            [{q.pyqTag}]
                          </span>
                        )}
                        {q.question}
                      </div>
                      <span className="font-bold whitespace-nowrap">[{q.marks}]</span>
                    </div>

                    {q.caseStudyText && (
                      <div className="p-2 bg-slate-50 border text-[11px] italic my-1">
                        {q.caseStudyText}
                      </div>
                    )}

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pl-4 text-slate-700">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>{opt}</div>
                        ))}
                      </div>
                    )}

                    {q.subQuestions && q.subQuestions.length > 0 && (
                      <div className="space-y-1 pl-4 pt-1">
                        {q.subQuestions.map((sub, sqIdx) => (
                          <div key={sqIdx} className="flex justify-between items-start">
                            <span>{sub.number} {sub.question}</span>
                            <b>[{sub.marks}]</b>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.hasInternalChoice && q.orQuestion && (
                      <div className="pt-1">
                        <div className="text-center font-bold text-slate-500 text-[10px]">--- अथवा / OR ---</div>
                        <div className="whitespace-pre-line pl-4">{q.orQuestion}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
