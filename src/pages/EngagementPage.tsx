import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  CheckSquare,
  GripVertical,
  Layers3,
  Megaphone,
  Plus,
  Radio,
  Save,
  Target,
  Trash2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  createChecklist,
  createGuide,
  createSurvey,
  getGuideAnalyticsSummary,
  listChecklists,
  listGuides,
  listSurveys,
  updateChecklist,
  updateGuideStatus,
  updateSurvey,
  type GuideAnalyticsSummary
} from '@/lib/engagement/api';
import type {
  FrequencyRules,
  Guide,
  GuidePriority,
  GuideStep,
  GuideType,
  TargetingCondition,
  TargetingConditionType,
  TargetingRuleGroup
} from '@/lib/guides/types';

type BuilderTab = 'guides' | 'surveys' | 'checklists' | 'analytics';

const defaultRules = (): TargetingRuleGroup => ({
  id: crypto.randomUUID(),
  operator: 'AND',
  conditions: [],
  groups: []
});

const defaultFrequency: FrequencyRules = {
  showOncePerSession: true,
  cooldownHours: 24,
  maxDisplays: 5
};

const conditionTypes: TargetingConditionType[] = [
  'URL_CONTAINS',
  'URL_EQUALS',
  'ROLE_EQUALS',
  'PLAN_EQUALS',
  'EVENT_TRIGGERED',
  'EVENT_NOT_TRIGGERED',
  'VISITED_PAGE',
  'SESSION_DURATION',
  'ENGAGEMENT_SCORE',
  'COOLDOWN'
];

