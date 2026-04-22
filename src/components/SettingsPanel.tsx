import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Settings2,
  UserCircle
} from 'lucide-react';

import ManageDevicesModal from '@/components/ManageDevicesModal';
import Modal from '@/components/Modal';
import SectionCard from '@/components/SectionCard';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmationContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';
import {
  SYNC_CHATGPT_ACTION_SCHEMA,
  SYNC_CHATGPT_INSTRUCTION_TEXT
} from '@/features/sync/schema';

interface RegenerateSyncKeyResponse {
  message: string;
  data: {
    syncApiKey: string;
  };
}

interface CompanionDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  status: 'active' | 'revoked' | 'pending';
  createdAt?: string;
  updatedAt?: string;
  revokedAt?: string | null;
}

interface CompanionDevicesResponse {
  message: string;
  data: {
    devices: CompanionDevice[];
  };
}

interface CompanionKeyResponse {
  message: string;
  data: {
    key: string;
    maxCompanionDevices: number;
    activeCompanionDevices: number;
  };
}

const chatGptIntegrationSteps = [
  {
    title: "Step 1: Open GPTs from ChatGPT sidebar",
    summary: "Navigate to the GPTs section to access and create custom GPTs.",
    details: [
      "From the ChatGPT home page, look at the left sidebar.",
      "Find the option labeled 'GPTs'.",
      "Click 'GPTs' to open the GPT explorer page.",
      "This section allows you to browse, manage, and create your own GPTs."
    ],
    image: "https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863067/step1_fv1uo6.png"
  },
  {
    title: "Step 2: Click on Create to start a new GPT",
    summary: "Start building your custom GPT by clicking the Create button on the GPTs page.",
    details: [
      "On the GPTs explorer page, look at the top-right corner.",
      "Click the '+ Create' button next to 'My GPTs'.",
      "This opens the GPT Builder interface.",
      "You’ll be taken to the screen where you configure your custom GPT."
    ],
    image: "https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863066/step2_xi5if1.png"
  },
  {
    title: "Step 3: Configure your GPT details",
    summary: "Fill in the basic configuration including name, description, and instructions to define your GPT’s behavior.",
    details: [
      "In the Configure tab, enter a name for your GPT.",
      "Add a short description explaining what your GPT does.",
      "Upload a logo if you want one.",
      "Paste the following instructions:"
    ],
    code: SYNC_CHATGPT_INSTRUCTION_TEXT,
    image: "https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863066/step3_sgj3se.png"
  },
  {
    title: "Step 4: Add actions and connect your API",
    summary: "Create a new action and paste your OpenAPI schema to connect your backend.",
    details: [
      "Scroll down to the bottom of the Configure page.",
      "Click on 'Create new action'.",
      "A new screen will open with Authentication and Schema fields.",
      "You will configure API Key authentication for this action in the next step.",
      "Copy and paste the following schema into the Schema field:"
    ],
    code: SYNC_CHATGPT_ACTION_SCHEMA,
    image: "https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863066/step4_b9fukz.png"
  },
  {
    title: "Step 5: Configure API authentication",
    summary: "Set up API key authentication so your GPT can securely call your backend.",
    details: [
      "In the Authentication settings, select 'API Key'.",
      "Enter your sync API key from the app settings.",
      "Under Auth Type, select 'Custom'.",
      "In 'Custom Header Name', enter: x-sync-api-key",
      "Click 'Save' to apply the authentication settings."
    ],
    image: "https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863066/step5_o7jbyl.png"
  },
  {
    title: "Step 6: Create your GPT",
    summary: "Finalize and create your custom GPT with the configured settings.",
    details: [
      "Review all your configurations including instructions, actions, and authentication.",
      "Click the 'Create' button at the top right.",
      "Select Create App For Only Me.",
      "Your custom GPT will now be created and ready to use.",
      "You can immediately start testing tasks, epics, project notes, and summary queries."
    ],
    image: "https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863065/step6_ix2pos.png"
  }
];

