export interface RoadmapItem {
  id: string;
  label: string;
}

export const completedFeatures: RoadmapItem[] = [
  { id: 'analyzer-engine', label: 'Analyzer Engine' },
  { id: 'core-integration', label: 'Core Integration' },
  { id: 'api-endpoint', label: 'API Endpoint' },
  { id: 'issue-detection', label: 'Issue Detection' }
];

export const upcomingFeatures: RoadmapItem[] = [
  { id: 'code-cleaning', label: 'Code Cleaning' },
  { id: 'file-uploads', label: 'File Uploads' },
  { id: 'folder-uploads', label: 'Folder Uploads' },
  { id: 'zip-processing', label: 'ZIP Processing' },
  { id: 'download-cleaned', label: 'Download Cleaned Code' },
  { id: 'repository-reports', label: 'Repository Reports' }
];
