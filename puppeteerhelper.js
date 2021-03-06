const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const blockedResources = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
];

class PuppeteerHelper {
  constructor() {
    this.browser = null;
  }

  launchBrowser(params = { debug: false }) {
    return new Promise(async (resolve, reject) => {
      try {
        const browser = await puppeteer.launch({
          ignoreHTTPSErrors: true,
          devtools: params.debug,
          args: [
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-infobars',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-accelerated-2d-canvas',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        });

        this.browser = browser;
        resolve(true);
      } catch (error) {
        console.log('Browser Launch Error: ', error);
        reject(error);
      }
    });
  }

  closeBrowser() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.browser) await this.browser.close();

        resolve(true);
      } catch (error) {
        console.log(`closeBrowser Error: ${error}`);
        reject(error);
      }
    });
  }

  launchPage(params = { blockResources: false }) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create New Page
        const page = await this.browser.newPage();

        // Set page View Port
        await page.setViewport({ width: 1366, height: 768 });

        // Set user agent for page.
        const userAgent = new UserAgent();
        await page.setUserAgent(userAgent.toString());

        // Pass the Webdriver Test.
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
          });

          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
          });

          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
        });

        // Block Resources
        if (params.blockResources) {
          // Set Request Interception to avoid receiving images, fonts and stylesheets for fast speed
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const requestUrl = req._url.split('?')[0].split('#')[0];
            if (blockedResources.includes(req.resourceType()) || skippedResources.some((resource) => requestUrl.includes(resource))) {
              req.abort();
            } else {
              req.continue();
            }
          });
        }

        // Disable Javascript to overcome f/e anti-bot
        // await page.setJavaScriptEnabled(false);

        // Authenticate Proxy Server
        // await page.authenticate({username: proxyUser, password: proxyPassword});

        resolve(page);
      } catch (error) {
        console.log('Launch Page Error: ', error);
        reject(error);
      }
    });
  }

  getHTML(selector, page) {
    return new Promise(async (resolve, reject) => {
      try {
        let html = '';
        const isNode = await page.$(selector);
        if (isNode) {
          html = await page.$eval(selector, (elm) => elm.innerHTML.trim());
        }

        resolve(html);
      } catch (error) {
        console.log(`getHTML Error: ${error}`);
        reject(error);
      }
    });
  }

  getTxt(selector, page) {
    return new Promise(async (resolve, reject) => {
      try {
        let txt = '';
        const isNode = await page.$(selector);
        if (isNode) {
          txt = await page.$eval(selector, (elm) => elm.innerText.trim());
        }

        resolve(txt);
      } catch (error) {
        console.log(`getTxt Error: ${error}`);
        reject(error);
      }
    });
  }

  getTxtMultiple(selector, page) {
    return new Promise(async (resolve, reject) => {
      try {
        let txt = [];
        const isNode = await page.$(selector);
        if (isNode) {
          txt = await page.$$eval(selector, (elms) => elms.map((elm) => elm.innerText.trim()));
        }

        resolve(txt);
      } catch (error) {
        console.log(`getTxtMultiple Error: ${error}`);
        reject(error);
      }
    });
  }

  getAttr(selector, attribute, page) {
    return new Promise(async (resolve, reject) => {
      try {
        let attr = '';
        const isNode = await page.$(selector);
        if (isNode) {
          attr = await page.$eval(selector, (elm, attribute) => elm.getAttribute(attribute).trim(), attribute);
        } else {
          console.log(`Node not found`);
        }

        resolve(attr);
      } catch (error) {
        console.log(`getAttr Error: ${error}`);
        reject(error);
      }
    });
  }

  getAttrMultiple(selector, attribute, page) {
    return new Promise(async (resolve, reject) => {
      try {
        let attr = [];
        const isNode = await page.$(selector);
        if (isNode) {
          attr = await page.$$eval(selector, (elms, attribute) => elms.map((elm) => elm.getAttribute(attribute).trim()), attribute);
        }

        resolve(attr);
      } catch (error) {
        console.log(`getAttrMultiple Error: ${error}`);
        reject(error);
      }
    });
  }

  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let page = 1;
        let totalHeight = 0;
        const distance = 250;
        const timer = setInterval(() => {
          console.log(`${page} - Scrollig...`);
          page++;
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 500);
      });
    });
  }
}

module.exports = new PuppeteerHelper();
