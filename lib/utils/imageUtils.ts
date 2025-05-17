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
 * Processes an image file, converting HEIC to JPEG if necessary
 * @param file The image file to process
 * @returns A Promise that resolves to the processed file
 */
export const processImageFile = async (file: File): Promise<File> => {
  if (!file) return file;
  
  try {
    if (isHeicFile(file)) {
      console.log(`Processing HEIC image: ${file.name}`);
      return await convertHeicToJpeg(file);
    }
    return file;
  } catch (error) {
    console.error('Error processing image file:', error);
    // Alert but don't break the upload - return the original file as fallback
    console.warn('Falling back to original file due to conversion error');
    return file; // Return original file on error
  }
};
