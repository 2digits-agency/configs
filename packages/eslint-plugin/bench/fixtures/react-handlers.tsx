import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface FormData {
  username: string;
  email: string;
  password: string;
}

interface ListItem {
  id: string;
  title: string;
  completed: boolean;
}

export function Button({ children, onClick, disabled, variant = 'primary' }: ButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <button disabled={disabled} onClick={handleClick} type="button">
      {variant}: {children}
    </button>
  );
}

export function FormComponent() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, username: e.target.value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, password: e.target.value }));
  };

  const validateForm = useCallback(() => {
    const newErrors: Partial<FormData> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleUsernameChange} placeholder="Username" type="text" value={formData.username} />
      {errors.username && <span>{errors.username}</span>}

      <input onChange={handleEmailChange} placeholder="Email" type="email" value={formData.email} />
      {errors.email && <span>{errors.email}</span>}

      <input onChange={handlePasswordChange} placeholder="Password" type="password" value={formData.password} />
      {errors.password && <span>{errors.password}</span>}

      <Button disabled={isSubmitting} onClick={() => handleSubmit}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}

export function ListComponent() {
  const [items, setItems] = useState<Array<ListItem>>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const completedCount = useMemo(() => items.filter((item) => item.completed).length, [items]);

  const handleAddItem = () => {
    if (!newItemTitle.trim()) {
      return;
    }

    const newItem: ListItem = {
      id: crypto.randomUUID(),
      title: newItemTitle,
      completed: false,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemTitle('');
  };

  const handleToggleItem = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItemTitle(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  return (
    <div>
      <div>
        <input
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add new item"
          ref={inputRef}
          type="text"
          value={newItemTitle}
        />
        <Button onClick={handleAddItem}>Add</Button>
      </div>

      <p>
        Completed: {completedCount} / {items.length}
      </p>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <input checked={item.completed} onChange={() => handleToggleItem(item.id)} type="checkbox" />
            <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</span>
            <Button onClick={() => handleDeleteItem(item.id)} variant="danger">
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
