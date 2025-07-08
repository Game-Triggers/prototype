import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AuthDebugController } from './auth-debug.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            // Determine the path based on file type
            const isImage = file.mimetype.startsWith('image/');
            const uploadPath = join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              'public',
              'uploads',
              isImage ? 'images' : 'videos',
            );

            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            // Create a unique file name
            const uniqueSuffix = uuidv4();
            const fileExt = extname(file.originalname);
            cb(null, `${uniqueSuffix}${fileExt}`);
          },
        }),
        limits: {
          fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // Default 10MB if not specified
        },
        fileFilter: (req, file, cb) => {
          // Validate file types
          const allowedImageTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ];
          const allowedVideoTypes = [
            'video/mp4',
            'video/webm',
            'video/quicktime',
          ];

          if (
            allowedImageTypes.includes(file.mimetype) ||
            allowedVideoTypes.includes(file.mimetype)
          ) {
            cb(null, true);
          } else {
            cb(
              new Error(
                'Only images (jpeg, png, gif, webp) and videos (mp4, webm, mov) are allowed!',
              ),
              false,
            );
          }
        },
      }),
    }),
  ],
  controllers: [UploadController, AuthDebugController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
