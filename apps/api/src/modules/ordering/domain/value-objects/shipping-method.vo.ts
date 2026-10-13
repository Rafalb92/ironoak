import { Money } from '../../../../shared-kernel/domain/value-objects/money.vo';
import { InvalidShippingMethodError } from '../errors/ordering.errors';

export type ShippingMethodCode = 'STANDARD' | 'WHITE_GLOVE';

interface ShippingMethodDefinition {
  name: string;
  description: string;
  estimate: string;
  priceAmount: number; // cents
}

/**
 * Delivery options are a business rule: their prices live on the server, never
 * in the client. Heavy equipment shapes the catalogue — a 128 kg rack is a
 * delivery job, not a parcel.
 */
const DEFINITIONS: Record<ShippingMethodCode, ShippingMethodDefinition> = {
  STANDARD: {
    name: 'Standard delivery',
    description: 'Our own fleet, delivered to your door.',
    estimate: '5–7 business days',
    priceAmount: 0,
  },
  WHITE_GLOVE: {
    name: 'White-glove delivery',
    description:
      'Carried to the room of your choice, assembled, packaging taken away.',
    estimate: '7–10 business days',
    priceAmount: 14900,
  },
};

export class ShippingMethod {
  private constructor(
    public readonly code: ShippingMethodCode,
    private readonly definition: ShippingMethodDefinition,
  ) {}

  static of(code: string): ShippingMethod {
    // hasOwn, not `in`: "toString" must not pass as a shipping method
    if (!Object.hasOwn(DEFINITIONS, code)) {
      throw new InvalidShippingMethodError(code);
    }
    const known = code as ShippingMethodCode;
    return new ShippingMethod(known, DEFINITIONS[known]);
  }

  static all(): ShippingMethod[] {
    return (Object.keys(DEFINITIONS) as ShippingMethodCode[]).map((code) =>
      ShippingMethod.of(code),
    );
  }

  /** Display name for a stored code — tolerant of options retired since the order. */
  static nameOf(code: string): string {
    return Object.hasOwn(DEFINITIONS, code)
      ? DEFINITIONS[code as ShippingMethodCode].name
      : code;
  }

  get name(): string {
    return this.definition.name;
  }

  get description(): string {
    return this.definition.description;
  }

  get estimate(): string {
    return this.definition.estimate;
  }

  get price(): Money {
    return Money.of(this.definition.priceAmount, 'USD');
  }
}
