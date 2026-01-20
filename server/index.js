import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { i18nMiddleware } from './i18n/i18n.js';
import mongoose from 'mongoose';

const cron = require('node-cron');
const joi = require('joi');
const { Contact } = require('./models/contactModel')
import Newsletter from './models/Newsletter.js';
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { sendMail } = require('./mailer')
// import authRoutes from './routes/authRoute.js';
// import { auth } from './middleware/auth.js';
import { getArticles,getArticlesRaw, getArticle, getArticleRaw } from './routes/articleListRoute.js';
import { articleListJSONLD, articleJSONLD, indexPageJSONLD } from './middleware/metaBuilder.js';
import pricingPlans from './data/pricingPlans.json';
import { generateSitemap } from './sitemapGen.js';
import demoRoutes from './routes/demoRouteSecure.js';



const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(i18nMiddleware);

// Add middleware to store original URL
app.use((req, res, next) => {
  res.locals.originalUrl = req.originalUrl;
  next();
});
var schema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  message: joi.string().required()
})

var newsletterSchema = joi.object({
  name: joi.string().required().max(100),
  company: joi.string().max(150).allow('').optional(),
  website: joi.string().allow('', null).optional(),
  email: joi.string().email().required()
})  


// Template engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/icons', express.static(path.join(__dirname, 'public/images/icons')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));

// Secure demo routes
app.use('/', demoRoutes);

// Language-specific routes first
// app.get('/:lang(zh)/articles', i18nMiddleware, (req, res) => { res.redirect(`/${req.params.lang}/articles/all/1`); });
// app.get('/articles', i18nMiddleware, (req, res) => {  res.redirect(`/articles/all/1`); });

// app.get('/:lang(zh)/articles/:category(all|news|guides|posts)/:page(\\d+)', i18nMiddleware, async (req, res) => {  
//   const articles = await getArticles(req.params.lang, req.params.page, req.params.category);
//   if (!articles) {    return res.status(404).render('404');  }
//   const jsonLD = articleListJSONLD(req.params.category, req.params.page, res.locals.lang, articles);
//   res.render('articleList', { articles:articles, category: req.params.category, page: req.params.page,jsonLD:jsonLD }); 
// });
// app.get('/articles/:category(all|news|guides|posts)/:page(\\d+)', i18nMiddleware, async (req, res) => {  
//   const articles = await getArticles(res.locals.lang, req.params.page, req.params.category);
//   if (!articles) {    return res.status(404).render('404');  }
//   const jsonLD = articleListJSONLD(req.params.category, req.params.page, res.locals.lang, articles);
//   res.render('articleList', { articles:articles, category: req.params.category, page: req.params.page, jsonLD:jsonLD });
// });
// app.get('/articlesRaw/:category(all|news|guides|posts)/:page(\\d+)', i18nMiddleware, async (req, res) => {  
//   const articles = await getArticlesRaw(res.locals.lang, req.params.page, req.params.category);
//   if (!articles) {    return res.status(404).render('404');  }
//   res.send(articles)
// });

// app.get('/:lang(zh)/article/:slug', i18nMiddleware, async (req, res) => {  
//   const article = await getArticle(req.params.slug);
//   if(article == null) return res.status(404).render('404');
//   if (!article) {    return res.status(404).render('404');  }
//   const jsonLD = articleJSONLD(article);
//   res.render('article', { article:article, jsonLD:jsonLD }); 
// });
// app.get('/article/:slug', i18nMiddleware, async (req, res) => {  
//   const article = await getArticle(req.params.slug);
//   if(article == null) return res.status(404).render('404');
//   if (!article ) {  return res.status(404).render('404');}
  
//   // if (!article) {  return res.status(404).render('404');  }
//   const jsonLD = articleJSONLD(article);
//   res.render('article', { article:article, jsonLD:jsonLD }); 
// });

