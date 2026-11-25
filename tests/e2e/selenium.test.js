// Teste end-to-end com Selenium: cadastro -> criar filme -> buscar -> excluir
process.env.DB_PATH = ':memory:';
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const app = require('../../server');

(async () => {
  const server = app.listen(3100);
  const opts = new chrome.Options();
  if (process.env.HEADLESS !== '0') opts.addArguments('--headless=new');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).build();
  const wait = css => driver.wait(until.elementLocated(By.css(css)), 5000);
  try {
    await driver.get('http://localhost:3100');
    await driver.findElement(By.id('name')).sendKeys('Tester');
    await driver.findElement(By.id('email')).sendKeys('tester@e2e.com');
    await driver.findElement(By.id('password')).sendKeys('123456');
    await driver.findElement(By.id('register-btn')).click();
    await driver.wait(until.elementIsVisible(await wait('#movie-form')), 5000);

    await driver.findElement(By.id('m-title')).sendKeys('Filme Selenium');
    await driver.findElement(By.id('m-year')).sendKeys('2021');
    await driver.findElement(By.id('save-movie')).click();

    await driver.findElement(By.id('search')).sendKeys('Selenium');
    await wait('article[data-title="Filme Selenium"]');
    console.log('✔ filme criado e encontrado na busca');

    await driver.findElement(By.css('article[data-title="Filme Selenium"] .danger')).click();
    await driver.switchTo().alert().accept();
    await driver.wait(async () => (await driver.findElements(By.css('article'))).length === 0, 5000);
    console.log('✔ filme excluído\nE2E OK');
  } catch (e) {
    console.error('E2E FALHOU:', e.message); process.exitCode = 1;
  } finally { await driver.quit(); server.close(); }
})();
