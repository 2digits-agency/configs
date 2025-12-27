'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'search';
  error?: string;
  disabled?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption>;
  placeholder?: string;
  disabled?: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

function Button({ children, onClick, disabled, loading, variant = 'primary', size = 'md' }: ButtonProps) {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
    ghost: 'bg-transparent text-gray-600',
  };

  return (
    <button
      className={`${sizeClasses[size]} ${variantClasses[variant]}`}
      disabled={disabled || loading}
      onClick={handleClick}
      type="button"
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = 'text', error, disabled }: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <input
        className={error ? 'border-red-500' : 'border-gray-300'}
        disabled={disabled}
        onChange={handleChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <span className="text-red-500 text-sm">{error}</span> : null}
    </div>
  );
}

function Select({ value, onChange, options, placeholder, disabled }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select disabled={disabled} onChange={handleChange} value={value}>
      {placeholder ? (
        <option disabled value="">
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50" onClick={handleBackdropClick} ref={modalRef}>
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button onClick={onClose} variant="ghost">
            ×
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Array<Todo>>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Todo['priority']>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const stats = useMemo(
    () => ({
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
    }),
    [todos],
  );

  const handleAddTodo = useCallback(() => {
    if (!newTodoTitle.trim()) {
      return;
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: newTodoTitle,
      completed: false,
      priority: newTodoPriority,
    };

    startTransition(() => {
      setTodos((prev) => [...prev, newTodo]);
    });

    setNewTodoTitle('');
    inputRef.current?.focus();
  }, [newTodoTitle, newTodoPriority]);

  const handleToggleTodo = useCallback((id: string) => {
    startTransition(() => {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
    });
  }, []);

  const handleDeleteTodo = useCallback((id: string) => {
    startTransition(() => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    });
  }, []);

  const handleEditTodo = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTodo) {
      return;
    }

    startTransition(() => {
      setTodos((prev) => prev.map((todo) => (todo.id === editingTodo.id ? editingTodo : todo)));
    });

    setIsModalOpen(false);
    setEditingTodo(null);
  }, [editingTodo]);

  const handleClearCompleted = useCallback(() => {
    startTransition(() => {
      setTodos((prev) => prev.filter((todo) => !todo.completed));
    });
  }, []);

  const priorityOptions: Array<SelectOption> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Todo App</h1>
        <p className="text-gray-600">Welcome, {currentUser.name}</p>
      </header>

      <div className="flex gap-2 mb-4">
        <Input onChange={setNewTodoTitle} placeholder="Add a new todo..." value={newTodoTitle} />
        <Select
          onChange={(v) => setNewTodoPriority(v as Todo['priority'])}
          options={priorityOptions}
          value={newTodoPriority}
        />
        <Button disabled={isPending} loading={isPending} onClick={handleAddTodo}>
          Add
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'primary' : 'ghost'}>
          All ({stats.total})
        </Button>
        <Button onClick={() => setFilter('active')} variant={filter === 'active' ? 'primary' : 'ghost'}>
          Active ({stats.active})
        </Button>
        <Button onClick={() => setFilter('completed')} variant={filter === 'completed' ? 'primary' : 'ghost'}>
          Completed ({stats.completed})
        </Button>
        {stats.completed > 0 ? (
          <Button onClick={handleClearCompleted} variant="danger">
            Clear Completed
          </Button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {filteredTodos.map((todo) => (
          <li className="flex items-center gap-2 p-2 border rounded" key={todo.id}>
            <input checked={todo.completed} onChange={() => handleToggleTodo(todo.id)} type="checkbox" />
            <span className={todo.completed ? 'line-through text-gray-400' : ''}>{todo.title}</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-100">{todo.priority}</span>
            <div className="ml-auto flex gap-1">
              <Button onClick={() => handleEditTodo(todo)} size="sm" variant="ghost">
                Edit
              </Button>
              <Button onClick={() => handleDeleteTodo(todo.id)} size="sm" variant="danger">
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Todo">
        {editingTodo ? (
          <div className="space-y-4">
            <Input
              onChange={(value) => setEditingTodo({ ...editingTodo, title: value })}
              placeholder="Todo title"
              value={editingTodo.title}
            />
            <Select
              onChange={(value) => setEditingTodo({ ...editingTodo, priority: value as Todo['priority'] })}
              options={priorityOptions}
              value={editingTodo.priority}
            />
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setIsModalOpen(false)} variant="ghost">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