// app.get('/faq', i18nMiddleware, (req, res) => {  res.render('faq'); });
// app.get('/:lang(zh)/faq', i18nMiddleware, (req, res) => {  res.render('faq'); });

// app.get('/articleRaw/:slug', i18nMiddleware, async (req, res) => {  
//   const article = await getArticleRaw(req.params.slug);
//   res.send(article);
// });


app.get('/:lang(zh)/contact', i18nMiddleware, (req, res) => {  res.render('contact'); });
app.get('/contact', i18nMiddleware, (req, res) => {  res.render('contact'); });
// Contact form handler function
const handleContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const { error, value } = schema.validate({...req.body  });

    if(error) throw error;

    // Save to database if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const contact = new Contact({
        name,
        email,
        message
      })
      await contact.save()
    } else {
      console.log('📝 Contact form submission (Demo Mode):', { name, email, message });
    }

    // Send email if mailer is configured
    if (Bun.env.MAILER_EMAIL && Bun.env.MAILER_PASSWORD && Bun.env.MAILER_RECIPIENT) {
      await sendMail('Contact Form Submission', `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`);
    } else {
      console.log('📧 Email would be sent to:', Bun.env.MAILER_RECIPIENT || 'contact@a-pro.ai');
      console.log('📧 Email content:', { name, email, message });
    }

    res.send(res.locals.t ? res.locals.t('contactSuccess') : 'Thank you for your message! We\'ll get back to you soon.')
  }catch(err){
    console.log('Contact form error:', err.message)
    res.status(401).send(res.locals.t ? res.locals.t('contactError') : 'Sorry, there was an error sending your message. Please try again.')
  }
};

app.post('/:lang(zh|en)/contact', i18nMiddleware, handleContactForm);
app.post('/contact', i18nMiddleware, handleContactForm);

// app.get('/:lang(zh)/pricing', i18nMiddleware, (req, res) => {
//   res.render('pricing',{pricingPlans:pricingPlans, currency:'ntd'}); 
// });

// app.get('/pricing', i18nMiddleware, (req, res) => {
//   res.render('pricing',{pricingPlans:pricingPlans, currency:'usd'}); 
// });

// app.get('/:lang(en|zh)/pricing/:currency(ntd|usd)', i18nMiddleware, (req, res) => {
//   res.render('components/CurrencyUpdate',{pricingPlans:pricingPlans, currency:req.params.currency}); 
// });

// app.get('/:lang(zh)/about', i18nMiddleware, (req, res) => {  res.render('about'); });
// app.get('/about', i18nMiddleware, (req, res) => {  res.render('about'); });

app.get('/:lang(zh)', i18nMiddleware, async (req, res) => {  
  var articles = await getArticles(res.locals.lang, 1, 'all');
  if (!articles) {    articles = [];  }
  else articles = articles ? articles.slice(0, 4) : [];
  const jsonLD = indexPageJSONLD(articles, res.locals.lang);  
  jsonLD.name = res.locals.t('homePageMeta.title');
  jsonLD.description = res.locals.t('homePageMeta.description');
  // console.log(Bun.env)
  res.render('index', {articles:articles, jsonLD:jsonLD, lang:res.locals.lang, appUrl: Bun.env.APP_URL}); 
});
app.get('/', i18nMiddleware, async (req, res) => {  
  var articles = await getArticles(res.locals.lang, 1, 'all');
  if (!articles) {  articles = []}
  else articles = articles ? articles.slice(0, 4) : [];
  const jsonLD = indexPageJSONLD(articles);
  jsonLD.name = res.locals.t('homePageMeta.title');
  jsonLD.description = res.locals.t('homePageMeta.description');
  // console.log(Bun.env)

  res.render('index', {articles:articles, jsonLD:jsonLD, appUrl: Bun.env.APP_URL});
});
app.get('/free-7-day-trial', i18nMiddleware, (req, res) => {
    res.render('freeTrial7Days');
  }
);
// Static page routes
app.get('/:lang(zh)/about', i18nMiddleware, (req, res) => {
  res.render('about');
});
app.get('/about', i18nMiddleware, (req, res) => {
  res.render('about');
});

