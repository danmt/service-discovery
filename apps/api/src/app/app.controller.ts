import { Message } from '@my-org/api-interfaces';
import { Controller, Get, HttpService, Param } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { fork, ChildProcess } from 'child_process';
import { Observable, Observer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

interface Service {
  name: string;
  instance: ChildProcess;
  port?: number;
}
@Controller()
export class AppController {
  services: { [serviceName: string]: Service } = {};

  constructor(private readonly httpService: HttpService) {}

  @Get(':serviceName')
  getData(@Param() { serviceName }: { serviceName: string }): Observable<
    AxiosResponse<Message>
  > {
    return this.getService(this.services, serviceName).pipe(
      tap((service: Service) => {
        if (!this.services[serviceName]) {
          this.services[serviceName] = service;
        }
      }),
      mergeMap((service: Service) => this.getServicePort(service)),
      tap((port: number) => (this.services[serviceName].port = port)),
      mergeMap((port: number) =>
        this.httpService
          .get(`http://localhost:${port}/api`)
          .pipe(map(res => res.data))
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
}
