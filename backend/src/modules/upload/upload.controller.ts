import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Req,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/enhanced-jwt-auth.guard';
import { UploadService } from './upload.service';
import { Request } from 'express';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    try {
      // Log both possible user ID formats
      const userId = request.user
        ? request.user['userId'] || request.user['sub'] || 'unknown'
        : 'no-user';
      this.logger.log(`Upload request received from user: ${userId}`);

      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Get the URL path for the file
      const fileUrl = this.uploadService.getFileUrl(file);

      this.logger.log(`File uploaded successfully: ${fileUrl}`);

      return {
        status: HttpStatus.CREATED,
        message: 'File uploaded successfully',
        url: fileUrl,
        fileName: file.filename,
        fileType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(
          'You must be authenticated to upload files',
        );
      }

      throw new BadRequestException(error.message || 'Could not upload file');
    }
  }

  // Test endpoint that doesn't require authentication
  @Get('test-status')
  testStatus() {
    return {
      status: 'healthy',
      message: 'Upload service is running',
    };
  }
}
