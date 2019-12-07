import { EventEmitter } from 'events';
import { ChildProcess, fork } from 'child_process';
import { Observable, Observer } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

export interface Service {
  name: string;
  instance: ChildProcess;
  port?: number;
}

export const getService = (
  services: { [serviceName: string]: Service },
  serviceName: string,
  channel: EventEmitter
) => {
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

    channel.emit('service-started', service);

    service.instance.on('exit', () => {
      console.log(`${serviceName} has been cleared from gateway`);
      channel.emit('service-exitted', serviceName);
    });

    observer.next(service);
    observer.complete();
  });
};

export const getServicePort = (service: Service, channel: EventEmitter) => {
  return new Observable((observer: Observer<number>) => {
    if (service.port) {
      observer.next(service.port);
      observer.complete();
      return;
    }

    service.instance.on('message', ({ port }) => {
      channel.emit('add-port', service.name, port);
      observer.next(port);
      observer.complete();
    });
  });
};

export const getUrl = (
  hostName: string,
  port: number,
  url: string,
  ssl = false
) => {
  const urlAsArray = url.split('/');
  urlAsArray.splice(0, 2);
  const request = urlAsArray.join('/');
  const protocol = ssl ? 'https' : 'http';
  return `${protocol}://${hostName}:${port}/${request}`;
};

export const getServiceUrl = (
  services: { [serviceName: string]: Service },
  serviceName: string,
  originalUrl: string,
  channel: EventEmitter
) => {
  return getService(services, serviceName, channel).pipe(
    mergeMap((service: Service) => getServicePort(service, channel)),
    map((port: number) => getUrl('localhost', port, originalUrl))
  );
};
