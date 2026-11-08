import { ErrorMessage } from '@/components/Form';

export const validationSchema = { message: ErrorMessage.required };

export interface SchemaProps {
  readonly name: string;
}
