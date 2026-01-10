# Social Media Links Configuration

## Overview
The `socialMediaLinks.json` file controls the **external social media platform links** displayed on the `/socials` page. The Newsletter card and Contact CTA sections are hardcoded in the template and not controlled by this configuration.

## Configuration Structure

### Platform Object
Each social media platform in the `platforms` array has the following properties:

```json
{
  "name": "Platform Name",           // Display name for the platform
  "description": "Description text", // Description shown on the card
  "url": "https://...",             // Link URL (internal or external)
  "iconClass": "fab fa-icon",       // Font Awesome icon class
  "buttonText": "Follow Us",        // Text displayed on the button
  "buttonClass": "btn btn-primary", // CSS classes for button styling
  "cardColor": "",                  // Background color for the card (optional)
  "textColor": ""                   // Text color override (optional)
}
```

### Page Settings
The `pageSettings` object controls the page metadata and content:

```json
{
  "title": "Page title for <title> tag",
  "metaDescription": "Meta description for SEO",
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description",
  "ogImage": "URL to Open Graph image",
  "heroTitle": "Main headline",
  "heroSubtitle": "Secondary headline",
  "heroDescription": "Hero section description",
  "sectionTitle": "Social media section title"
}
```

## What's Configurable vs Hardcoded

### **Configurable via JSON** (External Social Platforms):
- LinkedIn, Facebook, Instagram, YouTube, Bluesky, etc.
- Platform URLs, descriptions, button text, icons, styling
- Page metadata (title, description, Open Graph)
- Hero section content

### **Hardcoded in Template** (Internal Features):
- Newsletter signup card (links to internal newsletter section)
- Contact CTA section at bottom of page
- Overall page structure and layout

## How to Update

### Adding a New Social Media Platform
1. Open `socialMediaLinks.json`
2. Add a new object to the `platforms` array:

```json
{
  "name": "Twitter",
  "description": "Follow us for quick updates and industry news.",
  "url": "https://twitter.com/yourhandle",
  "iconClass": "fab fa-twitter",
  "buttonText": "Follow Us",
  "buttonClass": "btn btn-info",
  "cardColor": "",
  "textColor": ""
}
```

### Updating Existing Links
Simply modify the `url` property of the platform you want to change:

```json
{
  "name": "LinkedIn",
  "url": "https://www.linkedin.com/company/new-company-name/"
  // ... other properties remain the same
}
```

### Changing Page Content
Modify any property in the `pageSettings` object:

```json
{
  "heroTitle": "Connect With Our Team",
  "sectionTitle": "Our Social Presence"
}
```

## Icon Classes
Use Font Awesome icon classes. Common examples:
- LinkedIn: `fab fa-linkedin`
- Facebook: `fab fa-facebook`
- Instagram: `fab fa-instagram`
- Twitter: `fab fa-twitter`
- YouTube: `fab fa-youtube`
- TikTok: `fab fa-tiktok`
- Email: `fas fa-envelope`
- Custom/Generic: `fas fa-link`

## Button Styling
Available Bootstrap button classes:
- `btn btn-primary` (blue)
- `btn btn-secondary` (gray)
- `btn btn-success` (green)
- `btn btn-danger` (red)
- `btn btn-warning` (yellow)
- `btn btn-info` (light blue)
- `btn btn-dark` (black)

## Special Styling
For custom card colors (like the Newsletter card):
- `cardColor`: CSS color value (e.g., `"var(--primary-color)"`, `"#ff5733"`)
- `textColor`: CSS color value (e.g., `"black"`, `"white"`, `"#333"`)

## External vs Internal Links
- External links (starting with `http`) automatically get `target="_blank"` and `rel="noopener noreferrer"`
- Internal links (starting with `/` or `#`) open in the same tab

## Restart Required
After making changes to `socialMediaLinks.json`, restart the server to see the updates:

```bash
# Stop the server (Ctrl+C)
# Then restart:
bun dev
```