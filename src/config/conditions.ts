/**
 * Concerns people commonly ask us about.
 *
 * COPY RULES — this page must not diagnose, must not promise outcomes, and must
 * not imply that physiotherapy is appropriate for every presentation. Each entry
 * describes what people describe to us and what an appointment involves.
 */

export type ConditionGroup = {
  id: string;
  title: string;
  intro: string;
  items: { name: string; description: string }[];
};

export const conditionGroups: ConditionGroup[] = [
  {
    id: 'back-and-neck',
    title: 'Back and neck concerns',
    intro:
      'People often get in touch about back or neck discomfort that is affecting sleep, work or daily activity.',
    items: [
      {
        name: 'Lower back discomfort',
        description:
          'Ongoing or recurring discomfort in the lower back, including stiffness first thing in the morning or after sitting.',
      },
      {
        name: 'Neck stiffness and tension',
        description:
          'Restricted neck movement or tension, often described alongside desk work or driving.',
      },
      {
        name: 'Postural discomfort',
        description:
          'Discomfort people associate with long periods in one position at work or at home.',
      },
    ],
  },
  {
    id: 'shoulder-and-arm',
    title: 'Shoulder, arm and hand concerns',
    intro: 'Upper limb concerns that affect reaching, lifting, gripping or sleeping.',
    items: [
      {
        name: 'Shoulder movement restriction',
        description:
          'Difficulty raising the arm, reaching behind the back, or discomfort when sleeping on one side.',
      },
      {
        name: 'Elbow and forearm discomfort',
        description:
          'Discomfort associated with gripping, lifting or repetitive tasks at work or in sport.',
      },
      {
        name: 'Wrist and hand movement concerns',
        description:
          'Stiffness or discomfort affecting grip strength and fine hand movements.',
      },
    ],
  },
  {
    id: 'hip-knee-and-leg',
    title: 'Hip, knee and leg concerns',
    intro: 'Lower limb concerns that affect walking, stairs, standing or exercise.',
    items: [
      {
        name: 'Hip and groin discomfort',
        description:
          'Discomfort noticed when walking, climbing stairs, or after periods of sitting.',
      },
      {
        name: 'Knee discomfort and stiffness',
        description:
          'Knee symptoms noticed on stairs, when kneeling, or after exercise.',
      },
      {
        name: 'Calf, ankle and foot concerns',
        description:
          'Lower leg or foot discomfort affecting walking distance, running or standing at work.',
      },
    ],
  },
  {
    id: 'activity-and-recovery',
    title: 'Activity, training and recovery',
    intro:
      'Concerns raised by people who are active and want to talk through how they are managing load and recovery.',
    items: [
      {
        name: 'Returning to activity after a period of rest',
        description:
          'Guidance on how people commonly build activity back up gradually and sensibly.',
      },
      {
        name: 'Sports-related physical concerns',
        description:
          'Discussion of training demands, movement quality and recovery between sessions.',
      },
      {
        name: 'General deconditioning and low activity levels',
        description:
          'Support for people who have become less active and want a realistic starting point.',
      },
    ],
  },
  {
    id: 'daily-living',
    title: 'Mobility and daily living',
    intro: 'Support for people whose day-to-day movement has changed.',
    items: [
      {
        name: 'Walking and balance confidence',
        description:
          'Conversation about walking, confidence and the activities you find difficult.',
      },
      {
        name: 'Getting up, sitting down and stairs',
        description:
          'Practical discussion of the everyday transfers that feel harder than they used to.',
      },
      {
        name: 'Managing long-term movement limitations',
        description:
          'Support alongside — not instead of — care you receive from other healthcare professionals.',
      },
    ],
  },
];

/**
 * Presentations where physiotherapy is not the right first step. Being explicit
 * here is both an ethical and a safety requirement.
 */
export const seekUrgentHelpFor: string[] = [
  'Chest pain, difficulty breathing, or symptoms of a stroke — call 999 immediately',
  'A suspected fracture, dislocation, or an injury following significant trauma',
  'Sudden loss of bladder or bowel control, or numbness around the saddle area — seek emergency care immediately',
  'New, unexplained weakness, numbness or loss of sensation',
  'Fever, unexplained weight loss or feeling generally unwell alongside your symptoms',
  'Symptoms that are rapidly getting worse',
];
