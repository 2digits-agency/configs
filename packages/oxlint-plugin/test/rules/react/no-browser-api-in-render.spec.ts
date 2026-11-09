import ts from 'dedent';

import { noBrowserApiInRender } from '../../../src/rules/react/no-browser-api-in-render';
import { createRuleTester } from '../../rule-tester';

function reads(name: string) {
  return { messageId: 'browserApiInRender', data: { name } };
}

const valid: Array<string> = [
  // Effects run after hydration, which is the fix for the reported bugs.
  ts`
    export function LanguageSelect() {
      const [showLanguages, setShowLanguages] = useState(true);

      useEffect(() => {
        setShowLanguages(localStorage.getItem(KEY) !== 'false');
      }, []);

      useLayoutEffect(() => {
        document.body.style.overflow = 'hidden';
      }, []);

      return <div>{showLanguages}</div>;
    }
  `,

  // Event handlers, callbacks and ref callbacks run after render.
  ts`
    export function Share({ url }: { url: string }) {
      const copy = useCallback(() => navigator.clipboard.writeText(url), [url]);

      function openWindow() {
        window.open(url);
      }

      return (
        <div ref={(node) => node?.ownerDocument === document}>
          <button type="button" onClick={() => sessionStorage.setItem('shared', url)}>Share</button>
          <button type="button" onClick={openWindow}>Open</button>
          <button type="button" onClick={copy}>Copy</button>
        </div>
      );
    }
  `,

  // The snapshot functions of useSyncExternalStore are the supported way to read browser state.
  ts`
    function subscribe(callback: () => void) {
      window.addEventListener('storage', callback);

      return () => window.removeEventListener('storage', callback);
    }

    export function useStoredTheme() {
      return useSyncExternalStore(
        subscribe,
        () => localStorage.getItem('theme'),
        () => null,
      );
    }
  `,

  // Refs are read in effects, and synchronous array callbacks only count when they run during render.
  ts`
    export function useWindowWidth(ids: Array<string>) {
      const width = useRef<number | null>(null);

      useEffect(() => {
        width.current = window.innerWidth;
        ids.forEach((id) => document.getElementById(id)?.focus());
      }, [ids]);

      return width;
    }
  `,

  // Helpers outside components and hooks, and module scope, are not render.
  ts`
    const IS_SERVER = typeof window === 'undefined';

    function readLanguage() {
      return IS_SERVER ? null : localStorage.getItem(KEY);
    }

    export const storage = {
      get: (key: string) => globalThis.localStorage.getItem(key),
    };
  `,

  // Locals, parameters and properties with browser names are not the browser globals.
  ts`
    export function Frame({ window, item }: Props) {
      const document = useDocument();
      const options = { navigator: item.navigator };

      return <div title={window.title}>{document.title}{props.localStorage}{options.navigator}</div>;
    }
  `,

  // Type positions do not run.
  ts`
    export function Target({ target }: { target: typeof window | typeof window.document }) {
      return <div>{String(target)}</div>;
    }
  `,
];

const invalid = [
  // From easy-noisecontrol-web Announcement.tsx: the IS_SERVER guard itself causes the mismatch.
  {
    code: ts`
      export function Announcement() {
        const [isClosed, setIsClosed] = useState(
          IS_SERVER ? false : (globalThis.window.sessionStorage.getItem(KEY) ?? false),
        );

        return isClosed ? null : <button type="button" onClick={() => setIsClosed(true)}>Close</button>;
      }
    `,
    errors: [reads('globalThis.window')],
  },

  // From move-your-box-web LanguageSelect.tsx, first version.
  {
    code: ts`
      export function LanguageSelect() {
        const [showLanguages] = useState(localStorage.getItem(KEY) !== 'false');

        return <div>{showLanguages}</div>;
      }
    `,
    errors: [reads('localStorage')],
  },

  // From move-your-box-web LanguageSelect.tsx, second version: the typeof guard is not reported, the read it guards is.
  {
    code: ts`
      export function LanguageSelect() {
        const [showLanguages] = useState(() => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem(KEY) !== 'false';
          }

          return true;
        });

        return <div>{showLanguages}</div>;
      }
    `,
    errors: [reads('localStorage')],
  },

  // Component body and JSX, including memo-wrapped arrow components.
  {
    code: ts`
      export const Device = memo(() => {
        const isMobile = window.innerWidth < 768;

        return <div title={navigator.userAgent}>{isMobile ? 'mobile' : 'desktop'}</div>;
      });
    `,
    errors: [reads('window'), reads('navigator')],
  },

  // Custom hook bodies and useRef initial values.
  {
    code: ts`
      export function useTheme() {
        const root = useRef(document.documentElement);

        return root.current.dataset.theme ?? globalThis['localStorage'].getItem('theme');
      }
    `,
    errors: [reads('document'), reads('globalThis.localStorage')],
  },

  // The callbacks of useMemo, useReducer init functions, IIFEs and synchronous array callbacks run during render.
  {
    code: ts`
      export function Settings({ keys }: { keys: Array<string> }) {
        const values = useMemo(() => keys.map((key) => sessionStorage.getItem(key)), [keys]);
        const [state] = useReducer(reducer, keys, (initial) => initial.filter((key) => key in window));
        const lang = (() => navigator.language)();

        return <ul>{values.map((value) => <li key={value}>{value ?? document.title}{state}{lang}</li>)}</ul>;
      }
    `,
    errors: [reads('sessionStorage'), reads('window'), reads('navigator'), reads('document')],
  },
];

createRuleTester({
  languageOptions: { parserOptions: { lang: 'tsx' }, sourceType: 'module' },
}).run('no-browser-api-in-render', noBrowserApiInRender, { valid, invalid });
