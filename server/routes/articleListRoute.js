import express from 'express';
import axios from 'axios';

const router = express.Router();

const GHOST_URL = process.env.GHOST_URL || 'https://blog.apromarketing.com';
const GHOST_API_KEY = process.env.GHOST_API_KEY;

function buildFilter(category) {
  if (!category || category === 'all') return '';
  return `&filter=tag:${category}`;
}

function applyLazyLoad(html) {
  return (html || '')
    .replace(
      /<img[^>]+src="data:image\/[^>]+>|<noscript>([\s\S]*?)<\/noscript>/g,
      '$1'
    )
    .replace(/<img((?:\s+[^>]+)?)>/gi, (match, attributes) => {
      if (/class\s*=\s*(['"])(.*?)\1/.test(attributes)) {
        return match
          .replace(/(class\s*=\s*["'])([^"']*)(["'])/, (_, p1, classes, p3) => `${p1}${classes} blur-up${p3}`)
          .replace('>', ' loading="lazy">');
      }
      return `<img${attributes} class="blur-up lazyload" loading="lazy">`;
    });
}

export const getArticles = async (_lang, page, category) => {
  try {
    const filter = buildFilter(category);
    const url = `${GHOST_URL}/ghost/api/content/posts/?key=${GHOST_API_KEY}&include=authors,tags&limit=15&page=${page}${filter}`;
    const { data } = await axios.get(url);
    const totalPages = data.meta?.pagination?.pages || 1;

    return data.posts.map(post => ({
      totalPages,
      id: post.id,
      title: post.title || '',
      author: post.primary_author?.name || '',
      publishedDate: new Date(post.published_at).toLocaleDateString(),
      date: new Date(post.published_at).toLocaleDateString(),
      summary: post.excerpt || '',
      slug: post.slug || '',
      img: post.feature_image || '',
      medImg: post.feature_image || '',
      smImg: post.feature_image || '',
      imgAlt: post.feature_image_alt || '',
      authorImg: post.primary_author?.profile_image || '',
      authorDescription: post.primary_author?.bio || '',
      authorId: post.primary_author?.id || '',
      terms: post.tags || [],
    }));
  } catch (error) {
    console.log(error);
  }
};

export const getArticlesRaw = async (lang, page, category) => {
  try {
    const filter = buildFilter(category);
    const url = `${GHOST_URL}/ghost/api/content/posts/?key=${GHOST_API_KEY}&include=authors,tags&limit=15&page=${page}${filter}`;
    const { data } = await axios.get(url);
    return data.posts;
  } catch (error) {
    console.log(error);
  }
};

export const getArticle = async (slug) => {
  try {
    const url = `${GHOST_URL}/ghost/api/content/posts/slug/${slug}/?key=${GHOST_API_KEY}&include=authors,tags`;
    const { data } = await axios.get(url);
    if (!data.posts?.length) return null;
    const post = data.posts[0];

    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      content: applyLazyLoad(post.html),
      modified: post.updated_at,
      slug: post.slug,
      date: new Date(post.published_at).toLocaleDateString(),
      translations: null,
      lang: null,
      img: post.feature_image || '',
      author: post.primary_author?.name || '',
      authorImg: post.primary_author?.profile_image || '',
    };
  } catch (error) {
    console.log(error);
  }
};

export const getArticleRaw = async (slug) => {
  try {
    const url = `${GHOST_URL}/ghost/api/content/posts/slug/${slug}/?key=${GHOST_API_KEY}&include=authors,tags`;
    const { data } = await axios.get(url);
    return data.posts;
  } catch (error) {
    console.log(error);
  }
};

export default router;
