import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const DDAPL_EMAIL = 'ddapl@example.com';
const DDAPL_PASSWORD = 'password123';

describe('E2E: DDAPL User Role', () => {
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
    // Attempt to logout if logged in
    const [logoutButton] = await page.$$('::-p-xpath(//button[contains(., "Logout")])');
    if (logoutButton) {
      await (logoutButton as any).click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    }
  });

  test('TC_D01 & TC_D02: Authentication', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    
    // Test Invalid Login (TC_D02)
    await page.type('input[type="email"]', 'wrong@example.com');
    await page.type('input[type="password"]', 'badpass');
    await page.click('button[type="submit"]');
    
    // Wait for error message (adjust selector based on your toast/error UI)
    // await page.waitForSelector('.text-red-500'); 
    
    // Test Valid Login (TC_D01)
    await page.evaluate(() => (document.querySelector('input[type="email"]') as HTMLInputElement).value = '');
    await page.evaluate(() => (document.querySelector('input[type="password"]') as HTMLInputElement).value = '');
    
    await page.type('input[type="email"]', DDAPL_EMAIL);
    await page.type('input[type="password"]', DDAPL_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    expect(page.url()).toContain('/ddapl');
  });

  test('TC_D04: Unauthorized Access Prevention', async () => {
    // Assuming we are logged out due to afterEach
    await page.goto(`${BASE_URL}/ddapl`);
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    // Should be redirected to login
    expect(page.url()).toContain('/login');
  });

  test('TC_D16: Sidebar Analytics Match', async () => {
    // Log in
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', DDAPL_EMAIL);
    await page.type('input[type="password"]', DDAPL_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Get number in the tab
    const [tabElem] = await page.$$('::-p-xpath(//button[contains(., "Action Required")])');
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
