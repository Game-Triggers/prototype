import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Get the base URL for serving files
    this.baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.logger.log(
      `Upload service initialized with base URL: ${this.baseUrl}`,
    );
  }

  /**
   * Returns the public URL for accessing the uploaded file
   */
  getFileUrl(file: Express.Multer.File): string | null {
    if (!file || !file.path) {
      this.logger.error('Invalid file object provided');
      return null;
    }

    // Determine if the file is an image or video based on mimetype
    const isImage = file.mimetype.startsWith('image/');
    const mediaType = isImage ? 'images' : 'videos';

    // Extract just the filename from the full path
    const filename = path.basename(file.filename);

    // Construct the URL path that will be accessible from the frontend
    const filePath = `/uploads/${mediaType}/${filename}`;

    this.logger.log(`Generated file URL: ${filePath}`);
    return filePath;
  }

  /**
   * Validates if a file is an allowed media type
   */
  isValidMediaType(mimetype: string): boolean {
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    return [...allowedImageTypes, ...allowedVideoTypes].includes(mimetype);
  }
}
