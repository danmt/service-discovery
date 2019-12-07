import { Message } from '@my-org/api-interfaces';
import {
  Controller,
  Get,
  HttpService,
  Param,
  Req,
  HttpException
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { fork, ChildProcess } from 'child_process';
import { Observable, Observer, throwError } from 'rxjs';
import { map, mergeMap, tap, catchError } from 'rxjs/operators';

interface Service {
  name: string;
  instance: ChildProcess;
  port?: number;
}

const AVAILABLE_SERVICES = ['service-a', 'service-b'];
@Controller()
export class AppController {
  services: { [serviceName: string]: Service } = {};

  constructor(private readonly httpService: HttpService) {}

  @Get(':serviceName/*')
  getData(
    @Req() req: Request,
    @Param() { serviceName }: { serviceName: string }
  ): Observable<AxiosResponse<Message>> {
    if (AVAILABLE_SERVICES.indexOf(serviceName) === -1) {
      throw new HttpException('Service doesnt exist', 404);
    }

    return this.getService(this.services, serviceName).pipe(
      tap((service: Service) => {
        if (!this.services[serviceName]) {
          this.services[serviceName] = service;
        }
      }),
      mergeMap((service: Service) => this.getServicePort(service)),
      tap((port: number) => (this.services[serviceName].port = port)),
      map((port: number) => this.getUrl('localhost', port, req.url)),
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

  private getService(
    services: { [serviceName: string]: Service },
    serviceName: string
  ) {
    return new Observable((observer: Observer<Service>) => {
      if (services[serviceName]) {
        observer.next(services[serviceName]);
        observer.complete();
        return;
      }

      const service = {
        name: serviceName,
        instance: fork(`dist/apps/${serviceName}/main`)
      };

      service.instance.on('exit', () => {
        console.log(`${serviceName} has been cleared from gateway`);
        delete this.services[serviceName];
      });

      observer.next(service);
      observer.complete();
    });
  }

  private getServicePort(service: Service) {
    return new Observable((observer: Observer<number>) => {
      if (service.port) {
        observer.next(service.port);
        observer.complete();
        return;
      }

      service.instance.on('message', ({ port }) => {
        observer.next(port);
        observer.complete();
      });
    });
  }

  private getUrl(hostName: string, port: number, url: string, ssl = false) {
    const urlAsArray = url.split('/');
    urlAsArray.splice(0, 2);
    const request = urlAsArray.join('/');
    const protocol = ssl ? 'https' : 'http';
    return `${protocol}://${hostName}:${port}/${request}`;
  }
}
