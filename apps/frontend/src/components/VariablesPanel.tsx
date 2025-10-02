import { useState, useEffect } from 'react';
import type { Variable } from '@cloutagent/types';
import { CreateVariableModal } from './CreateVariableModal';

interface VariablesPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VariablesPanel({ projectId, isOpen, onClose }: VariablesPanelProps) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'global' | 'node' | 'execution'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editVariable, setEditVariable] = useState<Variable | undefined>();

  useEffect(() => {
    if (isOpen) {
      loadVariables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/variables`);
      const data = await response.json();
      setVariables(data.variables || []);
    } catch (error) {
      // Error loading variables - log for debugging
      // eslint-disable-next-line no-console
      console.error('Failed to load variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (variableId: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) return;

    try {
      await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
        method: 'DELETE',
      });
      await loadVariables();
    } catch (error) {
      // Error deleting variable - log for debugging
      // eslint-disable-next-line no-console
      console.error('Failed to delete variable:', error);
    }
  };

  const handleEdit = (variable: Variable) => {
    setEditVariable(variable);
    setShowCreateModal(true);
  };

  const filteredVariables = filter === 'all'
    ? variables
    : variables.filter(v => v.scope === filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Variables</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700">
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'global'}
              onClick={() => setFilter('global')}
            >
              Global
            </FilterButton>
            <FilterButton
              active={filter === 'node'}
              onClick={() => setFilter('node')}
            >
              Node
            </FilterButton>
            <FilterButton
              active={filter === 'execution'}
              onClick={() => setFilter('execution')}
            >
              Execution
            </FilterButton>
          </div>

          <button
            onClick={() => {
              setEditVariable(undefined);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white"
          >
            + New Variable
          </button>
        </div>

        {/* Variables List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading variables...</div>
            </div>
          ) : filteredVariables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-4xl mb-4">📦</div>
              <div className="text-lg font-semibold mb-2">No variables yet</div>
              <div className="text-sm">
                Create your first variable to get started
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVariables.map(variable => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Variable Modal */}
      {showCreateModal && (
        <CreateVariableModal
          projectId={projectId}
          onClose={() => {
            setShowCreateModal(false);
            setEditVariable(undefined);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditVariable(undefined);
            loadVariables();
          }}
          editVariable={editVariable}
        />
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function VariableCard({ variable, onDelete, onEdit }: {
  variable: Variable;
  onDelete: (id: string) => void;
  onEdit: (variable: Variable) => void;
}) {
  const scopeColors: Record<Variable['scope'], string> = {
    global: 'bg-purple-500/20 text-purple-300',
    node: 'bg-blue-500/20 text-blue-300',
    execution: 'bg-green-500/20 text-green-300',
  };

  const typeColors: Record<Variable['type'], string> = {
    string: 'bg-gray-600',
    number: 'bg-yellow-600',
    boolean: 'bg-green-600',
    object: 'bg-blue-600',
    array: 'bg-purple-600',
    secret: 'bg-red-600',
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono font-semibold text-white">
              {variable.name}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${scopeColors[variable.scope]}`}>
              {variable.scope}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs text-white ${typeColors[variable.type]}`}>
              {variable.type}
            </span>
          </div>

          <div className="text-sm text-gray-300 font-mono">
            {variable.type === 'secret' ? (
              <span className="text-gray-500">••••••••••</span>
            ) : variable.type === 'object' || variable.type === 'array' ? (
              <pre className="text-xs overflow-auto max-h-20">
                {JSON.stringify(variable.value, null, 2)}
              </pre>
            ) : (
              <span>{String(variable.value)}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(variable)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(variable.id)}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
