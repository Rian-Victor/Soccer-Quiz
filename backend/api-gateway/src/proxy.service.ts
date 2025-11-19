import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly authServiceUrl: string;
  private readonly userServiceUrl: string;
  private readonly quizServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
    this.userServiceUrl =
      process.env.USER_SERVICE_URL || 'http://user-service:3000';
    this.quizServiceUrl =
      process.env.QUIZ_SERVICE_URL || 'http://quiz-service:3000';
  }

  async proxyRequest(
    service: 'auth' | 'user' | 'quiz',
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
  ) {
    const baseUrl = this.getBaseUrl(service);
    const url = `${baseUrl}${path}`;

    this.logger.log(`Proxying ${method} ${url}`);

    const config: any = {
      method: method.toLowerCase(),
      url,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = body;
    }

    try {
      const response = await firstValueFrom(this.httpService.request(config));

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        this.logger.error(`Error proxying to ${url}: ${error.message}`);
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        };
      }
      this.logger.error(
        `Unexpected error proxying to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private getBaseUrl(service: 'auth' | 'user' | 'quiz'): string {
    switch (service) {
      case 'auth':
        return this.authServiceUrl;
      case 'user':
        return this.userServiceUrl;
      case 'quiz':
        return this.quizServiceUrl;
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
}
