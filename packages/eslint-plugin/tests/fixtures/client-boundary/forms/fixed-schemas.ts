import type { FormProps } from '@/components/Form';
import { ErrorMessage } from '@/constants/interfaces';

export const validationSchema = { message: ErrorMessage.required };

export type Props = FormProps;
