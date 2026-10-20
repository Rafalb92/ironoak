import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AdminOrderEmail } from '@ironoak/contracts';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../shared/guards/roles.guard';
import { Roles } from '../../../../../shared/decorators/roles.decorator';
import { SentEmailQueryService } from '../../../application/services/sent-email-query.service';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrderEmailsController {
  constructor(private readonly emails: SentEmailQueryService) {}

  @Get(':orderId/emails')
  @ApiOperation({
    summary: 'Emails sent for an order',
    description:
      'Every attempt from the notifications log, oldest first, with failures and their errors.',
  })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  list(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<AdminOrderEmail[]> {
    return this.emails.forOrder(orderId);
  }
}
