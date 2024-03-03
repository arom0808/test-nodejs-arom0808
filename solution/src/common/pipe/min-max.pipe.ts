import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

export type MinMaxOptions = { min?: number; max?: number };

@Injectable()
export class MinMaxPipe implements PipeTransform<number, number> {
  constructor(private readonly options: MinMaxOptions) {}

  transform(value: number, metadata: ArgumentMetadata): number {
    if (this.options.min !== undefined && value < this.options.min)
      throw new HttpException(
        `value of ${metadata.type} '${metadata.data}' is lower then ${this.options.min}`,
        HttpStatus.BAD_REQUEST,
      );
    if (this.options.max !== undefined && value > this.options.max)
      throw new HttpException(
        `value of ${metadata.type} '${metadata.data}' is greater then ${this.options.max}`,
        HttpStatus.BAD_REQUEST,
      );
    return value;
  }
}
