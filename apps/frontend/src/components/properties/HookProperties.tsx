import { PropertyEditorProps } from './types';
import { usePropertyForm } from '../../hooks/usePropertyForm';
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
    value: 'pre-tool-call',
    label: 'Pre-Tool Call',
    description: 'Runs before a tool is called',
  },
  {
    value: 'post-tool-call',
    label: 'Post-Tool Call',
    description: 'Runs after a tool is called',
  },
  {
    value: 'on-error',
    label: 'On Error',
    description: 'Runs when an error occurs',
  },
  {
    value: 'on-validation-fail',
    label: 'On Validation Fail',
    description: 'Runs when validation fails',
  },
];

const validateHookForm = (data: HookFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  return errors;
};

export function HookProperties({ node, onChange }: PropertyEditorProps) {
  const { formData, updateField, errors } = usePropertyForm<HookFormData>({
    node,
    defaults: {
      name: 'Hook',
      type: 'pre-execution' as HookType,
      enabled: true,
    },
    onChange,
    validate: validateHookForm,
  });

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
