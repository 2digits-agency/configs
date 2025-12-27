import tsParser from '@typescript-eslint/parser';
import {
  run as _run,
  type InvalidTestCase,
  type RuleTesterInitOptions,
  type TestCasesOptions,
  type ValidTestCase,
} from 'eslint-vitest-rule-tester';

import { preferInlineHandlers, RULE_NAME } from '../../src/rules/prefer-inline-handlers';

function run(options: TestCasesOptions & RuleTesterInitOptions) {
  return _run({
    parser: tsParser as never,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
    ...options,
  });
}

const tsx = String.raw;

const valids: Array<ValidTestCase> = [
  tsx`
    export function MyComponent() {
      return <button onClick={() => console.log("clicked")}>Click</button>;
    }
  `,

  tsx`
    export function MyComponent() {
      const handleClick = () => {
        console.log("clicked");
      };

      return (
        <div>
          <button onClick={handleClick}>First</button>
          <button onClick={handleClick}>Second</button>
        </div>
      );
    }
  `,

  tsx`
    export function MyComponent() {
      const handleClick = () => {
        console.log("clicked");
      };

      useEffect(() => {
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
      }, []);

      return <div>Content</div>;
    }
  `,

  tsx`
    const handleClick = () => {
      console.log("clicked");
    };

    export function MyComponent() {
      return <button onClick={handleClick}>Click</button>;
    }
  `,

  tsx`
    export function MyComponent() {
      const transform = (x: number) => x * 2;
      const result = [1, 2, 3].map(transform);

      return <div>{result}</div>;
    }
  `,

  tsx`
    export function MyComponent() {
      const handleClick = () => console.log("clicked");
      
      someFunction(handleClick);

      return <button onClick={handleClick}>Click</button>;
    }
  `,

  tsx`
    export function MyComponent() {
      const handleClick = useCallback(() => {
        console.log("clicked");
      }, []);

      return <button onClick={handleClick}>Click</button>;
    }
  `,

  tsx`
    export function MyComponent() {
      const handleClick = useMemo(() => () => {
        console.log("clicked");
      }, []);

      return <button onClick={handleClick}>Click</button>;
    }
  `,

  tsx`
    export function MyComponent() {
      const handleSubmit = useCallback(async (data: FormData) => {
        await submitData(data);
      }, [submitData]);

      return <form onSubmit={handleSubmit}>Submit</form>;
    }
  `,
];

const invalids: Array<InvalidTestCase> = [
  {
    code: tsx`
      export function MyComponent() {
        const handleClick = () => {
          console.log("clicked");
        };

        return <button onClick={handleClick}>Click me</button>;
      }
    `,
    output: tsx`
      export function MyComponent() {
        

        return <button onClick={() => {
          console.log("clicked");
        }}>Click me</button>;
      }
    `,
    errors: [{ messageId: 'preferInlineHandler', data: { name: 'handleClick' } }],
  },

  {
    code: tsx`
      export function MyComponent() {
        const handleClick = function() {
          console.log("clicked");
        };

        return <button onClick={handleClick}>Click me</button>;
      }
    `,
    output: tsx`
      export function MyComponent() {
        

        return <button onClick={function() {
          console.log("clicked");
        }}>Click me</button>;
      }
    `,
    errors: [{ messageId: 'preferInlineHandler', data: { name: 'handleClick' } }],
  },

  {
    code: tsx`
      export function MyComponent() {
        function handleClick() {
          console.log("clicked");
        }

        return <button onClick={handleClick}>Click me</button>;
      }
    `,
    output: tsx`
      export function MyComponent() {
        

        return <button onClick={() => {
          console.log("clicked");
        }}>Click me</button>;
      }
    `,
    errors: [{ messageId: 'preferInlineHandler', data: { name: 'handleClick' } }],
  },

  {
    code: tsx`
      export function MyComponent() {
        const handleClick = () => console.log("click");

        return (
          <button onClick={handleClick}>
            Click me
          </button>
        );
      }
    `,
    output: tsx`
      export function MyComponent() {
        

        return (
          <button onClick={() => console.log("click")}>
            Click me
          </button>
        );
      }
    `,
    errors: [{ messageId: 'preferInlineHandler', data: { name: 'handleClick' } }],
  },

  {
    code: tsx`
      export function Parent() {
        const Child = () => {
          const handleClick = () => console.log("clicked");
          return <button onClick={handleClick}>Click</button>;
        };

        return <Child />;
      }
    `,
    output: tsx`
      export function Parent() {
        const Child = () => {
          
          return <button onClick={() => console.log("clicked")}>Click</button>;
        };

        return <Child />;
      }
    `,
    errors: [{ messageId: 'preferInlineHandler', data: { name: 'handleClick' } }],
  },

  {
    code: tsx`
      export function MyComponent() {
        const handleClick = async () => {
          await doSomething();
        };

        return <button onClick={handleClick}>Click</button>;
      }
    `,
    output: tsx`
      export function MyComponent() {
        

        return <button onClick={async () => {
          await doSomething();
        }}>Click</button>;
      }
    `,
    errors: [{ messageId: 'preferInlineHandler', data: { name: 'handleClick' } }],
  },
];

await run({
  name: RULE_NAME,
  rule: preferInlineHandlers,
  valid: valids,
  invalid: invalids,
});
