import puppeteer, { Browser, Page } from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const CUSTOMER_EMAIL = 'customer@example.com';
const CUSTOMER_PASSWORD = 'password123';

describe('E2E: Customer User Role', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  afterEach(async () => {
    const [logoutButton] = await page.$$('::-p-xpath(//button[contains(., "Logout")])');
    if (logoutButton) {
      await (logoutButton as any).click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    }
  });

  test('TC_C01 & TC_C02: Authentication & Navigation', async () => {
    // Valid Login (TC_C01)
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CUSTOMER_EMAIL);
    await page.type('input[type="password"]', CUSTOMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('/customer');

    // Unauthorized Access (TC_C02) - Attempt to visit DDAPL
    await page.goto(`${BASE_URL}/ddapl`);
    // Should be redirected away or shown access denied
    await new Promise(r => setTimeout(r, 1000));
    expect(page.url()).not.toContain('/ddapl');
  });

  test('TC_C04: Sidebar Analytics Match', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', CUSTOMER_EMAIL);
    await page.type('input[type="password"]', CUSTOMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Get number in the tab
    const [tabElem] = await page.$$('::-p-xpath(//button[contains(., "Active")])');
    let tabText = '';
    if (tabElem) {
      tabText = await page.evaluate(el => el.textContent, tabElem) || '';
    }
    const match = tabText.match(/\((\d+)\)/);
    const tabCount = match ? parseInt(match[1]) : 0;

    // Get number in sidebar "Total Active"
    const [sidebarElem] = await page.$$('::-p-xpath(//p[contains(text(), "Total Active")]/preceding-sibling::h3)');
    let sidebarText = '';
    if (sidebarElem) {
      sidebarText = await page.evaluate(el => el.textContent, sidebarElem) || '0';
    }
    const sidebarCount = parseInt(sidebarText);

    expect(sidebarCount).toEqual(tabCount);
  });
});
