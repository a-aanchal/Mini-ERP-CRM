import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const Role = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTS: 'ACCOUNTS',
};

const CustomerType = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  DISTRIBUTOR: 'DISTRIBUTOR',
};

const CustomerStatus = {
  LEAD: 'LEAD',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

const MovementType = {
  IN: 'IN',
  OUT: 'OUT',
};

const ChallanStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing database records
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // Create Users with hashed passwords
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashSales = await bcrypt.hash('Sales@123', 10);
  const passwordHashWarehouse = await bcrypt.hash('Warehouse@123', 10);
  const passwordHashAccounts = await bcrypt.hash('Accounts@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      password: passwordHashAdmin,
      role: Role.ADMIN,
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Sales Manager',
      email: 'sales@example.com',
      password: passwordHashSales,
      role: Role.SALES,
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Warehouse Supervisor',
      email: 'warehouse@example.com',
      password: passwordHashWarehouse,
      role: Role.WAREHOUSE,
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Accounts Officer',
      email: 'accounts@example.com',
      password: passwordHashAccounts,
      role: Role.ACCOUNTS,
    },
  });

  console.log('Created test users for all 4 roles.');

  // Seed Customers (At least 8)
  const customersData = [
    {
      customerName: 'ABC Traders',
      mobileNumber: '9876543210',
      email: 'contact@abctraders.com',
      businessName: 'ABC Traders Pvt Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: CustomerType.WHOLESALE,
      address: '102 Business Hub, MG Road, Mumbai',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-15'),
      notes: 'Key wholesale partner for electronics.',
    },
    {
      customerName: 'Global Enterprises',
      mobileNumber: '9822012345',
      email: 'info@globalent.com',
      businessName: 'Global Logistics & Trading',
      gstNumber: '27BBBCA1111B1Z2',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Industrial Area Phase 2, Pune',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-12'),
      notes: 'Distributor covering Western Region.',
    },
    {
      customerName: 'Metro Electronics',
      mobileNumber: '9988776655',
      email: 'sales@metroelec.com',
      businessName: 'Metro Retail Store',
      gstNumber: '27CCCCB2222C1Z9',
      customerType: CustomerType.RETAIL,
      address: '45 Commercial Street, Bangalore',
      status: CustomerStatus.ACTIVE,
      notes: 'Retail store ordering weekly.',
    },
    {
      customerName: 'Apex Distributors',
      mobileNumber: '9123456789',
      email: 'purchase@apexdist.com',
      businessName: 'Apex Wholesale Corp',
      gstNumber: '27DDDDD3333D1Z4',
      customerType: CustomerType.DISTRIBUTOR,
      address: '88 Ring Road, Delhi',
      status: CustomerStatus.LEAD,
      followUpDate: new Date('2026-08-10'),
      notes: 'New lead interested in bulk laptop orders.',
    },
    {
      customerName: 'Sunrise Tech World',
      mobileNumber: '9765432109',
      email: 'hello@sunrisetech.in',
      businessName: 'Sunrise Technologies',
      gstNumber: '27EEEEE4444E1Z1',
      customerType: CustomerType.WHOLESALE,
      address: 'Plot 12, IT Park, Hyderabad',
      status: CustomerStatus.ACTIVE,
      notes: 'High volume wholesale buyer.',
    },
    {
      customerName: 'Zenith Hardware Stores',
      mobileNumber: '9543210987',
      email: 'orders@zenithhardware.com',
      businessName: 'Zenith Retail Outlets',
      gstNumber: '27FFFFF5555F1Z7',
      customerType: CustomerType.RETAIL,
      address: 'Shop 4, Central Plaza, Chennai',
      status: CustomerStatus.INACTIVE,
      notes: 'Account inactive for 3 months.',
    },
    {
      customerName: 'Pinnacle Distribution',
      mobileNumber: '9321098765',
      email: 'admin@pinnacle.com',
      businessName: 'Pinnacle Supply Networks',
      gstNumber: '27GGGGG6666G1Z3',
      customerType: CustomerType.DISTRIBUTOR,
      address: '500 Warehousing Complex, Ahmedabad',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-20'),
      notes: 'Quarterly review scheduled.',
    },
    {
      customerName: 'Vanguard Retailers',
      mobileNumber: '9112233445',
      email: 'contact@vanguardretail.com',
      businessName: 'Vanguard Mart',
      gstNumber: '27HHHHH7777H1Z8',
      customerType: CustomerType.RETAIL,
      address: '15 Station Road, Kolkata',
      status: CustomerStatus.LEAD,
      followUpDate: new Date('2026-08-18'),
      notes: 'Quotation sent for peripherals.',
    },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({ data: c });
    createdCustomers.push(customer);
  }
  console.log(`Seeded ${createdCustomers.length} customers.`);

  // Seed FollowUps
  await prisma.followUp.create({
    data: {
      customerId: createdCustomers[0].id,
      notes: 'Initial meeting completed. Discussed credit terms.',
      followUpDate: new Date('2026-08-15'),
      createdById: sales.id,
    },
  });

  await prisma.followUp.create({
    data: {
      customerId: createdCustomers[3].id,
      notes: 'Sent product catalog and price list.',
      followUpDate: new Date('2026-08-10'),
      createdById: sales.id,
    },
  });

  // Seed Products (At least 12, with normal stock, low stock, out of stock)
  const productsData = [
    {
      productName: 'Professional Laptop Pro 15',
      sku: 'LAP-PRO-15',
      category: 'Laptops',
      unitPrice: 65000.0,
      currentStock: 25,
      minimumStock: 5,
      warehouseLocation: 'Shelf A-12',
    },
    {
      productName: 'Business Ultrabook 14',
      sku: 'LAP-ULT-14',
      category: 'Laptops',
      unitPrice: 52000.0,
      currentStock: 10,
      minimumStock: 5,
      warehouseLocation: 'Shelf A-14',
    },
    {
      productName: 'Ergonomic Mechanical Keyboard',
      sku: 'ACC-KEY-01',
      category: 'Accessories',
      unitPrice: 3500.0,
      currentStock: 45,
      minimumStock: 10,
      warehouseLocation: 'Bin B-05',
    },
    {
      productName: 'Wireless Optical Mouse',
      sku: 'ACC-MOU-02',
      category: 'Accessories',
      unitPrice: 850.0,
      currentStock: 80,
      minimumStock: 20,
      warehouseLocation: 'Bin B-08',
    },
    {
      productName: '4K UHD Monitor 27 Inch',
      sku: 'DIS-MON-27',
      category: 'Displays',
      unitPrice: 24000.0,
      currentStock: 3, // LOW STOCK (minimumStock = 5)
      minimumStock: 5,
      warehouseLocation: 'Rack C-01',
    },
    {
      productName: 'Full HD Curved Monitor 24 Inch',
      sku: 'DIS-MON-24',
      category: 'Displays',
      unitPrice: 14500.0,
      currentStock: 2, // LOW STOCK (minimumStock = 5)
      minimumStock: 5,
      warehouseLocation: 'Rack C-03',
    },
    {
      productName: 'Thunderbolt 4 Docking Station',
      sku: 'HUB-TB4-01',
      category: 'Accessories',
      unitPrice: 11000.0,
      currentStock: 0, // OUT OF STOCK
      minimumStock: 5,
      warehouseLocation: 'Bin B-12',
    },
    {
      productName: 'Noise Cancelling Wireless Headset',
      sku: 'AUD-HDS-01',
      category: 'Audio',
      unitPrice: 7500.0,
      currentStock: 30,
      minimumStock: 8,
      warehouseLocation: 'Shelf D-02',
    },
    {
      productName: 'Gigabit Wi-Fi 6 Router',
      sku: 'NET-ROU-06',
      category: 'Networking',
      unitPrice: 4800.0,
      currentStock: 18,
      minimumStock: 5,
      warehouseLocation: 'Shelf E-01',
    },
    {
      productName: 'Managed 24-Port Switch',
      sku: 'NET-SWI-24',
      category: 'Networking',
      unitPrice: 18500.0,
      currentStock: 4, // LOW STOCK
      minimumStock: 5,
      warehouseLocation: 'Shelf E-04',
    },
    {
      productName: 'External SSD 1TB Portable',
      sku: 'STR-SSD-01',
      category: 'Storage',
      unitPrice: 8200.0,
      currentStock: 50,
      minimumStock: 10,
      warehouseLocation: 'Bin F-01',
    },
    {
      productName: 'NAS Server 4-Bay Storage',
      sku: 'STR-NAS-04',
      category: 'Storage',
      unitPrice: 38000.0,
      currentStock: 6,
      minimumStock: 3,
      warehouseLocation: 'Rack F-09',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.create({ data: p });
    createdProducts.push(product);
  }
  console.log(`Seeded ${createdProducts.length} products.`);

  // Seed Initial Stock Movements
  for (const product of createdProducts) {
    if (product.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: product.currentStock,
          movementType: MovementType.IN,
          reason: 'Initial stock load upon system startup',
          createdById: warehouse.id,
        },
      });
    }
  }
  console.log('Seeded initial stock movements.');

  // Seed Challans (1 Draft, 1 Confirmed)
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-00001',
      customerId: createdCustomers[0].id,
      totalQuantity: 3,
      status: ChallanStatus.CONFIRMED,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productNameSnapshot: createdProducts[0].productName,
            skuSnapshot: createdProducts[0].sku,
            unitPriceSnapshot: createdProducts[0].unitPrice,
            quantity: 2,
          },
          {
            productId: createdProducts[2].id,
            productNameSnapshot: createdProducts[2].productName,
            skuSnapshot: createdProducts[2].sku,
            unitPriceSnapshot: createdProducts[2].unitPrice,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: createdProducts[0].id,
      quantity: 2,
      movementType: MovementType.OUT,
      reason: `Sales Challan ${challan1.challanNumber}`,
      createdById: sales.id,
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: createdProducts[2].id,
      quantity: 1,
      movementType: MovementType.OUT,
      reason: `Sales Challan ${challan1.challanNumber}`,
      createdById: sales.id,
    },
  });

  await prisma.challan.create({
    data: {
      challanNumber: 'CH-00002',
      customerId: createdCustomers[1].id,
      totalQuantity: 5,
      status: ChallanStatus.DRAFT,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            productNameSnapshot: createdProducts[1].productName,
            skuSnapshot: createdProducts[1].sku,
            unitPriceSnapshot: createdProducts[1].unitPrice,
            quantity: 2,
          },
          {
            productId: createdProducts[3].id,
            productNameSnapshot: createdProducts[3].productName,
            skuSnapshot: createdProducts[3].sku,
            unitPriceSnapshot: createdProducts[3].unitPrice,
            quantity: 3,
          },
        ],
      },
    },
  });

  console.log('Seeded sample Challans (Draft and Confirmed).');
  console.log('✅ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
