function Child({ name }) {
  return <span>{name}</span>;
}

export function Parent({ name, t }) {
  return (
    <>
      <Child name={name} />
      {t.rich('message', { strong: (chunks) => <strong>{chunks}</strong> })}
      <List renderItem={(item) => <span>{item.name}</span>} />
    </>
  );
}
