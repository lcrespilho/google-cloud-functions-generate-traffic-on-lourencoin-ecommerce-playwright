import type {
  HttpFunction,
  Request as CFRequest,
  Response as CFResponse,
} from '@google-cloud/functions-framework';

import { chromium, devices } from 'playwright-core';
import type { Page, BrowserContext, Request } from 'playwright-core';
import bundledChromium from 'chrome-aws-lambda';
import c from 'ansi-colors';

function flatRequestUrl(req: Request): string {
  return (req.url() + '&' + (req.postData() || ''))
    .replace(/\r\n|\n|\r/g, '&')
    .replace(/&&/g, '&')
    .replace(/&$/g, '');
}

async function task(whileCounter: number = 1, parallel: number = 1) {
  const browser = await Promise.resolve(bundledChromium.executablePath).then(
    executablePath => {
      if (!executablePath) {
        return chromium.launch({});
      }
      return chromium.launch({ executablePath });
    }
  );

  while (whileCounter--) {
    console.log(
      '══════════════════════════════════════════════ ' + whileCounter
    );
    await Promise.allSettled(
      new Array(parallel).fill(3).map(async (_, idx) => {
        let page: Page, context: BrowserContext;
        const SKIP_THRESHOLD = 0.2;

        try {
          context = await browser.newContext({
            ...devices['iPhone 12 Pro'],
          });
          page = await context.newPage();

          page.on('request', async (req: Request) => {
            const url = flatRequestUrl(req);
            if (url.match(/google.*collect\?v=2/)) {
              const events = url
                .match(/&en=.*?&/g)!
                .map(s => s.replace(/&(en=)?/g, ''))
                .map(s => (s === 'purchase' ? c.red(s) : s));
              const s = `${idx}: ${events.join(', ')}`;
              console.log(s);
            }
          });

          // Navegações para popular lista de Ads
          await page.goto('https://google.com.br', {
            timeout: 60000,
            waitUntil: 'networkidle',
          });
          await page.goto('https://google.com', {
            timeout: 60000,
            waitUntil: 'networkidle',
          });
          await page.goto('https://youtube.com', {
            timeout: 60000,
            waitUntil: 'networkidle',
          });

          // 2 disparos de view_promotion
          await Promise.all([
            page.goto('https://louren.co.in/ecommerce/home.html', {
              waitUntil: 'load',
              referer: 'https://google.com/',
            }),
            page.waitForRequest(/google.*collect\?v=2/),
          ]);

          if (Math.random() < SKIP_THRESHOLD) return;
          // Aguarda disparo de select_promotion, porque a página
          // tem delay de 500ms para disparar esse evento.
          await page.waitForTimeout(1000);

          if (Math.random() < SKIP_THRESHOLD) return;
          // view_item_list em PDL
          await Promise.all([
            page.click(
              Math.random() < 0.75 ? 'text=pdl1.html' : 'text=pdl2.html'
            ),
            page.waitForNavigation({ waitUntil: 'networkidle' }),
          ]);

          if (Math.random() < SKIP_THRESHOLD) return;
          // select_item quando clica no produto
          // view_item no carregamento da pdp
          await Promise.all([
            page
              .locator('text=pdp')
              .nth(Math.random() < 0.75 ? 0 : 1)
              .click(),
            page.waitForNavigation({ waitUntil: 'networkidle' }),
          ]);

          if (Math.random() < SKIP_THRESHOLD) return;
          // add_to_cart, estando na PDP
          await page.locator('text=add_to_cart').click();

          if (Math.random() < SKIP_THRESHOLD) return;
          // view_cart no carregamento do cart.html, estando na PDP
          await Promise.all([
            page.locator('text=cart.html').click(),
            page.waitForNavigation({ waitUntil: 'networkidle' }),
          ]);

          if (Math.random() < SKIP_THRESHOLD) return;
          // begin_checkout no clique para ir pro checkout, estando no cart
          await Promise.all([
            page.locator('text=checkout').click(),
            page.waitForNavigation({ waitUntil: 'networkidle' }),
          ]);

          if (Math.random() < SKIP_THRESHOLD) return;
          // add_payment_info, estando no checkout
          await page.locator('text=add_payment_info').click();

          if (Math.random() < SKIP_THRESHOLD) return;
          // add_shipping_info, estando no checkout
          await page.locator('text=add_shipping_info').click();

          await page.waitForTimeout(1000);

          if (Math.random() < SKIP_THRESHOLD) return;
          // purchase, no carregamento da TYP
          await Promise.all([
            page.locator('text=finalizar compra').click(),
            page.waitForNavigation({ waitUntil: 'networkidle' }),
          ]);
          await page.waitForTimeout(1500);
        } catch (error) {
          const s = '[💩] ' + error;
          console.log(s);
        } finally {
          if (page! && !page.isClosed()) {
            await page.close();
            await context!.close();
          }
        }
      })
    );
  }
  await browser.close();
}

export const run: HttpFunction = async (req: CFRequest, res: CFResponse) => {
  const t0 = new Date().getTime();
  await task(30, 10);
  const elapsedMin = (new Date().getTime() - t0) / 60000;
  console.log(`Finalizou em ${elapsedMin} min.`);
  res.send(`Finalizou em ${elapsedMin} min.`);
};
