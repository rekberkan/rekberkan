import { ArgumentsHost, Catch, HttpStatus, ExceptionFilter, Logger } from '@nestjs/common';
import { Response } from 'express';

// Define the error type inline since Prisma types may not be available
interface PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: Record<string, any>;
}

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check if this is a Prisma error
    if (!this.isPrismaError(exception)) {
      // Re-throw if not a Prisma error
      throw exception;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violation';
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation violation';
        break;
      case 'P2016':
        status = HttpStatus.BAD_REQUEST;
        message = 'Query interpretation error';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error';
        this.logger.error(`Prisma error: ${exception.code} - ${exception.message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private isPrismaError(exception: any): exception is PrismaClientKnownRequestError {
    return (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof exception.code === 'string' &&
      exception.code.startsWith('P')
    );
  }
}
