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
const { BetaSignup } = require('./models/betaSignup.js');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { sendMail } = require('./mailer')
// import authRoutes from './routes/authRoute.js';
// import { auth } from './middleware/auth.js';
import { getArticles,getArticlesRaw, getArticle, getArticleRaw } from './routes/articleListRoute.js';
import { articleListJSONLD, articleJSONLD, indexPageJSONLD } from './middleware/metaBuilder.js';
import pricingPlans from './data/pricingPlans.json';
import { generateSitemap } from './sitemapGen.js';



const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(i18nMiddleware);

// Auto-redirect middleware based on browser language (SEO-safe)
app.use((req, res, next) => {
  // Detect if it's a search engine crawler
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp|google|bing|yahoo|teoma|baidu|yandex|duckduckbot/i.test(req.headers['user-agent']);
  
  // Check if user already has a language preference cookie
  const hasLangCookie = req.cookies.lang;
  
  // Only redirect real users (not bots) on the root path, and only if they haven't been redirected before
  if (!isBot && !hasLangCookie && req.path === '/') {
    const acceptLanguage = req.headers['accept-language'] || '';
    const browserLang = acceptLanguage.split(',')[0] || '';
    
    // Language detection logic
    let preferredLang = 'en'; // default
    
    if (browserLang.startsWith('zh')) {
      preferredLang = 'zh';
    } else if (browserLang.startsWith('ja')) {
      preferredLang = 'ja';
    } else if (browserLang.startsWith('es')) {
      preferredLang = 'es';
    }
    
    // Only redirect if preferred language is not English
    if (preferredLang !== 'en') {
      // Set cookie to remember user's preference (1 year)
      res.cookie('lang', `${preferredLang}-${preferredLang === 'zh' ? 'TW' : preferredLang === 'es' ? 'MX' : preferredLang === 'ja' ? 'JP' : preferredLang.toUpperCase()}`, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Redirect to preferred language
      return res.redirect(301, `/${preferredLang}`);
    }
  }
  
  next();
});

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

var betaSignupSchema = joi.object({
  name: joi.string().required().max(100),
  company: joi.string().max(150).allow('').optional(),
  website: joi.string().allow('', null).optional(),
  email: joi.string().email().required(),
  lang: joi.string().optional()
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

// Language-specific routes first
app.get('/:lang(en|zh|ja|es)/articles', i18nMiddleware, (req, res) => { res.redirect(`/${req.params.lang}/articles/all/1`); });
app.get('/articles', i18nMiddleware, (req, res) => {  res.redirect(`/articles/all/1`); });

app.get('/:lang(en|zh|ja|es)/articles/:category(all|news|guides|posts)/:page(\\d+)', i18nMiddleware, async (req, res) => {  
  const articles = await getArticles(req.params.lang, req.params.page, req.params.category);
  if (!articles) {    return res.status(404).render('404');  }
  const jsonLD = articleListJSONLD(req.params.category, req.params.page, res.locals.lang, articles);
  res.render('articleList', {articles:articles, jsonLD:jsonLD, lang:res.locals.lang, category:req.params.category, page:req.params.page}); 
});

app.get('/articles/:category(all|news|guides|posts)/:page(\\d+)', i18nMiddleware, async (req, res) => {  
  const articles = await getArticles('en', req.params.page, req.params.category);
  if (!articles) {    return res.status(404).render('404');  }
  const jsonLD = articleListJSONLD(req.params.category, req.params.page, 'en', articles);
  res.render('articleList', {articles:articles, jsonLD:jsonLD, lang:'en', category:req.params.category, page:req.params.page}); 
});

app.get('/:lang(en|zh|ja|es)/article/:slug', i18nMiddleware, async (req, res) => {  
  const article = await getArticle(req.params.slug);
  if(article == null) return res.status(404).render('404');
  if (!article) {    return res.status(404).render('404');  }
  
  const jsonLD = articleJSONLD(article);
  res.render('article', { article:article, jsonLD:jsonLD }); 
});

app.get('/article/:slug', i18nMiddleware, async (req, res) => {  
  const article = await getArticle(req.params.slug);
  if(article == null) return res.status(404).render('404');
  if (!article) {    return res.status(404).render('404');  }
  
  const jsonLD = articleJSONLD(article);
  res.render('article', { article:article, jsonLD:jsonLD }); 
});

app.get('/faq', i18nMiddleware, (req, res) => {  res.render('faq'); });
app.get('/:lang(en|zh|ja|es)/faq', i18nMiddleware, (req, res) => {  res.render('faq'); });

// app.get('/articleRaw/:slug', i18nMiddleware, async (req, res) => {  
//   const article = await getArticleRaw(req.params.slug);
//   res.send(article);
// });


app.get('/:lang(en|zh|ja|es)/contact', i18nMiddleware, (req, res) => {  res.render('contact'); });
app.get('/contact', i18nMiddleware, (req, res) => {  res.render('contact'); });
// app.post('/:lang(zh|en)/contact', i18nMiddleware, (req, res) => {
//   try {
//     const { name, email, message } = req.body;
//     const { error, value } = schema.validate({...req.body  });
    
//     if(error) throw error;
//     const contact = new Contact({
//       name,
//       email,
//       message
//     })
//     contact.save()
//     sendMail('contact form', `name: ${name}, email: ${email}, message: ${message}`);
//     res.send(res.locals.t('contactSuccess'))
//   }catch(err){
//     console.log(err.message)
//     res.status(401).send(res.locals.t('contactError'))
//   }
// });

app.get('/:lang(en|zh|ja|es)/pricing', i18nMiddleware, (req, res) => {
  res.render('pricing',{pricingPlans:pricingPlans, currency:'usd'}); 
});
app.get('/pricing', i18nMiddleware, (req, res) => {
  res.render('pricing',{pricingPlans:pricingPlans, currency:'usd'}); 
});

// app.get('/:lang(en|zh)/pricing/:currency(ntd|usd)', i18nMiddleware, (req, res) => {
//   res.render('components/CurrencyUpdate',{pricingPlans:pricingPlans, currency:req.params.currency}); 
// });

app.get('/:lang(en|zh|ja|es)/about', i18nMiddleware, (req, res) => {  res.render('about'); });
app.get('/about', i18nMiddleware, (req, res) => {  res.render('about'); });

app.get('/:lang(en|zh|ja|es)', i18nMiddleware, async (req, res) => {  
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
app.post('/demo', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const response = await fetch('http://localhost:8000/api/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ website: url })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              res.write(`data: ${data}\n\n`);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.get('/demo-stream', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const response = await fetch('http://localhost:8000/api/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ website: url })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              res.write(`data: ${data}\n\n`);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
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
      message: 'Thank you for your interest! We\'ll be in touch soon.'
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
app.post('/beta-signup', async (req, res) => {
  try {
    const { name, company, website, email, lang } = req.body;
    const { error, value } = betaSignupSchema.validate({...req.body});

    if(error) throw error;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected - save to database
      const betaSignup = new BetaSignup({
        name,
        company,
        website,
        email,
        lang
      });

      await betaSignup.save();
      sendMail('beta signup', `New beta signup - Name: ${name}, Company: ${company}, Email: ${email}, Website: ${website}`);
    } else {
      // MongoDB not connected - just log for demo purposes
      console.log('📧 Beta signup (Demo Mode):', { name, company, website, email });
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for signing up! We\'ll be in touch soon.'
    });

  } catch(err) {
    console.log(err.message);
    if (err.code === 11000) {
      // Duplicate email error
      res.status(400).json({
        success: false,
        message: 'This email is already signed up for our beta.'
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

const port = process.env.PORT || 8888;
app.listen(port, () => {
  console.log('Development environment:', process.env.NODE_ENV);
  console.log(`Server running on port ${port}`);
});