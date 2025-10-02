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
      <div className="min-h-screen text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-semibold tracking-tight text-white/95">Projects</h1>
            <button
              disabled
              className="btn-primary-coral flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>
          <div className="text-white/60 mb-6 font-medium">Loading projects...</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="glass rounded-2xl p-6 animate-pulse-soft"
              >
                <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-4"></div>
                <div className="h-4 bg-white/5 rounded-lg w-full mb-2"></div>
                <div className="h-4 bg-white/5 rounded-lg w-2/3"></div>
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
      <div className="min-h-screen text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-semibold tracking-tight text-white/95">Projects</h1>
            <button
              onClick={onCreateProject}
              className="btn-primary-coral flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>
          <div className="glass-strong rounded-2xl p-8 text-center max-w-2xl mx-auto border border-red-500/20">
            <div className="text-red-400 text-2xl font-semibold mb-3 tracking-tight">Error Loading Projects</div>
            <div className="text-red-300/80 mb-6 text-sm">{error}</div>
            <button
              onClick={loadProjects}
              className="btn-glass inline-flex items-center gap-2"
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
      <div className="min-h-screen text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-semibold tracking-tight text-white/95">Projects</h1>
            <button
              onClick={onCreateProject}
              className="btn-primary-coral flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>
          <div className="text-center py-20">
            <div className="glass-strong inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 animate-float">
              <Folder size={48} className="text-white/40" />
            </div>
            <h2 className="text-3xl font-semibold text-white/90 mb-3 tracking-tight">
              No projects yet
            </h2>
            <p className="text-white/50 mb-8 text-lg max-w-md mx-auto">
              Create your first project to get started with CloutAgent
            </p>
            <button
              onClick={onCreateProject}
              className="btn-primary-coral inline-flex items-center gap-2 px-8 py-4 text-lg"
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
    <div className="min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-white/95">Projects</h1>
          <button
            onClick={onCreateProject}
            className="btn-primary-coral flex items-center gap-2"
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
              className="card-glass cursor-pointer group focus-ring"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-white/90 group-hover:text-apple-blue transition-colors duration-200 tracking-tight">
                  {project.name}
                </h2>
                <div className="glass rounded-lg p-2 group-hover:bg-apple-blue/20 transition-colors duration-200">
                  <Folder
                    size={18}
                    className="text-white/40 group-hover:text-apple-blue transition-colors duration-200"
                  />
                </div>
              </div>

              {project.description && (
                <p className="text-white/60 text-sm mb-5 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}

              <div className="space-y-3 text-sm mb-5">
                <div className="flex items-center gap-2 text-white/50">
                  <Cpu size={14} className="flex-shrink-0" />
                  <span className="font-mono text-xs tracking-tight">
                    {project.agent.model}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-white/50">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span className="text-xs">
                    Updated{' '}
                    {formatDistance(new Date(project.updatedAt), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-white/50">{project.subagents.length} subagents</span>
                  <span className="text-white/50">{project.hooks.length} hooks</span>
                  <span className="text-white/50">{project.mcps.length} MCPs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
