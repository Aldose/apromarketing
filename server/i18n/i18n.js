import enUS from './en-US/en-us.js'
import zhTW from './zh-TW/zh-tw.js'
import esMX from './es-MX/es-mx.js'
import nl from './nl/nl.js'
import jaJP from './ja-JP/ja-jp.js'
export const i18n =  {
  'en': enUS,
  'zh': zhTW,
  'es': esMX,
  'nl': nl,
  'ja': jaJP,
}
// Helper function to get nested translations
export function translate(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null;
  }, obj);
}

// Middleware for Express
export function i18nMiddleware(req, res, next) {
  
  const { lang } = req.params;
  let baseLang;
  lang ? baseLang = lang.slice(0, 2) : baseLang = 'en';
  
  res.locals.t = (key) => {
    const translation = translate(i18n[baseLang], key);
    return translation || translate(i18n['en'], key) || key;
  };
  
  // Add current language to res.locals
  res.locals.lang = baseLang;
  if (!lang){ 
    res.cookie('lang', 'en-US');
    next();
  }
  else{
    res.cookie('lang', `${lang}-${lang === 'zh' ? 'TW' : lang === 'es' ? 'MX' : lang === 'ja' ? 'JP' : lang.toUpperCase()}`);
    next();
  }
} 