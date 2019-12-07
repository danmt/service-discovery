import { Message } from '@my-org/api-interfaces';
import { Controller, Get, HttpService, Param } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { fork } from 'child_process';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

@Controller()
export class AppController {
  services: any = {};

  constructor(private readonly httpService: HttpService) {}

  @Get(':service')
  getData(@Param() { service }: { service: string }): Observable<
    AxiosResponse<Message>
  > {
    return this.getServicePort(this.services, service).pipe(
      tap(port => (this.services[service] = port)),
      mergeMap(port =>
        this.httpService
          .get(`http://localhost:${port}/api`)
          .pipe(map(res => res.data))
      )
    );
  }

  private getServicePort(services: any, service: string) {
    return new Observable(observer => {
      if (services[service]) {
        observer.next(services[service]);
        observer.complete();
        return;
      }

      const serviceInstance = fork(`dist/apps/${service}/main`);
      serviceInstance.on('message', ({ port }) => {
        observer.next(port);
        observer.complete();
      });
    });
  }
}
