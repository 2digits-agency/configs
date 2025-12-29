import type { Meta, StoryObj } from '@storybook/nextjs';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}

 
const meta: Meta<typeof Button> = {
  component: Button,
  args: {
    label: 'Click me',
    onClick: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
