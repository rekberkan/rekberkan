import { Logger } from '@nestjs/common';
export class AppLogger extends Logger {
  constructor(context: string = 'App') {
    super(context);
  }
}
