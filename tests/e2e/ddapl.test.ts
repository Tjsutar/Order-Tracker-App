import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const DDAPL_EMAIL = 'sandhya@ddautomation.co.in';
const DDAPL_PASSWORD = 'sandhya@2026';

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
      await page.evaluate((b) => (b as HTMLElement).click(), logoutButton);
      await page.waitForFunction(() => window.location.pathname === '/', { timeout: 5000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }
  });

  test('TC_D01 & TC_D02: Authentication', async () => {
    await page.goto(`${BASE_URL}/`);
    await new Promise(r => setTimeout(r, 1000)); // Wait for React hydration
    await page.waitForSelector('input[type="email"]');
    
    // Test Invalid Login (TC_D02)
    await page.type('input[type="email"]', 'wrong@example.com');
    await page.type('input[type="password"]', 'badpass');
    await page.click('button[type="submit"]');
    
    // Wait for error message (adjust selector based on your toast/error UI)
    // await page.waitForSelector('.text-red-500'); 
    
    // Test Valid Login (TC_D01)
    await page.goto(`${BASE_URL}/`);
    await new Promise(r => setTimeout(r, 1000));
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', DDAPL_EMAIL);
    await page.type('input[type="password"]', DDAPL_PASSWORD);
    
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.location.pathname !== '/', { timeout: 15000 });
    
    await new Promise(r => setTimeout(r, 1000));
    if (page.url().endsWith('/')) throw new Error(`Login failed for ${DDAPL_EMAIL}`);
    
    expect(page.url()).toContain('/ddapl');
  });

  test('TC_D04: Unauthorized Access Prevention', async () => {
    // Assuming we are logged out due to afterEach
    await page.goto(`${BASE_URL}/ddapl`);
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    // Should be redirected away or shown access denied
    expect(page.url()).not.toContain('/ddapl');
  });

  test('TC_D16: Sidebar Analytics Match', async () => {
    // Log in
    await page.goto(`${BASE_URL}/`);
    await new Promise(r => setTimeout(r, 1000));
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', DDAPL_EMAIL);
    await page.type('input[type="password"]', DDAPL_PASSWORD);
    
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.location.pathname !== '/', { timeout: 15000 });
    
    await new Promise(r => setTimeout(r, 1000));
    if (page.url().endsWith('/')) throw new Error(`Login failed for ${DDAPL_EMAIL}`);

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
