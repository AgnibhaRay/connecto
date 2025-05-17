# HEIC Image Conversion Feature

## Overview
This feature automatically converts HEIC images (commonly used by Apple devices) to JPEG format before uploading them to Firebase Storage. This ensures that all images are stored in a widely compatible format that can be displayed in any browser.

## How it Works
1. When a user selects a HEIC/HEIF image file, the application detects the format based on the file extension or MIME type.
2. The user receives a notification that their HEIC image is being converted to JPEG.
3. The `heic2any` library processes the image before it's uploaded to Firebase Storage.
4. The converted JPEG image is stored, making it universally accessible across all devices and browsers.

## Implementation Details
The conversion logic is implemented in the `lib/utils/imageUtils.ts` utility file, which provides the following functions:

- `isHeicFile(file)`: Detects if a file is in HEIC/HEIF format
- `convertHeicToJpeg(file)`: Converts a HEIC file to JPEG format
- `processImageFile(file)`: Handles image processing, converting HEIC to JPEG if necessary

### Important Implementation Notes
- The heic2any module is loaded dynamically using ES6 dynamic imports to avoid issues with SSR (Server-Side Rendering)
- The implementation includes fallbacks to ensure images can still be uploaded even if conversion fails
- Error handling is comprehensive to ensure a smooth user experience

## Files Modified
1. `components/feed/CreatePost.tsx` - For post image uploads
2. `app/(main)/events/create/page.tsx` - For event cover image uploads
3. `app/(main)/profile/edit/page.tsx` - For profile photo uploads
4. `lib/utils/imageUtils.ts` - Core utility implementing dynamic imports for better browser compatibility

## Dependencies
This feature uses the `heic2any` NPM package for browser-compatible conversion of HEIC to JPEG images.

## User Experience
The conversion happens transparently with minimal UI impact. Users will see a toast notification when a HEIC image is being converted, but otherwise the process is the same as uploading any other image type.

## Troubleshooting and Known Issues

### Browser Compatibility
- The HEIC conversion runs in the browser using the heic2any library which has good browser compatibility.
- All modern browsers should support the conversion process.
- The use of dynamic imports further improves compatibility by only loading the conversion code when needed.

### Error Handling
- If conversion fails, the application will show an error message and attempt to upload the original file.
- Large HEIC files may take longer to convert.
- The system includes robust fallback mechanisms to handle conversion failures gracefully.

### Testing
- A test file is available at `/public/heic-test.html` to verify conversion functionality.
- You can access it by opening your app in development and navigating to `/heic-test.html`.
- The test page has been updated to load the heic2any library directly from a CDN to isolate conversion issues.

### Memory Usage
- HEIC conversion happens in-memory in the browser, so very large images might cause memory pressure.
- The system includes fallback logic to handle conversion errors gracefully.

## Performance Monitoring

A simple metrics system has been implemented to track conversion performance:

- The `conversionMetrics.ts` utility tracks successful and failed conversions
- Metrics include conversion time, file size, browser information, and success rate
- This data can help identify patterns in conversion failures and opportunities for optimization

### Accessing Metrics

In development, metrics are logged to the console. In a production environment, these metrics could be sent to an analytics service for further analysis.
