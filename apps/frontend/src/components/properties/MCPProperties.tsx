import { useState, useEffect } from 'react';
import { PropertyEditorProps, ValidationErrors } from './types';
import { TextInput, Select, Checkbox, SectionHeader } from './FormComponents';

interface MCPFormData {
  name: string;
  type: 'url' | 'npx' | 'uvx';
  connection: string;
  enabled: boolean;
  tools: string[];
}

const CONNECTION_TYPES = [
  { value: 'npx', label: 'NPX Package' },
  { value: 'uvx', label: 'UVX Package' },
  { value: 'url', label: 'URL' },
];

const getConnectionExample = (type: 'url' | 'npx' | 'uvx'): string => {
  switch (type) {
    case 'npx':
      return 'npx @modelcontextprotocol/server-filesystem /path/to/directory';
    case 'uvx':
      return 'uvx mcp-server-git --repository https://github.com/user/repo';
    case 'url':
      return 'https://example.com/mcp-server';
  }
};

export function MCPProperties({ node, onChange }: PropertyEditorProps) {
  const [formData, setFormData] = useState<MCPFormData>({
    name: (node.data as any).config?.name || 'MCP Server',
    type: (node.data as any).config?.type || 'npx',
    connection: (node.data as any).config?.connection || '',
    enabled: (node.data as any).config?.enabled ?? true,
    tools: (node.data as any).config?.tools || [],
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.connection.trim()) {
      newErrors.connection = 'Connection is required';
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
          connected: false,
          config: {
            id: (node.data as any).config?.id || node.id,
            ...formData,
          },
        },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = <K extends keyof MCPFormData>(
    field: K,
    value: MCPFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Basic Information" />

        <div className="space-y-4">
          <TextInput
            label="MCP Server Name"
            value={formData.name}
            onChange={value => updateField('name', value)}
            error={errors.name}
            placeholder="My MCP Server"
            required
          />

          <Select
            label="Connection Type"
            value={formData.type}
            onChange={value =>
              updateField('type', value as 'url' | 'npx' | 'uvx')
            }
            options={CONNECTION_TYPES}
            helperText="How to connect to this MCP server"
          />
        </div>
      </section>

      <section>
        <SectionHeader title="Connection" />

        <div className="space-y-4">
          <TextInput
            label="Connection String"
            value={formData.connection}
            onChange={value => updateField('connection', value)}
            error={errors.connection}
            placeholder={getConnectionExample(formData.type)}
            required
          />

          <div className="p-3 bg-gray-700 rounded">
            <p className="text-xs font-semibold text-gray-300 mb-1">Example:</p>
            <code className="text-xs text-green-400 break-all">
              {getConnectionExample(formData.type)}
            </code>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Settings" />

        <Checkbox
          label="Enabled"
          checked={formData.enabled}
          onChange={checked => updateField('enabled', checked)}
          helperText="Disable to temporarily skip this server"
        />
      </section>

      <section className="p-3 bg-gray-700 rounded">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Connection Status
        </h4>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              (node.data as any).connected ? 'bg-green-400' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm text-gray-300">
            {(node.data as any).connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Connection will be established when the workflow is executed
        </p>
      </section>
    </div>
  );
}
