/**
 * Simulation History Component
 * Browse, search, and manage saved simulations
 */
import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  Upload,
  Trash2,
  Copy,
  Play,
  Calendar,
  Tag,
  BarChart3,
  Filter,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { simulationStorage, StoredSimulation } from '@/services/simulationStorage.service';
import { SimulationRequest } from '@/services/api/simulation.service';
import { toast } from 'sonner';

interface SimulationHistoryProps {
  onLoadSimulation: (config: SimulationRequest) => void;
  onViewResults: (simulation: StoredSimulation) => void;
}

export function SimulationHistory({ onLoadSimulation, onViewResults }: SimulationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const history = simulationStorage.getHistory();
  const stats = simulationStorage.getStatistics();

  // Filter and sort simulations
  const filteredSimulations = useMemo(() => {
    let filtered = history;

    // Search filter
    if (searchQuery.trim()) {
      filtered = simulationStorage.searchSimulations(searchQuery);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(sim =>
        selectedTags.some(tag => sim.tags.includes(tag))
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [history, searchQuery, selectedTags, sortBy]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this simulation?')) {
      if (simulationStorage.deleteSimulation(id)) {
        toast.success('Simulation deleted');
        // Force re-render
        setSearchQuery(prev => prev);
      }
    }
  };

  const handleDuplicate = (id: string) => {
    const duplicate = simulationStorage.duplicateSimulation(id);
    if (duplicate) {
      toast.success('Simulation duplicated');
      setSearchQuery(prev => prev);
    }
  };

  const handleExport = (id: string) => {
    const jsonData = simulationStorage.exportSimulation(id);
    if (jsonData) {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation_${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Simulation exported');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const jsonData = event.target?.result as string;
          const imported = simulationStorage.importSimulation(jsonData);
          if (imported) {
            toast.success('Simulation imported');
            setSearchQuery(prev => prev);
          } else {
            toast.error('Failed to import simulation');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all simulation history? This cannot be undone.')) {
      simulationStorage.clearHistory();
      toast.success('History cleared');
      setSearchQuery(prev => prev);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-polar-600/20 rounded-lg flex items-center justify-center">
              <History size={20} className="text-polar-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Total Simulations</div>
              <div className="text-lg font-bold text-gray-100">{stats.totalSimulations}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-green-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">With Results</div>
              <div className="text-lg font-bold text-gray-100">{stats.withResults}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Tag size={20} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Unique Tags</div>
              <div className="text-lg font-bold text-gray-100">{stats.uniqueTags.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Filter size={20} className="text-yellow-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Filtered</div>
              <div className="text-lg font-bold text-gray-100">{filteredSimulations.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search simulations..."
                className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-polar-600 focus:ring-polar-600/10"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:border-polar-600 focus:ring-polar-600/10"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={handleImport}
                className="btn-secondary"
                title="Import simulation"
              >
                <Upload size={18} />
              </button>
              <button
                onClick={handleClearAll}
                className="btn-secondary text-red-400 hover:text-red-300"
                title="Clear all history"
                disabled={history.length === 0}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Tag Filter */}
          {stats.uniqueTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 mr-2">Filter by tags:</span>
              {stats.uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-polar-600 text-white'
                      : 'bg-dark-surface text-gray-400 hover:text-gray-300'
                  )}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X size={12} className="inline ml-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Simulation List */}
      <div className="space-y-3">
        {filteredSimulations.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <History size={64} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {searchQuery || selectedTags.length > 0 ? 'No matching simulations' : 'No simulation history'}
              </h3>
              <p className="text-gray-400">
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Run a simulation to start building your history'}
              </p>
            </div>
          </Card>
        ) : (
          filteredSimulations.map(simulation => (
            <Card key={simulation.id} className="hover:border-dark-accent transition-colors">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {simulation.name}
                      </h3>
                      {simulation.result && (
                        <Badge variant="success" size="sm">
                          <BarChart3 size={12} className="mr-1" />
                          Completed
                        </Badge>
                      )}
                      {simulation.comparison && (
                        <Badge variant="info" size="sm">
                          Compared
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(simulation.timestamp).toLocaleString()}</span>
                      </div>
                      <div>
                        Scenario: <span className="text-gray-300">{simulation.config.scenario_name}</span>
                      </div>
                      <div>
                        Duration: <span className="text-gray-300">{simulation.config.parameters.duration_hours}h</span>
                      </div>
                    </div>

                    {simulation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {simulation.tags.map(tag => (
                          <Badge key={tag} variant="default" size="sm">
                            <Tag size={10} className="mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {simulation.notes && (
                      <p className="text-sm text-gray-400 italic">{simulation.notes}</p>
                    )}

                    {simulation.result && (
                      <div className="mt-3 flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-400">Fuel: </span>
                          <span className="text-gray-100 font-semibold">
                            {((simulation.result.summary?.total_fuel_consumed_l ?? 0)).toFixed(1)} L
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Renewable: </span>
                          <span className="text-renewable font-semibold">
                            {((simulation.result.summary?.average_renewable_share_percent ?? 0)).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Alerts: </span>
                          <span className="text-yellow-400 font-semibold">
                            {simulation.result.alerts.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onLoadSimulation(simulation.config)}
                      className="btn-icon"
                      title="Load configuration"
                    >
                      <Play size={16} />
                    </button>
                    {simulation.result && (
                      <button
                        onClick={() => onViewResults(simulation)}
                        className="btn-icon"
                        title="View results"
                      >
                        <BarChart3 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(simulation.id)}
                      className="btn-icon"
                      title="Duplicate"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleExport(simulation.id)}
                      className="btn-icon"
                      title="Export"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(simulation.id)}
                      className="btn-icon text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