app.get('/:lang(zh)/demo', i18nMiddleware, (req, res) => {
  res.render('demo');
});
app.get('/demo', i18nMiddleware, (req, res) => {
  res.render('demo');
});

app.get('/:lang(zh)/pricing', i18nMiddleware, (req, res) => {
  res.render('pricing', {pricingPlans:pricingPlans, currency:'ntd'});
});
app.get('/pricing', i18nMiddleware, (req, res) => {
  res.render('pricing', {pricingPlans:pricingPlans, currency:'usd'});
});

app.get('/:lang(zh)/socials', i18nMiddleware, (req, res) => {
  res.render('socials', { socialMediaLinks: socialMediaLinks });
});
app.get('/socials', i18nMiddleware, (req, res) => {
  res.render('socials', { socialMediaLinks: socialMediaLinks });
});

// Internationalized blog listing page route
app.get('/:lang(zh)/blog', i18nMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;

    // Fetch posts from Ghost Content API
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/?key=${apiKey}&limit=${limit}&page=${page}&fields=title,excerpt,slug,published_at,feature_image,reading_time&include=tags`);

    if (!response.ok) {
      throw new Error(`Ghost API error: ${response.status}`);
    }

    const data = await response.json();

    const pagination = {
      page: page,
      pages: data.meta.pagination.pages,
      total: data.meta.pagination.total,
      next: data.meta.pagination.next,
      prev: data.meta.pagination.prev
    };

    res.render('blog', {
      articles: data.posts,
      pagination: pagination,
      currentPath: req.path
    });

  } catch (error) {
    console.error('Error fetching blog articles:', error);
    res.status(500).render('500', {
      error: 'Unable to fetch blog articles'
    });
  }
});

// Blog listing page route
app.get('/blog', i18nMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;

    // Fetch posts from Ghost Content API
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/?key=${apiKey}&limit=${limit}&page=${page}&fields=title,excerpt,slug,published_at,feature_image,reading_time&include=tags`);

    if (!response.ok) {
      throw new Error(`Ghost API error: ${response.status}`);
    }

    const data = await response.json();

    const pagination = {
      page: page,
      pages: data.meta.pagination.pages,
      total: data.meta.pagination.total,
      next: data.meta.pagination.next,
      prev: data.meta.pagination.prev
    };

    res.render('blog', {
      articles: data.posts,
      pagination: pagination,
      currentPath: req.path
    });

  } catch (error) {
    console.error('Error fetching blog articles:', error);
    res.status(500).render('500', {
      error: 'Unable to fetch blog articles'
    });
  }
});

// Internationalized blog article page route
app.get('/:lang(zh)/blog/:slug', i18nMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch the article from Ghost API
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/slug/${slug}/?key=${apiKey}&include=tags`);

    if (!response.ok) {
      return res.status(404).render('404');
    }

    const data = await response.json();
    const article = data.posts[0];

    if (!article) {
      return res.status(404).render('404');
    }

    const formattedArticle = {
      title: article.title,
      excerpt: article.excerpt,
      html: article.html,
      slug: article.slug,
      published_at: article.published_at,
      feature_image: article.feature_image,
      reading_time: article.reading_time,
      tags: article.tags || []
    };

    res.render('blog-article', { article: formattedArticle, appUrl: Bun.env.APP_URL });

  } catch (error) {
    console.error('Error fetching blog article:', error);
    res.status(500).render('500', {
      error: 'Unable to fetch blog article'
    });
  }
});

// Blog article page route
app.get('/blog/:slug', i18nMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch the article from Ghost API
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/slug/${slug}/?key=${apiKey}&include=tags`);

    if (!response.ok) {
      return res.status(404).render('404');
    }

    const data = await response.json();

    if (!data.posts || data.posts.length === 0) {
      return res.status(404).render('404');
    }

    const article = data.posts[0];

    // Format the article data
    const formattedArticle = {
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.html,
      slug: article.slug,
      publishedAt: article.published_at,
      featureImage: article.feature_image,
      readingTime: article.reading_time || 5,
      tags: article.tags || [],
      metaTitle: article.meta_title || article.title,
      metaDescription: article.meta_description || article.excerpt,
      ogTitle: article.og_title || article.title,
      ogDescription: article.og_description || article.excerpt,
      ogImage: article.og_image || article.feature_image,
      twitterTitle: article.twitter_title || article.title,
      twitterDescription: article.twitter_description || article.excerpt,
      twitterImage: article.twitter_image || article.feature_image
    };

    res.render('blog-article', { article: formattedArticle, appUrl: Bun.env.APP_URL });

  } catch (error) {
    console.error('Error fetching blog article:', error);
    res.status(500).render('500');
  }
});

