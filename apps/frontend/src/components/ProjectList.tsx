import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Folder, Calendar, Cpu } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import type { Project } from '@cloutagent/types';
import { formatDistance } from 'date-fns';

interface ProjectListProps {
  onCreateProject?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export function ProjectList({
  onCreateProject,
  onSelectProject,
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.listProjects();
      setProjects(data || []); // Handle undefined/null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectClick = (projectId: string) => {
    onSelectProject?.(projectId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, projectId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleProjectClick(projectId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h1>
            <button
              disabled
              className="btn btn-primary"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>
          <div className="mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>Loading projects...</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-2xl p-6 animate-pulse-soft"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <div className="h-6 rounded-lg w-3/4 mb-4" style={{ background: 'var(--bg-tertiary)' }}></div>
                <div className="h-4 rounded-lg w-full mb-2" style={{ background: 'var(--bg-tertiary)' }}></div>
                <div className="h-4 rounded-lg w-2/3" style={{ background: 'var(--bg-tertiary)' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h1>
            <button
              onClick={onCreateProject}
              className="btn btn-primary"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>
          <div className="rounded-2xl p-8 text-center max-w-2xl mx-auto" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--error)'
          }}>
            <div className="text-2xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--error)' }}>Error Loading Projects</div>
            <div className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</div>
            <button
              onClick={loadProjects}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h1>
            <button
              onClick={onCreateProject}
              className="btn btn-primary"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6" style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)'
            }}>
              <Folder size={48} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <h2 className="text-3xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              No projects yet
            </h2>
            <p className="mb-8 text-lg max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Create your first project to get started with CloutAgent
            </p>
            <button
              onClick={onCreateProject}
              className="btn btn-primary btn-lg"
            >
              <Plus size={24} />
              <span>Create New Project</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Project list
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h1>
          <button
            onClick={onCreateProject}
            className="btn-primary flex items-center gap-2"
            aria-label="Create new project"
          >
            <Plus size={20} />
            <span>Create New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              onKeyDown={e => handleKeyDown(e, project.id)}
              tabIndex={0}
              role="button"
              aria-label={`Open project ${project.name}`}
              className="cursor-pointer group focus-ring rounded-2xl p-6 transition-all duration-200"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold group-hover:opacity-80 transition-opacity duration-200 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h2>
                <div className="rounded-lg p-2 transition-colors duration-200" style={{
                  background: 'var(--bg-tertiary)'
                }}>
                  <Folder
                    size={18}
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </div>
              </div>

              {project.description && (
                <p className="text-sm mb-5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {project.description}
                </p>
              )}

              <div className="space-y-3 text-sm mb-5">
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Cpu size={14} className="flex-shrink-0" />
                  <span className="font-mono text-xs tracking-tight">
                    {project.agent.model}
                  </span>
                </div>

                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar size={14} className="flex-shrink-0" />
                  <span className="text-xs">
                    Updated{' '}
                    {formatDistance(new Date(project.updatedAt), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-5" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{project.subagents.length} subagents</span>
                  <span>{project.hooks.length} hooks</span>
                  <span>{project.mcps.length} MCPs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
