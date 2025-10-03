import { PropertyEditorProps } from './types';
import { usePropertyForm } from '../../hooks/usePropertyForm';
import {
  TextInput,
  Select,
  Textarea,
  Checkbox,
  NumberInput,
  SectionHeader,
} from './FormComponents';

interface SubagentFormData {
  name: string;
  type: string;
  prompt: string;
  tools: string[];
  parallel: boolean;
  maxParallelInstances?: number;
}

const SUBAGENT_TYPES = [
  { value: 'frontend-engineer', label: 'Frontend Engineer' },
  { value: 'backend-engineer', label: 'Backend Engineer' },
  { value: 'ml-engineer', label: 'ML Engineer' },
  { value: 'data-engineer', label: 'Data Engineer' },
  { value: 'infrastructure-engineer', label: 'Infrastructure Engineer' },
  { value: 'software-engineer-test', label: 'Software Engineer (Test)' },
  { value: 'ui-ux-designer', label: 'UI/UX Designer' },
  { value: 'prompt-engineer', label: 'Prompt Engineer' },
  { value: 'project-manager', label: 'Project Manager' },
];

const AVAILABLE_TOOLS = ['bash', 'text-editor', 'computer'];

const validateSubagentForm = (data: SubagentFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.prompt.trim()) {
    errors.prompt = 'Prompt is required';
  }

  if (
    data.parallel &&
    data.maxParallelInstances !== undefined &&
    data.maxParallelInstances < 1
  ) {
    errors.maxParallelInstances = 'Max parallel instances must be at least 1';
  }

  return errors;
};

export function SubagentProperties({ node, onChange }: PropertyEditorProps) {
  const { formData, updateField, errors } = usePropertyForm<SubagentFormData>({
    node,
    defaults: {
      name: 'Subagent',
      type: 'frontend-engineer',
      prompt: '',
      tools: [],
      parallel: false,
      maxParallelInstances: undefined,
    },
    onChange,
    validate: validateSubagentForm,
  });

  const toggleTool = (tool: string) => {
    const newTools = formData.tools.includes(tool)
      ? formData.tools.filter(t => t !== tool)
      : [...formData.tools, tool];
    updateField('tools', newTools);
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Basic Information" />

        <div className="space-y-4">
          <TextInput
            label="Subagent Name"
            value={formData.name}
            onChange={value => updateField('name', value)}
            error={errors.name}
            placeholder="My Subagent"
            required
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={value => updateField('type', value)}
            options={SUBAGENT_TYPES}
            helperText="Specialized role for this subagent"
          />
        </div>
      </section>

      <section>
        <SectionHeader title="Configuration" />

        <div className="space-y-4">
          <Textarea
            label="Prompt"
            value={formData.prompt}
            onChange={value => updateField('prompt', value)}
            rows={6}
            error={errors.prompt}
            placeholder="Task instructions for this subagent..."
            helperText="Task instructions for this subagent"
            required
          />

          <div>
            <Checkbox
              label="Parallel Execution"
              checked={formData.parallel}
              onChange={checked => updateField('parallel', checked)}
              helperText="Allow multiple instances to run simultaneously"
            />

            {formData.parallel && (
              <div className="mt-4">
                <NumberInput
                  label="Max Parallel Instances"
                  value={formData.maxParallelInstances || 5}
                  onChange={value => updateField('maxParallelInstances', value)}
                  min={1}
                  max={20}
                  error={errors.maxParallelInstances}
                  helperText="Maximum number of parallel instances (1-20)"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Enabled Tools" />

        <div className="space-y-2">
          {AVAILABLE_TOOLS.map(tool => (
            <Checkbox
              key={tool}
              label={tool}
              checked={formData.tools.includes(tool)}
              onChange={() => toggleTool(tool)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
