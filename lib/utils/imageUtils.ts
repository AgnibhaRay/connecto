// Use heic2any for browser compatibility
import { recordConversion } from './conversionMetrics';

/**
 * Checks if a file is a HEIC image
 * @param file The file to check
 * @returns A boolean indicating whether the file is a HEIC image
 */
export const isHeicFile = (file: File): boolean => {
  return (
    file.type === 'image/heic' || 
    file.type === 'image/heif' || 
    file.name.toLowerCase().endsWith('.heic') || 
    file.name.toLowerCase().endsWith('.heif')
  );
};

/**
 * Converts a HEIC image to JPEG format
 * @param file The HEIC file to convert
 * @returns A Promise that resolves to a new File object in JPEG format
 */
export const convertHeicToJpeg = async (file: File): Promise<File> => {
  // Start performance measurement
  const startTime = performance.now();
  
  try {
    // Skip conversion if not a HEIC file
    if (!isHeicFile(file)) {
      return file;
    }

    console.log(`Starting conversion for ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Dynamically import heic2any to avoid issues with SSR
    console.log('Dynamically importing heic2any...');
    const heic2any = (await import('heic2any')).default;
    
    // Convert HEIC to JPEG using heic2any
    console.log('Converting HEIC to JPEG...');
    const jpegBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    }) as Blob;
    
    // Create a new File object with the converted JPEG data
    const newFilename = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
    console.log(`Creating new File object with name: ${newFilename}`);
    
    const jpegFile = new File(
      [jpegBlob], 
      newFilename, 
      { type: 'image/jpeg' }
    );
    
    const endTime = performance.now();
    const conversionTime = endTime - startTime;
    
    console.log(`Conversion completed in ${conversionTime.toFixed(2)}ms`);
    console.log(`Result: ${jpegFile.name} (${(jpegFile.size / 1024).toFixed(2)} KB)`);
    
    // Record success metric
    recordConversion({
      timestamp: new Date(),
      fileSize: file.size,
      conversionTime: conversionTime,
      success: true
    });
    
    return jpegFile;
  } catch (error) {
    const endTime = performance.now();
    console.error('Error converting HEIC to JPEG:', error);
    
    // Record error metric
    recordConversion({
      timestamp: new Date(),
      fileSize: file.size,
      conversionTime: endTime - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return useful error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to convert HEIC image to JPEG: ${errorMessage}`);
  }
};

/**
 * Resizes an image to fit within the specified dimensions while maintaining aspect ratio
 * @param file The image file to resize
 * @param maxWidth Maximum width of the resized image
 * @param maxHeight Maximum height of the resized image
 * @param quality JPEG quality (0-1), defaults to 0.9
 * @returns A Promise that resolves to a new File object with the resized image
 */
export const resizeImage = async (
  file: File, 
  maxWidth: number = 1080, 
  maxHeight: number = 1920, 
  quality: number = 0.9
): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new image object
      const img = new Image();
      const reader = new FileReader();
      
      // When the file is loaded as a data URL, set it as the image source
      reader.onload = (e) => {
        if (!e.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        img.src = e.target.result as string;
        
        // When the image is loaded, resize it
        img.onload = () => {
          // Calculate the resized dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          // First check if we need to resize the width
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          
          // Then check if we need to resize the height further
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
          
          // Create a canvas with the resized dimensions
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw the resized image on the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert the canvas to a blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            
            // Create a new file object with the resized image
            const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
            const resizedFile = new File([blob], newFileName, { type: 'image/jpeg' });
            resolve(resizedFile);
          }, 'image/jpeg', quality);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error resizing image:', error);
      reject(error);
    }
  });
};

/**
 * Processes an image file, converting HEIC to JPEG if necessary and resizing to fit standards
 * @param file The image file to process
 * @returns A Promise that resolves to the processed file
 */
export const processImageFile = async (file: File): Promise<File> => {
  if (!file) return file;
  
  try {
    // First handle HEIC conversion if needed
    let processedFile = file;
    if (isHeicFile(file)) {
      console.log(`Processing HEIC image: ${file.name}`);
      processedFile = await convertHeicToJpeg(file);
    }
    
    // Then resize the image to ensure it's not too large
    if (processedFile.type.startsWith('image/')) {
      console.log(`Resizing image: ${processedFile.name}`);
      return await resizeImage(processedFile, 1080, 1920, 0.9);
    }
    
    return processedFile;
  } catch (error) {
    console.error('Error processing image file:', error);
    // Alert but don't break the upload - return the original file as fallback
    console.warn('Falling back to original file due to conversion error');
    return file; // Return original file on error
  }
};
