import { ComposedMessage, Message } from '@my-org/api-interfaces';
import {
  getOriginalUrl,
  getServiceUrl,
  Service
} from '@my-org/service-manager';
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
import { Observable, throwError, zip } from 'rxjs';
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

  @Get('composed')
  getComposedData(): Observable<{
    [serviceName: string]: AxiosResponse<ComposedMessage>;
  }> {
    return zip(
      getServiceUrl(this.services, 'service-a', 'hello', this.channel).pipe(
        mergeMap((url: string) =>
          this.httpService.get(url).pipe(map(res => res.data.message))
        )
      ),
      getServiceUrl(this.services, 'service-b', 'hello', this.channel).pipe(
        mergeMap((url: string) =>
          this.httpService.get(url).pipe(map(res => res.data.message))
        )
      )
    ).pipe(map(([serviceAUrl, serviceBUrl]) => ({ serviceAUrl, serviceBUrl })));
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
      getOriginalUrl(req.url),
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
