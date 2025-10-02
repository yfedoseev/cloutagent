import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProjectList } from './ProjectList';
import { apiClient } from '../lib/api-client';
import type { Project } from '@cloutagent/types';

// Mock API client
vi.mock('../lib/api-client', () => ({
  apiClient: {
    listProjects: vi.fn(),
  },
}));

describe('ProjectList', () => {
  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Customer Support Bot',
      description: 'AI-powered customer support agent',
      agent: {
        id: 'agent-1',
        name: 'Support Agent',
        systemPrompt: 'You are a helpful support agent',
        model: 'claude-sonnet-4-5',
        temperature: 0.7,
        maxTokens: 2000,
        enabledTools: ['search', 'email'],
      },
      subagents: [],
      hooks: [],
      mcps: [],
      apiKey: 'test-key',
      limits: {
        maxTokens: 100000,
        maxCost: 10,
        timeout: 300,
      },
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-20T15:30:00Z',
    },
    {
      id: 'project-2',
      name: 'Data Analysis Pipeline',
      description: 'Automated data processing workflow',
      agent: {
        id: 'agent-2',
        name: 'Data Agent',
        systemPrompt: 'You are a data analyst',
        model: 'claude-opus-4',
        temperature: 0.3,
        maxTokens: 4000,
        enabledTools: ['python', 'sql'],
      },
      subagents: [],
      hooks: [],
      mcps: [],
      apiKey: 'test-key-2',
      limits: {
        maxTokens: 200000,
        maxCost: 20,
        timeout: 600,
      },
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-01-18T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    // Mock slow API response
    vi.mocked(apiClient.listProjects).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(mockProjects), 100);
        }),
    );

    render(<ProjectList />);

    // Should show loading skeleton
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('should fetch and display projects', async () => {
    vi.mocked(apiClient.listProjects).mockResolvedValue(mockProjects);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('Customer Support Bot')).toBeTruthy();
      expect(screen.getByText('Data Analysis Pipeline')).toBeTruthy();
    });

    // Verify descriptions are shown
    expect(screen.getByText(/AI-powered customer support/i)).toBeTruthy();
    expect(screen.getByText(/Automated data processing/i)).toBeTruthy();

    // Verify API was called
    expect(apiClient.listProjects).toHaveBeenCalledTimes(1);
  });

  it('should show empty state when no projects', async () => {
    vi.mocked(apiClient.listProjects).mockResolvedValue([]);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeTruthy();
    });

    // Should show create button in empty state
    const createButtons = screen.getAllByText(/create/i);
    expect(createButtons.length).toBeGreaterThan(0);
  });

  it('should navigate to project on click', async () => {
    vi.mocked(apiClient.listProjects).mockResolvedValue(mockProjects);
    const onSelectProject = vi.fn();

    render(<ProjectList onSelectProject={onSelectProject} />);

    await waitFor(() => {
      expect(screen.getByText('Customer Support Bot')).toBeTruthy();
    });

    // Click on first project
    const projectCard = screen.getByText('Customer Support Bot').closest('div');
    expect(projectCard).toBeTruthy();

    if (projectCard) {
      fireEvent.click(projectCard);
      expect(onSelectProject).toHaveBeenCalledWith('project-1');
    }
  });

  it('should show error message on fetch failure', async () => {
    vi.mocked(apiClient.listProjects).mockRejectedValue(
      new Error('Network error'),
    );

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
    });

    // Should show retry button
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('should refresh projects on retry button click', async () => {
    // First call fails, second succeeds
    vi.mocked(apiClient.listProjects)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockProjects);

    render(<ProjectList />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeTruthy();
    });

    // Click retry
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Should show loading, then projects
    await waitFor(() => {
      expect(screen.getByText('Customer Support Bot')).toBeTruthy();
    });

    expect(apiClient.listProjects).toHaveBeenCalledTimes(2);
  });

  it('should show create project button', async () => {
    vi.mocked(apiClient.listProjects).mockResolvedValue(mockProjects);
    const onCreateProject = vi.fn();

    render(<ProjectList onCreateProject={onCreateProject} />);

    await waitFor(() => {
      expect(screen.getByText(/create new project/i)).toBeTruthy();
    });

    // Click create button
    const createButton = screen.getByText(/create new project/i);
    fireEvent.click(createButton);

    expect(onCreateProject).toHaveBeenCalledTimes(1);
  });

  it('should display project metadata', async () => {
    vi.mocked(apiClient.listProjects).mockResolvedValue(mockProjects);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('Customer Support Bot')).toBeTruthy();
    });

    // Check for model info
    expect(screen.getByText(/claude-sonnet-4-5/i)).toBeTruthy();
    expect(screen.getByText(/claude-opus-4/i)).toBeTruthy();
  });

  it('should be keyboard accessible', async () => {
    vi.mocked(apiClient.listProjects).mockResolvedValue(mockProjects);
    const onSelectProject = vi.fn();

    render(<ProjectList onSelectProject={onSelectProject} />);

    await waitFor(() => {
      expect(screen.getByText('Customer Support Bot')).toBeTruthy();
    });

    // Find project card and simulate Enter key
    const projectCard = screen.getByText('Customer Support Bot').closest('div');
    if (projectCard) {
      fireEvent.keyDown(projectCard, { key: 'Enter', code: 'Enter' });
      expect(onSelectProject).toHaveBeenCalledWith('project-1');
    }
  });
});
