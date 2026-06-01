import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Megaphone, MousePointerClick, Sparkles, X } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import {
  evaluateRuntime,
  submitSurveyResponse,
  trackEngagementEvent
} from '@/lib/engagement/api';
import type { EngagementEventName, Guide, GuideStep } from '@/lib/guides/types';

interface GuideRuntimeProviderProps {
  children: ReactNode;
}

interface RuntimeEventDetail {
  eventName: string;
  properties?: Record<string, unknown>;
}

const SESSION_STARTED_AT = Date.now();

export function GuideRuntimeProvider({ children }: GuideRuntimeProviderProps): JSX.Element {
  const location = useLocation();
  const { user, session } = useAuth();
  const [experiences, setExperiences] = useState<Guide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const evaluatingRef = useRef(false);

  const activeGuide = experiences[activeIndex] ?? null;

  const evaluate = useCallback(
    async (event?: RuntimeEventDetail) => {
      if (!user || evaluatingRef.current) {
        return;
      }

      evaluatingRef.current = true;
      try {
        const result = await evaluateRuntime({
          userId: user.id,
          sessionId: session?.sessionId,
          url: window.location.href,
          referrer: document.referrer,
          role: 'ADMIN',
          plan: 'default',
          userProperties: {
            email: user.email,
            name: user.name
          },
          session: {
            durationSeconds: Math.floor((Date.now() - SESSION_STARTED_AT) / 1000),
            count: Number(sessionStorage.getItem('sync-session-count') ?? '1'),
            engagementScore: Math.min(100, Math.floor((Date.now() - SESSION_STARTED_AT) / 6000))
          },
          eventName: event?.eventName,
          eventProperties: event?.properties
        });
        setExperiences(result);
        setActiveIndex(0);
        setStepIndex(0);
      } catch {
        setExperiences([]);
      } finally {
        evaluatingRef.current = false;
      }
    },
    [session?.sessionId, user]
  );

  useEffect(() => {
    const count = Number(sessionStorage.getItem('sync-session-count') ?? '0') + 1;
    sessionStorage.setItem('sync-session-count', String(count));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void evaluate();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [evaluate, location.pathname, location.search]);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<RuntimeEventDetail>).detail;
      if (detail?.eventName) {
        void evaluate(detail);
      }
    };
    window.addEventListener('sync:analytics-event', listener);
    return () => window.removeEventListener('sync:analytics-event', listener);
  }, [evaluate]);

  const track = useCallback(
    async (eventName: EngagementEventName, guide: Guide, step?: GuideStep, properties?: Record<string, unknown>) => {
      const surveyId = typeof guide.metadata?.surveyId === 'string' ? guide.metadata.surveyId : undefined;
      const checklistId = typeof guide.metadata?.checklistId === 'string' ? guide.metadata.checklistId : undefined;
      await trackEngagementEvent({
        eventName,
        guideId: surveyId ? undefined : guide.id,
        surveyId,
        checklistId,
        stepId: step?.id,
        userId: user?.id,
        sessionId: session?.sessionId,
        properties
      });
    },
    [session?.sessionId, user?.id]
  );

  const closeActive = useCallback(
    (completed: boolean) => {
      if (!activeGuide) {
        return;
      }

      const eventName = completed
        ? activeGuide.type === 'SURVEY'
          ? 'survey_completed'
          : 'guide_completed'
        : activeGuide.type === 'SURVEY'
          ? 'survey_abandoned'
          : 'guide_dismissed';

      void track(eventName, activeGuide);
      setActiveIndex((current) => current + 1);
      setStepIndex(0);
    },
    [activeGuide, track]
  );

  const runtimeOverlay = useMemo(() => {
    if (!activeGuide) {
      return null;
    }

    return (
      <GuideOverlay
        guide={activeGuide}
        stepIndex={stepIndex}
        onDismiss={() => closeActive(false)}
        onComplete={() => closeActive(true)}
        onNext={() => {
          const step = activeGuide.steps[stepIndex];
          void track('step_completed', activeGuide, step);
          setStepIndex((current) => Math.min(current + 1, activeGuide.steps.length - 1));
        }}
        onPrevious={() => setStepIndex((current) => Math.max(current - 1, 0))}
        onStepViewed={(step) => void track('step_viewed', activeGuide, step)}
        onSurveySubmit={async (answers) => {
          const surveyId = typeof activeGuide.metadata?.surveyId === 'string' ? activeGuide.metadata.surveyId : undefined;
          if (surveyId) {
            await submitSurveyResponse(surveyId, {
              userId: user?.id,
              sessionId: session?.sessionId,
              answers
            });
          } else {
            await track('survey_completed', activeGuide, undefined, { answers });
          }
          setActiveIndex((current) => current + 1);
          setStepIndex(0);
        }}
        onTrack={(eventName, step, properties) => void track(eventName, activeGuide, step, properties)}
      />
    );
  }, [activeGuide, closeActive, session?.sessionId, stepIndex, track, user?.id]);

  return (
    <>
      {children}
      {runtimeOverlay}
    </>
  );
}

