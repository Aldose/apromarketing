import { buildSitemaps } from 'express-sitemap-xml';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// always
// hourly
// daily
// weekly
// monthly
// yearly
// never
export const urls = [
  // English URLs
  {
    url: '/',
    priority: 1, // optional
    lastMod: new Date('2025-02-20'), // optional (specify `true` for today's date)
    changeFreq: 'weekly' // optional
  },
  {
    url: '/about',
    priority: 0.8,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'monthly'
  },
  {
    url: '/contact',
    priority: 0.5,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'never'
  },
  {
    url: '/pricing',
    priority: 0.5,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'monthly'
  },
  {
    url: '/faq',
    priority: 0.5,
    lastMod: new Date('2025-06-13'),
    changeFreq: 'monthly'
  },
  {
    url: '/articles/all/1',
    priority: 0.9,
    lastMod: new Date(),
    changeFreq: 'weekly'
  },

  // Chinese URLs
  {
    url: '/zh',
    priority: 1,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'weekly'
  },
  {
    url: '/zh/about',
    priority: 0.8,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'monthly'
  },
  {
    url: '/zh/pricing',
    priority: 0.5,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'monthly'
  },
  {
    url: '/zh/faq',
    priority: 0.5,
    lastMod: new Date('2025-06-13'),
    changeFreq: 'monthly'
  },
  {
    url: '/zh/contact',
    priority: 0.5,
    lastMod: new Date('2025-02-22'),
    changeFreq: 'never'
  },
  {
    url: '/zh/articles/all/1',
    priority: 0.9,
    lastMod: new Date(),
    changeFreq: 'weekly'
  },

  // Japanese URLs
  {
    url: '/ja',
    priority: 1,
    lastMod: new Date(),
    changeFreq: 'weekly'
  },
  {
    url: '/ja/about',
    priority: 0.8,
    lastMod: new Date(),
    changeFreq: 'monthly'
  },
  {
    url: '/ja/pricing',
    priority: 0.5,
    lastMod: new Date(),
    changeFreq: 'monthly'
  },
  {
    url: '/ja/faq',
    priority: 0.5,
    lastMod: new Date(),
    changeFreq: 'monthly'
  },
  {
    url: '/ja/contact',
    priority: 0.5,
    lastMod: new Date(),
    changeFreq: 'never'
  },
  {
    url: '/ja/articles/all/1',
    priority: 0.9,
    lastMod: new Date(),
    changeFreq: 'weekly'
  },

  // Spanish URLs
  {
    url: '/es',
    priority: 1,
    lastMod: new Date(),
    changeFreq: 'weekly'
  },
  {
    url: '/es/about',
    priority: 0.8,
    lastMod: new Date(),
    changeFreq: 'monthly'
  },
  {
    url: '/es/pricing',
    priority: 0.5,
    lastMod: new Date(),
    changeFreq: 'monthly'
  },
  {
    url: '/es/faq',
    priority: 0.5,
    lastMod: new Date(),
    changeFreq: 'monthly'
  },
  {
    url: '/es/contact',
    priority: 0.5,
    lastMod: new Date(),
    changeFreq: 'never'
  },
  {
    url: '/es/articles/all/1',
    priority: 0.9,
    lastMod: new Date(),
    changeFreq: 'weekly'
  },
];

async function getPostSlugs(lang) {
  try {
    let slugs = [];
    let page = 1;
    const perPage = 100; // maximum items per page
    while (true) {
      const startTime = performance.now();
      const res = await fetch(`https://blog.a-pro.ai/wp-json/wp/v2/posts?lang=${lang}&_fields=id,title,excerpt,modified,slug,date_gmt,author,featured_media,_links,_embedded&_embed&per_page=${perPage}&page=${page}`);
      const endTime = performance.now();
      console.log(`Page ${page} fetch took ${(endTime - startTime).toFixed(2)} milliseconds`);
      if (!res.ok) {
        // if we're on page 1 and get an error, throw immediately
        throw new Error(`HTTP error on page ${page}! status: ${res.status}`);
      }
      const posts = await res.json();
      let url;
      if(lang === 'en') url = `/article/`
      if(lang === 'zh') url = `/zh/article/`
      if(lang === 'ja') url = `/ja/article/`
      if(lang === 'es') url = `/es/article/`
      if (posts.length === 0) break;
      urls.push(...posts.map((post) => ({
          url:url+post.slug,
          priority: 0.5,
          lastMod: new Date(post.modified),
          changeFreq: 'monthly'
      })));
      // If less than perPage posts are returned, we're at the last page.
      if (posts.length < perPage) break;
      page++;
    }
    return urls;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

async function generateSitemap() {
  try {
    // Fetch all URLs for all languages
    await getPostSlugs('en');
    await getPostSlugs('zh');
    await getPostSlugs('ja');
    await getPostSlugs('es');

    // Generate sitemap XML
    const sitemap = await buildSitemaps(urls, 'https://a-pro.ai');
    
    // Write to file
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    await fs.mkdir(path.dirname(sitemapPath), { recursive: true });
    await fs.writeFile(sitemapPath, sitemap['/sitemap.xml']);
    
    console.log(`Sitemap generated successfully at: ${sitemapPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

// Export the function for use in other files
export { generateSitemap };

// Check if this file is being run directly
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  generateSitemap().catch(console.error);
}

async function run() {
  const sitemaps = await buildSitemaps(urls,'https://a-pro.ai')

  // console.log(Object.keys(sitemaps))
  // console.log(sitemaps['/sitemap.xml'])
}
run()