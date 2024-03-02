import {
  ArgumentMetadata,
  Injectable,
  ParseEnumPipe,
  PipeTransform,
} from '@nestjs/common';
import { RegionEnum } from '../regions-enum.type';

@Injectable()
export class RegionsPipe
  implements PipeTransform<string[], Promise<RegionEnum[]>>
{
  private enumPipe = new ParseEnumPipe(RegionEnum);

  transform(value: any[], metadata: ArgumentMetadata) {
    return Promise.all(
      value.map((el) => this.enumPipe.transform(el, metadata)),
    ) as Promise<any[]> as Promise<RegionEnum[]>;
  }
}
