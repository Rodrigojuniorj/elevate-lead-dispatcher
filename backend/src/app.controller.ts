import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './common/dto/health-response.dto.js';
import { Public } from './common/auth/decorators/public.decorator.js';

@ApiTags('Health')
@Controller('api')
export class AppController {
  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({ type: HealthResponseDto })
  @Public()
  @Get('health')
  health(): HealthResponseDto {
    return {
      status: 'ok' as const,
      service: 'elevate-lead-dispatcher-api',
    };
  }
}
