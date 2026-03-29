import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const htmlString = fs.readFileSync('test_loker.html', 'utf-8');
  const $ = cheerio.load(htmlString);
  
  const firstJob = $('article.card').first();
  const jobTitle = firstJob.find('h3').text().trim();
  const company = firstJob.find('span.text-secondary-500').first().text().trim();
  let jobUrl = firstJob.find('a').attr('href');
  if (jobUrl && !jobUrl.startsWith('http')) jobUrl = 'https://www.loker.id' + jobUrl;
  const location = firstJob.find('.opacity-50 span[translate="no"]').text().trim();
  
  console.log("Title: ", jobTitle);
  console.log("Company: ", company);
  console.log("Location: ", location);
  console.log("URL: ", jobUrl);
}
test();
