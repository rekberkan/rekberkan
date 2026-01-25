import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseUuidPipe implements PipeTransform {
  transform(value: unknown) {
    return value;
  }
}