// Tag page route
app.get('/tag/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch articles by tag from Ghost API
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/?key=${apiKey}&filter=tag:${slug}&include=tags`);

    if (!response.ok) {
      return res.status(404).render('404');
    }

    const data = await response.json();

    // Also fetch tag information
    const tagResponse = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/tags/slug/${slug}/?key=${apiKey}`);
    let tagInfo = null;
    if (tagResponse.ok) {
      const tagData = await tagResponse.json();
      tagInfo = tagData.tags && tagData.tags.length > 0 ? tagData.tags[0] : null;
    }

    // Format articles for display
    const articles = data.posts.map(article => {
      let excerpt = article.excerpt || '';
      // Truncate long excerpts to about 150 characters
      if (excerpt.length > 150) {
        excerpt = excerpt.substring(0, 150).trim() + '...';
      }
      // If no meaningful excerpt, don't include one
      if (!excerpt || excerpt.trim() === article.title) {
        excerpt = '';
      }

      return {
        title: article.title,
        excerpt,
        slug: article.slug,
        publishedAt: article.published_at,
        featureImage: article.feature_image,
        readingTime: article.reading_time || 5,
        tags: article.tags || []
      };
    });

    res.render('tag', {
      articles,
      tagInfo: tagInfo || { name: slug, slug },
      appUrl: Bun.env.APP_URL || 'http://localhost:8888'
    });

  } catch (error) {
    console.error('Error fetching tag articles:', error);
    res.status(500).render('500');
  }
});

// AI-NOTES: Demo endpoints moved to /routes/demoRouteSecure.js for enhanced security
// Includes origin authentication, rate limiting, and input validation

// Ghost Blog API endpoint for Phase 2 animations
app.get('/api/ghost-posts', async (req, res) => {
  try {
    // Set CORS headers for frontend access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Fetch posts from Ghost Content API - using real Ghost data only
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/?key=${apiKey}&limit=6&fields=title,excerpt,slug,published_at`);

    if (!response.ok) {
      throw new Error(`Ghost API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched', data.posts.length, 'real blog posts from Ghost');

    // Format posts for frontend
    const posts = data.posts.map(post => ({
      title: post.title,
      excerpt: post.excerpt || 'No excerpt available',
      slug: post.slug,
      publishedAt: post.published_at
    }));

    res.status(200).json({
      success: true,
      posts: posts
    });

  } catch (error) {
    console.log('❌ Ghost API Error:', error.message);
    console.log('🚨 Real blog data unavailable - check Ghost server status');

    // Return error instead of mock data - following AGENTS.md requirement
    res.status(503).json({
      success: false,
      message: 'Blog content temporarily unavailable. Please ensure Ghost server is running on port 2368.',
      error: error.message
    });
  }
});

