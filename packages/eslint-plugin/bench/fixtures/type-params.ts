type Identity<T> = T;

type Nullable<T> = T | null;

type ArrayType<T> = Array<T>;

interface Container<TValue> {
  value: TValue;
  getValue(): TValue;
  setValue(value: TValue): void;
}

interface Repository<TEntity, TId> {
  findById(id: TId): TEntity | null;
  findAll(): Array<TEntity>;
  save(entity: TEntity): TEntity;
  delete(id: TId): boolean;
}

interface ApiClient<TRequest, TResponse> {
  send(request: TRequest): Promise<TResponse>;
  sendBatch(requests: Array<TRequest>): Promise<Array<TResponse>>;
}

type Result<TData, TError> = { success: true; data: TData } | { success: false; error: TError };

type AsyncResult<TData, TError> = Promise<Result<TData, TError>>;

interface EventHandler<TEvent> {
  handle(event: TEvent): void;
  canHandle(event: unknown): event is TEvent;
}

interface Mapper<TInput, TOutput> {
  map(input: TInput): TOutput;
  mapMany(inputs: Array<TInput>): Array<TOutput>;
}

interface Cache<TKey, TValue> {
  get(key: TKey): TValue | undefined;
  set(key: TKey, value: TValue): void;
  has(key: TKey): boolean;
  delete(key: TKey): boolean;
  clear(): void;
}

interface Queue<TItem> {
  enqueue(item: TItem): void;
  dequeue(): TItem | undefined;
  peek(): TItem | undefined;
  isEmpty(): boolean;
  size(): number;
}

interface Stack<TItem> {
  push(item: TItem): void;
  pop(): TItem | undefined;
  peek(): TItem | undefined;
  isEmpty(): boolean;
  size(): number;
}

type Predicate<TValue> = (value: TValue) => boolean;

type Comparator<TValue> = (a: TValue, b: TValue) => number;

type Transformer<TInput, TOutput> = (input: TInput) => TOutput;

interface Builder<TResult> {
  build(): TResult;
  reset(): this;
}

interface Factory<TProduct, TConfig> {
  create(config: TConfig): TProduct;
}

interface Observer<TState> {
  update(state: TState): void;
}

interface Subject<TState> {
  attach(observer: Observer<TState>): void;
  detach(observer: Observer<TState>): void;
  notify(): void;
}

function createContainer<TValue>(initialValue: TValue): Container<TValue> {
  let value = initialValue;

  return {
    value,
    getValue() {
      return value;
    },
    setValue(newValue: TValue) {
      value = newValue;
    },
  };
}

function mapArray<TInput, TOutput>(array: Array<TInput>, transformer: Transformer<TInput, TOutput>): Array<TOutput> {
  return array.map(transformer);
}

function filterArray<TValue>(array: Array<TValue>, predicate: Predicate<TValue>): Array<TValue> {
  return array.filter(predicate);
}

function sortArray<TValue>(array: Array<TValue>, comparator: Comparator<TValue>): Array<TValue> {
  return [...array].sort(comparator);
}

async function fetchData<TData>(url: string): AsyncResult<TData, Error> {
  try {
    const response = await fetch(url);
    const data = (await response.json()) as TData;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

export type {
  ApiClient,
  ArrayType,
  AsyncResult,
  Builder,
  Cache,
  Comparator,
  Container,
  EventHandler,
  Factory,
  Identity,
  Mapper,
  Nullable,
  Observer,
  Predicate,
  Queue,
  Repository,
  Result,
  Stack,
  Subject,
  Transformer,
};

export { createContainer, fetchData, filterArray, mapArray, sortArray };
