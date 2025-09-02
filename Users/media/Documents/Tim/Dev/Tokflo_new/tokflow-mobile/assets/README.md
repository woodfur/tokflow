# Assets Directory

This directory contains the app's static assets including icons, splash screens, and other images.

## Required Assets

To complete the app setup, you'll need to add the following assets:

### App Icon
- `icon.png` - 1024x1024px app icon
- `adaptive-icon.png` - 1024x1024px adaptive icon for Android
- `favicon.png` - 32x32px favicon for web

### Splash Screen
- `splash.png` - 1284x2778px splash screen image

## Asset Guidelines

### App Icon (`icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Design: Should represent the TokFlo brand
- Colors: Use brand colors (#6366f1, #8b5cf6)
- Content: Avoid text, keep design simple and recognizable

### Adaptive Icon (`adaptive-icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Design: Foreground layer of the adaptive icon
- Safe area: Keep important elements within 66% of the canvas
- Background: Will use the color specified in app.json (#6366f1)

### Splash Screen (`splash.png`)
- Size: 1284x2778 pixels (iPhone 12 Pro Max resolution)
- Format: PNG
- Design: Simple logo or brand mark centered
- Background: Should match the backgroundColor in app.json (#6366f1)
- Content: Minimal design, avoid detailed graphics

### Favicon (`favicon.png`)
- Size: 32x32 pixels
- Format: PNG
- Design: Simplified version of the app icon
- Usage: Web version of the app

## Creating Assets

You can create these assets using:
- Design tools: Figma, Sketch, Adobe Illustrator
- Online generators: App icon generators, favicon generators
- AI tools: Midjourney, DALL-E for initial concepts

## Asset Optimization

- Use PNG format for icons (supports transparency)
- Optimize file sizes without losing quality
- Test icons on different backgrounds
- Ensure icons are visible in both light and dark themes

## Platform-Specific Considerations

### iOS
- Icons should not include the iOS rounded corner effect
- Avoid using the iOS app icon grid
- Test on various iOS devices and sizes

### Android
- Adaptive icons allow for various shapes
- Test with different launcher themes
- Consider Material Design guidelines

## Temporary Placeholders

Until you create custom assets, you can:
1. Use Expo's default assets as placeholders
2. Generate simple colored squares with the app name
3. Use online placeholder generators

## Implementation

Once you have the assets:
1. Place them in this `assets/` directory
2. Ensure filenames match those specified in `app.json`
3. Test the app on both iOS and Android
4. Verify assets appear correctly in app stores

## Brand Guidelines

For TokFlo branding:
- Primary color: #6366f1 (Indigo)
- Secondary color: #8b5cf6 (Purple)
- Style: Modern, clean, video-focused
- Inspiration: TikTok's playful yet professional aesthetic