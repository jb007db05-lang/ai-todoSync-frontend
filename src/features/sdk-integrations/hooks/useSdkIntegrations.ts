import { useEffect, useState, useCallback } from 'react';
import type { SdkIntegration } from '@/lib/sdk-integrations/api';
import {
  listIntegrations,
  regenerateKey,
  disableIntegration,
  enableIntegration,
  deleteIntegration
} from '@/lib/sdk-integrations/api';

export function useSdkIntegrations() {
  const [integrations, setIntegrations] = useState<SdkIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listIntegrations();
      setIntegrations(data);
    } catch {
      setError('Failed to load SDK integrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleToggle = async (item: SdkIntegration) => {
    try {
      if (item.status === 'disabled') {
        await enableIntegration(item.id);
      } else {
        await disableIntegration(item.id);
      }
      await fetchList();
    } catch {
      setError('Failed to update integration status.');
    }
  };

  const handleRegenKey = async (id: string) => {
    if (!window.confirm('Regenerating this key will immediately invalidate the current SDK key. Continue?')) return;
    try {
      const { sdkKey } = await regenerateKey(id);
      setCreatedKey(sdkKey);
      await fetchList();
    } catch {
      setError('Failed to regenerate SDK key.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this integration? This action cannot be undone.')) return;
    try {
      await deleteIntegration(id);
      await fetchList();
    } catch {
      setError('Failed to delete integration.');
    }
  };

  const copyKey = (key: string, id: string) => {
    void navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  return {
    integrations,
    loading,
    error,
    setError,
    showCreate,
    setShowCreate,
    createdKey,
    setCreatedKey,
    copiedKeyId,
    expandedId,
    setExpandedId,
    fetchList,
    handleToggle,
    handleRegenKey,
    handleDelete,
    copyKey
  };
}