function SettingsPanel(): JSX.Element {
  const { refreshUser, session, user, updateProfile } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [devices, setDevices] = useState<CompanionDevice[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isGeneratingCompanionKey, setIsGeneratingCompanionKey] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>('mobile');

  // Profile management state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileSuccess(false);
    try {
      await updateProfile({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim() 
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setErrorMessage('Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const [generatedCompanionKey, setGeneratedCompanionKey] = useState<{
    key: string;
    deviceName: string;
  } | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const canManagePrimarySecurity = session?.deviceType === 'primary';

  const loadDevices = async (): Promise<void> => {
    try {
      const response = await api.get<CompanionDevicesResponse>('/auth/devices');
      console.info('[SettingsPanel] Raw API Response:', JSON.stringify(response.data, null, 2));
      const fetched = response.data.data?.devices ?? [];
      console.info('[SettingsPanel] Extracted Devices Array:', fetched);
      setDevices(fetched);
    } catch (err) {
      console.error('[SettingsPanel] Error loading devices:', err);
    }
  };

  useEffect(() => {
    console.info('[SettingsPanel] Current Devices State:', devices);
  }, [devices]);

  useEffect(() => {
    if (canManagePrimarySecurity) {
      void loadDevices();
    }
  }, [canManagePrimarySecurity]);

  const handleRegenerateKey = async (): Promise<void> => {
    const isConfirmed = await confirm({
      title: 'Regenerate Sync Key',
      message: 'Are you sure you want to regenerate your sync API key? Any existing GPT integrations using this key will stop working immediately.',
      confirmText: 'Regenerate Key',
      type: 'danger'
    });

    if (!isConfirmed) return;

    setIsRegenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.patch<RegenerateSyncKeyResponse>('/auth/regenerate-sync-key');
      console.info('Sync key regenerated:', response.data);
      await refreshUser();
      setSuccessMessage('Sync API key regenerated successfully.');
    } catch {
      setErrorMessage('Unable to regenerate sync API key right now.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateCompanionKey = async (): Promise<void> => {
    if (!deviceName.trim()) {
      setErrorMessage('Device name is required to generate a companion key.');
      return;
    }

    setIsGeneratingCompanionKey(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.post<CompanionKeyResponse>('/auth/companion-keys', {
        deviceName: deviceName.trim(),
        deviceType
      });
      setGeneratedCompanionKey({
        key: response.data.data.key,
        deviceName: deviceName.trim()
      });
      setDeviceName('');
      void loadDevices();
    } catch {
      setErrorMessage('Unable to generate companion key right now.');
    } finally {
      setIsGeneratingCompanionKey(false);
    }
  };

  const handleCopy = async (text: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      showToast({ message: 'Unable to copy to clipboard.', variant: 'error' });
    }
  };

  const ghostBtn = 'inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors';
  const primaryBtn = 'inline-flex items-center gap-1.5 px-4 py-2 bg-olive-900 dark:bg-olive-600 text-white rounded text-sm font-medium hover:bg-olive-800 dark:hover:bg-olive-500 disabled:opacity-50 transition-colors';

  return (
    <div className="grid gap-8 p-1">
      {/* <div className="grid gap-1 mb-2">
        <h2 className="text-[1.5rem] font-bold text-olive-950 dark:text-white m-0">Settings</h2>
        <p className="text-zinc-500 dark:text-slate-400 m-0">Manage your profile, account security, and integrations.</p>
      </div> */}

      {/* Profile Section */}
      <SectionCard>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-olive-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">Account</span>
            <h2 className="mt-1 mb-1 text-olive-950 dark:text-slate-100">Profile Information</h2>
            <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Update your personal details used across the workspace.</p>
          </div>
          <span className="flex items-center justify-center w-10 h-10 bg-olive-600/8 dark:bg-blue-400/12 rounded-xl text-olive-600 dark:text-blue-400 shrink-0">
            <UserCircle size={18} />
          </span>
        </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-olive-900 dark:text-slate-300">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 transition-all text-olive-950 dark:text-slate-100"
                placeholder="Enter your first name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-olive-900 dark:text-slate-300">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 transition-all text-olive-950 dark:text-slate-100"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-olive-900 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl text-zinc-500 cursor-not-allowed"
            />
            <p className="text-[0.7rem] text-zinc-400 mt-1">Email cannot be changed directly. Contact support for help.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile || (firstName === (user?.firstName || '') && lastName === (user?.lastName || ''))}
              className="flex items-center gap-2 px-6 py-2.5 bg-olive-900 text-white rounded-xl font-bold text-sm hover:bg-olive-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUpdatingProfile ? (
                 <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : profileSuccess ? (
                <Check className="w-4 h-4" />
              ) : null}
              {isUpdatingProfile ? 'Saving...' : profileSuccess ? 'Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Top grid: Security + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync API Key card */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-olive-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">Security</span>
              <h2 className="mt-1 mb-1 text-olive-950 dark:text-slate-100">Sync API Key</h2>
              <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Your unique key for connecting external task tools.</p>
            </div>
            <span className="flex items-center justify-center w-10 h-10 bg-olive-600/8 dark:bg-blue-400/12 rounded-xl text-olive-600 dark:text-blue-400 shrink-0">
              <Shield size={18} />
            </span>
          </div>

          {/* Key display */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-4">
            <KeyRound className="text-zinc-400 dark:text-slate-500 shrink-0" size={16} />
            <code className="flex-1 text-[0.85rem] text-zinc-700 dark:text-slate-300 break-all">{user?.syncApiKey || 'No key generated'}</code>
            <button
              className="flex items-center justify-center w-7 h-7 rounded text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-200 transition-colors"
              onClick={() => user?.syncApiKey && handleCopy(user.syncApiKey, -1)}
              type="button"
            >
              {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <button
            className={ghostBtn}
            disabled={isRegenerating}
            onClick={() => void handleRegenerateKey()}
            type="button"
          >
            <RefreshCcw className={isRegenerating ? 'animate-spin' : ''} size={14} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Key'}
          </button>

          {successMessage && <p className="text-teal-600 dark:text-teal-400 m-0 text-sm mt-3">{successMessage}</p>}
          {errorMessage && <p className="text-red-600 dark:text-red-400 m-0 text-sm mt-3">{errorMessage}</p>}
        </SectionCard>

        {/* Companion Access card */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-olive-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">Devices</span>
              <h2 className="mt-1 mb-1 text-olive-950 dark:text-slate-100">Companion Access</h2>
              <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Manage secure keys for mobile, desktop, or voice apps.</p>
            </div>
            <span className="flex items-center justify-center w-10 h-10 bg-olive-600/8 dark:bg-blue-400/12 rounded-xl text-olive-600 dark:text-blue-400 shrink-0">
              <Smartphone size={18} />
            </span>
          </div>

          {canManagePrimarySecurity ? (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm text-zinc-400 dark:text-slate-500 border border-zinc-100 dark:border-slate-700">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest m-0 mb-0.5">Device Registry</p>
                      <p className="text-sm font-semibold text-olive-950 dark:text-slate-100 m-0">
                        {devices.length} registered {devices.length === 1 ? 'device' : 'devices'}
                      </p>
                    </div>
                  </div>
                  <button
                    className={ghostBtn}
                    onClick={() => setIsManageModalOpen(true)}
                    type="button"
                  >
                    <Settings2 size={14} />
                    Manage devices
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-slate-800/50">
                  <p className="text-[0.65rem] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest mb-2">New Device Key</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="bg-white/50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-olive-950 dark:text-slate-100 transition-all focus:outline-none focus:border-olive-500"
                      onChange={(event) => setDeviceName(event.target.value)}
                      placeholder="e.g. Work Mobile"
                      value={deviceName}
                    />
                    <select
                      className="bg-white/50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-olive-950 dark:text-slate-100 transition-all focus:outline-none focus:border-olive-500"
                      onChange={(event) => setDeviceType(event.target.value)}
                      value={deviceType}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                      <option value="desktop">Desktop</option>
                      </select>
                  </div>
                  <button
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-olive-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    disabled={isGeneratingCompanionKey || !deviceName.trim() || devices.length >= 5}
                    onClick={() => void handleGenerateCompanionKey()}
                    type="button"
                  >
                    <Shield size={16} />
                    {isGeneratingCompanionKey ? 'Generating...' : 'Generate Device Key'}
                  </button>
                </div>
              </div>

              {isManageModalOpen && (
                <ManageDevicesModal
                  onClose={() => setIsManageModalOpen(false)}
                  onDevicesChanged={() => {
                    void loadDevices();
                  }}
                />
              )}
            </>
          ) : (
            <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 rounded-xl p-5 text-center">
              <span className="text-zinc-400 dark:text-slate-500 text-sm">Restricted on companion devices</span>
              <strong className="block mt-1.5 text-zinc-700 dark:text-slate-300">Only the main device can manage companion devices.</strong>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ChatGPT Integration */}
      <SectionCard>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-olive-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">A.I.</span>
            <h2 className="mt-1 mb-1 text-olive-950 dark:text-slate-100">ChatGPT Integration</h2>
            <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Configure a custom GPT to manage your tasks via voice or chat.</p>
          </div>
          <span className="flex items-center justify-center w-10 h-10 bg-olive-600/8 dark:bg-blue-400/12 rounded-xl text-olive-600 dark:text-blue-400 shrink-0">
            <Sparkles size={18} />
          </span>
        </div>

        {/* Accordion steps */}
        <div className="grid gap-3">
          {chatGptIntegrationSteps.map((step, index) => {
            const isOpen = openStepIndex === index;
            const panelId = `chatgpt-step-panel-${index}`;

            return (
              <article
                key={step.title}
                className={[
                  'border border-zinc-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all',
                  isOpen ? 'bg-zinc-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'
                ].join(' ')}
              >
                {/* Trigger */}
                <button
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenStepIndex(isOpen ? null : index)}
                  type="button"
                >
                  <span className="grid gap-0.5">
                    <strong className="text-olive-950 dark:text-slate-100 text-[0.95rem]">{step.title}</strong>
                    <span className="text-zinc-500 dark:text-slate-400 text-sm">{step.summary}</span>
                  </span>
                  <span className="flex items-center justify-center w-6 h-6 text-zinc-400 dark:text-slate-500 text-lg shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {/* Panel */}
                {isOpen && (
                  <div className="px-5 pb-5 grid gap-4" id={panelId}>
                    <div className="grid grid-cols-[1fr_280px] gap-6">
                      <ol className="text-zinc-700 dark:text-slate-300 text-sm list-decimal pl-4 grid gap-2">
                        {step.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ol>
                      <img
                        alt={step.title}
                        className="rounded-lg border border-zinc-200 dark:border-slate-700 w-full object-cover"
                        src={step.image}
                      />
                    </div>
                    {step.code && (
                      <div className="relative">
                        <button
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-600 transition-colors"
                          onClick={() => handleCopy(step.code!, index)}
                          type="button"
                        >
                          {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                        <pre className="bg-olive-900 dark:bg-[#0d1117] text-zinc-100 text-[0.8rem] leading-relaxed rounded-xl p-5 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </SectionCard>

      {/* Generated key modal */}
      {generatedCompanionKey && (
        <Modal onClose={() => setGeneratedCompanionKey(null)} title="Companion Device Key">
          <div className="grid gap-4">
            <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">
              Key for <strong className="text-olive-900 dark:text-slate-200">{generatedCompanionKey?.deviceName}</strong>. Copy it now; it won't be shown again.
            </p>
            <code className="block bg-olive-900 dark:bg-[#0d1117] text-zinc-100 text-[0.85rem] rounded-xl p-4 break-all">
              {generatedCompanionKey?.key}
            </code>
            <div className="flex gap-3">
              <button className={primaryBtn} onClick={() => generatedCompanionKey?.key && void handleCopy(generatedCompanionKey.key, -2)} type="button">
                {copiedIndex === -2 ? <Check size={14} /> : <Copy size={14} />}
                Copy Key
              </button>
              <button className={ghostBtn} onClick={() => setGeneratedCompanionKey(null)} type="button">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SettingsPanel;
