export const GHANA_CONFIG = {
  // Ghana Regions and Major Cities
  regions: [
    {
      code: 'greater-accra',
      name: 'Greater Accra',
      capital: 'Accra',
      cities: ['Accra', 'Tema', 'Kasoa', 'Madina', 'Adenta', 'Teshie', 'Nungua'],
      deliveryZone: 'metro',
      deliveryFee: 5.00, // GHS
    },
    {
      code: 'ashanti',
      name: 'Ashanti',
      capital: 'Kumasi',
      cities: ['Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Konongo'],
      deliveryZone: 'regional',
      deliveryFee: 10.00,
    },
    {
      code: 'northern',
      name: 'Northern',
      capital: 'Tamale',
      cities: ['Tamale', 'Yendi', 'Savelugu', 'Salaga'],
      deliveryZone: 'remote',
      deliveryFee: 15.00,
    },
    {
      code: 'western',
      name: 'Western',
      capital: 'Sekondi-Takoradi',
      cities: ['Sekondi-Takoradi', 'Tarkwa', 'Prestea', 'Axim'],
      deliveryZone: 'regional',
      deliveryFee: 12.00,
    },
    {
      code: 'eastern',
      name: 'Eastern',
      capital: 'Koforidua',
      cities: ['Koforidua', 'Akosombo', 'Nkawkaw', 'Akim Oda'],
      deliveryZone: 'regional',
      deliveryFee: 8.00,
    },
    {
      code: 'volta',
      name: 'Volta',
      capital: 'Ho',
      cities: ['Ho', 'Hohoe', 'Keta', 'Aflao'],
      deliveryZone: 'regional',
      deliveryFee: 12.00,
    },
    {
      code: 'central',
      name: 'Central',
      capital: 'Cape Coast',
      cities: ['Cape Coast', 'Elmina', 'Winneba', 'Kasoa'],
      deliveryZone: 'regional',
      deliveryFee: 10.00,
    },
    {
      code: 'upper-east',
      name: 'Upper East',
      capital: 'Bolgatanga',
      cities: ['Bolgatanga', 'Bawku', 'Navrongo'],
      deliveryZone: 'remote',
      deliveryFee: 20.00,
    },
    {
      code: 'upper-west',
      name: 'Upper West',
      capital: 'Wa',
      cities: ['Wa', 'Tumu', 'Lawra'],
      deliveryZone: 'remote',
      deliveryFee: 20.00,
    },
    {
      code: 'brong-ahafo',
      name: 'Brong Ahafo',
      capital: 'Sunyani',
      cities: ['Sunyani', 'Techiman', 'Berekum', 'Dormaa Ahenkro'],
      deliveryZone: 'regional',
      deliveryFee: 12.00,
    },
  ],

  // Mobile Money Providers in Ghana
  mobileMoneyProviders: [
    {
      code: 'mtn',
      name: 'MTN Mobile Money',
      shortCode: '*170#',
      logo: '/images/momo/mtn-logo.png',
      color: '#FFCC00',
      active: true,
    },
    {
      code: 'vodafone',
      name: 'Vodafone Cash',
      shortCode: '*110#',
      logo: '/images/momo/vodafone-logo.png',
      color: '#E60000',
      active: true,
    },
    {
      code: 'airtel_tigo',
      name: 'AirtelTigo Money',
      shortCode: '*100#',
      logo: '/images/momo/airteltigo-logo.png',
      color: '#ED1C24',
      active: true,
    },
  ],

  // Major Banks in Ghana
  banks: [
    { code: 'gcb', name: 'GCB Bank Limited' },
    { code: 'ecobank', name: 'Ecobank Ghana Limited' },
    { code: 'absa', name: 'Absa Bank Ghana Limited' },
    { code: 'stanbic', name: 'Stanbic Bank Ghana Limited' },
    { code: 'standard_chartered', name: 'Standard Chartered Bank Ghana Limited' },
    { code: 'fidelity', name: 'Fidelity Bank Ghana Limited' },
    { code: 'cal_bank', name: 'CAL Bank Limited' },
    { code: 'republic_bank', name: 'Republic Bank Ghana Limited' },
    { code: 'access_bank', name: 'Access Bank Ghana Limited' },
    { code: 'uts_bank', name: 'UMB Bank Ghana Limited' },
  ],

  // Business Categories for Ghana Market
  businessCategories: {
    groceries: {
      name: 'Groceries & Food',
      subcategories: [
        'Fresh Produce',
        'Pantry Items',
        'Beverages',
        'Dairy & Eggs',
        'Meat & Fish',
        'Local Foods',
        'Imported Foods',
        'Spices & Seasonings',
      ],
    },
    electronics: {
      name: 'Electronics',
      subcategories: [
        'Mobile Phones',
        'Laptops & Computers',
        'TV & Audio',
        'Home Appliances',
        'Accessories',
        'Gaming',
        'Photography',
        'Smart Devices',
      ],
    },
    consumables: {
      name: 'Everyday Consumables',
      subcategories: [
        'Personal Care',
        'Health & Wellness',
        'Household Items',
        'Baby Care',
        'Beauty Products',
        'Cleaning Supplies',
        'Paper Products',
        'Pet Supplies',
      ],
    },
    fashion: {
      name: 'Fashion & Clothing',
      subcategories: [
        'Men\'s Clothing',
        'Women\'s Clothing',
        'Children\'s Clothing',
        'Shoes & Footwear',
        'Bags & Accessories',
        'Traditional Wear',
        'Jewelry',
        'Watches',
      ],
    },
    home_garden: {
      name: 'Home & Garden',
      subcategories: [
        'Furniture',
        'Home Decor',
        'Kitchen & Dining',
        'Bedding & Bath',
        'Garden & Outdoor',
        'Tools & Hardware',
        'Lighting',
        'Storage & Organization',
      ],
    },
  },

  // Business Hours (Ghana Standard Time - GMT+0)
  defaultBusinessHours: {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: false },
  },

  // Currency and Payment Settings
  currency: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghana Cedi',
    decimals: 2,
  },

  // Tax Information
  tax: {
    vat: 0.125, // 12.5% VAT in Ghana
    nhil: 0.025, // 2.5% National Health Insurance Levy
    getfund: 0.025, // 2.5% Ghana Education Trust Fund levy
  },

  // Common Ghanaian Phone Number Formats
  phoneNumberRegex: /^(\+233|0)(20|23|24|26|27|28|50|54|55|56|57|59)\d{7}$/,

  // Ghana Post GPS Codes
  gpsCodeRegex: /^[A-Z]{2}-\d{4}-\d{4}$/,

  // Supported Languages
  languages: [
    { code: 'en', name: 'English' },
    { code: 'tw', name: 'Twi' },
    { code: 'ee', name: 'Ewe' },
    { code: 'ga', name: 'Ga' },
    { code: 'dag', name: 'Dagbani' },
  ],

  // Measurement Units
  units: {
    weight: ['kg', 'g', 'pounds'],
    volume: ['l', 'ml', 'gallons'],
    length: ['m', 'cm', 'inches'],
  },

  // Common Ghanaian Product Units
  localUnits: [
    'Bag', 'Box', 'Carton', 'Piece', 'Bottle', 'Can', 'Pack', 'Bundle', 
    'Sachet', 'Tube', 'Jar', 'Tin', 'Roll', 'Pair', 'Set', 'Dozen',
    'Olonka', 'Cigarette', 'Margarine Tin', 'Milk Tin', 'Tomato Tin'
  ],
}