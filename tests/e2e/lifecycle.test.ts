import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

// --- CONFIGURATION ---
const BASE_URL = 'http://localhost:3000';

// ** IMPORTANT **: Update these with real test credentials in your local database
const DDAPL_EMAIL = 'ddapl@example.com';
const DDAPL_PASSWORD = 'password123';

const CUSTOMER_EMAIL = 'customer@example.com';
const CUSTOMER_PASSWORD = 'password123';

// We'll generate a unique PO number for each test run to avoid collisions
const TEST_PO_NUMBER = `E2E-TEST-${Date.now()}`;

describe('E2E: Golden Path Lifecycle', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true to run headlessly
      defaultViewport: null,
      args: ['--start-maximized'],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  // Helper function to login
  const login = async (email: string, password: string) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  };

  const logout = async () => {
    // Assuming there is a logout button with text "Logout"
    const [logoutButton] = await page.$$('::-p-xpath(//button[contains(., "Logout")])');
    if (logoutButton) {
      await (logoutButton as any).click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }
  };

  test('1. DDAPL logs in, creates a PO, and uploads documents', async () => {
    // 1. Login as DDAPL
    await login(DDAPL_EMAIL, DDAPL_PASSWORD);
    
    // Ensure we are on the dashboard
    expect(page.url()).toContain('/ddapl');

    // 2. Create PO
    const [createBtn] = await page.$$('::-p-xpath(//button[contains(., "Upload PO")])');
    if (createBtn) {
      await (createBtn as any).click();
    }
    
    // Wait for modal or form
    await page.waitForSelector('input[name="poNumber"]');
    
    // Fill form
    await page.type('input[name="poNumber"]', TEST_PO_NUMBER);
    await page.type('input[name="amount"]', '1000');
    await page.type('input[name="totalShipments"]', '1');

    // Upload PO PDF
    const poFilepath = path.join(__dirname, 'fixtures', 'dummy-po.pdf');
    const [poFileInput] = await page.$$('::-p-xpath(//input[@type="file"])');
    if (poFileInput) {
      await (poFileInput as any).uploadFile(poFilepath);
    }
    
    // Submit PO
    const [submitBtn] = await page.$$('::-p-xpath(//button[contains(., "Submit")] | //button[contains(., "Create")])');
    if (submitBtn) {
      await (submitBtn as any).click();
    }

    // Wait for success toast or modal to close
    await new Promise(r => setTimeout(r, 2000));

    // 3. Upload Invoice and POD for the shipment
    // Expand the PO card
    const [poCard] = await page.$$(`::-p-xpath(//span[contains(text(), "${TEST_PO_NUMBER}")]/ancestor::tr | //div[contains(text(), "${TEST_PO_NUMBER}")]/ancestor::div)`);
    if (poCard) {
      const [viewDetailsBtn] = await (poCard as any).$$('::-p-xpath(.//button[contains(., "View Details")])');
      if (viewDetailsBtn) await viewDetailsBtn.click();
    }

    await new Promise(r => setTimeout(r, 1000));

    // Upload Invoice
    const [invoiceBtn] = await page.$$('::-p-xpath(//button[contains(., "Upload Invoice")])');
    if (invoiceBtn) {
      await (invoiceBtn as any).click();
      await page.waitForSelector('input[type="file"]');
      const invoiceFilepath = path.join(__dirname, 'fixtures', 'dummy-invoice.pdf');
      const fileInput = await page.$('input[type="file"]');
      await fileInput?.uploadFile(invoiceFilepath);
      const [confirmUpload] = await page.$$('::-p-xpath(//button[contains(., "Confirm")] | //button[contains(., "Upload")])');
      if (confirmUpload) await (confirmUpload as any).click();
      await new Promise(r => setTimeout(r, 2000));
    }

    // Upload POD
    const [podBtn] = await page.$$('::-p-xpath(//button[contains(., "Upload POD")])');
    if (podBtn) {
      await (podBtn as any).click();
      await page.waitForSelector('input[type="file"]');
      const podFilepath = path.join(__dirname, 'fixtures', 'dummy-invoice.pdf'); // Re-using dummy invoice as POD for test
      const fileInput = await page.$('input[type="file"]');
      await fileInput?.uploadFile(podFilepath);
      const [confirmUpload] = await page.$$('::-p-xpath(//button[contains(., "Confirm")] | //button[contains(., "Upload")])');
      if (confirmUpload) await (confirmUpload as any).click();
      await new Promise(r => setTimeout(r, 2000));
    }

    // 4. Logout
    await logout();
  });

  test('2. Customer logs in and rejects the shipment', async () => {
    // 5. Log in as Customer
    await login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    
    // Ensure we are on the customer dashboard
    expect(page.url()).toContain('/customer');

    // 6. Find the newly created PO and reject the shipment
    // Expand the PO card
    const [poCard] = await page.$$(`::-p-xpath(//span[contains(text(), "${TEST_PO_NUMBER}")]/ancestor::tr)`);
    if (poCard) {
      const [viewDetailsBtn] = await (poCard as any).$$('::-p-xpath(.//button[contains(., "View Details")])');
      if (viewDetailsBtn) await viewDetailsBtn.click();
    }

    await new Promise(r => setTimeout(r, 1000));

    // Reject Shipment
    const [rejectBtn] = await page.$$('::-p-xpath(//button[contains(., "Reject")])');
    if (rejectBtn) {
      await (rejectBtn as any).click();
      await page.waitForSelector('textarea');
      await page.type('textarea', 'E2E Test Rejection Reason');
      
      const [confirmReject] = await page.$$('::-p-xpath(//button[contains(., "Confirm Rejection")])');
      if (confirmReject) await (confirmReject as any).click();
      
      await new Promise(r => setTimeout(r, 2000));
    }

    // 7. Logout
    await logout();
  });

  test('3. DDAPL logs in and fixes the rejected shipment', async () => {
    // 8. Log in as DDAPL
    await login(DDAPL_EMAIL, DDAPL_PASSWORD);
    
    // 9. View rejected shipment and re-upload POD
    const [poCard] = await page.$$(`::-p-xpath(//span[contains(text(), "${TEST_PO_NUMBER}")]/ancestor::tr)`);
    if (poCard) {
      const [viewDetailsBtn] = await (poCard as any).$$('::-p-xpath(.//button[contains(., "View Details")])');
      if (viewDetailsBtn) await viewDetailsBtn.click();
    }

    await new Promise(r => setTimeout(r, 1000));

    // Verify rejection reason is visible (optional assertion)
    const [reasonText] = await page.$$('::-p-xpath(//p[contains(text(), "E2E Test Rejection Reason")])');
    expect(reasonText).toBeTruthy();

    // Re-upload POD to fix it
    const [podBtn] = await page.$$('::-p-xpath(//button[contains(., "Re-upload POD") | contains(., "Upload POD")])');
    if (podBtn) {
      await (podBtn as any).click();
      await page.waitForSelector('input[type="file"]');
      const podFilepath = path.join(__dirname, 'fixtures', 'dummy-invoice.pdf'); 
      const fileInput = await page.$('input[type="file"]');
      await fileInput?.uploadFile(podFilepath);
      const [confirmUpload] = await page.$$('::-p-xpath(//button[contains(., "Confirm")] | //button[contains(., "Upload")])');
      if (confirmUpload) await (confirmUpload as any).click();
      await new Promise(r => setTimeout(r, 2000));
    }

    // 10. Logout
    await logout();
  });

  test('4. Customer logs in and accepts the shipment', async () => {
    // 11. Log in as Customer
    await login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    
    // 12. Accept the shipment
    const [poCard] = await page.$$(`::-p-xpath(//span[contains(text(), "${TEST_PO_NUMBER}")]/ancestor::tr)`);
    if (poCard) {
      const [viewDetailsBtn] = await (poCard as any).$$('::-p-xpath(.//button[contains(., "View Details")])');
      if (viewDetailsBtn) await viewDetailsBtn.click();
    }

    await new Promise(r => setTimeout(r, 1000));

    // Accept Shipment
    const [acceptBtn] = await page.$$('::-p-xpath(//button[contains(., "Accept")])');
    if (acceptBtn) {
      await (acceptBtn as any).click();
      await new Promise(r => setTimeout(r, 2000));
    }

    // Verify it moves to Completed tab
    const [completedTab] = await page.$$('::-p-xpath(//button[contains(., "Completed")])');
    if (completedTab) {
      await (completedTab as any).click();
      await new Promise(r => setTimeout(r, 1000));
      
      const [completedPoCard] = await page.$$(`::-p-xpath(//span[contains(text(), "${TEST_PO_NUMBER}")])`);
      expect(completedPoCard).toBeTruthy();
    }
  });
});
