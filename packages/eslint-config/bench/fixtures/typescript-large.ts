interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: 'admin' | 'user' | 'guest';
  permissions: Array<string>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  tags: Array<string>;
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: Date;
}

interface ApiResponse<TData> {
  data: TData;
  status: number;
  message: string;
  timestamp: Date;
}

interface PaginatedResponse<TItem> {
  items: Array<TItem>;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

type Result<TData, TError> = { success: true; data: TData } | { success: false; error: TError };

type AsyncResult<TData, TError> = Promise<Result<TData, TError>>;

interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(options?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<TEntity>>;
  save(entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TEntity>;
  update(id: TId, updates: Partial<TEntity>): Promise<TEntity | null>;
  delete(id: TId): Promise<boolean>;
}

interface Cache<TKey, TValue> {
  get(key: TKey): TValue | undefined;
  set(key: TKey, value: TValue, ttl?: number): void;
  has(key: TKey): boolean;
  delete(key: TKey): boolean;
  clear(): void;
  size(): number;
}

class InMemoryCache<TKey, TValue> implements Cache<TKey, TValue> {
  private store = new Map<TKey, { value: TValue; expiresAt?: number }>();

  get(key: TKey): TValue | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);

      return undefined;
    }

    return entry.value;
  }

  set(key: TKey, value: TValue, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : undefined;

    this.store.set(key, { value, expiresAt });
  }

  has(key: TKey): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: TKey): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

class UserRepository implements Repository<User, string> {
  private users = new Map<string, User>();
  private cache = new InMemoryCache<string, User>();

  async findById(id: string): Promise<User | null> {
    const cached = this.cache.get(id);

    if (cached) {
      return cached;
    }

    const user = this.users.get(id) ?? null;

    if (user) {
      this.cache.set(id, user, 60000);
    }

    return user;
  }

  async findAll(options?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<User>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const allUsers = Array.from(this.users.values());
    const start = (page - 1) * pageSize;
    const items = allUsers.slice(start, start + pageSize);

    return {
      items,
      total: allUsers.length,
      page,
      pageSize,
      hasMore: start + pageSize < allUsers.length,
    };
  }

  async save(entity: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = {
      ...entity,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    this.cache.set(user.id, user, 60000);

    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);

    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    this.cache.set(id, updatedUser, 60000);

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    this.cache.delete(id);

    return this.users.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
  }

  async findActiveUsers(): Promise<Array<User>> {
    const result: Array<User> = [];

    for (const user of this.users.values()) {
      if (user.isActive) {
        result.push(user);
      }
    }

    return result;
  }

  async findByRole(role: User['role']): Promise<Array<User>> {
    const result: Array<User> = [];

    for (const user of this.users.values()) {
      if (user.role === role) {
        result.push(user);
      }
    }

    return result;
  }
}

class PostService {
  private postRepository: Repository<Post, string>;
  private userRepository: Repository<User, string>;

  constructor(postRepository: Repository<Post, string>, userRepository: Repository<User, string>) {
    this.postRepository = postRepository;
    this.userRepository = userRepository;
  }

  async createPost(
    authorId: string,
    data: { title: string; content: string; tags?: Array<string> },
  ): AsyncResult<Post, Error> {
    const author = await this.userRepository.findById(authorId);

    if (!author) {
      return { success: false, error: new Error('Author not found') };
    }

    if (!author.isActive) {
      return { success: false, error: new Error('Author is not active') };
    }

    const post = await this.postRepository.save({
      title: data.title,
      content: data.content,
      authorId,
      tags: data.tags ?? [],
      published: false,
      views: 0,
    });

    return { success: true, data: post };
  }

  async publishPost(postId: string, userId: string): AsyncResult<Post, Error> {
    const post = await this.postRepository.findById(postId);

    if (!post) {
      return { success: false, error: new Error('Post not found') };
    }

    if (post.authorId !== userId) {
      return { success: false, error: new Error('Not authorized') };
    }

    const updatedPost = await this.postRepository.update(postId, { published: true });

    if (!updatedPost) {
      return { success: false, error: new Error('Failed to update post') };
    }

    return { success: true, data: updatedPost };
  }

  async incrementViews(postId: string): AsyncResult<Post, Error> {
    const post = await this.postRepository.findById(postId);

    if (!post) {
      return { success: false, error: new Error('Post not found') };
    }

    const updatedPost = await this.postRepository.update(postId, { views: post.views + 1 });

    if (!updatedPost) {
      return { success: false, error: new Error('Failed to update views') };
    }

    return { success: true, data: updatedPost };
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; errors: Array<string> } {
  const errors: Array<string> = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function debounce<TArgs extends Array<unknown>>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

function throttle<TArgs extends Array<unknown>>(
  fn: (...args: TArgs) => void,
  limit: number,
): (...args: TArgs) => void {
  let lastCall = 0;

  return (...args: TArgs) => {
    const now = Date.now();

    if (now - lastCall >= limit) {
      fn(...args);
      lastCall = now;
    }
  };
}

export type {
  ApiResponse,
  AsyncResult,
  Cache,
  Comment,
  PaginatedResponse,
  Post,
  Repository,
  Result,
  User,
};

export {
  InMemoryCache,
  PostService,
  UserRepository,
  debounce,
  formatDate,
  throttle,
  validateEmail,
  validatePassword,
};
