/**
 * Embedded English datasets. Kept intentionally small — enough variety for
 * realistic test data without bloating the bundle.
 */
export const firstNames: string[] = [
  'Aarav', 'Aditi', 'Alice', 'Amara', 'Ananya', 'Andre', 'Arjun', 'Ava',
  'Benjamin', 'Camila', 'Carlos', 'Charlotte', 'Chen', 'Daniel', 'Diego',
  'Elena', 'Emma', 'Ethan', 'Fatima', 'Gabriel', 'Grace', 'Hannah', 'Hiroshi',
  'Isabella', 'Ishaan', 'Jack', 'James', 'Julia', 'Kavya', 'Kenji', 'Layla',
  'Leo', 'Liam', 'Lucas', 'Maria', 'Mateo', 'Maya', 'Mei', 'Mia', 'Mohammed',
  'Nina', 'Noah', 'Olivia', 'Omar', 'Priya', 'Rahul', 'Rosa', 'Sofia', 'Sanjay',
  'Sarah', 'Sneha', 'Sophia', 'Tariq', 'Thomas', 'Valentina', 'William',
  'Yuki', 'Zara', 'Zoe',
];

export const lastNames: string[] = [
  'Adams', 'Ahmed', 'Anderson', 'Bailey', 'Baker', 'Bennett', 'Brown',
  'Carter', 'Chen', 'Clark', 'Collins', 'Das', 'Davis', 'Edwards', 'Evans',
  'Fischer', 'Garcia', 'Gonzalez', 'Gupta', 'Hall', 'Harris', 'Hernandez',
  'Iyer', 'Jackson', 'Johnson', 'Jones', 'Kapoor', 'Khan', 'Kim', 'Kumar',
  'Lee', 'Lewis', 'Lopez', 'Martin', 'Martinez', 'Mehta', 'Miller', 'Mitchell',
  'Morales', 'Murphy', 'Nakamura', 'Nelson', 'Nguyen', 'Patel', 'Perez',
  'Reddy', 'Roberts', 'Robinson', 'Rodriguez', 'Sato', 'Sharma', 'Singh',
  'Smith', 'Taylor', 'Thompson', 'Turner', 'Walker', 'Wang', 'White',
  'Williams', 'Wilson', 'Wright', 'Yamamoto', 'Young', 'Zhang',
];

export const jobTitles: string[] = [
  'Accessibility Engineer', 'Automation Architect', 'Backend Developer',
  'Business Analyst', 'Cloud Engineer', 'Customer Success Manager',
  'Data Engineer', 'Data Scientist', 'DevOps Engineer', 'Engineering Manager',
  'Frontend Developer', 'Full Stack Developer', 'Machine Learning Engineer',
  'Mobile Developer', 'Performance Engineer', 'Platform Engineer',
  'Product Designer', 'Product Manager', 'QA Analyst', 'QA Engineer',
  'Release Manager', 'SDET', 'Security Engineer', 'Site Reliability Engineer',
  'Solutions Architect', 'Support Engineer', 'Technical Writer',
  'Test Automation Engineer', 'Test Lead', 'UX Researcher',
];

export const cities: string[] = [
  'Amsterdam', 'Austin', 'Bangalore', 'Barcelona', 'Berlin', 'Boston',
  'Buenos Aires', 'Cairo', 'Cape Town', 'Chicago', 'Delhi', 'Dubai', 'Dublin',
  'Hyderabad', 'Jakarta', 'Lagos', 'Lisbon', 'London', 'Madrid', 'Melbourne',
  'Mexico City', 'Mumbai', 'Nairobi', 'New York', 'Osaka', 'Paris', 'Prague',
  'Pune', 'San Francisco', 'Seattle', 'Seoul', 'Singapore', 'Stockholm',
  'Sydney', 'Tokyo', 'Toronto', 'Vancouver', 'Warsaw', 'Zurich',
];

export const countries: Array<{ name: string; code: string }> = [
  { name: 'Argentina', code: 'AR' }, { name: 'Australia', code: 'AU' },
  { name: 'Brazil', code: 'BR' }, { name: 'Canada', code: 'CA' },
  { name: 'China', code: 'CN' }, { name: 'Egypt', code: 'EG' },
  { name: 'France', code: 'FR' }, { name: 'Germany', code: 'DE' },
  { name: 'India', code: 'IN' }, { name: 'Indonesia', code: 'ID' },
  { name: 'Ireland', code: 'IE' }, { name: 'Italy', code: 'IT' },
  { name: 'Japan', code: 'JP' }, { name: 'Kenya', code: 'KE' },
  { name: 'Mexico', code: 'MX' }, { name: 'Netherlands', code: 'NL' },
  { name: 'Nigeria', code: 'NG' }, { name: 'Poland', code: 'PL' },
  { name: 'Singapore', code: 'SG' }, { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' }, { name: 'Spain', code: 'ES' },
  { name: 'Sweden', code: 'SE' }, { name: 'Switzerland', code: 'CH' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'United States', code: 'US' },
];

export const streetSuffixes: string[] = [
  'Avenue', 'Boulevard', 'Circle', 'Court', 'Drive', 'Lane', 'Parkway',
  'Place', 'Road', 'Square', 'Street', 'Terrace', 'Way',
];

export const domainSuffixes: string[] = [
  'com', 'net', 'org', 'io', 'dev', 'app', 'co', 'ai', 'tech',
];

export const freeEmailProviders: string[] = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'proton.me',
  'icloud.com',
];

export const loremWords: string[] = [
  'alias', 'aliquam', 'amet', 'animi', 'aperiam', 'atque', 'aut', 'beatae',
  'blanditiis', 'commodi', 'consequatur', 'corporis', 'culpa', 'cumque',
  'debitis', 'deleniti', 'dicta', 'dignissimos', 'dolor', 'dolorem', 'ducimus',
  'earum', 'eius', 'eligendi', 'enim', 'error', 'esse', 'eveniet', 'expedita',
  'facere', 'fugiat', 'harum', 'illo', 'impedit', 'ipsa', 'ipsum', 'iste',
  'itaque', 'iure', 'labore', 'laudantium', 'magnam', 'maiores', 'minima',
  'modi', 'molestiae', 'natus', 'nemo', 'nesciunt', 'nihil', 'nobis',
  'officiis', 'omnis', 'optio', 'pariatur', 'perferendis', 'porro', 'possimus',
  'praesentium', 'quaerat', 'quia', 'quidem', 'quisquam', 'ratione',
  'recusandae', 'reiciendis', 'repellat', 'rerum', 'saepe', 'sapiente',
  'sequi', 'similique', 'sint', 'soluta', 'sunt', 'tempora', 'tenetur',
  'totam', 'ullam', 'unde', 'velit', 'veniam', 'veritatis', 'vitae',
  'voluptas', 'voluptatem',
];

export const currencies: Array<{ code: string; name: string; symbol: string }> = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];
