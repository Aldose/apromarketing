# Nuxt Migration Plan - Clean Break Approach

## Project Overview
**Branch**: Nuxt development branch (separate from main)
**Strategy**: Clean break from Pug/Express to full Nuxt implementation
**Fallback**: Can revert to previous branch if needed
**Date**: December 2024

## Current Stack (To Be Replaced)
- Express.js with Pug templates (port 8888)
- Vue.js 3 via CDN
- Ghost CMS (port 2368)
- MongoDB for data storage
- Bun runtime (v1.3.1)
- AI Service (port 8000)

## Target Stack (Nuxt Implementation)
- **Nuxt 3** with compatibility mode for future Nuxt 4 upgrade
- **Bun** as package manager and runtime
- **Vue 3** Composition API (native, not CDN)
- **Ghost CMS** integration via Nuxt server routes
- **MongoDB** with Nitro server integration
- **Tailwind CSS** for styling (optional: keep Bootstrap if preferred)

## Implementation Phases

### Phase 0: Project Setup & Configuration
```bash
# Create new Nuxt application with Bun
bunx --bun nuxi@latest init . --packageManager bun

# Install core dependencies
bun add @nuxtjs/tailwindcss @pinia/nuxt @vueuse/nuxt
bun add mongoose joi express-mongo-sanitize
bun add -D @nuxtjs/eslint-module sass
```

**nuxt.config.ts** Configuration:
```typescript
export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility mode for future upgrade
  future: {
    compatibilityVersion: 4,
  },

  // Bun optimization
  nitro: {
    preset: 'bun',
    experimental: {
      wasm: true
    }
  },

  // Runtime config for API keys
  runtimeConfig: {
    ghostContentKey: process.env.CONTENT_API_KEY,
    ghostAdminKey: process.env.ADMIN_API_KEY,
    mongoUri: process.env.MONGO_URI,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  // Development server
  devServer: {
    port: 3000
  }
})
```

### Phase 1: Core Components Implementation

#### 1.1 Animation Components (Priority: HIGH)
Based on **Phase 1, 2, and 3 UI Animations** from requirements:

**components/Demo/DemoForm.vue**
- Form submission with website URL input
- Phase 1: Graphic fade-out, form moves left
- Trigger Phase 2 after submission

**components/Demo/LoadingAnimation.vue**
- Progress bar with percentage
- Analysis steps display
- Real-time SSE updates

**components/Blog/BlogPanel.vue**
- Phase 2: Slide in from right during analysis
- Display 6 Ghost blog posts
- Phase 3: Article expansion on click
- Close button to return to grid view
- Fixed pagination with < > buttons (bug fix from requirements)

**components/Blog/BlogArticle.vue**
- Expanded article view (Phase 3)
- Takes up most of blog panel space
- 2% padding around article
- Close button in upper right

#### 1.2 Layout Components
**layouts/default.vue**
```vue
<template>
  <div>
    <NavigationHeader />
    <main>
      <slot />
    </main>
    <FooterSection />
  </div>
</template>
```

### Phase 2: Pages Structure

#### 2.1 Homepage with Demo Integration
**pages/index.vue**
```vue
<template>
  <div class="hero-section">
    <div class="container">
      <div class="row">
        <!-- Left: Hero graphic that fades in Phase 1 -->
        <div class="col-lg-6" v-show="!formSubmitted" :class="{ 'fade-out': isAnimating }">
          <HeroGraphic />
        </div>

        <!-- Right: Demo form section -->
        <div class="col-lg-6" :class="{ 'move-left': isAnimating, 'form-with-blog': formSubmitted }">
          <DemoForm @submit="handleDemoSubmit" />
          <LoadingAnimation v-if="isLoading" :progress="progress" />
          <DemoResults v-if="showResults" :data="resultsData" />
        </div>

        <!-- Blog Panel - Phase 2 -->
        <BlogPanel
          v-show="showBlogPanel"
          :class="{ 'slide-in-right': showBlogPanel }"
          @article-select="handleArticleSelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const formSubmitted = ref(false)
const isAnimating = ref(false)
const showBlogPanel = ref(false)
const isLoading = ref(false)
const showResults = ref(false)
const progress = ref(0)
const resultsData = ref(null)

const handleDemoSubmit = async (websiteUrl) => {
  // Phase 1: Start animations
  isAnimating.value = true
  formSubmitted.value = true
  isLoading.value = true

  // Phase 2: Show blog panel after 1 second
  setTimeout(() => {
    triggerPhase2()
  }, 1000)

  // Start SSE connection for real-time updates
  await startDemoAnalysis(websiteUrl)
}

const triggerPhase2 = async () => {
  showBlogPanel.value = true
  // Fetch Ghost posts for blog panel
  await fetchGhostPosts()
}

const handleArticleSelect = (article) => {
  // Phase 3: Expand selected article
  // Handled within BlogPanel component
}
</script>
```

