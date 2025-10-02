import { useState, useEffect } from 'react';
import { PropertyEditorProps, ValidationErrors } from './types';
import { TextInput, Select, Checkbox, SectionHeader } from './FormComponents';
import type { HookType } from '@cloutagent/types';

interface HookFormData {
  name: string;
  type: HookType;
  enabled: boolean;
}

const HOOK_TYPES: { value: HookType; label: string; description: string }[] = [
  {
    value: 'pre-execution',
    label: 'Pre-Execution',
    description: 'Runs before agent execution',
  },
  {
    value: 'post-execution',
    label: 'Post-Execution',
    description: 'Runs after agent execution',
  },
  {
    value: 'tool-call',
    label: 'Tool Call',
    description: 'Runs when a tool is called',
  },
  {
    value: 'error',
    label: 'Error',
    description: 'Runs when an error occurs',
  },
];

export function HookProperties({ node, onChange }: PropertyEditorProps) {
  const [formData, setFormData] = useState<HookFormData>({
    name: (node.data as any).config?.name || 'Hook',
    type: (node.data as any).config?.type || 'pre-execution',
    enabled: (node.data as any).config?.enabled ?? true,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
          enabled: formData.enabled,
          config: {
            id: (node.data as any).config?.id || node.id,
            ...formData,
          },
        },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = <K extends keyof HookFormData>(
    field: K,
    value: HookFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeDescription = (type: HookType): string => {
    return HOOK_TYPES.find(t => t.value === type)?.description || '';
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Basic Information" />

        <div className="space-y-4">
          <TextInput
            label="Hook Name"
            value={formData.name}
            onChange={value => updateField('name', value)}
            error={errors.name}
            placeholder="My Hook"
            required
          />

          <Select
            label="Hook Type"
            value={formData.type}
            onChange={value => updateField('type', value as HookType)}
            options={HOOK_TYPES}
            helperText="When this hook should be triggered"
          />

          <div className="p-3 bg-gray-700 rounded">
            <p className="text-xs text-gray-300">
              {getTypeDescription(formData.type)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Settings" />

        <Checkbox
          label="Enabled"
          checked={formData.enabled}
          onChange={checked => updateField('enabled', checked)}
          helperText="Disable to temporarily skip this hook"
        />
      </section>
    </div>
  );
}
