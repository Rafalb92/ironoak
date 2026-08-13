import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { OrderingModule } from '../ordering/ordering.module';

@Module({
  imports: [CatalogModule, OrderingModule],
  controllers: [CartController],
  providers: [CartService, JwtAuthGuard],
  exports: [CartService], // przyda się przy checkoucie
})
export class CartModule {}
