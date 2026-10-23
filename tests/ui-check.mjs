import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {once} from 'node:events';
const server=spawn('node',['node_modules/next/dist/bin/next','start','-p','3100'],{stdio:'pipe'});
let browser;
try{
 await new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(new Error('Server not ready')),15000);server.stdout.on('data',d=>{if(String(d).includes('Ready')){clearTimeout(deadline);resolve()}});server.on('error',reject)});
 browser=await chromium.launch({executablePath:'/usr/bin/google-chrome-stable',headless:true,args:['--no-sandbox']});
 for(const width of [320,390,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});await page.goto('http://localhost:3100/concept');await page.locator('.expense-row').last().waitFor();await page.evaluate(()=>document.fonts.ready);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw new Error('Horizontal overflow '+width);
 await page.screenshot({path:'/downloads/expense-real-'+width+'.png',fullPage:true});
 await page.getByLabel('Search',{exact:true}).fill('zzzz-not-an-expense');await page.getByText('No expenses in this view.').waitFor();await page.getByRole('button',{name:'Reset filters'}).click();
 await page.getByLabel('Category',{exact:true}).selectOption('Food');if(await page.locator('.expense-row').count()!==3)throw new Error('Food filter mismatch');await page.getByRole('button',{name:'Reset filters'}).click();
 await page.getByRole('button',{name:'+ Add expense'}).click();await page.getByLabel('Amount (₹)').fill('100.25');await page.getByLabel('Description',{exact:true}).fill('Demo test');await page.getByLabel('Date',{exact:true}).fill('2026-10-13');await page.getByRole('button',{name:'Save in demo'}).click();await page.getByText('Demo test',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Edit Demo test',exact:true}).click();await page.getByLabel('Description',{exact:true}).fill('Edited demo');await page.getByRole('button',{name:'Save in demo'}).click();await page.getByText('Edited demo',{exact:true}).waitFor();await page.getByRole('button',{name:'Delete Edited demo',exact:true}).click();await page.getByRole('button',{name:'Confirm deletion'}).click();if(await page.getByText('Edited demo',{exact:true}).count())throw new Error('Demo deletion failed');await page.getByRole('button',{name:'Filter Food',exact:true}).click();if(await page.locator('.expense-row').count()!==3)throw new Error('Orbit filter failed');await page.getByRole('button',{name:'Reset filters'}).click();await page.getByRole('button',{name:'Transactions',exact:false}).click();await page.getByText('Every expense, together.').waitFor();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV'}).click();const download=await downloadPromise;await download.saveAs('/tmp/expense-'+width+'.csv');
 await page.close();console.log('PASS UI '+width+' filters, empty state, demo add/edit/delete, chart, tab, export, overflow');
 }
 const p=await browser.newPage();await p.goto('http://localhost:3100/login');await p.screenshot({path:'/downloads/expense-login.png',fullPage:true});
 const rejected=await p.request.post('http://localhost:3100/api/import',{data:{source_message_id:'x',entries:[]}});if(rejected.status()!==400)throw new Error('Missing origin not rejected');console.log('PASS unauthenticated malformed import blocked');
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