#### 2.2 Other Pages
- **pages/pricing.vue** - Pricing plans
- **pages/about.vue** - About page
- **pages/contact.vue** - Contact form
- **pages/blog/index.vue** - Blog listing
- **pages/blog/[slug].vue** - Individual blog posts

### Phase 3: Server API Routes

#### 3.1 Demo Analysis SSE Endpoint
**server/api/demo-stream.get.ts**
```typescript
import { sendStream } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { url } = query

  // Security checks (origin, rate limiting)
  const origin = getHeader(event, 'origin')
  if (!isAllowedOrigin(origin)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Set SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Connect to AI service on port 8000
      try {
        const response = await fetch('http://localhost:8000/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: url })
        })

        // Stream responses back to client
        const reader = response.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      } catch (error) {
        const errorMessage = `data: ${JSON.stringify({ error: error.message })}\n\n`
        controller.enqueue(encoder.encode(errorMessage))
      } finally {
        controller.close()
      }
    }
  })

  return sendStream(event, stream)
})
```

#### 3.2 Ghost CMS Integration
**server/api/ghost/posts.get.ts**
```typescript
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const { page = 1, limit = 6 } = query

  try {
    const response = await $fetch(`http://localhost:2368/ghost/api/content/posts/`, {
      params: {
        key: config.ghostContentKey,
        limit,
        page,
        fields: 'title,excerpt,slug,published_at,html,feature_image',
        include: 'tags,authors'
      }
    })

    return response
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Ghost CMS unavailable'
    })
  }
})
```

#### 3.3 Newsletter Signup
**server/api/newsletter.post.ts**
```typescript
import mongoose from 'mongoose'
import Newsletter from '~/server/models/Newsletter'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri)
  }

  // Validate and save
  try {
    const newsletter = new Newsletter({
      name: body.name,
      company: body.company,
      website: body.website,
      email: body.email,
      subscriptionStatus: 'pending'
    })

    await newsletter.save()

    return {
      success: true,
      message: 'Thank you for subscribing!'
    }
  } catch (error) {
    if (error.code === 11000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already subscribed'
      })
    }
    throw error
  }
})
```

### Phase 4: Composables & State Management

#### 4.1 Demo Composable
**composables/useDemo.ts**
```typescript
export const useDemo = () => {
  const isAnalyzing = ref(false)
  const progress = ref(0)
  const results = ref(null)
  const error = ref(null)

  const startAnalysis = async (websiteUrl: string) => {
    isAnalyzing.value = true
    progress.value = 0
    error.value = null

    const eventSource = new EventSource(`/api/demo-stream?url=${encodeURIComponent(websiteUrl)}`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.progress) {
        progress.value = data.progress
      }

      if (data.complete) {
        results.value = data.results
        isAnalyzing.value = false
        eventSource.close()
      }

      if (data.error) {
        error.value = data.error
        isAnalyzing.value = false
        eventSource.close()
      }
    }

    eventSource.onerror = () => {
      error.value = 'Connection failed'
      isAnalyzing.value = false
      eventSource.close()
    }
  }

  return {
    isAnalyzing: readonly(isAnalyzing),
    progress: readonly(progress),
    results: readonly(results),
    error: readonly(error),
    startAnalysis
  }
}
```

#### 4.2 Ghost Composable
**composables/useGhost.ts**
```typescript
export const useGhost = () => {
  const posts = ref([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const fetchPosts = async (page = 1) => {
    isLoading.value = true
    try {
      const { posts: data, meta } = await $fetch('/api/ghost/posts', {
        params: { page, limit: 6 }
      })

      posts.value = data
      currentPage.value = meta.pagination.page
      totalPages.value = meta.pagination.pages
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      fetchPosts(currentPage.value + 1)
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      fetchPosts(currentPage.value - 1)
    }
  }

  return {
    posts: readonly(posts),
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    isLoading: readonly(isLoading),
    fetchPosts,
    nextPage,
    prevPage
  }
}
```

### Phase 5: Styling Strategy

#### 5.1 CSS Architecture
```scss
// assets/scss/main.scss
@import 'abstracts/variables';
@import 'abstracts/mixins';
@import 'abstracts/animations';

// Phase 1 Animations
.fade-out {
  animation: fadeOut 0.5s ease-out forwards;
  opacity: 0;
}

.move-left {
  transition: transform 0.5s ease-out;
  transform: translateX(-25%);
}

.form-with-blog {
  flex: 0 0 48%;
  max-width: 48%;
}

// Phase 2 Animations
.blog-panel-container {
  position: absolute;
  top: 0;
  left: calc(100% + 2%);
  width: 45%;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 0.8s ease-out, opacity 0.8s ease-out;

  &.slide-in-right {
    transform: translateX(0);
    opacity: 1;
  }
}

// Phase 3 - Article Expansion
.article-expanded {
  position: absolute;
  top: 2%;
  left: 2%;
  right: 2%;
  bottom: 2%;
  background: white;
  border-radius: 12px;
  padding: 20px;
  z-index: 1001;
  animation: expandArticle 0.3s ease-out;
}

@keyframes expandArticle {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

#### 5.2 Tailwind Configuration
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'apro-green': '#0fffad',
        'apro-dark': '#1a1a1a'
      },
      animation: {
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'fade-out': 'fadeOut 0.5s ease-out'
      }
    }
  }
}
```

### Phase 6: Development Workflow

#### 6.1 Environment Setup
**.env**
```bash
# Ghost CMS
CONTENT_API_KEY=df871a8bbdcd8f01b6a7e1a8f7
ADMIN_API_KEY=6937e69c8d31199a18d6497b:cb80bdc75549333d97055ea3d2aad33fbf752309f357e9c510d46b91f2ebd22f