const guideTypes: GuideType[] = ['MODAL', 'TOUR', 'SMART_TIP', 'HOTSPOT', 'BANNER'];
const priorities: GuidePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function EngagementPage(): JSX.Element {
  const [tab, setTab] = useState<BuilderTab>('guides');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [surveys, setSurveys] = useState<Guide[]>([]);
  const [checklists, setChecklists] = useState<Guide[]>([]);
  const [analytics, setAnalytics] = useState<GuideAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [guideList, surveyList, checklistList, summary] = await Promise.all([
        listGuides(),
        listSurveys(),
        listChecklists(),
        getGuideAnalyticsSummary()
      ]);
      setGuides(guideList);
      setSurveys(surveyList);
      setChecklists(checklistList);
      setAnalytics(summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(
    () => ({
      live: [...guides, ...surveys, ...checklists].filter((item) => item.status === 'LIVE').length,
      drafts: [...guides, ...surveys, ...checklists].filter((item) => item.status === 'DRAFT').length
    }),
    [checklists, guides, surveys]
  );

  return (
    <div className="min-h-full bg-olive-50">
      <div className="border-b border-olive-200 bg-white px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-2xl font-bold text-olive-950">Engagement</h2>
            <p className="m-0 mt-1 text-sm text-olive-500">Guides, surveys, checklists, targeting, and behavior analytics</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right">
            <Metric label="Live" value={totals.live} />
            <Metric label="Drafts" value={totals.drafts} />
            <Metric label="MTU" value={analytics?.mtu.users ?? 0} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <TabButton active={tab === 'guides'} icon={Layers3} label="Guides" onClick={() => setTab('guides')} />
          <TabButton active={tab === 'surveys'} icon={Radio} label="Surveys" onClick={() => setTab('surveys')} />
          <TabButton active={tab === 'checklists'} icon={CheckSquare} label="Checklists" onClick={() => setTab('checklists')} />
          <TabButton active={tab === 'analytics'} icon={BarChart3} label="Analytics" onClick={() => setTab('analytics')} />
        </div>
      </div>

      {message && (
        <div className="mx-8 mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      )}

      <div className="p-8">
        {tab === 'guides' && (
          <GuideBuilder
            guides={guides}
            loading={loading}
            onCreate={async (payload) => {
              await createGuide(payload);
              setMessage('Guide saved.');
              await load();
            }}
            onStatusChange={async (guide, status) => {
              await updateGuideStatus(guide.id, status);
              setMessage(`Guide ${status.toLowerCase()}.`);
              await load();
            }}
          />
        )}
        {tab === 'surveys' && (
          <SurveyBuilder
            surveys={surveys}
            loading={loading}
            onCreate={async (payload) => {
              await createSurvey(payload);
              setMessage('Survey saved.');
              await load();
            }}
            onStatusChange={async (survey, status) => {
              await updateSurvey(survey.id, { status });
              setMessage(`Survey ${status.toLowerCase()}.`);
              await load();
            }}
          />
        )}
        {tab === 'checklists' && (
          <ChecklistBuilder
            checklists={checklists}
            loading={loading}
            onCreate={async (payload) => {
              await createChecklist(payload);
              setMessage('Checklist saved.');
              await load();
            }}
            onStatusChange={async (checklist, status) => {
              await updateChecklist(checklist.id, { status });
              setMessage(`Checklist ${status.toLowerCase()}.`);
              await load();
            }}
          />
        )}
        {tab === 'analytics' && <AnalyticsDashboard analytics={analytics} />}
      </div>
    </div>
  );
}

function GuideBuilder({
  guides,
  loading,
  onCreate,
  onStatusChange
}: {
  guides: Guide[];
  loading: boolean;
  onCreate: (payload: Parameters<typeof createGuide>[0]) => Promise<void>;
  onStatusChange: (guide: Guide, status: 'LIVE' | 'PAUSED' | 'ARCHIVED') => Promise<void>;
}): JSX.Element {
  const [title, setTitle] = useState('New onboarding modal');
  const [description, setDescription] = useState('Introduce the next best action.');
  const [type, setType] = useState<GuideType>('MODAL');
  const [priority, setPriority] = useState<GuidePriority>('MEDIUM');
  const [rules, setRules] = useState<TargetingRuleGroup>(defaultRules);
  const [steps, setSteps] = useState<GuideStep[]>([newStep()]);

  return (
    <BuilderLayout
      list={<ExperienceList experiences={guides} loading={loading} onStatusChange={onStatusChange} />}
      preview={<Preview guide={{ id: 'preview', title, description, type, priority, steps, targetingRules: rules }} />}
    >
      <SectionTitle icon={Megaphone} title="Guide Builder" />
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Title" value={title} onChange={setTitle} />
        <SelectInput label="Type" value={type} values={guideTypes} onChange={(value) => setType(value as GuideType)} />
        <TextInput label="Description" value={description} onChange={setDescription} />
        <SelectInput label="Priority" value={priority} values={priorities} onChange={(value) => setPriority(value as GuidePriority)} />
      </div>
      <StepEditor steps={steps} onChange={setSteps} mode="guide" />
      <RuleBuilder rules={rules} onChange={setRules} />
      <button className="mt-5 flex items-center gap-2 rounded-md bg-olive-700 px-4 py-2.5 text-sm font-bold text-white" onClick={() => onCreate({ title, description, type, priority, targetingRules: rules, frequencyRules: defaultFrequency, steps })} type="button">
        <Save size={16} />
        Save Draft
      </button>
    </BuilderLayout>
  );
}

function SurveyBuilder({
  surveys,
  loading,
  onCreate,
  onStatusChange
}: {
  surveys: Guide[];
  loading: boolean;
  onCreate: (payload: Parameters<typeof createSurvey>[0]) => Promise<void>;
  onStatusChange: (survey: Guide, status: 'LIVE' | 'PAUSED' | 'ARCHIVED') => Promise<void>;
}): JSX.Element {
  const [title, setTitle] = useState('NPS pulse');
  const [description, setDescription] = useState('Ask users how likely they are to recommend Sync Todo.');
  const [priority, setPriority] = useState<GuidePriority>('MEDIUM');
  const [rules, setRules] = useState<TargetingRuleGroup>(defaultRules);
  const [questions, setQuestions] = useState<GuideStep[]>([newSurveyQuestion('NPS')]);

  return (
    <BuilderLayout
      list={<ExperienceList experiences={surveys} loading={loading} onStatusChange={onStatusChange} />}
      preview={<Preview guide={{ id: 'preview-survey', title, description, type: 'SURVEY', priority, steps: questions, targetingRules: rules }} />}
    >
      <SectionTitle icon={Radio} title="Survey Builder" />
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Title" value={title} onChange={setTitle} />
        <SelectInput label="Priority" value={priority} values={priorities} onChange={(value) => setPriority(value as GuidePriority)} />
        <TextInput label="Description" value={description} onChange={setDescription} />
      </div>
      <StepEditor steps={questions} onChange={setQuestions} mode="survey" />
      <RuleBuilder rules={rules} onChange={setRules} />
      <button className="mt-5 flex items-center gap-2 rounded-md bg-olive-700 px-4 py-2.5 text-sm font-bold text-white" onClick={() => onCreate({ title, description, priority, questions, targetingRules: rules, frequencyRules: defaultFrequency })} type="button">
        <Save size={16} />
        Save Survey
      </button>
    </BuilderLayout>
  );
}

function ChecklistBuilder({
  checklists,
  loading,
  onCreate,
  onStatusChange
}: {
  checklists: Guide[];
  loading: boolean;
  onCreate: (payload: Parameters<typeof createChecklist>[0]) => Promise<void>;
  onStatusChange: (checklist: Guide, status: 'LIVE' | 'PAUSED' | 'ARCHIVED') => Promise<void>;
}): JSX.Element {
  const [title, setTitle] = useState('Activation checklist');
  const [description, setDescription] = useState('Help users reach the first success milestone.');
  const [rules, setRules] = useState<TargetingRuleGroup>(defaultRules);
  const [items, setItems] = useState<GuideStep[]>([newChecklistItem()]);

  return (
    <BuilderLayout
      list={<ExperienceList experiences={checklists} loading={loading} onStatusChange={onStatusChange} />}
      preview={<Preview guide={{ id: 'preview-checklist', title, description, type: 'CHECKLIST', priority: 'MEDIUM', steps: items, targetingRules: rules }} />}
    >
      <SectionTitle icon={CheckSquare} title="Checklist Builder" />
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Title" value={title} onChange={setTitle} />
        <TextInput label="Description" value={description} onChange={setDescription} />
      </div>
      <StepEditor steps={items} onChange={setItems} mode="checklist" />
      <RuleBuilder rules={rules} onChange={setRules} />
      <button className="mt-5 flex items-center gap-2 rounded-md bg-olive-700 px-4 py-2.5 text-sm font-bold text-white" onClick={() => onCreate({ title, description, items, targetingRules: rules, frequencyRules: defaultFrequency })} type="button">
        <Save size={16} />
        Save Checklist
      </button>
    </BuilderLayout>
  );
}

function BuilderLayout({ children, list, preview }: { children: ReactNode; list: ReactNode; preview: ReactNode }): JSX.Element {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="grid gap-6">
        <div className="rounded-lg border border-olive-200 bg-white p-6 shadow-sm">{children}</div>
        {list}
      </div>
      {preview}
    </div>
  );
}

function ExperienceList({
  experiences,
  loading,
  onStatusChange
}: {
  experiences: Guide[];
  loading: boolean;
  onStatusChange: (experience: Guide, status: 'LIVE' | 'PAUSED' | 'ARCHIVED') => Promise<void>;
}): JSX.Element {
  return (
    <div className="rounded-lg border border-olive-200 bg-white p-6 shadow-sm">
      <SectionTitle icon={Layers3} title="Library" />
      <div className="grid gap-3">
        {loading && <p className="text-sm text-olive-500">Loading...</p>}
        {!loading && experiences.length === 0 && <p className="text-sm text-olive-500">No experiences yet.</p>}
        {experiences.map((experience) => (
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-olive-100 px-4 py-3" key={experience.id}>
            <div>
              <p className="m-0 text-sm font-bold text-olive-950">{experience.title}</p>
              <p className="m-0 mt-1 text-xs text-olive-500">{experience.type} · {experience.status ?? 'DRAFT'} · {experience.priority}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-olive-200 px-3 py-1.5 text-xs font-bold text-olive-700" onClick={() => onStatusChange(experience, 'LIVE')} type="button">
                Publish
              </button>
              <button className="rounded-md border border-olive-200 px-3 py-1.5 text-xs font-bold text-olive-700" onClick={() => onStatusChange(experience, 'PAUSED')} type="button">
                Pause
              </button>
              <button className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600" onClick={() => onStatusChange(experience, 'ARCHIVED')} type="button">
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepEditor({ steps, onChange, mode }: { steps: GuideStep[]; onChange: (steps: GuideStep[]) => void; mode: 'guide' | 'survey' | 'checklist' }): JSX.Element {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const add = () => onChange([...steps, mode === 'survey' ? newSurveyQuestion('TEXT') : mode === 'checklist' ? newChecklistItem() : newStep()]);
  const update = (index: number, patch: Partial<GuideStep>) => onChange(steps.map((step, current) => (current === index ? { ...step, ...patch } : step)));
  const remove = (index: number) => onChange(steps.filter((_, current) => current !== index));
  const drop = (index: number) => {
    if (dragIndex == null || dragIndex === index) return;
    const next = [...steps];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle icon={GripVertical} title={mode === 'survey' ? 'Questions' : mode === 'checklist' ? 'Items' : 'Steps'} />
        <button className="flex items-center gap-2 rounded-md border border-olive-200 px-3 py-1.5 text-xs font-bold text-olive-700" onClick={add} type="button">
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <div
            className="rounded-md border border-olive-200 bg-olive-50 p-4"
            draggable
            key={step.id}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(index)}
          >
            <div className="grid grid-cols-[24px_1fr_120px_32px] gap-3">
              <GripVertical className="mt-2 text-olive-400" size={18} />
              <TextInput label="Title" value={step.title} onChange={(value) => update(index, { title: value })} />
              {mode === 'survey' ? (
                <SelectInput label="Type" value={step.type ?? 'TEXT'} values={['NPS', 'TEXT', 'TEXTAREA', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'RATING_SCALE', 'DROPDOWN', 'YES_NO']} onChange={(value) => update(index, { type: value as GuideStep['type'] })} />
              ) : mode === 'checklist' ? (
                <TextInput label="Event" value={step.linkedEvent ?? ''} onChange={(value) => update(index, { linkedEvent: value })} />
              ) : (
                <TextInput label="Selector" value={step.selector ?? ''} onChange={(value) => update(index, { selector: value })} />
              )}
              <button className="mt-6 flex h-9 w-9 items-center justify-center rounded-md text-red-500 hover:bg-red-50" onClick={() => remove(index)} title="Remove" type="button">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3">
              <TextInput label="Description" value={step.description ?? ''} onChange={(value) => update(index, { description: value })} />
            </div>
            {mode === 'survey' && ['SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN'].includes(step.type ?? '') && (
              <div className="mt-3">
                <TextInput label="Options, comma-separated" value={(step.options ?? []).join(', ')} onChange={(value) => update(index, { options: value.split(',').map((entry) => entry.trim()).filter(Boolean) })} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleBuilder({ rules, onChange }: { rules: TargetingRuleGroup; onChange: (rules: TargetingRuleGroup) => void }): JSX.Element {
  const addCondition = () => {
    const condition: TargetingCondition = {
      id: crypto.randomUUID(),
      type: 'URL_CONTAINS',
      value: '/dashboard'
    };
    onChange({ ...rules, conditions: [...(rules.conditions ?? []), condition] });
  };
  const updateCondition = (id: string, patch: Partial<TargetingCondition>) => {
    onChange({
      ...rules,
      conditions: (rules.conditions ?? []).map((condition) => (condition.id === id ? { ...condition, ...patch } : condition))
    });
  };
  const removeCondition = (id: string) => {
    onChange({ ...rules, conditions: (rules.conditions ?? []).filter((condition) => condition.id !== id) });
  };

  return (
    <div className="mt-6 rounded-lg border border-olive-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle icon={Target} title="Targeting" />
        <div className="flex items-center gap-2">
          <select className="rounded-md border border-olive-200 px-2 py-1.5 text-xs font-bold" onChange={(event) => onChange({ ...rules, operator: event.target.value as 'AND' | 'OR' })} value={rules.operator}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <button className="rounded-md border border-olive-200 px-3 py-1.5 text-xs font-bold text-olive-700" onClick={addCondition} type="button">
            Add Condition
          </button>
        </div>
      </div>
      <div className="grid gap-2">
        {(rules.conditions ?? []).map((condition) => (
          <div className="grid grid-cols-[180px_1fr_32px] gap-2" key={condition.id}>
            <select className="rounded-md border border-olive-200 px-2 py-2 text-sm" onChange={(event) => updateCondition(condition.id, { type: event.target.value as TargetingConditionType })} value={condition.type}>
              {conditionTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input className="rounded-md border border-olive-200 px-3 py-2 text-sm" onChange={(event) => updateCondition(condition.id, { value: event.target.value, eventName: event.target.value })} value={String(condition.value ?? condition.eventName ?? '')} />
            <button className="rounded-md text-red-500 hover:bg-red-50" onClick={() => removeCondition(condition.id)} type="button">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {(rules.conditions ?? []).length === 0 && <p className="m-0 text-sm text-olive-500">No conditions means all authenticated users are eligible.</p>}
      </div>
    </div>
  );
}

function Preview({ guide }: { guide: Guide }): JSX.Element {
  return (
    <aside className="sticky top-6 h-fit rounded-lg border border-olive-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={Bell} title="Preview" />
      <div className="mt-4 rounded-lg border border-olive-200 bg-olive-50 p-4">
        <p className="m-0 text-xs font-bold uppercase tracking-widest text-olive-500">{guide.type}</p>
        <h3 className="m-0 mt-2 text-lg font-bold text-olive-950">{guide.title}</h3>
        <p className="m-0 mt-2 text-sm text-olive-600">{guide.description}</p>
        <div className="mt-4 grid gap-2">
          {guide.steps.map((step, index) => (
            <div className="rounded-md bg-white px-3 py-2 text-sm" key={step.id}>
              <span className="font-bold text-olive-900">{index + 1}. {step.title}</span>
              {step.description && <p className="m-0 mt-1 text-xs text-olive-500">{step.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function AnalyticsDashboard({ analytics }: { analytics: GuideAnalyticsSummary | null }): JSX.Element {
  if (!analytics) {
    return <div className="rounded-lg border border-olive-200 bg-white p-6 text-sm text-olive-500">No analytics yet.</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Impressions" value={analytics.guides.impressions} />
        <MetricCard label="Completions" value={analytics.guides.completions} />
        <MetricCard label="Dismissals" value={analytics.guides.dismissals} />
        <MetricCard label="NPS" value={Math.round(analytics.surveys.nps)} />
      </div>
      <div className="rounded-lg border border-olive-200 bg-white p-6">
        <SectionTitle icon={BarChart3} title="Engagement Events" />
        <div className="mt-4 grid gap-2">
          {analytics.events.map((event) => (
            <div className="grid grid-cols-[1fr_80px] rounded-md bg-olive-50 px-3 py-2 text-sm" key={event.eventName}>
              <span className="font-semibold text-olive-900">{event.eventName}</span>
              <span className="text-right font-bold text-olive-700">{event.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Promoters" value={analytics.surveys.promoters} />
        <MetricCard label="Passives" value={analytics.surveys.passives} />
        <MetricCard label="Detractors" value={analytics.surveys.detractors} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded-md border border-olive-200 px-4 py-2">
      <p className="m-0 text-xs font-bold uppercase tracking-widest text-olive-400">{label}</p>
      <p className="m-0 text-xl font-black text-olive-950">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded-lg border border-olive-200 bg-white p-5 shadow-sm">
      <p className="m-0 text-xs font-bold uppercase tracking-widest text-olive-400">{label}</p>
      <p className="m-0 mt-2 text-3xl font-black text-olive-950">{value}</p>
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }): JSX.Element {
  return (
    <button className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${active ? 'bg-olive-700 text-white' : 'border border-olive-200 text-olive-700 hover:bg-olive-50'}`} onClick={onClick} type="button">
      <Icon size={16} />
      {label}
    </button>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Icon size={17} className="text-olive-700" />
      <h3 className="m-0 text-sm font-black uppercase tracking-widest text-olive-900">{title}</h3>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }): JSX.Element {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-olive-500">
      {label}
      <input className="rounded-md border border-olive-200 px-3 py-2 text-sm font-medium normal-case tracking-normal text-olive-950 focus:border-olive-500 focus:outline-none" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function SelectInput({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }): JSX.Element {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-widest text-olive-500">
      {label}
      <select className="rounded-md border border-olive-200 px-3 py-2 text-sm font-medium normal-case tracking-normal text-olive-950 focus:border-olive-500 focus:outline-none" onChange={(event) => onChange(event.target.value)} value={value}>
        {values.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
      </select>
    </label>
  );
}

function newStep(): GuideStep {
  return {
    id: crypto.randomUUID(),
    title: 'Explain this area',
    description: 'Tell users why this workflow matters.',
    placement: 'AUTO',
    selector: '[data-guide-target]'
  };
}

function newSurveyQuestion(type: GuideStep['type']): GuideStep {
  return {
    id: crypto.randomUUID(),
    title: type === 'NPS' ? 'How likely are you to recommend Sync Todo?' : 'Question',
    type,
    min: 0,
    max: type === 'NPS' ? 10 : 5,
    options: ['Option A', 'Option B']
  };
}

function newChecklistItem(): GuideStep {
  return {
    id: crypto.randomUUID(),
    title: 'Create first project',
    description: 'Completes when project_created is tracked.',
    linkedEvent: 'project_created',
    estimatedMinutes: 5
  };
}

export default EngagementPage;
