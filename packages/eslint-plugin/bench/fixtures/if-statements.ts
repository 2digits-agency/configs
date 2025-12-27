interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: 'admin' | 'user' | 'guest';
  permissions: Array<string>;
  metadata?: Record<string, unknown>;
}

interface ApiResponse<TData> {
  data: TData;
  status: number;
  message: string;
}

function validateUser(user: User | null): boolean {
  if (!user) return false;

  if (user.isActive)
    return true;

  if (user.role === 'admin') return true;

  if (user.permissions.length > 0)
    return user.permissions.includes('read');

  return false;
}

function processUserPermissions(user: User): Array<string> {
  const result: Array<string> = [];

  if (user.role === 'admin') {
    result.push('all');
  } else if (user.role === 'user') {
    result.push('read', 'write');
  } else {
    result.push('read');
  }

  if (user.isActive)
    result.push('active');
  else
    result.push('inactive');

  for (const permission of user.permissions) {
    if (permission.startsWith('custom:'))
      result.push(permission);
  }

  return result;
}

function handleApiResponse<TData>(response: ApiResponse<TData>): TData | null {
  if (response.status >= 200 && response.status < 300)
    return response.data;

  if (response.status === 401) throw new Error('Unauthorized');
  if (response.status === 403) throw new Error('Forbidden');
  if (response.status === 404) return null;

  if (response.status >= 500) {
    console.error('Server error:', response.message);
    throw new Error('Server error');
  }

  return null;
}

function getUserDisplayName(user: User): string {
  if (user.metadata?.displayName)
    return String(user.metadata.displayName);

  if (user.name) return user.name;

  if (user.email)
    return user.email.split('@')[0] ?? 'unknown';

  return 'Anonymous';
}

class UserService {
  private users: Map<string, User> = new Map();

  addUser(user: User): void {
    if (this.users.has(user.id))
      throw new Error('User already exists');

    if (!user.email.includes('@'))
      throw new Error('Invalid email');

    this.users.set(user.id, user);
  }

  getUser(id: string): User | undefined {
    if (!id) return undefined;

    return this.users.get(id);
  }

  updateUser(id: string, updates: Partial<User>): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    if (updates.email && !updates.email.includes('@'))
      return false;

    if (updates.role)
      user.role = updates.role;

    if (updates.isActive !== undefined)
      user.isActive = updates.isActive;

    if (updates.permissions)
      user.permissions = updates.permissions;

    return true;
  }

  deleteUser(id: string): boolean {
    if (!this.users.has(id)) return false;

    return this.users.delete(id);
  }

  findActiveUsers(): Array<User> {
    const result: Array<User> = [];

    for (const user of this.users.values()) {
      if (user.isActive)
        result.push(user);
    }

    return result;
  }

  findUsersByRole(role: User['role']): Array<User> {
    const result: Array<User> = [];

    for (const user of this.users.values()) {
      if (user.role === role) result.push(user);
    }

    return result;
  }
}

export {
  type ApiResponse,
  type User,
  UserService,
  getUserDisplayName,
  handleApiResponse,
  processUserPermissions,
  validateUser,
};
