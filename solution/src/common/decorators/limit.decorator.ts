import { DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { MinMaxPipe } from '../pipe/min-max.pipe';

export const PaginationLimit = () =>
  Query(
    'limit',
    new DefaultValuePipe(5),
    ParseIntPipe,
    new MinMaxPipe({ min: 0, max: 50 }),
  );

export const PaginationOffset = () =>
  Query(
    'offset',
    new DefaultValuePipe(0),
    ParseIntPipe,
    new MinMaxPipe({ min: 0 }),
  );
