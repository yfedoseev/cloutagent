import { useState } from 'react';
import type { Variable } from '@cloutagent/types';

interface CreateVariableModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  editVariable?: Variable;
}

export function CreateVariableModal({
  projectId,
  onClose,
  onSuccess,
  editVariable,
}: CreateVariableModalProps) {
  const [name, setName] = useState(editVariable?.name || '');
  const [type, setType] = useState<Variable['type']>(editVariable?.type || 'string');
  const [scope, setScope] = useState<Variable['scope']>(editVariable?.scope || 'global');
  const [value, setValue] = useState(
    editVariable?.type === 'object' || editVariable?.type === 'array'
      ? JSON.stringify(editVariable.value, null, 2)
      : String(editVariable?.value || ''),
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate name (alphanumeric + underscore)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error('Variable name must be alphanumeric with underscores');
      }

      // Parse value based on type
      let parsedValue: string | number | boolean | Record<string, unknown> | unknown[] = value;

      if (type === 'number') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
          throw new Error('Invalid number value');
        }
      } else if (type === 'boolean') {
        parsedValue = value === 'true';
      } else if (type === 'object' || type === 'array') {
        try {
          parsedValue = JSON.parse(value);
        } catch {
          throw new Error(`Invalid JSON for ${type}`);
        }
      }

      const url = editVariable
        ? `/api/projects/${projectId}/variables/${editVariable.id}`
        : `/api/projects/${projectId}/variables`;

      const method = editVariable ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          scope,
          value: parsedValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save variable');
      }

      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-[500px] p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {editVariable ? 'Edit Variable' : 'Create Variable'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="variable-name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              id="variable-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono"
              placeholder="variableName"
              required
              disabled={!!editVariable}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="variable-type" className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              id="variable-type"
              value={type}
              onChange={(e) => setType(e.target.value as Variable['type'])}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
              <option value="secret">Secret</option>
            </select>
          </div>

          {/* Scope */}
          <div>
            <label htmlFor="variable-scope" className="block text-sm font-medium text-gray-300 mb-1">
              Scope
            </label>
            <select
              id="variable-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as Variable['scope'])}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="global">Global (project-wide)</option>
              <option value="node">Node (specific node)</option>
              <option value="execution">Execution (runtime)</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label htmlFor="variable-value" className="block text-sm font-medium text-gray-300 mb-1">
              Value
            </label>
            {type === 'boolean' ? (
              <select
                id="variable-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : type === 'object' || type === 'array' ? (
              <textarea
                id="variable-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono"
                rows={6}
                placeholder={type === 'object' ? '{"key": "value"}' : '["item1", "item2"]'}
                required
              />
            ) : (
              <input
                id="variable-value"
                type={type === 'number' ? 'number' : type === 'secret' ? 'password' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono"
                placeholder={type === 'secret' ? '••••••••' : 'Enter value'}
                required
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              disabled={loading}
            >
              {loading ? 'Saving...' : editVariable ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
