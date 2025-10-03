import { PropertyEditorProps } from './types';
import { usePropertyForm } from '../../hooks/usePropertyForm';
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

const validateAgentForm = (data: AgentFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (data.temperature < 0 || data.temperature > 1) {
    errors.temperature = 'Temperature must be between 0 and 1';
  }

  if (data.maxTokens < 1 || data.maxTokens > 200000) {
    errors.maxTokens = 'Max tokens must be between 1 and 200,000';
  }

  if (data.maxCost !== undefined && data.maxCost < 0) {
    errors.maxCost = 'Max cost must be positive';
  }

  return errors;
};

export function AgentProperties({ node, onChange }: PropertyEditorProps) {
  const { formData, updateField, errors } = usePropertyForm<AgentFormData>({
    node,
    defaults: {
      name: 'Claude Agent',
      model: 'claude-sonnet-4-5',
      systemPrompt: '',
      temperature: 1.0,
      maxTokens: 4096,
      maxCost: undefined,
      timeout: undefined,
      enabledTools: [],
    },
    onChange,
    validate: validateAgentForm,
  });

  const toggleTool = (tool: string) => {
    const newTools = formData.enabledTools.includes(tool)
      ? formData.enabledTools.filter(t => t !== tool)
      : [...formData.enabledTools, tool];
    updateField('enabledTools', newTools);
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
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
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
              className="w-full px-3 py-2 border rounded"
              style={{
                background: 'var(--input-bg)',
                borderColor: errors.maxCost ? 'var(--error)' : 'var(--input-border)',
                color: 'var(--text-primary)',
              }}
              placeholder="No limit"
            />
            {errors.maxCost && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.maxCost}</p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Stop execution when cost exceeds this amount
            </p>
          </div>

          <div>
            <label
              htmlFor="input-timeout-(seconds)---optional"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
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
              className="w-full px-3 py-2 border rounded"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
              }}
              placeholder="No timeout"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
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
      <section className="p-3 rounded" style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Estimated Cost per Execution
        </h4>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Based on {formData.maxTokens.toLocaleString()} max tokens:
        </p>
        <p className="text-lg font-bold mt-1" style={{ color: 'var(--success)' }}>
          ~${calculateCost()}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Actual cost varies based on usage
        </p>
      </section>
    </div>
  );
}
