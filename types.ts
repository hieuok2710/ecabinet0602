export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO date string
  location: string;
  attendees: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx';
  size: number;
  url: string; // Blob URL
  file: File;
  uploadedAt: Date;
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}