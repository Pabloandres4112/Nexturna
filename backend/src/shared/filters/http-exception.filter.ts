import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

type ValidationDetail = {
  field: string;
  errors: string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const normalized = this.normalizeException(exception, status);

    response.status(status).json({
      success: false,
      statusCode: status,
      error: normalized.error,
      message: normalized.message,
      details: normalized.details,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
    });
  }

  private normalizeException(
    exception: unknown,
    status: number,
  ): { error: string; message: string; details: ValidationDetail[] } {
    const defaultError = HttpStatus[status] ?? 'Error';

    if (!(exception instanceof HttpException)) {
      return {
        error: defaultError,
        message: 'Error interno del servidor',
        details: [],
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        error: defaultError,
        message: exceptionResponse,
        details: [],
      };
    }

    const responseObject = exceptionResponse as {
      message?: string | string[];
      error?: string;
      errors?: ValidationDetail[];
    };

    const message = Array.isArray(responseObject.message)
      ? responseObject.message.join(', ')
      : responseObject.message || exception.message || 'Ha ocurrido un error';

    const details = Array.isArray(responseObject.errors)
      ? responseObject.errors
      : Array.isArray(responseObject.message)
        ? [{ field: 'request', errors: responseObject.message }]
        : [];

    return {
      error: responseObject.error || defaultError,
      message,
      details,
    };
  }
}
