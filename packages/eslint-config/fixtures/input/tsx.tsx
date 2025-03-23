import { useState } from "react";

export const Component1 = () => {
  const [isHidden, setIsHidden] = useState(true);
  return <div onClick={() => setIsHidden(!isHidden)} hidden={isHidden}></div>;
};

export function jsx2() {
  const props = { a: 1, b: 2 };
  return (
    <a foo="bar" bar={`foo`}>
      <div {...props} a={1} b="2">
        Inline Text
      </div>
      <Component1>Block Text</Component1>
      <div>
        Mixed
        <div>Foo</div>
        Text<b> Bar</b>
      </div>
      <p>
        foo<i>bar</i>
        <b>baz</b>
      </p>
    </a>
  );
}
