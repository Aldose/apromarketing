import express from 'express';
import axios from 'axios';
import categories from '../data/blogCategories.json';

const router = express.Router();

async function categoryMatcher(category){
  let currentCategory;
  const theCat = await categories.find(cat => cat.slug == category)?.id || 'all';
  theCat == 'all' ? currentCategory = '' : currentCategory = `&categories=${theCat}`;
  return currentCategory;
}

export const getArticles = async (lang, page, category) => {
  try{
    const ghostApiKey = process.env.GHOST_API_KEY;
    if (!ghostApiKey) {
      console.log('Ghost CMS API key not found in environment variables');
      return [];
    }

    // For homepage display, get the 4 most recent posts
    const limit = 4;
    const {data} = await axios.get(`https://blog.apromarketing.com/ghost/api/v3/content/posts/?key=${ghostApiKey}&limit=${limit}&include=authors`);

    if (!data || !data.posts) {
      console.log('No posts returned from Ghost API');
      return [];
    }

    return data.posts.map(post => ({
      id: post.id,
      title: post.title || '',
      author: post.authors?.[0]?.name || 'Unknown',
      publishedDate: new Date(post.published_at).toLocaleDateString(),
      date: new Date(post.published_at).toLocaleDateString(),
      summary: post.excerpt || '',
      slug: post.slug || '',
      featuredImage: post.feature_image || '',
      img: post.feature_image || ''
    }));

  }catch(error){
    console.log('Error fetching articles from Ghost:', error.message);
    return [];
  }
};
export const getArticlesRaw = async (lang, page, category) => {
  try{
    const cat = await categoryMatcher(category);
    const {data, headers} = await axios.get(`https://blog.apromarketing.com/wp-json/wp/v2/posts?lang=${lang}&page=${page}&_fields=id,title,excerpt,modified,slug,date_gmt,author,featured_media,_links,_embedded&_embed${cat}`);

    return data
  }catch(error){
    console.log(error)
  }
};

export const getArticle = async (slug) => {
  try {
    let article;
    const { data } = await axios.get(`https://blog.apromarketing.com/wp-json/wp/v2/posts?slug=${slug}&_fields=id,title,excerpt,content,modified,slug,date_gmt,author,translations,lang,featured_media,_links,_embedded&_embed`);
    if (!data.length) return null;
    return article = {
      id: data[0].id,
      title: data[0].title.rendered,
      excerpt: data[0].excerpt.rendered,
      content: data[0].content.rendered
        .replace(
          /<img[^>]+src="data:image\/[^>]+>|<noscript>([\s\S]*?)<\/noscript>/g,
          '$1'
        )
        .replace(/<img((?:\s+[^>]+)?)>/gi, (match, attributes) => {
          // Check if a class attribute exists
          if (/class\s*=\s*(['"])(.*?)\1/.test(attributes)) {
            // Append "wrap-up" to the existing class attribute
            return match.replace(/(class\s*=\s*["'])([^"']*)(["'])/, (m, p1, classes, p3) => {
              return `${p1}${classes} blur-up${p3}`;
            }).replace('>', ' loading="lazy">');
          } else {
            // No class attribute, so add one with "wrap-up"
            return `<img${attributes} class="blur-up lazyload" loading="lazy">`;
          }
        }),
      modified: data[0].modified,
      slug: data[0].slug,
      date: new Date(data[0].date_gmt).toLocaleDateString(),
      translations: data[0].translations,
      lang: data[0].lang,
      img: data[0]._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      author: data[0]._embedded?.author?.[0]?.name || 'Unknown',
      authorImg: data[0]._embedded?.author?.[0]?.avatar_urls?.[96] || '',
      translations: data[0].translations,
    };
  } catch (error) {
    console.log(error)
  }
};
export const getArticleRaw = async (slug) => {
  try {
    const { data } = await axios.get(`https://blog.apromarketing.com/wp-json/wp/v2/posts?slug=${slug}&_fields=id,title,excerpt,content,modified,slug,date_gmt,author,translations,lang,featured_media,_links,_embedded&_embed`);
    return data;
    
  } catch (error) {
    console.log(error)
  }
};


export default router;