interface GuideOverlayProps {
  guide: Guide;
  stepIndex: number;
  onDismiss: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onStepViewed: (step: GuideStep) => void;
  onSurveySubmit: (answers: Record<string, unknown>) => Promise<void>;
  onTrack: (eventName: EngagementEventName, step?: GuideStep, properties?: Record<string, unknown>) => void;
}

function GuideOverlay({
  guide,
  stepIndex,
  onDismiss,
  onComplete,
  onNext,
  onPrevious,
  onStepViewed,
  onSurveySubmit,
  onTrack
}: GuideOverlayProps): JSX.Element | null {
  const step = guide.steps[stepIndex] ?? guide.steps[0];
  const anchor = useAnchorRect(step?.selector);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (step) {
      onStepViewed(step);
    }
  }, [onStepViewed, step]);

  if (guide.type === 'BANNER') {
    return (
      <div className="fixed left-0 right-0 top-0 z-[10000] border-b border-olive-200 bg-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Megaphone size={18} className="shrink-0 text-olive-700" />
            <div className="min-w-0">
              <p className="m-0 text-sm font-bold text-olive-950">{guide.title}</p>
              {guide.description && <p className="m-0 text-xs text-olive-500">{guide.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-olive-700 px-3 py-1.5 text-xs font-bold text-white" onClick={() => { onTrack('banner_clicked'); onComplete(); }} type="button">
              Open
            </button>
            <button className="rounded-md p-1.5 text-olive-500 hover:bg-olive-100" onClick={onDismiss} title="Dismiss" type="button">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (guide.type === 'HOTSPOT') {
    const style = anchor
      ? { left: anchor.left + anchor.width - 8, top: anchor.top - 8 }
      : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    return (
      <button
        className="fixed z-[10000] flex h-7 w-7 items-center justify-center rounded-full bg-accent-amber text-white shadow-xl ring-8 ring-amber-300/30"
        onClick={() => {
          onTrack('hotspot_opened', step);
          onComplete();
        }}
        style={style}
        title={guide.title}
        type="button"
      >
        <Sparkles size={15} />
      </button>
    );
  }

  if (guide.type === 'SMART_TIP' || guide.type === 'TOUR') {
    const style = buildPopoverStyle(anchor, step?.placement);
    return (
      <>
        {anchor && <Spotlight rect={anchor} />}
        <div className="fixed z-[10000] w-[320px] rounded-lg border border-olive-200 bg-white p-4 shadow-2xl" style={style}>
          <GuideCard
            guide={guide}
            step={step}
            stepIndex={stepIndex}
            onDismiss={onDismiss}
            onComplete={onComplete}
            onNext={onNext}
            onPrevious={onPrevious}
          />
        </div>
      </>
    );
  }

  if (guide.type === 'CHECKLIST') {
    return (
      <div className="fixed bottom-5 right-5 z-[10000] w-[360px] rounded-lg border border-olive-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-bold text-olive-950">{guide.title}</p>
            {guide.description && <p className="m-0 mt-1 text-xs text-olive-500">{guide.description}</p>}
          </div>
          <button className="rounded-md p-1 text-olive-400 hover:bg-olive-100" onClick={onDismiss} type="button">
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-2">
          {guide.steps.map((item) => (
            <button
              className="flex items-center gap-3 rounded-md border border-olive-100 px-3 py-2 text-left text-sm hover:bg-olive-50"
              key={item.id}
              onClick={() => onTrack('step_completed', item, { checklistItemId: item.id })}
              type="button"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-olive-300">
                <Check size={13} />
              </span>
              <span>
                <span className="block font-semibold text-olive-900">{item.title}</span>
                {item.description && <span className="block text-xs text-olive-500">{item.description}</span>}
              </span>
            </button>
          ))}
        </div>
        <button className="mt-4 w-full rounded-md bg-olive-700 px-3 py-2 text-sm font-bold text-white" onClick={onComplete} type="button">
          Done
        </button>
      </div>
    );
  }

  if (guide.type === 'SURVEY') {
    return (
      <ModalShell onDismiss={onDismiss}>
        <div className="mb-4">
          <p className="m-0 text-lg font-bold text-olive-950">{guide.title}</p>
          {guide.description && <p className="m-0 mt-1 text-sm text-olive-500">{guide.description}</p>}
        </div>
        <div className="grid gap-4">
          {guide.steps.map((question) => (
            <SurveyQuestionField
              key={question.id}
              question={question}
              value={surveyAnswers[question.id]}
              onChange={(value) => setSurveyAnswers((current) => ({ ...current, [question.id]: value }))}
            />
          ))}
        </div>
        <button className="mt-5 w-full rounded-md bg-olive-700 px-4 py-2.5 text-sm font-bold text-white" onClick={() => void onSurveySubmit(surveyAnswers)} type="button">
          Submit
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell onDismiss={onDismiss}>
      <GuideCard
        guide={guide}
        step={step}
        stepIndex={stepIndex}
        onDismiss={onDismiss}
        onComplete={onComplete}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    </ModalShell>
  );
}

function GuideCard({
  guide,
  step,
  stepIndex,
  onDismiss,
  onComplete,
  onNext,
  onPrevious
}: {
  guide: Guide;
  step?: GuideStep;
  stepIndex: number;
  onDismiss: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}): JSX.Element {
  const hasSteps = guide.steps.length > 0;
  const isLast = !hasSteps || stepIndex >= guide.steps.length - 1;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-olive-700 text-white">
            <MousePointerClick size={16} />
          </span>
          <div>
            <p className="m-0 text-base font-bold text-olive-950">{step?.title ?? guide.title}</p>
            {(step?.description || guide.description) && (
              <p className="m-0 mt-1 text-sm text-olive-500">{step?.description ?? guide.description}</p>
            )}
          </div>
        </div>
        <button className="rounded-md p-1 text-olive-400 hover:bg-olive-100" onClick={onDismiss} title="Dismiss" type="button">
          <X size={16} />
        </button>
      </div>
      {hasSteps && (
        <div className="mb-4 h-1.5 rounded-full bg-olive-100">
          <div className="h-1.5 rounded-full bg-olive-700" style={{ width: `${((stepIndex + 1) / guide.steps.length) * 100}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <button className="rounded-md border border-olive-200 p-2 text-olive-600 disabled:opacity-30" disabled={stepIndex === 0} onClick={onPrevious} title="Previous" type="button">
          <ChevronLeft size={16} />
        </button>
        <button className="rounded-md bg-olive-700 px-4 py-2 text-sm font-bold text-white" onClick={isLast ? onComplete : onNext} type="button">
          {isLast ? 'Complete' : 'Next'}
        </button>
        <button className="rounded-md border border-olive-200 p-2 text-olive-600 disabled:opacity-30" disabled={isLast} onClick={onNext} title="Next" type="button">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function SurveyQuestionField({
  question,
  value,
  onChange
}: {
  question: GuideStep;
  value: unknown;
  onChange: (value: unknown) => void;
}): JSX.Element {
  const inputClass = 'w-full rounded-md border border-olive-200 px-3 py-2 text-sm text-olive-900 focus:border-olive-500 focus:outline-none';
  return (
    <label className="grid gap-2 text-sm font-semibold text-olive-900">
      <span>{question.title}</span>
      {question.type === 'TEXTAREA' ? (
        <textarea className={inputClass} onChange={(event) => onChange(event.target.value)} value={String(value ?? '')} />
      ) : question.type === 'SINGLE_CHOICE' || question.type === 'DROPDOWN' || question.type === 'YES_NO' ? (
        <select className={inputClass} onChange={(event) => onChange(event.target.value)} value={String(value ?? '')}>
          <option value="">Select</option>
          {(question.type === 'YES_NO' ? ['Yes', 'No'] : question.options ?? []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : question.type === 'MULTI_CHOICE' ? (
        <div className="grid gap-2">
          {(question.options ?? []).map((option) => {
            const selected = Array.isArray(value) ? value.includes(option) : false;
            return (
              <button className={`rounded-md border px-3 py-2 text-left text-sm ${selected ? 'border-olive-600 bg-olive-50' : 'border-olive-200'}`} key={option} onClick={() => {
                const current = Array.isArray(value) ? value : [];
                onChange(selected ? current.filter((entry) => entry !== option) : [...current, option]);
              }} type="button">
                {option}
              </button>
            );
          })}
        </div>
      ) : question.type === 'NPS' || question.type === 'RATING_SCALE' ? (
        <input className={inputClass} max={question.max ?? 10} min={question.min ?? 0} onChange={(event) => onChange(Number(event.target.value))} type="number" value={typeof value === 'number' ? value : ''} />
      ) : (
        <input className={inputClass} onChange={(event) => onChange(event.target.value)} value={String(value ?? '')} />
      )}
    </label>
  );
}

function ModalShell({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }): JSX.Element {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-lg rounded-lg border border-olive-200 bg-white p-6 shadow-2xl">
        <button className="float-right rounded-md p-1 text-olive-400 hover:bg-olive-100" onClick={onDismiss} title="Dismiss" type="button">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

function Spotlight({ rect }: { rect: DOMRect }): JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div className="absolute rounded-lg ring-[9999px] ring-black/35" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />
    </div>
  );
}

function useAnchorRect(selector?: string): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const element = document.querySelector(selector);
        setRect(element ? element.getBoundingClientRect() : null);
      });
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    refresh();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
      window.cancelAnimationFrame(frame);
    };
  }, [selector]);

  return rect;
}

function buildPopoverStyle(rect: DOMRect | null, placement?: string): CSSProperties {
  if (!rect) {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }

  const gap = 12;
  if (placement === 'LEFT') {
    return { left: Math.max(16, rect.left - 332), top: rect.top };
  }
  if (placement === 'RIGHT') {
    return { left: Math.min(window.innerWidth - 336, rect.right + gap), top: rect.top };
  }
  if (placement === 'TOP') {
    return { left: rect.left, top: Math.max(16, rect.top - 220) };
  }
  return { left: Math.min(window.innerWidth - 336, rect.left), top: Math.min(window.innerHeight - 220, rect.bottom + gap) };
}

export const emitEngagementEvent = (eventName: string, properties?: Record<string, unknown>): void => {
  window.dispatchEvent(new CustomEvent<RuntimeEventDetail>('sync:analytics-event', { detail: { eventName, properties } }));
};
