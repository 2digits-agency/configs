import React from 'react';

export const TailwindComponent = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Tailwind Test</h1>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Click me
      </button>
      <div className="flex flex-row space-x-4 mt-4">
        <span className="text-red-500 bg-red-100 p-2 rounded">Error</span>
        <span className="text-green-500 bg-green-100 p-2 rounded">Success</span>
      </div>
      {/* Test with some classes that might be duplicated or problematic */}
      <div className="p-4 p-4 bg-white bg-gray-50 shadow-lg rounded-lg">
        Duplicate classes test
      </div>
    </div>
  );
};

// Test with template literals
const className = `
  flex
  flex-col
  items-center
  justify-center
  min-h-screen
  bg-gradient-to-r
  from-blue-500
  to-purple-600
  text-white
`;

export const TemplateComponent = () => {
  return <div className={className}>Template test</div>;
};

// Test with clsx-like utility
export const ClsxComponent = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className={`
      base-class
      ${isActive ? 'active-class text-blue-500' : 'inactive-class text-gray-500'}
      hover:bg-gray-100
      transition-colors
      duration-200
    `}>
      Conditional classes
    </div>
  );
};