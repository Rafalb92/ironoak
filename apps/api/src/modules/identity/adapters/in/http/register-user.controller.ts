import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common';
import {
  registerUserSchema,
  type RegisterUserDto,
} from './dto/register-user.schema';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user/register-user.use-case';
import { RegisterUserCommand } from '../../../application/use-cases/register-user/register-user.command';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class RegisterUserController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 8, example: 'supersecret123' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Account created',
    schema: {
      type: 'object',
      properties: { userId: { type: 'string', format: 'uuid' } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or password too short',
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() dto: RegisterUserDto): Promise<{ userId: string }> {
    return this.registerUser.execute(
      new RegisterUserCommand(dto.email, dto.password),
    );
  }
}
