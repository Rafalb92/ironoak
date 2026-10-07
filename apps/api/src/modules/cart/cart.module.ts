import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CartController } from './cart.controller';
import { CartPreviewController } from './cart-preview.controller';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Module({
  imports: [CatalogModule],
  controllers: [CartController, CartPreviewController],
  providers: [CartService, JwtAuthGuard],
  exports: [CartService], // used at checkout
})
export class CartModule {}
