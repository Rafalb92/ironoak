import {
  type CanActivate,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Simulation marks orders as paid without any payment. It must be opted into
 * explicitly — NODE_ENV is often unset in real deployments, so "not production"
 * is not a safe default. Disabled → 404, so the endpoint's existence is not revealed.
 */
@Injectable()
export class PaymentSimulationEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>('PAYMENT_SIMULATION_ENABLED') !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
