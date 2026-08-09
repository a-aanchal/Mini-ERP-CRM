import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';
import { Role, CustomerType, CustomerStatus, ChallanStatus } from '../src/types';

describe('Mini ERP + CRM Business Logic & Integration Tests', () => {
  let adminToken: string;
  let salesToken: string;
  let warehouseToken: string;
  let testCustomerId: number;
  let testProductId: number;
  let lowStockProductId: number;

  beforeAll(async () => {
    // Clear and set up test database state
    await prisma.challanItem.deleteMany();
    await prisma.challan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    const passAdmin = await bcrypt.hash('Admin@123', 10);
    const passSales = await bcrypt.hash('Sales@123', 10);
    const passWh = await bcrypt.hash('Warehouse@123', 10);

    await prisma.user.create({
      data: { name: 'Test Admin', email: 'admin@test.com', password: passAdmin, role: Role.ADMIN },
    });

    await prisma.user.create({
      data: { name: 'Test Sales', email: 'sales@test.com', password: passSales, role: Role.SALES },
    });

    await prisma.user.create({
      data: { name: 'Test WH', email: 'warehouse@test.com', password: passWh, role: Role.WAREHOUSE },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Authentication Tests
  it('1. Login works for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@test.com', password: 'Sales@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    salesToken = res.body.data.token;
  });

  it('1b. Admin Login works and returns admin token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    adminToken = res.body.data.token;
  });

  it('1c. Warehouse Login works', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'warehouse@test.com', password: 'Warehouse@123' });

    expect(res.status).toBe(200);
    warehouseToken = res.body.data.token;
  });

  it('2. Invalid login fails with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 3. Customer CRUD
  it('3. Customer creation works', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerName: 'ABC Traders Test',
        mobileNumber: '9876543210',
        email: 'test@abctraders.com',
        businessName: 'ABC Traders Ltd',
        gstNumber: '27AAAAA0000A1Z5',
        customerType: CustomerType.WHOLESALE,
        address: '123 Test Street, Mumbai',
        status: CustomerStatus.ACTIVE,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    testCustomerId = res.body.data.id;
  });

  // 4. Product Creation
  it('4. Product creation works', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productName: 'Laptop Test',
        sku: 'LAP-TEST-001',
        category: 'Laptops',
        unitPrice: 50000,
        currentStock: 10,
        minimumStock: 3,
        warehouseLocation: 'Shelf A-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentStock).toBe(10);
    testProductId = res.body.data.id;

    // Create a 2nd product with low stock (2 items)
    const res2 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productName: 'Low Stock Item',
        sku: 'LOW-STOCK-001',
        category: 'Accessories',
        unitPrice: 1000,
        currentStock: 2,
        minimumStock: 5,
        warehouseLocation: 'Shelf B-01',
      });

    lowStockProductId = res2.body.data.id;
  });

  // 5. Draft Challan does NOT reduce stock
  it('5. Draft sales challan creation does not reduce stock', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId: testCustomerId,
        status: ChallanStatus.DRAFT,
        items: [
          { productId: testProductId, quantity: 3 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(ChallanStatus.DRAFT);
    const draftChallanId = res.body.data.id;

    // Verify stock remains 10
    const productRes = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(productRes.body.data.currentStock).toBe(10);

    // Confirm this draft challan for test 6
    const confirmRes = await request(app)
      .put(`/api/challans/${draftChallanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe(ChallanStatus.CONFIRMED);
  });

  // 6. Confirmed Challan reduces stock & creates OUT movement
  it('6. Confirmed sales challan reduces stock from 10 to 7 and creates OUT movement', async () => {
    const productRes = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(productRes.body.data.currentStock).toBe(7);

    // Verify OUT stock movement exists
    const stockRes = await request(app)
      .get(`/api/stock/movements?productId=${testProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(stockRes.body.data.length).toBeGreaterThan(0);
    expect(stockRes.body.data[0].movementType).toBe('OUT');
    expect(stockRes.body.data[0].quantity).toBe(3);
  });

  // 7 & 8. Insufficient Stock rejects confirmation & stock never becomes negative
  it('7 & 8. Insufficient stock rejects confirmation and stock remains 7', async () => {
    // Attempt to confirm a challan requesting 10 items when available stock is 7
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId: testCustomerId,
        status: ChallanStatus.CONFIRMED,
        items: [
          { productId: testProductId, quantity: 10 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient stock for Laptop Test');
    expect(res.body.available).toBe(7);
    expect(res.body.requested).toBe(10);

    // Verify stock is STILL 7 and not negative or modified
    const productRes = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(productRes.body.data.currentStock).toBe(7);
  });

  // 9. Unauthorized users cannot access restricted APIs
  it('9. Role-based authorization blocks unauthorized requests', async () => {
    // Warehouse user trying to create a customer should be blocked (HTTP 403)
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        customerName: 'Unauthorized Customer',
        mobileNumber: '9999999999',
        email: 'unauth@test.com',
        businessName: 'Unauth Inc',
        address: 'No access',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
