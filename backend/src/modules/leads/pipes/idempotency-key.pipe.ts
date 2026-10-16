import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

@Injectable()
export class IdempotencyKeyPipe implements PipeTransform<string | undefined, string> {
  transform(value: string | undefined): string {
    const idempotencyKey = value?.trim();
    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new BadRequestException('Idempotency-Key must contain between 1 and 255 characters.');
    }

    return idempotencyKey;
  }
}
