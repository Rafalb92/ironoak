import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { CategorySchema } from '../modules/catalog/entities/category.entity';
import { ProductSchema } from '../modules/catalog/entities/product.entity';
import { ProductVariantSchema } from '../modules/catalog/entities/product-variant.entity';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    console.log('CategorySchema:', CategorySchema);
    console.log('ProductSchema:', ProductSchema);
    console.log('ProductVariantSchema:', ProductVariantSchema);
    // --- kategorie ---
    const racks = em.create(CategorySchema, {
      name: 'Racks & Rigs',
      slug: 'racks-rigs',
    });
    const barbells = em.create(CategorySchema, {
      name: 'Barbells',
      slug: 'barbells',
    });
    const plates = em.create(CategorySchema, {
      name: 'Weight Plates',
      slug: 'weight-plates',
    });
    const kettlebells = em.create(CategorySchema, {
      name: 'Kettlebells',
      slug: 'kettlebells',
    });
    const cardio = em.create(CategorySchema, {
      name: 'Wood Series',
      slug: 'wood-series',
    });

    // --- Atlas Rack ---
    const atlas = em.create(ProductSchema, {
      name: 'Atlas Rack',
      slug: 'atlas-rack',
      description:
        'Modułowy rack ze stali konstrukcyjnej i akcentami z litego dębu. Podstawa Twojej domowej siłowni.',
      category: racks,
    });
    em.create(ProductVariantSchema, {
      product: atlas,
      sku: 'ATL-RCK-BLK',
      name: 'Ink Black',
      price: 899900, // 8999,00 zł
      weightGrams: 128000,
      color: 'Black',
      material: 'Steel / Oak',
      finish: 'Powder Coat',
      attributes: { height: '2300mm', gauge: '3mm', boltDiameter: 'M12' },
    });
    em.create(ProductVariantSchema, {
      product: atlas,
      sku: 'ATL-RCK-BRS',
      name: 'Brass Accent',
      price: 949900,
      weightGrams: 129000,
      color: 'Brass',
      material: 'Steel / Oak',
      finish: 'Brushed Brass',
      attributes: { height: '2300mm', gauge: '3mm', boltDiameter: 'M12' },
    });

    // --- Heirloom Barbell ---
    const barbell = em.create(ProductSchema, {
      name: 'Heirloom Barbell',
      slug: 'heirloom-barbell',
      description:
        'Gryf olimpijski kuty ze stali sprężynowej. Radełkowanie IPF, obrotowe tuleje igiełkowe.',
      category: barbells,
    });
    em.create(ProductVariantSchema, {
      product: barbell,
      sku: 'HRL-BAR-20-CER',
      name: '20kg / Cerakote',
      price: 189900,
      weightGrams: 20000,
      color: 'Graphite',
      material: 'Spring Steel',
      finish: 'Cerakote',
      attributes: {
        knurling: 'IPF',
        shaftDiameter: '28mm',
        tensileStrength: '215k PSI',
      },
    });
    em.create(ProductVariantSchema, {
      product: barbell,
      sku: 'HRL-BAR-15-BZN',
      name: '15kg / Black Zinc',
      price: 174900,
      weightGrams: 15000,
      color: 'Black',
      material: 'Spring Steel',
      finish: 'Black Zinc',
      attributes: {
        knurling: 'IWF',
        shaftDiameter: '25mm',
        tensileStrength: '215k PSI',
      },
    });

    // --- Forge Plates ---
    const forge = em.create(ProductSchema, {
      name: 'Forge Plates',
      slug: 'forge-plates',
      description:
        'Kalibrowane talerze żeliwne. Tolerancja ±10g, szlifowana powierzchnia.',
      category: plates,
    });
    for (const [w, price] of [
      [10000, 34900],
      [15000, 49900],
      [20000, 64900],
      [25000, 79900],
    ] as const) {
      em.create(ProductVariantSchema, {
        product: forge,
        sku: `FRG-PLT-${w / 1000}`,
        name: `${w / 1000}kg`,
        price,
        weightGrams: w,
        color: 'Black',
        material: 'Cast Iron',
        finish: 'Enamel',
        attributes: { tolerance: '±10g', diameter: '450mm' },
      });
    }

    // --- Anvil Kettlebell ---
    const anvil = em.create(ProductSchema, {
      name: 'Anvil Kettlebell',
      slug: 'anvil-kettlebell',
      description:
        'Odlewany jednoczęściowo kettlebell z gładkim uchwytem. Bez spawów, bez kompromisów.',
      category: kettlebells,
    });
    for (const [w, price] of [
      [12000, 32900],
      [16000, 39900],
      [24000, 54900],
      [32000, 69900],
    ] as const) {
      em.create(ProductVariantSchema, {
        product: anvil,
        sku: `ANV-KB-${w / 1000}`,
        name: `${w / 1000}kg`,
        price,
        weightGrams: w,
        color: 'Black',
        material: 'Cast Iron',
        finish: 'Powder Coat',
        attributes: { handleDiameter: '35mm', castMethod: 'Single-piece' },
      });
    }

    // --- Solstice Rower ---
    const rower = em.create(ProductSchema, {
      name: 'Solstice Rower',
      slug: 'solstice-rower',
      description:
        'Wioślarz wodny z litego dębu. Opór wody, cisza fal, mebel sam w sobie.',
      category: cardio,
    });
    em.create(ProductVariantSchema, {
      product: rower,
      sku: 'SOL-ROW-OAK',
      name: 'Solid Oak',
      price: 1249900,
      weightGrams: 35000,
      color: 'Natural Oak',
      material: 'Solid Oak',
      finish: 'Natural Oil',
      attributes: { resistance: 'Water', tankCapacity: '17L', foldable: true },
    });
    em.create(ProductVariantSchema, {
      product: rower,
      sku: 'SOL-ROW-WAL',
      name: 'Walnut',
      price: 1349900,
      weightGrams: 35500,
      color: 'Walnut',
      material: 'Solid Walnut',
      finish: 'Natural Oil',
      attributes: { resistance: 'Water', tankCapacity: '17L', foldable: true },
    });

    await em.flush();
  }
}
