import { useState, useEffect } from 'react';
import { PropertyEditorProps, ValidationErrors } from './types';
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

export function SubagentProperties({ node, onChange }: PropertyEditorProps) {
  const [formData, setFormData] = useState<SubagentFormData>({
    name: (node.data as any).config?.name || 'Subagent',
    type: (node.data as any).config?.type || 'frontend-engineer',
    prompt: (node.data as any).config?.prompt || '',
    tools: (node.data as any).config?.tools || [],
    parallel: (node.data as any).config?.parallel || false,
    maxParallelInstances: (node.data as any).config?.maxParallelInstances,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }

    if (
      formData.parallel &&
      formData.maxParallelInstances !== undefined &&
      formData.maxParallelInstances < 1
    ) {
      newErrors.maxParallelInstances =
        'Max parallel instances must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const updateField = <K extends keyof SubagentFormData>(
    field: K,
    value: SubagentFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool],
    }));
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
