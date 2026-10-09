import type { TypedSchema } from 'vee-validate';
import type { z } from 'zod';

/**
 * vee-validate path format: "email", "lines[0].quantity".
 * zod gives segments: ["lines", 0, "quantity"].
 */
function toFieldPath(segments: readonly PropertyKey[]): string {
  return segments.reduce<string>((path, segment) => {
    if (typeof segment === 'number') return `${path}[${segment}]`;
    return path ? `${path}.${String(segment)}` : String(segment);
  }, '');
}

/**
 * Adapts a contract zod schema (v4) to vee-validate's TypedSchema — the same
 * shape @vee-validate/zod produces, without depending on its zod version.
 * Validation never throws: failures come back as per-field messages.
 */
export function toFormSchema<TSchema extends z.ZodType>(
  schema: TSchema,
): TypedSchema<z.input<TSchema>, z.output<TSchema>> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values);
      if (result.success) {
        return { value: result.data, errors: [] };
      }

      const messagesByPath = new Map<string, string[]>();
      for (const issue of result.error.issues) {
        const path = toFieldPath(issue.path);
        messagesByPath.set(path, [...(messagesByPath.get(path) ?? []), issue.message]);
      }

      return {
        errors: [...messagesByPath].map(([path, errors]) => ({ path, errors })),
      };
    },
  };
}
