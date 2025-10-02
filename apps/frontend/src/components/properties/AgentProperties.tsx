import { useState, useEffect } from 'react';
import { PropertyEditorProps, ValidationErrors } from './types';
import {
  TextInput,
  Select,
  Textarea,
  Slider,
  NumberInput,
  Checkbox,
  SectionHeader,
} from './FormComponents';

interface AgentFormData {
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  maxCost?: number;
  timeout?: number;
  enabledTools: string[];
}

const MODEL_OPTIONS = [
  {
    value: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    description: 'Balanced performance and cost',
  },
  {
    value: 'claude-opus-4',
    label: 'Claude Opus 4',
    description: 'Most capable',
  },
  {
    value: 'claude-haiku-3.5',
    label: 'Claude Haiku 3.5',
    description: 'Fastest',
  },
];

const AVAILABLE_TOOLS = ['bash', 'computer', 'text-editor'];

export function AgentProperties({ node, onChange }: PropertyEditorProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    name: (node.data as any).config?.name || 'Agent',
    model: (node.data as any).config?.model || 'claude-sonnet-4-5',
    systemPrompt: (node.data as any).config?.systemPrompt || '',
    temperature: (node.data as any).config?.temperature ?? 1.0,
    maxTokens: (node.data as any).config?.maxTokens || 4096,
    maxCost: (node.data as any).config?.maxCost,
    timeout: (node.data as any).config?.timeout,
    enabledTools: (node.data as any).config?.enabledTools || [],
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Validation
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.temperature < 0 || formData.temperature > 1) {
      newErrors.temperature = 'Temperature must be between 0 and 1';
    }

    if (formData.maxTokens < 1 || formData.maxTokens > 200000) {
      newErrors.maxTokens = 'Max tokens must be between 1 and 200,000';
    }

    if (formData.maxCost !== undefined && formData.maxCost < 0) {
      newErrors.maxCost = 'Max cost must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save with debounce
  useEffect(() => {
    if (!validate()) return;

    const timer = setTimeout(() => {
      onChange({
        data: {
          ...node.data,
          config: {
            id: (node.data as any).config?.id || node.id,
            ...formData,
          },
        },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = <K extends keyof AgentFormData>(
    field: K,
    value: AgentFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      enabledTools: prev.enabledTools.includes(tool)
        ? prev.enabledTools.filter(t => t !== tool)
        : [...prev.enabledTools, tool],
    }));
  };

  const calculateCost = (): string => {
    // Output tokens cost approximately $15 per million tokens
    const cost = (formData.maxTokens / 1000000) * 15;
    return cost.toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <section>
        <SectionHeader title="Basic Information" />

        <div className="space-y-4">
          <TextInput
            label="Agent Name"
            value={formData.name}
            onChange={value => updateField('name', value)}
            error={errors.name}
            placeholder="My Agent"
            required
          />

          <Select
            label="Model"
            value={formData.model}
            onChange={value => updateField('model', value)}
            options={MODEL_OPTIONS}
            helperText="Sonnet: Balanced, Opus: Most capable, Haiku: Fastest"
          />
        </div>
      </section>

      {/* System Prompt Section */}
      <section>
        <SectionHeader title="System Prompt" />

        <Textarea
          label="System Prompt"
          value={formData.systemPrompt}
          onChange={value => updateField('systemPrompt', value)}
          rows={8}
          placeholder="You are a helpful AI assistant..."
          helperText="Define the agent's role and behavior"
          monospace
        />
      </section>

      {/* Advanced Settings Section */}
      <section>
        <SectionHeader title="Advanced Settings" />

        <div className="space-y-4">
          <Slider
            label="Temperature"
            value={formData.temperature}
            onChange={value => updateField('temperature', value)}
            min={0}
            max={1}
            step={0.01}
            error={errors.temperature}
            minLabel="Focused (0.0)"
            maxLabel="Creative (1.0)"
          />

          <NumberInput
            label="Max Tokens"
            value={formData.maxTokens}
            onChange={value => updateField('maxTokens', value)}
            min={1}
            max={200000}
            error={errors.maxTokens}
            helperText="Maximum response length (1-200,000)"
          />

          <div>
            <label
              htmlFor="input-max-cost-(usd)---optional"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Max Cost (USD) - Optional
            </label>
            <input
              id="input-max-cost-(usd)---optional"
              type="number"
              value={formData.maxCost !== undefined ? formData.maxCost : ''}
              onChange={e =>
                updateField(
                  'maxCost',
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              min={0}
              step={0.01}
              className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${
                errors.maxCost ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="No limit"
            />
            {errors.maxCost && (
              <p className="text-xs text-red-400 mt-1">{errors.maxCost}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Stop execution when cost exceeds this amount
            </p>
          </div>

          <div>
            <label
              htmlFor="input-timeout-(seconds)---optional"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Timeout (seconds) - Optional
            </label>
            <input
              id="input-timeout-(seconds)---optional"
              type="number"
              value={
                formData.timeout !== undefined ? formData.timeout / 1000 : ''
              }
              onChange={e =>
                updateField(
                  'timeout',
                  e.target.value ? parseInt(e.target.value) * 1000 : undefined,
                )
              }
              min={1}
              max={600}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="No timeout"
            />
            <p className="text-xs text-gray-400 mt-1">
              Maximum execution time (1-600 seconds)
            </p>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section>
        <SectionHeader title="Enabled Tools" />

        <div className="space-y-2">
          {AVAILABLE_TOOLS.map(tool => (
            <Checkbox
              key={tool}
              label={tool}
              checked={formData.enabledTools.includes(tool)}
              onChange={() => toggleTool(tool)}
            />
          ))}
        </div>
      </section>

      {/* Cost Estimate */}
      <section className="p-3 bg-gray-700 rounded">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Estimated Cost per Execution
        </h4>
        <p className="text-xs text-gray-400">
          Based on {formData.maxTokens.toLocaleString()} max tokens:
        </p>
        <p className="text-lg font-bold text-green-400 mt-1">
          ~${calculateCost()}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Actual cost varies based on usage
        </p>
      </section>
    </div>
  );
}
