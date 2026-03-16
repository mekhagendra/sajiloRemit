import mongoose from 'mongoose';
import { config } from './config';
import User from './models/User';
import Vendor from './models/Vendor';
import RemittanceRate from './models/RemittanceRate';
import BankInterestRate from './models/BankInterestRate';
import Bank from './models/Bank';
import Blog from './models/Blog';
import Review from './models/Review';
import { UserRole, VendorStatus } from './types/enums';

const seed = async () => {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Vendor.deleteMany({}),
    RemittanceRate.deleteMany({}),
    BankInterestRate.deleteMany({}),
    Bank.deleteMany({}),
    Blog.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Create admin
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@sajiloremit.com',
    password: 'admin123',
    role: UserRole.ADMIN,
  });

  // Create vendor users
  const vendorUser1 = await User.create({
    name: 'WorldRemit Agent',
    email: 'vendor1@sajiloremit.com',
    password: 'vendor123',
    role: UserRole.VENDOR,
  });

  const vendorUser2 = await User.create({
    name: 'Remitly Agent',
    email: 'vendor2@sajiloremit.com',
    password: 'vendor123',
    role: UserRole.VENDOR,
  });

  const vendorUser3 = await User.create({
    name: 'Western Union Agent',
    email: 'vendor3@sajiloremit.com',
    password: 'vendor123',
    role: UserRole.VENDOR,
  });

  // Create regular users
  const user1 = await User.create({
    name: 'Ram Sharma',
    email: 'user1@sajiloremit.com',
    password: 'user123',
    role: UserRole.USER,
  });

  const user2 = await User.create({
    name: 'Sita Thapa',
    email: 'user2@sajiloremit.com',
    password: 'user123',
    role: UserRole.USER,
  });

  // Create vendors
  const vendor1 = await Vendor.create({
    userId: vendorUser1._id,
    companyName: 'WorldRemit',
    baseCountry: 'Australia',
    supportedCountries: [
      { countryCode: 'NP', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'IN', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'PH', canSend: false, canReceive: true, isActive: true },
    ],
    email: 'info@worldremit.com',
    phone: '+61-400-000-001',
    website: 'https://www.worldremit.com',
    description: 'Send money online to Nepal with WorldRemit.',
    logo: '',
    status: VendorStatus.APPROVED,
  });

  const vendor2 = await Vendor.create({
    userId: vendorUser2._id,
    companyName: 'Remitly',
    baseCountry: 'Australia',
    supportedCountries: [
      { countryCode: 'NP', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'IN', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'BD', canSend: false, canReceive: true, isActive: true },
    ],
    email: 'info@remitly.com',
    phone: '+61-400-000-002',
    website: 'https://www.remitly.com',
    description: 'Fast, reliable money transfers to Nepal.',
    logo: '',
    status: VendorStatus.APPROVED,
  });

  const vendor3 = await Vendor.create({
    userId: vendorUser3._id,
    companyName: 'Western Union',
    baseCountry: 'United States',
    supportedCountries: [
      { countryCode: 'NP', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'IN', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'PH', canSend: false, canReceive: true, isActive: true },
      { countryCode: 'BD', canSend: false, canReceive: true, isActive: true },
    ],
    email: 'info@westernunion.com',
    phone: '+1-800-000-001',
    website: 'https://www.westernunion.com',
    description: 'Trusted worldwide money transfer service.',
    logo: '',
    status: VendorStatus.APPROVED,
  });

  // Create remittance rates
  const rates = [
    { vendorId: vendor1._id, fromCurrency: 'AUD', toCurrency: 'NPR', rate: 88.35, unit: 1, fee: 3.99 },
    { vendorId: vendor1._id, fromCurrency: 'USD', toCurrency: 'NPR', rate: 133.50, unit: 1, fee: 2.99 },
    { vendorId: vendor1._id, fromCurrency: 'GBP', toCurrency: 'NPR', rate: 168.20, unit: 1, fee: 2.49 },
    { vendorId: vendor2._id, fromCurrency: 'AUD', toCurrency: 'NPR', rate: 88.10, unit: 1, fee: 3.49 },
    { vendorId: vendor2._id, fromCurrency: 'USD', toCurrency: 'NPR', rate: 133.20, unit: 1, fee: 1.99 },
    { vendorId: vendor2._id, fromCurrency: 'GBP', toCurrency: 'NPR', rate: 167.80, unit: 1, fee: 2.99 },
    { vendorId: vendor2._id, fromCurrency: 'EUR', toCurrency: 'NPR', rate: 145.30, unit: 1, fee: 2.99 },
    { vendorId: vendor3._id, fromCurrency: 'AUD', toCurrency: 'NPR', rate: 88.55, unit: 1, fee: 4.99 },
    { vendorId: vendor3._id, fromCurrency: 'USD', toCurrency: 'NPR', rate: 133.80, unit: 1, fee: 4.99 },
    { vendorId: vendor3._id, fromCurrency: 'GBP', toCurrency: 'NPR', rate: 168.50, unit: 1, fee: 3.99 },
    { vendorId: vendor3._id, fromCurrency: 'EUR', toCurrency: 'NPR', rate: 145.60, unit: 1, fee: 3.99 },
    { vendorId: vendor3._id, fromCurrency: 'CAD', toCurrency: 'NPR', rate: 98.20, unit: 1, fee: 3.99 },
    { vendorId: vendor3._id, fromCurrency: 'JPY', toCurrency: 'NPR', rate: 0.89, unit: 1, fee: 4.99 },
  ];
  await RemittanceRate.insertMany(rates);

  // Create banks
  const [nabilBank, nibBank, globalIme, nmbBank, himalayan, prabhuBank, siddhartha] = await Promise.all([
    Bank.create({ name: 'Nabil Bank', country: 'Nepal' }),
    Bank.create({ name: 'Nepal Investment Bank', country: 'Nepal' }),
    Bank.create({ name: 'Global IME Bank', country: 'Nepal' }),
    Bank.create({ name: 'NMB Bank', country: 'Nepal' }),
    Bank.create({ name: 'Himalayan Bank', country: 'Nepal' }),
    Bank.create({ name: 'Prabhu Bank', country: 'Nepal' }),
    Bank.create({ name: 'Siddhartha Bank', country: 'Nepal' }),
  ]);

  // Create bank interest rates
  const bankRates = [
    { bank: nabilBank._id, plan: 'Fixed Deposit', duration: '1 Year', rate: 8.5, paymentTerm: 'Monthly', featured: true },
    { bank: nabilBank._id, plan: 'Savings', duration: 'N/A', rate: 5.0, paymentTerm: 'Quarterly', featured: false },
    { bank: nibBank._id, plan: 'Fixed Deposit', duration: '2 Years', rate: 9.0, paymentTerm: 'Monthly', featured: true },
    { bank: nibBank._id, plan: 'Fixed Deposit', duration: '1 Year', rate: 8.25, paymentTerm: 'Monthly', featured: false },
    { bank: globalIme._id, plan: 'Fixed Deposit', duration: '1 Year', rate: 8.75, paymentTerm: 'Monthly', featured: true },
    { bank: globalIme._id, plan: 'Savings', duration: 'N/A', rate: 5.25, paymentTerm: 'Quarterly', featured: false },
    { bank: nmbBank._id, plan: 'Fixed Deposit', duration: '6 Months', rate: 7.5, paymentTerm: 'Monthly', featured: false },
    { bank: nmbBank._id, plan: 'Fixed Deposit', duration: '1 Year', rate: 8.0, paymentTerm: 'Monthly', featured: true },
    { bank: himalayan._id, plan: 'Fixed Deposit', duration: '1 Year', rate: 8.25, paymentTerm: 'Monthly', featured: false },
    { bank: himalayan._id, plan: 'Fixed Deposit', duration: '3 Years', rate: 9.5, paymentTerm: 'Quarterly', featured: true },
    { bank: prabhuBank._id, plan: 'Savings', duration: 'N/A', rate: 5.5, paymentTerm: 'Quarterly', featured: false },
    { bank: siddhartha._id, plan: 'Fixed Deposit', duration: '1 Year', rate: 8.3, paymentTerm: 'Monthly', featured: true },
  ];
  await BankInterestRate.insertMany(bankRates);

  // Create blogs
  await Blog.insertMany([
    {
      title: 'Best Ways to Send Money to Nepal in 2026',
      thumbnail: '',
      shortDescription: 'Compare the top remittance services for sending money to Nepal from abroad.',
      content: 'Sending money to Nepal has never been easier. With multiple options available...',
      author: admin._id,
      isPublished: true,
    },
    {
      title: 'Understanding Exchange Rates',
      thumbnail: '',
      shortDescription: 'Learn how exchange rates work and how to get the best deal on your transfers.',
      content: 'Exchange rates fluctuate based on various economic factors...',
      author: admin._id,
      isPublished: true,
    },
    {
      title: 'Nepal Bank Interest Rates Guide',
      thumbnail: '',
      shortDescription: 'A comprehensive guide to understanding bank interest rates in Nepal.',
      content: 'Nepali banks offer competitive interest rates for various deposit schemes...',
      author: admin._id,
      isPublished: true,
    },
  ]);

  // Create reviews
  await Review.insertMany([
    { userId: user1._id, vendorId: vendor1._id, rating: 4, text: 'Great service, fast transfers to Nepal!', isApproved: true },
    { userId: user2._id, vendorId: vendor1._id, rating: 5, text: 'Very reliable and competitive rates.', isApproved: true },
    { userId: user1._id, vendorId: vendor2._id, rating: 4, text: 'Good rates but transfer took a bit longer than expected.', isApproved: true },
    { userId: user2._id, vendorId: vendor3._id, rating: 3, text: 'Trusted service but fees are a bit high.', isApproved: true },
  ]);

  console.log('Seed data created successfully!');
  console.log('\nTest Accounts:');
  console.log('Admin: admin@sajiloremit.com / admin123');
  console.log('Vendor: vendor1@sajiloremit.com / vendor123');
  console.log('User: user1@sajiloremit.com / user123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
