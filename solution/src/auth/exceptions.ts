import { HttpException, HttpStatus } from '@nestjs/common';

export class NoCountryWasFoundException extends HttpException {
  constructor(countryCode: string) {
    super(
      `No country with alpha2 code '${countryCode}' was found`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EqualUniqueFieldException extends HttpException {
  constructor(field: unknown) {
    super(`This ${field} is the same as the existing one`, HttpStatus.CONFLICT);
  }
}

export class WrongLoginOrPasswordException extends HttpException {
  constructor() {
    super('Wrong username or password!', HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidJWTFormatException extends Error {}
