import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator.js';
import { Public } from '../../common/auth/decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthenticatedUserDto } from './dto/authenticated-user.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface.js';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto.js';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credentials are invalid or the user is inactive.', type: HttpErrorResponseDto })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts.', type: HttpErrorResponseDto })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AuthenticatedUserDto })
  @ApiUnauthorizedResponse({ description: 'Bearer token is missing, invalid, expired, or belongs to an inactive user.', type: HttpErrorResponseDto })
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUserDto> {
    return this.authService.me(user);
  }
}
