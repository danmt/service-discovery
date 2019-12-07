import { EventEmitter } from 'events';

export interface HeartBeatConfig {
  maxIdleTimeInSeconds: number;
  beatStepInSeconds: number;
  explain: boolean;
}

export class HeartBeat {
  private readonly channel = new EventEmitter();
  private readonly explain: boolean;
  private readonly maxIdleTimeInSeconds: number;
  private readonly beatStepInSeconds: number;
  private lastCallTimestamp = Date.now();

  constructor(
    private readonly serviceName: string,
    config: Partial<HeartBeatConfig> = {}
  ) {
    this.explain = config.explain || false;
    this.maxIdleTimeInSeconds = config.maxIdleTimeInSeconds || 10;
    this.beatStepInSeconds = config.beatStepInSeconds || 1;
  }

  init() {
    setInterval(() => {
      if (this.explain) {
        console.log(`${this.serviceName} Beating...`);
        console.log(
          'Time passed since last request: ',
          (Date.now() - this.lastCallTimestamp) / 1000,
          'seconds'
        );
      }
      const idleSeconds = (Date.now() - this.lastCallTimestamp) / 1000;
      if (idleSeconds > this.maxIdleTimeInSeconds) {
        if (this.explain) {
          console.log(`${this.serviceName} has exitted`);
        }
        process.exit();
      }
    }, this.beatStepInSeconds * 1000);

    this.channel.on('request-arrived', () => {
      this.lastCallTimestamp = Date.now();
    });
  }

  requestArrived() {
    if (this.explain) {
      console.log(`New request arrived...`);
    }
    this.channel.emit('request-arrived');
  }
}