// Ghost Individual Post API endpoint for Phase 3 article expansion
app.get('/api/ghost-post/:slug', async (req, res) => {
  try {
    // Set CORS headers for frontend access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { slug } = req.params;

    // Fetch individual post from Ghost Content API with full content
    const apiKey = Bun.env.GHOST_API_KEY;
    const response = await fetch(`https://blog.apromarketing.com/ghost/api/v3/content/posts/slug/${slug}/?key=${apiKey}&fields=title,excerpt,html,slug,published_at,feature_image,reading_time&include=tags`);

    if (!response.ok) {
      throw new Error(`Ghost API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched individual post:', slug);

    // Format post for frontend
    const post = {
      title: data.posts[0].title,
      excerpt: data.posts[0].excerpt || 'No excerpt available',
      content: data.posts[0].html,
      slug: data.posts[0].slug,
      publishedAt: data.posts[0].published_at,
      featureImage: data.posts[0].feature_image,
      readingTime: data.posts[0].reading_time,
      tags: data.posts[0].tags || []
    };

    res.status(200).json({
      success: true,
      post: post
    });

  } catch (error) {
    console.log('❌ Ghost Individual Post API Error:', error.message);
    console.log('🚨 Individual post data unavailable - check Ghost server status');

    res.status(503).json({
      success: false,
      message: 'Article content temporarily unavailable. Please ensure Ghost server is running on port 2368.',
      error: error.message
    });
  }
});

// Newsletter signup route
app.post('/newsletter-signup', async (req, res) => {
  try {
    const { name, company, website, email } = req.body;
    const { error, value } = newsletterSchema.validate({...req.body});

    if(error) throw error;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected - save to database
      const newsletter = new Newsletter({
        name,
        company,
        website,
        email,
        subscriptionStatus: 'pending'
      });

      await newsletter.save();
      sendMail('newsletter signup', `New newsletter signup - Name: ${name}, Company: ${company}, Email: ${email}, Website: ${website}`);
    } else {
      // MongoDB not connected - just log for demo purposes
      console.log('📧 Newsletter signup (Demo Mode):', { name, company, website, email });
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for subscribing! We\'ll be in touch soon.'
    });

  } catch(err) {
    console.log(err.message);
    if (err.code === 11000) {
      // Duplicate email error
      res.status(400).json({
        success: false,
        message: 'This email is already subscribed to our newsletter.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Please check your information and try again.'
      });
    }
  }
});

// Set up sitemap generation
const setupSitemapGeneration = () => {
  // Run every Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('Running scheduled sitemap generation...');
    try {
      await generateSitemap();
      console.log('Sitemap generation completed successfully');
    } catch (error) {
      console.error('Error during sitemap generation:', error);
    }
  }, {
    timezone: "Asia/Shanghai"  // Adjust to your timezone
  });

  // Also run immediately when starting
  generateSitemap()
    .then(() => console.log('Initial sitemap generation completed'))
    .catch(error => console.error('Error during initial sitemap generation:', error));
};

// Initialize sitemap generation
setupSitemapGeneration();

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`
    User-agent: *
    Disallow: 
    Disallow: /cgi-bin/
    Sitemap: https://a-pro.ai/sitemap.xml
  `);
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/sitemap.xml'));
});

app.get('*', i18nMiddleware, (req, res) => {
  // res.cookie('lang', 'en-US');
  res.status(404).render('404');
});


const connectDB = async () => {
  console.log(Bun.env.MONGO_URI)
  try {
    if (Bun.env.MONGO_URI !== undefined) {
      const conn = await mongoose.connect(Bun.env.MONGO_URI, {
        autoIndex: true,
      })
      console.log(`MongoDB Connected: ${conn.connection.host}`)
    }
  } catch (err) {
    console.error(`Error: ${err.message}`)
  }
}


connectDB()
app.use(
  mongoSanitize({
    // onSanitize: ({ req, key }) => {
    //   console.warn(`This request[${key}] is sanitized`, req);
    // },
    // allowDots: true,
  }),
);
// Start server

const port = Bun.env.PORT || 8888;
app.listen(port, () => {
  console.log('Development environment:', Bun.env.NODE_ENV);
  console.log(`Server running on port ${port}`);
});