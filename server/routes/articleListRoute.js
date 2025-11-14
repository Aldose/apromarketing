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
    // const categoriesResponse = await axios.get('https://blog.a-pro.ai/wp-json/wp/v2/categories?per_page=100');
    const cat = await categoryMatcher(category);
    let articles;
    
    const {data, headers} = await axios.get(`https://blog.a-pro.ai/wp-json/wp/v2/posts?lang=${lang}&page=${page}&_fields=id,title,excerpt,modified,slug,date_gmt,author,featured_media,_links,_embedded&_embed${cat}`);

    return articles = data.map(post => ({
      totalPages : headers['x-wp-totalpages'],
      id: post.id,
      title: post.title.rendered || '',
      author: post._embedded?.author?.[0]?.name || 'Unknown',
      publishedDate: new Date(post.date_gmt).toLocaleDateString(),
      date: new Date(post.modified).toLocaleDateString(),
      summary: post.excerpt.rendered || '',
      slug: post.slug || '',
      img: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
      // medImg: post._embedded?.['wp:featuredmedia']?.[0]?.media_details.sizes?.medium?.source_url || '',
      // smImg: post._embedded?.['wp:featuredmedia']?.[0]?.media_details.sizes?.thumbnail.source_url || '',
      medImg: post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.medium?.source_url || '',
      smImg: post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.thumbnail?.source_url || '',
      imgAlt: post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '',
      author: post._embedded?.['author']?.[0]?.name || '',
      authorImg: post._embedded?.['author']?.[0]?.avatar_urls?.['96'] || '',
      authorDescription: post._embedded?.['author']?.[0]?.description || '',
      authorId: post.author || '',
      terms: post._embedded?.['wp:term']?.[0] || [],
    }))
  }catch(error){
    console.log(error)
  }
};
export const getArticlesRaw = async (lang, page, category) => {
  try{
    const cat = await categoryMatcher(category);
    const {data, headers} = await axios.get(`https://blog.a-pro.ai/wp-json/wp/v2/posts?lang=${lang}&page=${page}&_fields=id,title,excerpt,modified,slug,date_gmt,author,featured_media,_links,_embedded&_embed${cat}`);

    return data
  }catch(error){
    console.log(error)
  }
};

export const getArticle = async (slug) => {
  try {
    let article;
    const { data } = await axios.get(`https://blog.a-pro.ai/wp-json/wp/v2/posts?slug=${slug}&_fields=id,title,excerpt,content,modified,slug,date_gmt,author,translations,lang,featured_media,_links,_embedded&_embed`);
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
    const { data } = await axios.get(`https://blog.a-pro.ai/wp-json/wp/v2/posts?slug=${slug}&_fields=id,title,excerpt,content,modified,slug,date_gmt,author,translations,lang,featured_media,_links,_embedded&_embed`);
    return data;
    
  } catch (error) {
    console.log(error)
  }
};


export default router;