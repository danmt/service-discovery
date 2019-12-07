import { Message } from '@my-org/api-interfaces';
import { getServiceUrl, Service } from '@my-org/service-manager';
import {
  Controller,
  Get,
  HttpException,
  HttpService,
  OnModuleInit,
  Param,
  Req
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { EventEmitter } from 'events';
import { Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

const AVAILABLE_SERVICES = ['service-a', 'service-b'];
@Controller()
export class AppController implements OnModuleInit {
  services: { [serviceName: string]: Service } = {};
  channel = new EventEmitter();

  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    this.channel.on('service-started', (service: Service) => {
      this.services[service.name] = service;
    });

    this.channel.on('service-exitted', (serviceName: string) => {
      delete this.services[serviceName];
    });

    this.channel.on('add-port', (serviceName: string, port: number) => {
      this.services[serviceName].port = port;
    });
  }

  @Get(':serviceName/*')
  getData(
    @Req() req: Request,
    @Param() { serviceName }: { serviceName: string }
  ): Observable<AxiosResponse<Message>> {
    if (AVAILABLE_SERVICES.indexOf(serviceName) === -1) {
      throw new HttpException('Service doesnt exist', 404);
    }

    return getServiceUrl(
      this.services,
      serviceName,
      req.url,
      this.channel
    ).pipe(
      mergeMap((url: string) =>
        this.httpService.get(url).pipe(
          map(res => res.data),
          catchError(e =>
            throwError(new HttpException(e.response.data, e.response.status))
          )
        )
      )
    );
  }
}
