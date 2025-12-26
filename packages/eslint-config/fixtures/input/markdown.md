# Header

_Look,_ code blocks are formatted _too!_

```js
// This should be handled by ESLint instead of Prettier
const identity = (x) => {
  if (foo) {
    console.log('bar');
  }
}
```

```css
/* This should be handled by Prettier */
.foo {
  color: red;
}
```

| Pilot    | Airport | Hours |
| -------- | :-----: | ----: |
| John Doe |   SKG   |  1338 |
| Jane Roe |   JFK   |   314 |

---

- List
- with a [link](/to/somewhere)
- and [another one]

  [another one]: http://example.com 'Example title'

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Curabitur consectetur maximus risus, sed maximus tellus tincidunt et.

```ts
export interface Something {
  items: string[];
}

export const someFunc = ({items}: Something) => {
    items.forEach(item => console.log(item));
}
```
