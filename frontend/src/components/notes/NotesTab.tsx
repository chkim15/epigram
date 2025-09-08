'use client';

import React from 'react';
import { Problem } from '@/types/database';
import { NotesWithMath } from './NotesWithMath';

interface NotesTabProps {
  currentProblem: Problem | null;
}

export function NotesTab({ currentProblem }: NotesTabProps) {
  return <NotesWithMath currentProblem={currentProblem} />;
}