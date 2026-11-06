import { Injectable } from '@nestjs/common';

@Injectable()
/** Provides application-wide values used by the root controller. */
export class AppService {
  /** Returns the default greeting exposed at the API root. */
  getHello(): string {
    return 'Hello World!';
  }
}
