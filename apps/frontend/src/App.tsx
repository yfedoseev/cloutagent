import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CloutAgent</h1>
        <p className="text-xl text-gray-400 mb-8">Agents with Impact</p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
        >
          Count: {count}
        </button>
        <p className="mt-8 text-sm text-gray-500">
          Built with React 19 + Vite 7 + TypeScript
        </p>
      </div>
    </div>
  );
}

export default App;
