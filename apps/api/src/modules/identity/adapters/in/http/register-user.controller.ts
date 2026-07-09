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
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user/register-user.use-case';
import { RegisterUserCommand } from '../../../application/use-cases/register-user/register-user.command';

@Controller('auth')
export class RegisterUserController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  async register(@Body() dto: RegisterUserDto): Promise<{ userId: string }> {
    return this.registerUser.execute(
      new RegisterUserCommand(dto.email, dto.password),
    );
  }
}
