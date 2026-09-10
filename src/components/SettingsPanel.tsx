import React from 'react';
import type { Project } from '@/types/project';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';

export interface SettingsPanelProps {
  projects: Project[];
  activeProject?: Project | null;
  onAiConfigChange?: (enabled: boolean, provider: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ projects }) => {
  const settings = useSettings();

  return (
    <SettingsLayout
      user={settings.user}
      activeTab={settings.activeTab}
      setActiveTab={settings.setActiveTab}
      showKey={settings.showKey}
      setShowKey={settings.setShowKey}
      apiKeyCopied={settings.apiKeyCopied}
      schemaCopied={settings.schemaCopied}
      instructionsCopied={settings.instructionsCopied}
      isRegeneratingKey={settings.isRegeneratingKey}
      companionDevices={settings.companionDevices}
      isCompanionModalOpen={settings.isCompanionModalOpen}
      setIsCompanionModalOpen={settings.setIsCompanionModalOpen}
      setSelectedDeviceForRegen={settings.setSelectedDeviceForRegen}
      isLoadingCompanionDevices={settings.isLoadingCompanionDevices}
      slaConfigs={settings.slaConfigs}
      isLoadingSla={settings.isLoadingSla}
      isSavingSla={settings.isSavingSla}
      onCopyApiKey={settings.handleCopyApiKey}
      onCopySchema={settings.handleCopySchema}
      onCopyInstructions={settings.handleCopyInstructions}
      onRegenerateKey={settings.handleRegenerateKey}
      createCompanionDeviceAndKey={settings.createCompanionDeviceAndKey}
      onRevokeCompanionDevice={settings.handleRevokeCompanionDevice}
      onSaveSlaConfig={settings.handleSaveSlaConfig}
      fetchCompanionDevices={settings.fetchCompanionDevices}
      projects={projects}
    />
  );
};

export default SettingsPanel;
