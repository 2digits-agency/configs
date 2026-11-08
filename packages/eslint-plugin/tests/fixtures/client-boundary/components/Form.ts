'use client';

export const ErrorMessage = { required: 'zod.custom.required' };

export interface FormProps {
  readonly name: string;
}

export function Form(props: FormProps) {
  return props.name;
}
