import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadPath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('UPLOAD_DEST', './uploads');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${Date.now()}-${safeName}${ext}`;
    const filepath = path.join(this.uploadPath, filename);

    // Ensure we are still within the upload directory
    if (!filepath.startsWith(path.resolve(this.uploadPath))) {
      throw new Error('Invalid file path');
    }

    fs.writeFileSync(filepath, file.buffer);
    
    this.logger.log(`File uploaded: ${filename}`);
    return `/uploads/${filename}`;
  }

  async delete(filename: string): Promise<void> {
    const safeFilename = path.basename(filename);
    const filepath = path.join(this.uploadPath, safeFilename);
    
    if (fs.existsSync(filepath) && filepath.startsWith(path.resolve(this.uploadPath))) {
      fs.unlinkSync(filepath);
      this.logger.log(`File deleted: ${safeFilename}`);
    }
  }

  async get(filename: string): Promise<Buffer> {
    const safeFilename = path.basename(filename);
    const filepath = path.join(this.uploadPath, safeFilename);

    if (!filepath.startsWith(path.resolve(this.uploadPath))) {
      throw new Error('Invalid file path');
    }

    return fs.readFileSync(filepath);
  }
}
