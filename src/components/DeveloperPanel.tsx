import DeveloperConsole from './DeveloperConsole';
import { AppItem, DevRequest } from '../types';

interface DeveloperPanelProps {
  userId: string;
  userProfile: any;
  onAddApp: (app: AppItem) => void;
  onClose: () => void;
  publishedApps: AppItem[];
}

export default function DeveloperPanel({ 
  userId, 
  userProfile, 
  onAddApp, 
  onClose, 
  publishedApps
}: DeveloperPanelProps) {
  return (
    <DeveloperConsole 
      userId={userId}
      userProfile={userProfile}
      onAddApp={onAddApp}
      onClose={onClose}
      publishedApps={publishedApps}
    />
  );
}
