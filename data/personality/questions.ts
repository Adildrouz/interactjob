import type { Question } from '@/types/personality';

/**
 * 40 fully original behavioral workplace questions.
 * Inspired by behavioral personality models — not affiliated with
 * Everything DiSC® or any official DISC organization.
 *
 * Dimensions:
 *   L = Leader Energy      (decisive, competitive, action-oriented, confident)
 *   I = Social Influence   (outgoing, persuasive, enthusiastic, expressive)
 *   S = Stability & Support(calm, patient, supportive, dependable)
 *   P = Precision & Analysis(analytical, detail-oriented, structured, logical)
 */
export const questions: Question[] = [
  {
    id: 1,
    text: "When your team faces a new challenge with no clear playbook, what's your instinctive first move?",
    category: "Leadership",
    options: [
      { id: 'A', text: "Take charge, define the plan, and assign responsibilities", scores: { L: 3 } },
      { id: 'B', text: "Energize the team and brainstorm ideas together", scores: { I: 3 } },
      { id: 'C', text: "Understand how it affects everyone and ensure stability", scores: { S: 3 } },
      { id: 'D', text: "Research the problem thoroughly before proposing a path", scores: { P: 3 } },
    ],
  },
  {
    id: 2,
    text: "Your team disagrees on an important decision. How do you handle it?",
    category: "Decision Making",
    options: [
      { id: 'A', text: "Make the call confidently and move forward", scores: { L: 3 } },
      { id: 'B', text: "Use your persuasion to build consensus around the best idea", scores: { I: 3 } },
      { id: 'C', text: "Facilitate open dialogue until everyone feels heard", scores: { S: 3 } },
      { id: 'D', text: "Present a data-driven analysis of each option", scores: { P: 3 } },
    ],
  },
  {
    id: 3,
    text: "In meetings, colleagues would most likely describe you as the person who...",
    category: "Team Dynamics",
    options: [
      { id: 'A', text: "Drives the agenda and keeps everyone on track", scores: { L: 3 } },
      { id: 'B', text: "Brings energy and keeps the room engaged", scores: { I: 3 } },
      { id: 'C', text: "Listens carefully and ensures everyone has a voice", scores: { S: 3 } },
      { id: 'D', text: "Asks the detailed questions everyone else missed", scores: { P: 3 } },
    ],
  },
  {
    id: 4,
    text: "When you make a significant mistake at work, your typical response is to...",
    category: "Self-Awareness",
    options: [
      { id: 'A', text: "Own it immediately, fix it fast, and move on", scores: { L: 3 } },
      { id: 'B', text: "Talk it through with a trusted colleague to process it", scores: { I: 2, S: 1 } },
      { id: 'C', text: "Reflect on how it may have affected others first", scores: { S: 3 } },
      { id: 'D', text: "Analyze exactly what went wrong to prevent recurrence", scores: { P: 3 } },
    ],
  },
  {
    id: 5,
    text: "Which of these working environments energizes you most?",
    category: "Work Style",
    options: [
      { id: 'A', text: "Fast-paced and autonomous — I make decisions quickly", scores: { L: 3 } },
      { id: 'B', text: "Highly collaborative with lots of human interaction", scores: { I: 3 } },
      { id: 'C', text: "Stable and harmonious with a close-knit team", scores: { S: 3 } },
      { id: 'D', text: "Structured and precise with clear standards and processes", scores: { P: 3 } },
    ],
  },
  {
    id: 6,
    text: "When presenting to clients or senior stakeholders, your focus is on...",
    category: "Communication",
    options: [
      { id: 'A', text: "Leading with the key decision and bottom-line impact", scores: { L: 3 } },
      { id: 'B', text: "Building rapport and generating excitement about the vision", scores: { I: 3 } },
      { id: 'C', text: "Emphasizing how the solution supports their team's needs", scores: { S: 3 } },
      { id: 'D', text: "Backing every point with thorough data and evidence", scores: { P: 3 } },
    ],
  },
  {
    id: 7,
    text: "How do you typically behave when a project deadline is at serious risk?",
    category: "Pressure & Stress",
    options: [
      { id: 'A', text: "Accelerate personally and push the team through the obstacle", scores: { L: 3 } },
      { id: 'B', text: "Rally the team, boost morale, and create a sprint plan together", scores: { I: 3 } },
      { id: 'C', text: "Stay calm, stabilize the team, and manage expectations proactively", scores: { S: 3 } },
      { id: 'D', text: "Reassess the timeline with data and propose a structured recovery plan", scores: { P: 3 } },
    ],
  },
  {
    id: 8,
    text: "As a team leader, colleagues would say your style is closest to...",
    category: "Leadership",
    options: [
      { id: 'A', text: "Setting bold direction and holding people firmly accountable", scores: { L: 3 } },
      { id: 'B', text: "Inspiring through vision and creating an energized culture", scores: { I: 3 } },
      { id: 'C', text: "Mentoring individuals and ensuring no one gets left behind", scores: { S: 3 } },
      { id: 'D', text: "Establishing high standards and maintaining rigorous quality", scores: { P: 3 } },
    ],
  },
  {
    id: 9,
    text: "When there's open conflict between two teammates, you instinctively...",
    category: "Conflict",
    options: [
      { id: 'A', text: "Address it directly and drive toward a quick resolution", scores: { L: 3 } },
      { id: 'B', text: "Use humor or reframing to ease tension and get everyone talking", scores: { I: 3 } },
      { id: 'C', text: "Work to restore trust and ensure both sides feel respected", scores: { S: 3 } },
      { id: 'D', text: "Identify the logical root cause and propose a structured solution", scores: { P: 3 } },
    ],
  },
  {
    id: 10,
    text: "How do you prefer to receive professional feedback?",
    category: "Feedback",
    options: [
      { id: 'A', text: "Direct, honest, and to the point — no sugarcoating", scores: { L: 3 } },
      { id: 'B', text: "As a two-way conversation with back-and-forth exchange", scores: { I: 3 } },
      { id: 'C', text: "Gently and with attention to the relationship", scores: { S: 3 } },
      { id: 'D', text: "In written form with specific examples and clear actions", scores: { P: 3 } },
    ],
  },
  {
    id: 11,
    text: "When you have far too many competing priorities, your approach is to...",
    category: "Organization",
    options: [
      { id: 'A', text: "Quickly rank by impact, attack the top priority, and delegate the rest", scores: { L: 3 } },
      { id: 'B', text: "Align quickly with your manager, then energize the team around shared focus", scores: { I: 2, L: 1 } },
      { id: 'C', text: "Protect commitments to teammates first, then handle your own tasks", scores: { S: 3 } },
      { id: 'D', text: "Build a prioritization matrix based on deadlines and impact", scores: { P: 3 } },
    ],
  },
  {
    id: 12,
    text: "When joining a brand-new team, you typically...",
    category: "Team Dynamics",
    options: [
      { id: 'A', text: "Establish yourself quickly as someone who drives results", scores: { L: 3 } },
      { id: 'B', text: "Build personal connections with everyone as fast as possible", scores: { I: 3 } },
      { id: 'C', text: "Observe team dynamics carefully before inserting yourself", scores: { S: 3 } },
      { id: 'D', text: "Study the processes and structure first to understand how things work", scores: { P: 3 } },
    ],
  },
  {
    id: 13,
    text: "Which professional achievement makes you feel most proud?",
    category: "Motivation",
    options: [
      { id: 'A', text: "Leading a high-stakes initiative that delivered exceptional results", scores: { L: 3 } },
      { id: 'B', text: "Inspiring a team to achieve something no one believed was possible", scores: { I: 3 } },
      { id: 'C', text: "Building a team culture where everyone felt truly supported", scores: { S: 3 } },
      { id: 'D', text: "Delivering a complex project flawlessly under extreme constraints", scores: { P: 3 } },
    ],
  },
  {
    id: 14,
    text: "Faced with major uncertainty at work, you typically...",
    category: "Adaptability",
    options: [
      { id: 'A', text: "Decide with the available information and adjust as you go", scores: { L: 3 } },
      { id: 'B', text: "Tap your network, gather perspectives, and keep spirits high", scores: { I: 3 } },
      { id: 'C', text: "Focus on what's stable and controllable to maintain consistency", scores: { S: 3 } },
      { id: 'D', text: "Gather as much data as possible before committing to any path", scores: { P: 3 } },
    ],
  },
  {
    id: 15,
    text: "Your colleagues would most reliably describe you as...",
    category: "Reputation",
    options: [
      { id: 'A', text: "Someone who takes initiative without waiting for permission", scores: { L: 3 } },
      { id: 'B', text: "The person who brings energy and enthusiasm to any room", scores: { I: 3 } },
      { id: 'C', text: "The teammate who can always be counted on for support", scores: { S: 3 } },
      { id: 'D', text: "The professional who never cuts corners and maintains standards", scores: { P: 3 } },
    ],
  },
  {
    id: 16,
    text: "When a colleague is consistently underperforming, you...",
    category: "People Management",
    options: [
      { id: 'A', text: "Have a direct, honest conversation and set clear expectations immediately", scores: { L: 3 } },
      { id: 'B', text: "Offer encouragement and try to understand what's blocking them", scores: { I: 2, S: 1 } },
      { id: 'C', text: "Offer quiet, consistent support and check in regularly", scores: { S: 3 } },
      { id: 'D', text: "Document the pattern and escalate through the proper channels", scores: { P: 3 } },
    ],
  },
  {
    id: 17,
    text: "When tackling a complex, unstructured problem, you instinctively...",
    category: "Problem Solving",
    options: [
      { id: 'A', text: "Trust your instincts and move forward with a confident decision", scores: { L: 3 } },
      { id: 'B', text: "Convene a collaborative brainstorm to pool ideas", scores: { I: 3 } },
      { id: 'C', text: "Consider carefully how any solution will affect all stakeholders", scores: { S: 3 } },
      { id: 'D', text: "Break it down systematically and evaluate each option logically", scores: { P: 3 } },
    ],
  },
  {
    id: 18,
    text: "During a major company reorganization, you...",
    category: "Change",
    options: [
      { id: 'A', text: "See it as an opportunity and move quickly to position yourself", scores: { L: 3 } },
      { id: 'B', text: "Actively help manage team morale through the transition", scores: { I: 3 } },
      { id: 'C', text: "Focus on maintaining stability and reassuring your colleagues", scores: { S: 3 } },
      { id: 'D', text: "Seek complete clarity on the new structure before moving forward", scores: { P: 3 } },
    ],
  },
  {
    id: 19,
    text: "When managing a project, you spend the majority of your time...",
    category: "Work Style",
    options: [
      { id: 'A', text: "Making rapid decisions and removing every obstacle in the way", scores: { L: 3 } },
      { id: 'B', text: "Keeping stakeholders aligned and the team motivated", scores: { I: 3 } },
      { id: 'C', text: "Ensuring each team member feels supported and clear on their role", scores: { S: 3 } },
      { id: 'D', text: "Reviewing the plan, timelines, and quality benchmarks", scores: { P: 3 } },
    ],
  },
  {
    id: 20,
    text: "Which of the following frustrates you most in a workplace?",
    category: "Frustration",
    options: [
      { id: 'A', text: "Slow decision-making, indecision, and lack of urgency", scores: { L: 3 } },
      { id: 'B', text: "Being isolated or working alone for extended periods", scores: { I: 3 } },
      { id: 'C', text: "Conflict, broken trust, or team fragmentation", scores: { S: 3 } },
      { id: 'D', text: "Errors, lack of process, or inconsistent standards", scores: { P: 3 } },
    ],
  },
  {
    id: 21,
    text: "When your opinion clearly differs from the group's consensus, you...",
    category: "Influence",
    options: [
      { id: 'A', text: "Speak up confidently and advocate firmly for your position", scores: { L: 3 } },
      { id: 'B', text: "Share your view in a way that invites open, energetic debate", scores: { I: 3 } },
      { id: 'C', text: "Share your concern gently, then ultimately support the group", scores: { S: 3 } },
      { id: 'D', text: "Present supporting evidence to make your case objectively", scores: { P: 3 } },
    ],
  },
  {
    id: 22,
    text: "What's your natural attitude toward professional risk-taking?",
    category: "Risk",
    options: [
      { id: 'A', text: "Calculated risk is part of winning — I embrace it confidently", scores: { L: 3 } },
      { id: 'B', text: "I'm comfortable with risk when the team is aligned and energized", scores: { I: 2, L: 1 } },
      { id: 'C', text: "I prefer a cautious approach that protects the team's stability", scores: { S: 3 } },
      { id: 'D', text: "I assess every risk carefully with data before committing", scores: { P: 3 } },
    ],
  },
  {
    id: 23,
    text: "In a brainstorming session, your natural role is to...",
    category: "Creativity",
    options: [
      { id: 'A', text: "Focus on what's actionable and steer the group toward decisions", scores: { L: 3 } },
      { id: 'B', text: "Generate bold creative ideas and enthusiastically build on others'", scores: { I: 3 } },
      { id: 'C', text: "Ensure quieter voices are heard and all ideas feel welcome", scores: { S: 3 } },
      { id: 'D', text: "Evaluate ideas critically for feasibility, logic, and risk", scores: { P: 3 } },
    ],
  },
  {
    id: 24,
    text: "When you're under significant stress, colleagues would most likely notice you...",
    category: "Stress",
    options: [
      { id: 'A', text: "Becoming more direct, assertive, and impatient", scores: { L: 3 } },
      { id: 'B', text: "Becoming louder, more expressive, or emotionally charged", scores: { I: 3 } },
      { id: 'C', text: "Withdrawing and becoming unusually quiet or avoidant", scores: { S: 3 } },
      { id: 'D', text: "Becoming highly critical, perfectionistic, or fixated on details", scores: { P: 3 } },
    ],
  },
  {
    id: 25,
    text: "The type of professional work that excites you the most is...",
    category: "Motivation",
    options: [
      { id: 'A', text: "High-impact, high-stakes projects where you lead from the front", scores: { L: 3 } },
      { id: 'B', text: "Dynamic team projects filled with collaboration and variety", scores: { I: 3 } },
      { id: 'C', text: "Long-term initiatives that build deep trust and relationships", scores: { S: 3 } },
      { id: 'D', text: "Complex analytical work that requires deep focus and precision", scores: { P: 3 } },
    ],
  },
  {
    id: 26,
    text: "When onboarding a new team member, your approach is to...",
    category: "People Management",
    options: [
      { id: 'A', text: "Set clear expectations and give them challenging work early", scores: { L: 3 } },
      { id: 'B', text: "Make them feel welcome immediately and introduce them to everyone", scores: { I: 3 } },
      { id: 'C', text: "Patiently guide them and ensure they feel fully comfortable", scores: { S: 3 } },
      { id: 'D', text: "Prepare a structured onboarding plan with clear documentation", scores: { P: 3 } },
    ],
  },
  {
    id: 27,
    text: "How do you set professional goals?",
    category: "Goal Setting",
    options: [
      { id: 'A', text: "I set ambitious, aggressive goals and pursue them relentlessly", scores: { L: 3 } },
      { id: 'B', text: "I set inspiring goals that rally the team to push past limits", scores: { I: 3 } },
      { id: 'C', text: "I set realistic, collaborative goals everyone can genuinely commit to", scores: { S: 3 } },
      { id: 'D', text: "I set measurable goals with detailed milestones and KPIs", scores: { P: 3 } },
    ],
  },
  {
    id: 28,
    text: "In a client-facing or sales context, your natural approach is to...",
    category: "Client Relations",
    options: [
      { id: 'A', text: "Quickly understand what they need and drive to close confidently", scores: { L: 3 } },
      { id: 'B', text: "Build rapport, tell compelling stories, and generate excitement", scores: { I: 3 } },
      { id: 'C', text: "Build long-term trust and ensure consistent client satisfaction", scores: { S: 3 } },
      { id: 'D', text: "Present a fact-based, well-structured proposal backed by data", scores: { P: 3 } },
    ],
  },
  {
    id: 29,
    text: "When plans change unexpectedly, your first reaction is to...",
    category: "Adaptability",
    options: [
      { id: 'A', text: "Quickly adapt and define a new path forward without hesitation", scores: { L: 3 } },
      { id: 'B', text: "Rally the team and keep energy positive through the transition", scores: { I: 3 } },
      { id: 'C', text: "Help the team feel stable and reassured despite the disruption", scores: { S: 3 } },
      { id: 'D', text: "Request full clarity on the new plan before committing to action", scores: { P: 3 } },
    ],
  },
  {
    id: 30,
    text: "The feedback you most often receive from managers or mentors is...",
    category: "Self-Awareness",
    options: [
      { id: 'A', text: "You drive results powerfully but can push people too hard", scores: { L: 3 } },
      { id: 'B', text: "You're excellent with people but sometimes overlook critical details", scores: { I: 3 } },
      { id: 'C', text: "You're highly reliable but sometimes too hesitant about change", scores: { S: 3 } },
      { id: 'D', text: "Your output quality is exceptional but you sometimes overthink", scores: { P: 3 } },
    ],
  },
  {
    id: 31,
    text: "What professionally motivates you more than anything else?",
    category: "Motivation",
    options: [
      { id: 'A', text: "Achieving ambitious outcomes and advancing your career impact", scores: { L: 3 } },
      { id: 'B', text: "Recognition, genuine connection, and making a visible difference", scores: { I: 3 } },
      { id: 'C', text: "Feeling truly valued and essential to your team's well-being", scores: { S: 3 } },
      { id: 'D', text: "Achieving mastery, precision, and producing high-caliber work", scores: { P: 3 } },
    ],
  },
  {
    id: 32,
    text: "In a negotiation or high-stakes discussion, your approach is to...",
    category: "Influence",
    options: [
      { id: 'A', text: "Be assertive, direct, and keep the focus on winning", scores: { L: 3 } },
      { id: 'B', text: "Build chemistry first, then find creative win-win solutions", scores: { I: 3 } },
      { id: 'C', text: "Seek common ground and ensure both sides feel genuinely respected", scores: { S: 3 } },
      { id: 'D', text: "Prepare extensively with data and a structured, logical argument", scores: { P: 3 } },
    ],
  },
  {
    id: 33,
    text: "When you join a team that's clearly underperforming, you...",
    category: "Leadership",
    options: [
      { id: 'A', text: "Assess the situation quickly and start making structural changes", scores: { L: 3 } },
      { id: 'B', text: "Build energy and optimism to shift the team's collective mindset", scores: { I: 3 } },
      { id: 'C', text: "Build genuine trust with each member before proposing changes", scores: { S: 3 } },
      { id: 'D', text: "Analyze processes, identify gaps, and create a systematic improvement plan", scores: { P: 3 } },
    ],
  },
  {
    id: 34,
    text: "Your manager gives you a completely open-ended assignment. You...",
    category: "Autonomy",
    options: [
      { id: 'A', text: "Define the scope yourself and dive in immediately", scores: { L: 3 } },
      { id: 'B', text: "Gather input from key colleagues to shape the direction collaboratively", scores: { I: 3 } },
      { id: 'C', text: "Ask clarifying questions to fully understand expectations first", scores: { S: 2, P: 1 } },
      { id: 'D', text: "Request a detailed brief with clear success criteria", scores: { P: 3 } },
    ],
  },
  {
    id: 35,
    text: "When it comes to your professional reputation, what matters most to you?",
    category: "Values",
    options: [
      { id: 'A', text: "Being known as someone who delivers results and drives impact", scores: { L: 3 } },
      { id: 'B', text: "Being the person others love working with and look up to", scores: { I: 3 } },
      { id: 'C', text: "Being the trusted, dependable person everyone can count on", scores: { S: 3 } },
      { id: 'D', text: "Being respected for your expertise, accuracy, and thoroughness", scores: { P: 3 } },
    ],
  },
  {
    id: 36,
    text: "When you have a business idea you believe in strongly, you...",
    category: "Innovation",
    options: [
      { id: 'A', text: "Push for it decisively and move fast to test and iterate", scores: { L: 3 } },
      { id: 'B', text: "Pitch it with enthusiasm and rally others to champion it together", scores: { I: 3 } },
      { id: 'C', text: "Build consensus slowly and ensure broad stakeholder support", scores: { S: 3 } },
      { id: 'D', text: "Prepare a comprehensive feasibility study before proposing it formally", scores: { P: 3 } },
    ],
  },
  {
    id: 37,
    text: "In terms of your ideal management style from a boss, you prefer...",
    category: "Management",
    options: [
      { id: 'A', text: "High autonomy — give me a goal and get out of my way", scores: { L: 3 } },
      { id: 'B', text: "A collaborative, inspiring leader who recognizes contributions", scores: { I: 3 } },
      { id: 'C', text: "A supportive manager who values relationships and team culture", scores: { S: 3 } },
      { id: 'D', text: "A structured manager who provides clear expectations and feedback", scores: { P: 3 } },
    ],
  },
  {
    id: 38,
    text: "When you reflect on how you build relationships with colleagues, you...",
    category: "Relationships",
    options: [
      { id: 'A', text: "Build respect through performance and delivering on promises", scores: { L: 2, S: 1 } },
      { id: 'B', text: "Connect naturally and quickly — people are drawn to your energy", scores: { I: 3 } },
      { id: 'C', text: "Build deep, loyal relationships slowly through consistent trust", scores: { S: 3 } },
      { id: 'D', text: "Build professional credibility through expertise and reliability", scores: { P: 3 } },
    ],
  },
  {
    id: 39,
    text: "Looking back at your biggest professional failure, what was the core lesson?",
    category: "Growth",
    options: [
      { id: 'A', text: "I moved too fast without bringing the right people along", scores: { L: 3 } },
      { id: 'B', text: "I focused too much on enthusiasm and not enough on execution", scores: { I: 3 } },
      { id: 'C', text: "I avoided a necessary but difficult conversation for too long", scores: { S: 3 } },
      { id: 'D', text: "I over-analyzed and missed the window to act", scores: { P: 3 } },
    ],
  },
  {
    id: 40,
    text: "The single greatest factor behind your biggest professional success was...",
    category: "Success",
    options: [
      { id: 'A', text: "Your drive, decisiveness, and willingness to take bold risks", scores: { L: 3 } },
      { id: 'B', text: "Your ability to energize and unite the right people around a vision", scores: { I: 3 } },
      { id: 'C', text: "Your consistency, loyalty, and the deep trust you built over time", scores: { S: 3 } },
      { id: 'D', text: "Your disciplined planning, attention to detail, and flawless execution", scores: { P: 3 } },
    ],
  },
];

export default questions;
