'use client';

import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Tag, X } from 'lucide-react';
import { PIPELINE_STAGES, KEYWORD_CATEGORIES, type Organization, type PipelineStage, type KeywordCategory } from '@/lib/db/types';
import PipelineCard from './pipeline-card';
import AddOrgModal from './add-org-modal';

export default function KanbanBoard({ initialOrgs }: { initialOrgs: Organization[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KeywordCategory | ''>('');
  const router = useRouter();

  // Extract unique locations from orgs for the dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    orgs.forEach(o => {
      if (o.location) {
        // Normalize: extract city/region from full location strings
        const parts = o.location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          // Use last 2 parts (e.g., "Halifax, Nova Scotia" from "Dartmouth, Halifax, Nova Scotia")
          locs.add(parts.slice(-2).join(', '));
        }
        locs.add(o.location);
      }
    });
    return Array.from(locs).sort();
  }, [orgs]);

  // Filter orgs
  const filteredOrgs = useMemo(() => {
    return orgs.filter(o => {
      // Text search — matches name, mission, location
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = `${o.name} ${o.mission_focus} ${o.location} ${o.why_fit}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      // Location filter
      if (locationFilter) {
        if (!o.location || !o.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      }
      // Category filter
      if (categoryFilter) {
        if (o.keyword_category !== categoryFilter) return false;
      }
      return true;
    });
  }, [orgs, searchQuery, locationFilter, categoryFilter]);

  const getOrgsByStage = (stage: PipelineStage) =>
    filteredOrgs.filter(o => o.stage === stage);

  const hasActiveFilters = searchQuery || locationFilter || categoryFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setCategoryFilter('');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const orgId = Number(result.draggableId);
    const newStage = result.destination.droppableId as PipelineStage;
    const org = orgs.find(o => o.id === orgId);
    if (!org || org.stage === newStage) return;

    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, stage: newStage } : o));

    try {
      await fetch(`/api/organizations/${orgId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      router.refresh();
    } catch {
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, stage: org.stage } : o));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-silver-600">
          Drag organizations between columns to update their stage. Click a card for details.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-silver-500">
            {hasActiveFilters
              ? `${filteredOrgs.length} of ${orgs.length}`
              : `${orgs.length} total`}
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-ocean-600 hover:bg-ocean-700 rounded-lg flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> Add Organization
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-silver-50 border border-silver-200 rounded-xl px-4 py-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, mission, location..."
            className="w-full pl-9 pr-3 py-1.5 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 bg-white"
          />
        </div>

        {/* Location */}
        <div className="relative min-w-[180px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-400" />
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 bg-white appearance-none cursor-pointer"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="relative min-w-[180px]">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as KeywordCategory | '')}
            className="w-full pl-9 pr-3 py-1.5 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 bg-white appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {KEYWORD_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <AddOrgModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => router.refresh()}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
          {PIPELINE_STAGES.map(stage => {
            const stageOrgs = getOrgsByStage(stage.value);
            return (
              <Droppable key={stage.value} droppableId={stage.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-shrink-0 w-64 rounded-xl border p-3 transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-plum-50 border-plum-300'
                        : 'bg-silver-50 border-silver-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs text-silver-500 ml-auto">{stageOrgs.length}</span>
                    </div>

                    <div className="space-y-2 min-h-[100px]">
                      {stageOrgs.map((org, index) => (
                        <Draggable key={org.id} draggableId={String(org.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-90' : ''}
                            >
                              <PipelineCard org={org} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
