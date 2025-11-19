import {
  Controller,
  All,
  Req,
  Body,
  Param,
  Query,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class GatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('auth/:path(*)')
  async proxyAuth(
    @Req() req: Request,
    @Param('path') path: string,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.handleProxy('auth', req, path, body, query, headers);
  }

  @All('users/:path(*)')
  async proxyUsers(
    @Req() req: Request,
    @Param('path') path: string,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.handleProxy('user', req, path, body, query, headers);
  }

  @All('quiz/:path(*)')
  async proxyQuiz(
    @Req() req: Request,
    @Param('path') path: string,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.handleProxy('quiz', req, path, body, query, headers);
  }

  @All('user/:path(*)')
  async proxyUser(
    @Req() req: Request,
    @Param('path') path: string,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.handleProxy('user', req, path, body, query, headers);
  }

  private async handleProxy(
    service: 'auth' | 'user' | 'quiz',
    req: Request,
    path: string,
    body: any,
    query: any,
    headers: Record<string, string>,
  ) {
    try {
      // Construir o path completo com query params
      let fullPath = `/${path || ''}`;
      const queryString = new URLSearchParams(query).toString();
      if (queryString) {
        fullPath += `?${queryString}`;
      }

      // Filtrar headers relevantes (excluir host e outras informações sensíveis do gateway)
      const proxyHeaders: Record<string, string> = {};
      const headerKeysToForward = [
        'authorization',
        'content-type',
        'accept',
        'x-requested-with',
        'user-agent',
      ];

      Object.keys(headers).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (headerKeysToForward.includes(lowerKey)) {
          proxyHeaders[key] = headers[key];
        }
      });

      const result = await this.proxyService.proxyRequest(
        service,
        fullPath,
        req.method,
        body,
        proxyHeaders,
      );

      // Se houver erro no status, lançar exceção
      if (result.status >= 400) {
        throw new HttpException(
          {
            statusCode: result.status,
            message: result.data?.message || 'Error from microservice',
            error: result.data?.error || 'Unknown error',
          },
          result.status,
        );
      }

      // Retornar resposta do microsserviço
      return result.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error proxying request to microservice',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
