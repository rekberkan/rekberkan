import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseBigintPipe implements PipeTransform {
  transform(value: unknown) {
    return value;
  }
}