# MongoDB
MONGO_URI=mongodb://localhost:27017/apromarketing

# App Config
APP_URL=http://localhost:3000
NODE_ENV=development
```

#### 6.2 Development Commands
```bash
# Install dependencies
bun install

# Run development server with Bun runtime
bun --bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run with PM2 in production
pm2 start ecosystem.config.js
```

### Phase 7: Testing Strategy

#### 7.1 Feature Parity Checklist
- [ ] Homepage loads with hero section
- [ ] Demo form accepts website URL
- [ ] Phase 1 animation triggers on submit
- [ ] Phase 2 blog panel slides in
- [ ] Ghost blog posts display (6 posts)
- [ ] Phase 3 article expansion works
- [ ] Close button returns to grid view
- [ ] Pagination with < > buttons works
- [ ] SSE streaming shows real-time updates
- [ ] Newsletter signup saves to MongoDB
- [ ] All pages render correctly
- [ ] Mobile responsive design works

#### 7.2 Performance Targets
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size < 200KB (initial)

### Phase 8: Migration Checklist

#### 8.1 Pre-Migration
- [x] Create separate branch for Nuxt development
- [ ] Set up Nuxt project structure
- [ ] Install all dependencies
- [ ] Configure environment variables
- [ ] Set up development server

#### 8.2 Core Features
- [ ] Implement demo form component
- [ ] Add Phase 1 animations
- [ ] Add Phase 2 blog panel
- [ ] Add Phase 3 article expansion
- [ ] Fix pagination (< > buttons)
- [ ] Integrate Ghost CMS
- [ ] Connect MongoDB
- [ ] Set up SSE streaming

#### 8.3 Pages & Content
- [ ] Convert homepage
- [ ] Convert pricing page
- [ ] Convert about page
- [ ] Convert contact page
- [ ] Create blog listing
- [ ] Create blog post template

#### 8.4 Testing & Optimization
- [ ] Test all animations
- [ ] Verify Ghost integration
- [ ] Test SSE streaming
- [ ] Check mobile responsiveness
- [ ] Optimize performance
- [ ] Run Lighthouse audit

#### 8.5 Deployment Preparation
- [ ] Build production bundle
- [ ] Test production build locally
- [ ] Configure PM2 ecosystem
- [ ] Set up nginx proxy (optional)
- [ ] Document deployment process

## Rollback Strategy

If Nuxt implementation has issues:

1. **Immediate Rollback**
   ```bash
   git checkout main  # or previous working branch
   bun install
   bun run dev
   ```

2. **Preserve Nuxt Work**
   ```bash
   git branch nuxt-backup
   git checkout main
   ```

3. **Partial Integration**
   - Keep working components
   - Integrate successful features back into Express app
   - Use Nuxt components as micro-frontends

## Success Criteria

### Must Have
✅ All Phase 1, 2, 3 animations working
✅ Ghost CMS integration functional
✅ SSE demo streaming operational
✅ MongoDB newsletter signup working
✅ Pagination fixed with < > buttons
✅ No regression in functionality

### Nice to Have
⭐ Improved performance metrics
⭐ Better SEO with SSR
⭐ Code splitting for faster loads
⭐ Modern developer experience

## Notes & Considerations

1. **Bun Compatibility**: Use `--bun` flag for all commands to ensure Bun runtime is used
2. **Ghost API Keys**: Keep keys secure, use runtime config
3. **MongoDB Connection**: Implement connection pooling for production
4. **SSE Fallback**: Consider WebSocket fallback for older browsers
5. **Animation Performance**: Use CSS transforms for better performance
6. **Image Optimization**: Use Nuxt Image module for automatic optimization

## Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs/getting-started/introduction)
- [Nuxt 4 Compatibility Mode](https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4)
- [Bun with Nuxt Guide](https://bun.com/guides/ecosystem/nuxt)
- [Ghost Content API](https://ghost.org/docs/content-api/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Author**: Development Team
**Status**: Planning Phase