import React, { useState } from 'react';
import {
  ListTodo,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Vote,
  ShieldAlert,
  UserCheck,
  Building,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { defaultRagEngine } from '../services/ragService';

interface TaskDef {
  id: string;
  title: string;
  category: string;
  icon: any;
  description: string;
  estimatedMinutes: number;
  steps: {
    title: string;
    description: string;
    whyNeeded: string;
    type: 'select' | 'radio' | 'text' | 'checklist';
    field: string;
    options?: { label: string; value: string; desc?: string }[];
    bylawCitation?: string;
  }[];
}

const TASKS: TaskDef[] = [
  {
    id: 'voting-rights-check',
    title: 'Check Voting Rights Eligibility',
    category: 'Elections & Governance',
    icon: Vote,
    estimatedMinutes: 3,
    description: 'Verify if you meet all statutory requirements under cooperative bylaws to cast your vote in upcoming elections.',
    steps: [
      {
        title: 'Membership Duration & Admission Date',
        description: 'When were you admitted as an ordinary member of the cooperative society?',
        whyNeeded: 'Under Model Bylaws Section 11, members admitted within 30 days prior to the date of election are disqualified from voting.',
        type: 'radio',
        field: 'admissionAge',
        options: [
          { label: 'More than 30 days before election date', value: 'eligible_admission', desc: 'Satisfies statutory waiting threshold' },
          { label: 'Less than 30 days before election date', value: 'ineligible_admission', desc: 'Disqualified under 30-day statutory bar' },
        ],
        bylawCitation: 'Model Primary Cooperative Society Bylaws - Section 11: Member Disqualifications',
      },
      {
        title: 'Outstanding Dues & Loan Defaults',
        description: 'Do you have any overdue loan balance or unpaid society dues past 90 days?',
        whyNeeded: 'Bylaw 11(i) explicitly disqualifies any member in default of dues for over 90 days from exercising voting franchise.',
        type: 'radio',
        field: 'duesStatus',
        options: [
          { label: 'No overdue balance / All dues fully paid or within 90 days', value: 'clear_dues', desc: 'Statutorily eligible' },
          { label: 'Overdue loan balance exceeding 90 days past due date', value: 'default_dues', desc: 'Disqualified until loan is cleared' },
        ],
        bylawCitation: 'Model Primary Cooperative Society Bylaws - Section 11(i)',
      },
      {
        title: 'Active Patronage & Service Utilization',
        description: 'Did you supply the minimum required produce (e.g. 500 liters of milk) or utilize society services in the past financial year?',
        whyNeeded: 'Under Section 7, voting rights are preserved exclusively for Active Members who meet minimum economic transactions.',
        type: 'radio',
        field: 'patronageStatus',
        options: [
          { label: 'Yes, fulfilled minimum transaction/produce quota', value: 'active_patron', desc: 'Maintains Active Member status' },
          { label: 'No, did not meet the minimum annual quota', value: 'non_active_patron', desc: 'Classified as Non-Active Member' },
        ],
        bylawCitation: 'Model Primary Cooperative Society Bylaws - Section 7: Active Member Status',
      },
      {
        title: 'Provisional Voter List Inclusion',
        description: 'Have you verified your name on the provisional voter list published on the notice board?',
        whyNeeded: 'Rule 7 grants an 10-day objection window to rectify omitted names before the final list is locked.',
        type: 'radio',
        field: 'voterListStatus',
        options: [
          { label: 'My name is correctly listed on the board', value: 'listed_ok', desc: 'Ready for polling day' },
          { label: 'My name is omitted or incorrectly spelled', value: 'need_objection', desc: 'Must file Form E-2 objection immediately' },
        ],
        bylawCitation: 'State Cooperative Election Rules - Rule 7: Electoral Roll Publication',
      },
    ],
  },
  {
    id: 'election-procedure-guide',
    title: 'Understand Election Procedure & Objections',
    category: 'Electoral Rules',
    icon: ShieldAlert,
    estimatedMinutes: 5,
    description: 'Walk through key election timelines: voter rolls, filing objections, nomination scrutiny, secret ballot, and Returning Officer duties.',
    steps: [
      {
        title: 'Step 1: Electoral Roll Publication & Objections',
        description: 'The provisional list must be published 60 days before committee term expiration. If your name is omitted, you have 10 days to submit a written objection to the Returning Officer.',
        whyNeeded: 'Protects members against arbitrary removal by sitting management.',
        type: 'radio',
        field: 'electoralStepStatus',
        options: [
          { label: 'I understand the 10-day objection window requirement', value: 'understood_roll' },
          { label: 'I need to file an objection letter now', value: 'prepare_objection' },
        ],
        bylawCitation: 'State Cooperative Election Rules - Rule 7 & 8',
      },
      {
        title: 'Step 2: Nomination Paper Submission',
        description: 'Candidates must be proposed and seconded by two distinct active voting members. Nominations require verification of clean financial standing.',
        whyNeeded: 'Prevents fraudulent self-nominations and ensures community endorsement.',
        type: 'radio',
        field: 'nominationUnderstood',
        options: [
          { label: 'Understood: Candidate + Proposer + Seconder (3 distinct members)', value: 'understood_nom' },
        ],
        bylawCitation: 'State Cooperative Election Rules - Rule 16',
      },
      {
        title: 'Step 3: Secret Ballot & Impartial Polling',
        description: 'All voting must be conducted by secret ballot under an independent government-appointed Returning Officer. Societies with >500 members require mandatory video recording.',
        whyNeeded: 'Guarantees freedom from coercion or vote-buying.',
        type: 'radio',
        field: 'ballotUnderstood',
        options: [
          { label: 'Understood secret ballot and same-day counting rules', value: 'understood_ballot' },
        ],
        bylawCitation: 'State Cooperative Election Rules - Rule 24',
      },
    ],
  },
  {
    id: 'coop-registration-steps',
    title: 'Learn Cooperative Registration Steps',
    category: 'Formation & Society Setup',
    icon: Building,
    estimatedMinutes: 6,
    description: 'Step-by-step procedural manual for organizing and registering a new primary cooperative society under state regulations.',
    steps: [
      {
        title: 'Minimum Member Threshold (10 Individuals)',
        description: 'Do you have at least 10 eligible individuals from distinct families living/farming in the proposed operational jurisdiction?',
        whyNeeded: 'Statutory mandate prevents single-family proprietorships under the Cooperative Act.',
        type: 'radio',
        field: 'promoterCount',
        options: [
          { label: 'Yes, 10 or more individuals from distinct families', value: 'promoters_ready' },
          { label: 'Not yet, gathering interested farmers/members', value: 'promoters_pending' },
        ],
        bylawCitation: 'Cooperative Formation Manual - Step 1 & 2',
      },
      {
        title: 'Chief Promoter & Temporary Bank Account',
        description: 'Hold a preliminary meeting to elect a Chief Promoter and authorize opening a temporary share capital bank account.',
        whyNeeded: 'Bank certificate showing share deposit is mandatory for Form-A filing.',
        type: 'radio',
        field: 'chiefPromoterElected',
        options: [
          { label: 'Chief Promoter elected and resolution passed', value: 'promoter_done' },
          { label: 'Need guidance on organizing the preliminary meeting', value: 'need_meeting_help' },
        ],
        bylawCitation: 'Cooperative Formation Manual - Step 2',
      },
      {
        title: 'Dossier Preparation (Form-A & Model Bylaws)',
        description: 'Prepare four copies of proposed bylaws, promoter declarations, project viability report, and treasury challan.',
        whyNeeded: 'Registrar evaluates economic sustainability before granting registration certificate.',
        type: 'radio',
        field: 'dossierStatus',
        options: [
          { label: 'Dossier compiled with viability report', value: 'dossier_ready' },
          { label: 'Require model bylaws template', value: 'need_template' },
        ],
        bylawCitation: 'Cooperative Formation Manual - Step 3',
      },
      {
        title: 'Statutory 90-Day Registrar Review Mandate',
        description: 'The Assistant Registrar is statutorily bound to grant the registration certificate or issue a reasoned rejection in writing within 90 days.',
        whyNeeded: 'Guarantees citizens protection against indefinite bureaucratic delay.',
        type: 'radio',
        field: 'statutoryTimeline',
        options: [
          { label: 'Noted statutory 90-day decision deadline', value: 'timeline_noted' },
        ],
        bylawCitation: 'Cooperative Formation Manual - Step 5',
      },
    ],
  },
  {
    id: 'membership-procedure',
    title: 'Understand Membership Admission & Rights',
    category: 'Membership',
    icon: UserCheck,
    estimatedMinutes: 4,
    description: 'Learn criteria for becoming a cooperative member, application timelines, share certificates, and appeal rights if rejected.',
    steps: [
      {
        title: 'Eligibility Verification',
        description: 'Are you 18+ years of age, competent to contract, and residing/operating within the society operational territory?',
        whyNeeded: 'Essential requirements under Section 4 of Model Bylaws.',
        type: 'radio',
        field: 'eligibilityMet',
        options: [
          { label: 'Yes, meets all territorial and age criteria', value: 'eligible' },
          { label: 'No, outside designated operational zone', value: 'not_eligible' },
        ],
        bylawCitation: 'Model Primary Cooperative Society Bylaws - Section 4',
      },
      {
        title: 'Application Form M-1 & 45-Day Decision Window',
        description: 'Submit Form M-1 with share purchase payment. The Managing Committee must decide within 45 days. If ignored, an automatic deemed appeal lies with the Assistant Registrar.',
        whyNeeded: 'Prevents entrenched committees from blocking new members.',
        type: 'radio',
        field: 'applicationWindow',
        options: [
          { label: 'Understood the 45-day statutory decision rule', value: 'understood_45' },
        ],
        bylawCitation: 'Model Primary Cooperative Society Bylaws - Section 4',
      },
    ],
  },
];

export const GuidedTasks: React.FC = () => {
  const { setActiveTab, setSelectedSource, t } = useApp();
  const [activeTask, setActiveTask] = useState<TaskDef | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);

  const startTask = (task: TaskDef) => {
    setActiveTask(task);
    setCurrentStepIdx(0);
    setTaskAnswers({});
    setTaskCompleted(false);
  };

  const handleNext = () => {
    if (!activeTask) return;
    if (currentStepIdx < activeTask.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setTaskCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    } else {
      setActiveTask(null);
    }
  };

  const handleCancel = () => {
    setActiveTask(null);
    setCurrentStepIdx(0);
    setTaskCompleted(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-emerald-600" />
            <span>{t.guidedCardTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete common cooperative procedures through structured, stateful workflows.
          </p>
        </div>

        {/* Showcase Grievance Shortcut */}
        <button
          id="btn-guided-go-to-grievance"
          onClick={() => setActiveTab('grievance')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>Launch Grievance Letter Wizard</span>
        </button>
      </div>

      {/* Task List or Active Task Workflow */}
      {!activeTask ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TASKS.map((task) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {task.estimatedMinutes} mins
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    {task.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {task.steps.length} Steps
                  </span>
                  <button
                    id={`btn-start-task-${task.id}`}
                    onClick={() => startTask(task)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Start Task</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active Workflow Step-by-Step UI */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Workflow Header with Step Counter */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                {activeTask.title}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {!taskCompleted
                  ? `Step ${currentStepIdx + 1} of ${activeTask.steps.length}: ${activeTask.steps[currentStepIdx].title}`
                  : 'Task Completed: Summary & Recommendations'}
              </h3>
            </div>

            <button
              id="btn-cancel-active-task"
              onClick={handleCancel}
              className="text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-medium"
            >
              {t.cancelBtn}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-1.5">
            <div
              className="bg-emerald-600 h-1.5 transition-all duration-300"
              style={{
                width: taskCompleted
                  ? '100%'
                  : `${((currentStepIdx + 1) / activeTask.steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Workflow Step Content */}
          <div className="p-6">
            {!taskCompleted ? (
              <div className="space-y-5 max-w-2xl">
                {/* Description of step */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 leading-relaxed">
                  <span className="font-bold block mb-1">Procedural Guidance:</span>
                  {activeTask.steps[currentStepIdx].description}
                </div>

                {/* Why this is needed explanation */}
                {activeTask.steps[currentStepIdx].whyNeeded && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Why this matters: </strong>
                      {activeTask.steps[currentStepIdx].whyNeeded}
                    </div>
                  </div>
                )}

                {/* Statutory bylaw citation if available */}
                {activeTask.steps[currentStepIdx].bylawCitation && (
                  <div className="text-xs text-blue-800 bg-blue-50/70 border border-blue-200 px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reference: {activeTask.steps[currentStepIdx].bylawCitation}</span>
                  </div>
                )}

                {/* Input selection controls */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Select your situation:
                  </label>
                  {activeTask.steps[currentStepIdx].options?.map((opt) => {
                    const isSelected =
                      taskAnswers[activeTask.steps[currentStepIdx].field] === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() =>
                          setTaskAnswers({
                            ...taskAnswers,
                            [activeTask.steps[currentStepIdx].field]: opt.value,
                          })
                        }
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={activeTask.steps[currentStepIdx].field}
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-900 block">
                            {opt.label}
                          </span>
                          {opt.desc && (
                            <span className="text-slate-500 block mt-0.5">
                              {opt.desc}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Completed Summary */
              <div className="space-y-4 max-w-2xl text-left">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Workflow Completed Successfully
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Based on your responses, you have reviewed the key statutory requirements for {activeTask.title}.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <h5 className="font-bold text-slate-800">Your Action Summary:</h5>
                  {Object.entries(taskAnswers).map(([field, val]) => (
                    <div key={field} className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500 font-medium capitalize">{field}:</span>
                      <span className="font-semibold text-slate-800">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    id="btn-guided-completed-ask"
                    onClick={() => setActiveTab('ask')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Ask Follow-up in Chat
                  </button>
                  <button
                    id="btn-guided-completed-grievance"
                    onClick={() => setActiveTab('grievance')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                  >
                    Prepare Grievance Letter
                  </button>
                  <button
                    id="btn-guided-completed-reset"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                  >
                    Choose Another Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls Bar */}
          {!taskCompleted && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                id="btn-workflow-back"
                onClick={handleBack}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backBtn}</span>
              </button>

              <button
                id="btn-workflow-continue"
                onClick={handleNext}
                disabled={!taskAnswers[activeTask.steps[currentStepIdx].field]}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>{currentStepIdx === activeTask.steps.length - 1 ? 'Finish' : t.continueBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
