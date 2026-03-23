'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { PIPELINE_STAGES, type Organization, type PipelineStage } from '@/lib/db/types';
import PipelineCard from './pipeline-card';

export default function KanbanBoard({ initialOrgs }: { initialOrgs: Organization[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const router = useRouter();

  const getOrgsByStage = (stage: PipelineStage) =>
    orgs.filter(o => o.stage === stage);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const orgId = Number(result.draggableId);
    const newStage = result.destination.droppableId as PipelineStage;
    const org = orgs.find(o => o.id === orgId);
    if (!org || org.stage === newStage) return;

    // Optimistic update
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, stage: newStage } : o));

    try {
      await fetch(`/api/organizations/${orgId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      router.refresh();
    } catch {
      // Revert on error
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, stage: org.stage } : o));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-silver-600">
          Drag organizations between columns to update their stage. Click a card for details.
        </p>
        <span className="text-sm text-silver-500">{orgs.length} total</span>
      </div>

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
