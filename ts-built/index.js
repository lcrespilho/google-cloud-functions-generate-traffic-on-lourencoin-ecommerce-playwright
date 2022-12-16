"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
const playwright_1 = require("playwright");
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const fs_1 = __importDefault(require("fs"));
function flatRequestUrl(req) {
    return (req.url() + '&' + (req.postData() || ''))
        .replace(/\r\n|\n|\r/g, '&')
        .replace(/&&/g, '&')
        .replace(/&$/g, '');
}
function task() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield playwright_1.chromium.launch({
            headless: process.env.HEADLESS !== 'false',
            devtools: process.env.DEVTOOLS === 'true',
        });
        let counter = 2;
        while (counter--) {
            console.log('══════════════════════════════════════════════', counter);
            yield Promise.allSettled(new Array(1).fill(3).map((_, idx) => __awaiter(this, void 0, void 0, function* () {
                let page, context;
                let stateFile = 'state_' + Math.floor(Math.random() * 10000) + '.json';
                const SKIP_THRESHOLD = 0.02 * (idx + 1); // de 2% a 40%
                try {
                    if (!fs_1.default.existsSync(stateFile)) {
                        fs_1.default.writeFileSync(stateFile, '{}', 'utf8');
                    }
                    context = yield browser.newContext(Object.assign({ storageState: stateFile }, playwright_1.devices['iPhone 12 Pro']));
                    page = yield context.newPage();
                    page.on('request', (req) => __awaiter(this, void 0, void 0, function* () {
                        const url = flatRequestUrl(req);
                        if (url.match(/google.*collect\?v=2/)) {
                            const events = url
                                .match(/&en=.*?&/g)
                                .map(s => s.replace(/&(en=)?/g, ''))
                                .map(s => (s === 'purchase' ? ansi_colors_1.default.red(s) : s));
                            console.log(`${idx}:`, events.join(', '));
                        }
                    }));
                    // 2 disparos de view_promotion
                    yield Promise.all([
                        page.goto('https://louren.co.in/ecommerce/home.html?utm_source=ecommerce06&utm_medium=ecommerce06&utm_campaign=ecommerce06', {
                            waitUntil: 'load',
                        }),
                        page.waitForRequest(/google.*collect\?v=2/),
                    ]);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // Aguarda disparo de select_promotion, porque a página
                    // tem delay de 500ms para disparar esse evento.
                    yield page.waitForTimeout(1000);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // view_item_list em PDL
                    yield Promise.all([
                        page
                            .locator(Math.random() < 0.75 ? 'text=pdl1.html' : 'text=pdl2.html')
                            .click(),
                        page.waitForNavigation({ waitUntil: 'networkidle' }),
                    ]);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // select_item quando clica no produto
                    // view_item no carregamento da pdp
                    yield Promise.all([
                        page
                            .locator('button', { hasText: 'pdp' })
                            .nth(Math.random() < 0.75 ? 0 : 1)
                            .click(),
                        page.waitForNavigation({ waitUntil: 'networkidle' }),
                    ]);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // add_to_cart, estando na PDP
                    yield page.locator('text=add_to_cart').click();
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // view_cart no carregamento do cart.html, estando na PDP
                    yield Promise.all([
                        page.locator('text=cart.html').click(),
                        page.waitForNavigation({ waitUntil: 'networkidle' }),
                    ]);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // begin_checkout no clique para ir pro checkout, estando no cart
                    yield Promise.all([
                        page.locator('text=checkout').click(),
                        page.waitForNavigation({ waitUntil: 'networkidle' }),
                    ]);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // add_payment_info, estando no checkout
                    yield page.locator('text=add_payment_info').click();
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // add_shipping_info, estando no checkout
                    yield page.locator('text=add_shipping_info').click();
                    yield page.waitForTimeout(1000);
                    if (Math.random() < SKIP_THRESHOLD)
                        return;
                    // purchase, no carregamento da TYP
                    yield Promise.all([
                        page.locator('text=finalizar compra').click(),
                        page.waitForNavigation({ waitUntil: 'networkidle' }),
                    ]);
                    yield page.waitForTimeout(1500);
                }
                catch (error) {
                    console.log('[💩]', error);
                }
                finally {
                    if (page && !page.isClosed()) {
                        yield page.close();
                        yield context.storageState({ path: stateFile });
                        yield context.close();
                    }
                }
            })));
        }
        yield browser.close();
    });
}
const hello = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield task();
    res.send('Fim\n');
});
exports.hello = hello;
