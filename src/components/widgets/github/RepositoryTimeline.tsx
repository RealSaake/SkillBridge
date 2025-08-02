import React, { useState, useMemo } from 'react';
import { terminalLogger } from '../../../utils/terminalLogger';

interface RepositoryEvent {
  id: string;
  type: 'commit' | 'pull_request' | 'release' | 'issue' | 'fork' | 'star';
  repository: string;
  title: string;
  description?: string;
  date: string;
  url: string;
  author: string;
  metadata?: {
    additions?: number;
    deletions?: number;
    files_changed?: number;
    language?: string;
    stars?: number;
    forks?: number;
  };
}

interface RepositoryTimelineProps {
  events: RepositoryEvent[];
  className?: string;
  maxEvents?: number;
  showFilters?: boolean;
}

const EVENT_ICONS: Record<string, string> = {
  commit: '📝',
  pull_request: '🔀',
  release: '🚀',
  issue: '🐛',
  fork: '🍴',
  star: '⭐'
};

const EVENT_COLORS: Record<string, string> = {
  commit: 'bg-blue-100 text-blue-800 border-blue-200',
  pull_request: 'bg-purple-100 text-purple-800 border-purple-200',
  release: 'bg-green-100 text-green-800 border-green-200',
  issue: 'bg-red-100 text-red-800 border-red-200',
  fork: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  star: 'bg-orange-100 text-orange-800 border-orange-200'
};

export const RepositoryTimeline: React.FC<RepositoryTimelineProps> = ({
  events,
  className = '',
  maxEvents = 50,
  showFilters = true
}) => {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const { filteredEvents, repositories, eventTypes } = useMemo(() => {
    terminalLogger.debug('RepositoryTimeline', 'Processing timeline events', {
      totalEvents: events.length,
      maxEvents,
      hasFilters: selectedTypes.size > 0 || selectedRepo || searchQuery
    });

    // Get unique repositories and event types
    const repositories = Array.from(new Set(events.map(e => e.repository))).sort();
    const eventTypes = Array.from(new Set(events.map(e => e.type))).sort();

    // Apply filters
    let filtered = events;

    if (selectedTypes.size > 0) {
      filtered = filtered.filter(event => selectedTypes.has(event.type));
    }

    if (selectedRepo) {
      filtered = filtered.filter(event => event.repository === selectedRepo);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.repository.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first) and limit
    const filteredEvents = filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxEvents);

    return { filteredEvents, repositories, eventTypes };
  }, [events, selectedTypes, selectedRepo, searchQuery, maxEvents]);

  const toggleEventType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
    
    terminalLogger.info('RepositoryTimeline', 'Event type filter toggled', {
      type,
      isSelected: newSelected.has(type),
      totalSelected: newSelected.size
    });
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSelectedRepo('');
    setSearchQuery('');
    terminalLogger.info('RepositoryTimeline', 'All filters cleared');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatEventMetadata = (event: RepositoryEvent): string => {
    const { metadata } = event;
    if (!metadata) return '';

    const parts: string[] = [];
    
    if (metadata.additions !== undefined && metadata.deletions !== undefined) {
      parts.push(`+${metadata.additions} -${metadata.deletions}`);
    }
    
    if (metadata.files_changed) {
      parts.push(`${metadata.files_changed} files`);
    }
    
    if (metadata.language) {
      parts.push(metadata.language);
    }
    
    if (metadata.stars) {
      parts.push(`${metadata.stars} stars`);
    }
    
    if (metadata.forks) {
      parts.push(`${metadata.forks} forks`);
    }

    return parts.join(' • ');
  };

  const handleEventClick = (eventId: string, url: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(eventId);
      terminalLogger.info('RepositoryTimeline', 'Event expanded', {
        eventId,
        url
      });
    }
  };

  return (
    <div className={`repository-timeline ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Repository Activity</h4>
        <div className="text-xs text-gray-500">
          {filteredEvents.length} of {events.length} events
          {selectedTypes.size > 0 || selectedRepo || searchQuery ? ' (filtered)' : ''}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 space-y-3">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Repository filter */}
          <div>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All repositories</option>
              {repositories.map(repo => (
                <option key={repo} value={repo}>{repo}</option>
              ))}
            </select>
          </div>

          {/* Event type filters */}
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleEventType(type)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedTypes.has(type)
                    ? EVENT_COLORS[type] || 'bg-gray-100 text-gray-800 border-gray-200'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {EVENT_ICONS[type]} {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {(selectedTypes.size > 0 || selectedRepo || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <div className="text-sm">No events found</div>
            {(selectedTypes.size > 0 || selectedRepo || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2"
              >
                Clear filters to see all events
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handleEventClick(event.id, event.url)}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${EVENT_COLORS[event.type] || 'bg-gray-100 text-gray-800'}`}>
                  {EVENT_ICONS[event.type] || '📄'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {event.repository}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      by {event.author}
                      {formatEventMetadata(event) && (
                        <span className="ml-2">• {formatEventMetadata(event)}</span>
                      )}
                    </div>
                    
                    {expandedEvent === event.id && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on GitHub →
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded details */}
              {expandedEvent === event.id && event.metadata && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {event.metadata.additions !== undefined && (
                      <div>
                        <span className="text-gray-500">Additions:</span>
                        <span className="ml-1 text-green-600">+{event.metadata.additions}</span>
                      </div>
                    )}
                    {event.metadata.deletions !== undefined && (
                      <div>
                        <span className="text-gray-500">Deletions:</span>
                        <span className="ml-1 text-red-600">-{event.metadata.deletions}</span>
                      </div>
                    )}
                    {event.metadata.files_changed && (
                      <div>
                        <span className="text-gray-500">Files:</span>
                        <span className="ml-1 text-gray-900">{event.metadata.files_changed}</span>
                      </div>
                    )}
                    {event.metadata.language && (
                      <div>
                        <span className="text-gray-500">Language:</span>
                        <span className="ml-1 text-gray-900">{event.metadata.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load more indicator */}
      {events.length > maxEvents && filteredEvents.length === maxEvents && (
        <div className="text-center mt-4">
          <div className="text-xs text-gray-500">
            Showing {maxEvents} of {events.length} events
          </div>
        </div>
      )}
    </div>
  );
};