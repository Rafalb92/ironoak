import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Module({
  imports: [CatalogModule],
  controllers: [CartController],
  providers: [CartService, JwtAuthGuard],
  exports: [CartService], // przyda się przy checkoucie
})
export class CartModule {}
