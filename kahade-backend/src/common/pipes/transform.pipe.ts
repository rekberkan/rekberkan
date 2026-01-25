import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TransformPipe implements PipeTransform {
  transform(value: unknown) {
    return value;
  }
}
