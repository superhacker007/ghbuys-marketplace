export const ghanaConfig = {
  // Ghana regions with delivery zones
  regions: [
    {
      code: 'greater-accra',
      name: 'Greater Accra',
      capital: 'Accra',
      cities: ['Accra', 'Tema', 'Kasoa', 'Madina', 'Adenta', 'Teshie', 'Nungua'],
      deliveryFee: 5.00,
      deliveryZone: 'metro'
    },
    {
      code: 'ashanti',
      name: 'Ashanti',
      capital: 'Kumasi',
      cities: ['Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Konongo'],
      deliveryFee: 10.00,
      deliveryZone: 'regional'
    },
    {
      code: 'northern',
      name: 'Northern',
      capital: 'Tamale',
      cities: ['Tamale', 'Yendi', 'Savelugu', 'Salaga'],
      deliveryFee: 15.00,
      deliveryZone: 'remote'
    },
    {
      code: 'western',
      name: 'Western',
      capital: 'Sekondi-Takoradi',
      cities: ['Sekondi-Takoradi', 'Tarkwa', 'Prestea', 'Axim'],
      deliveryFee: 12.00,
      deliveryZone: 'regional'
    },
    {
      code: 'eastern',
      name: 'Eastern',
      capital: 'Koforidua',
      cities: ['Koforidua', 'Akosombo', 'Nkawkaw', 'Akim Oda'],
      deliveryFee: 8.00,
      deliveryZone: 'regional'
    },
    {
      code: 'volta',
      name: 'Volta',
      capital: 'Ho',
      cities: ['Ho', 'Hohoe', 'Keta', 'Aflao'],
      deliveryFee: 12.00,
      deliveryZone: 'regional'
    },
    {
      code: 'central',
      name: 'Central',
      capital: 'Cape Coast',
      cities: ['Cape Coast', 'Elmina', 'Winneba', 'Kasoa'],
      deliveryFee: 10.00,
      deliveryZone: 'regional'
    },
    {
      code: 'upper-east',
      name: 'Upper East',
      capital: 'Bolgatanga',
      cities: ['Bolgatanga', 'Bawku', 'Navrongo'],
      deliveryFee: 20.00,
      deliveryZone: 'remote'
    },
    {
      code: 'upper-west',
      name: 'Upper West',
      capital: 'Wa',
      cities: ['Wa', 'Tumu', 'Lawra'],
      deliveryFee: 20.00,
      deliveryZone: 'remote'
    },
    {
      code: 'brong-ahafo',
      name: 'Brong Ahafo',
      capital: 'Sunyani',
      cities: ['Sunyani', 'Techiman', 'Berekum', 'Dormaa Ahenkro'],
      deliveryFee: 12.00,
      deliveryZone: 'regional'
    }
  ],

  // Mobile Money providers in Ghana
  mobileMoneyProviders: [
    {
      code: 'mtn',
      name: 'MTN Mobile Money',
      shortCode: '*170#',
      color: '#FFCC00',
      active: true
    },
    {
      code: 'vodafone',
      name: 'Vodafone Cash',
      shortCode: '*110#',
      color: '#E60000',
      active: true
    },
    {
      code: 'airtel_tigo',
      name: 'AirtelTigo Money',
      shortCode: '*100#',
      color: '#ED1C24',
      active: true
    }
  ],

  // Major banks in Ghana
  banks: [
    { code: 'gcb', name: 'GCB Bank Limited' },
    { code: 'ecobank', name: 'Ecobank Ghana Limited' },
    { code: 'absa', name: 'Absa Bank Ghana Limited' },
    { code: 'stanbic', name: 'Stanbic Bank Ghana Limited' },
    { code: 'standard_chartered', name: 'Standard Chartered Bank Ghana Limited' },
    { code: 'fidelity', name: 'Fidelity Bank Ghana Limited' },
    { code: 'cal_bank', name: 'CAL Bank Limited' },
    { code: 'republic_bank', name: 'Republic Bank Ghana Limited' },
    { code: 'access_bank', name: 'Access Bank Ghana Limited' }
  ],

  // Product categories for Ghana market
  categories: [
    {
      id: 'groceries',
      name: 'Groceries & Food',
      description: 'Fresh produce, local foods, beverages, and pantry items',
      subcategories: [
        'Fresh Produce',
        'Local Foods',
        'Beverages',
        'Dairy & Eggs',
        'Meat & Fish',
        'Pantry Items',
        'Spices & Seasonings'
      ]
    },
    {
      id: 'electronics',
      name: 'Electronics',
      description: 'Mobile phones, laptops, home appliances, and tech accessories',
      subcategories: [
        'Mobile Phones',
        'Laptops & Computers',
        'TV & Audio',
        'Home Appliances',
        'Gaming',
        'Smart Devices'
      ]
    },
    {
      id: 'consumables',
      name: 'Everyday Consumables',
      description: 'Personal care, health products, and household items',
      subcategories: [
        'Personal Care',
        'Health & Wellness',
        'Household Items',
        'Baby Care',
        'Beauty Products'
      ]
    },
    {
      id: 'fashion',
      name: 'Fashion & Clothing',
      description: 'Clothing, shoes, accessories, and traditional wear',
      subcategories: [
        'Men\'s Clothing',
        'Women\'s Clothing',
        'Traditional Wear',
        'Shoes & Footwear',
        'Bags & Accessories',
        'Jewelry'
      ]
    },
    {
      id: 'home_garden',
      name: 'Home & Garden',
      description: 'Furniture, home decor, kitchen items, and garden supplies',
      subcategories: [
        'Furniture',
        'Kitchen & Dining',
        'Home Decor',
        'Garden & Outdoor'
      ]
    }
  ],

  // Ghana business hours (GMT+0)
  defaultBusinessHours: {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: false }
  },

  // Currency and tax settings
  currency: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghana Cedi',
    decimals: 2
  },

  taxes: {
    vat: 0.125, // 12.5% VAT
    nhil: 0.025, // 2.5% National Health Insurance Levy
    getfund: 0.025 // 2.5% Ghana Education Trust Fund levy
  },

  // Phone number validation
  phoneRegex: /^(\+233|0)(20|23|24|26|27|28|50|54|55|56|57|59)\d{7}$/,

  // GPS code validation
  gpsCodeRegex: /^[A-Z]{2}-\d{4}-\d{4}$/
};

// Utility functions
export const ghanaUtils = {
  isValidPhoneNumber: (phone: string): boolean => {
    return ghanaConfig.phoneRegex.test(phone);
  },

  isValidGPSCode: (gps: string): boolean => {
    return ghanaConfig.gpsCodeRegex.test(gps);
  },

  formatCurrency: (amount: number): string => {
    return `${ghanaConfig.currency.symbol}${amount.toFixed(ghanaConfig.currency.decimals)}`;
  },

  calculateTotalTax: (amount: number): number => {
    const vat = amount * ghanaConfig.taxes.vat;
    const nhil = amount * ghanaConfig.taxes.nhil;
    const getfund = amount * ghanaConfig.taxes.getfund;
    return vat + nhil + getfund;
  },

  getRegionByCode: (code: string) => {
    return ghanaConfig.regions.find(region => region.code === code);
  },

  getMobileMoneyProvider: (code: string) => {
    return ghanaConfig.mobileMoneyProviders.find(provider => provider.code === code);
  }
};