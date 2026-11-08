export function Parent({ name }) {
  function Child() {
    return <span>{name}</span>;
  }

  return <Child />;
}
