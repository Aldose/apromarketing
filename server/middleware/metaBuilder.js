
var he = require('he');
export const removeHtmlTags = (input) => {
  if(!input) return;
  return he.decode(input.replace(/<\/?[^>]+(>|$)/g, ""));
  
};

export const articleListJSONLD = (category, page, lang, articles,) => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Articles",
    "url": "https://a-pro.ai" + (lang !== "en" ? "/" + lang : "") + `/articles/${category}/${page}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": articles.map(function(article, index) {
        return {
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Article",
            "headline":he.decode(article.title),
            "abstract": removeHtmlTags(article.summary),
            "author": {
              "@type": "Person",
              "name": article.author
            },
            "image": article.medImg,
            "url": `https://a-pro.ai${lang !== "en" ? "/" + lang : ""}/article/${article.slug}`,
            "datePublished": article.publishedDate,
            "description": article.description
          }
        };
      })
    }
  };
}

export const articleJSONLD = (article) => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": he.decode(article.title),
    "abstract": removeHtmlTags(article.summary),
    "articleBody": removeHtmlTags(article.content),
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "image": article.medImg,
    "url": `https://a-pro.ai/article/${article.slug}`,
    "datePublished": article.publishedDate,
    "dateModified": article.date,
    "description": removeHtmlTags(article.description)
  };
}

export const indexPageJSONLD = (articles, lang) => {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "A-Pro | Your SEO Companion",
    "url": "https://a-pro.ai",
    "description": "A-Pro is your ultimate partner for digital marketing success. Discover cutting-edge SEO strategies, expert marketing insights, and AI-driven tools.",
    "publisher": {
      "@type": "Organization",
      "name": "A-Pro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://a-pro.ai/images/logo.png"
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": articles.map(function(article, index) {
        return {
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Article",
            "headline":he.decode(article.title),
            "abstract": removeHtmlTags(article.summary),
            "author": {
              "@type": "Person",
              "name": article.author
            },
            "image": article.medImg,
            "url": `https://a-pro.ai${lang !== "en" ? "/" + lang : ""}/article/${article.slug}`,
            "datePublished": article.publishedDate,
            "description": article.description
          }
        };
      })
    }
  };
}