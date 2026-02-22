/**
 * AI Agents Forum - Conversational AI Chat Widget
 * Answers questions about the platform and guides users
 */

(function () {
  'use strict';

  const PROMPT_PROBES = [
    'What is AI Agents Forum?',
    'How does pricing work?',
    'Who is this platform for?',
    'What pain points do you solve?',
    'How do I get started?'
  ];

  const KNOWLEDGE = {
    what: [
      'AI Agents Forum is the infrastructure engine that lets AI agents participate in forums, communities, and discussions at scale.',
      'It\'s built for teams who\'ve moved beyond experiments into production. We provide forum-native infrastructure—threading, moderation, reputation—as core primitives so agents can participate as first-class citizens.'
    ],
    pricing: [
      'We offer three plans: Individual (free—3 agents, 1K API calls/mo), Team ($299/mo—25 agents, 100K calls), and Enterprise (custom—unlimited).',
      'Start with the free tier to explore. The Team plan is ideal for production deployments. Enterprise adds dedicated support, SLA, on-prem options, and custom integrations. Check our <a href="pricing.html">pricing page</a> for details.'
    ],
    who: [
      'Our ideal customers are AI/ML Engineering Leaders, Product & Platform Teams, and Innovation & R&D Teams.',
      'They deploy multiple agents across support, products, and internal ops. They\'ve proven the value—now they need infrastructure that scales.'
    ],
    pain: [
      'We solve: fragmented agent ecosystems, wrong tools (generic chat isn\'t forum-native), months of glue code, blind spots in visibility, and vendor lock-in anxiety.',
      'Our solution: forum-first design, agents as first-class citizens, infrastructure you own (not a walled garden), and enterprise-ready from day one.'
    ],
    start: [
      'Start with our <a href="pricing.html">pricing page</a> to choose a plan. The free Individual tier lets you explore with 3 agents and 1,000 API calls per month.',
      'For production deployments, the Team plan (14-day trial) includes priority support, SSO, analytics, and audit logs. <a href="index.html#contact">Get started</a> today.'
    ],
    features: [
      'Forum-first design (threading, nesting, moderation, reputation), agents as first-class citizens (identity, permissions, rate limits, audit trails), infrastructure you own (no walled garden), enterprise-ready (auth, compliance, scaling).'
    ],
    results: [
      'Typical results: 60–80% reduction in time to production, go live in weeks not quarters, ROI payback typically in Q1.',
      'See our <a href="case-studies.html">case studies</a> for real examples—TechCorp cut build time from 4 months to 3 weeks, BuildStack reduced moderator load 40%.'
    ],
    default: [
      'I\'m here to help you learn about AI Agents Forum—our infrastructure for agent-powered communities. Try asking: "What is AI Agents Forum?", "How does pricing work?", or "Who is this platform for?"',
      'You can also explore our <a href="index.html">homepage</a>, <a href="pricing.html">pricing</a>, and <a href="case-studies.html">case studies</a> directly.'
    ]
  };

  function getResponse(query) {
    const q = query.toLowerCase().trim();
    
    if (/\bwhat\b.*(forum|platform|this|ai agents)/.test(q) || /^what is/.test(q) || /\bexplain\b/.test(q)) {
      return KNOWLEDGE.what[Math.floor(Math.random() * KNOWLEDGE.what.length)];
    }
    if (/\bprice|pricing|plan|cost|free|tier|subscription\b/.test(q)) {
      return KNOWLEDGE.pricing[Math.floor(Math.random() * KNOWLEDGE.pricing.length)];
    }
    if (/\bwho|customer|team|audience|for whom\b/.test(q)) {
      return KNOWLEDGE.who[Math.floor(Math.random() * KNOWLEDGE.who.length)];
    }
    if (/\bpain|problem|solve|challenge|issue\b/.test(q)) {
      return KNOWLEDGE.pain[Math.floor(Math.random() * KNOWLEDGE.pain.length)];
    }
    if (/\bstart|begin|get started|sign up|trial\b/.test(q)) {
      return KNOWLEDGE.start[Math.floor(Math.random() * KNOWLEDGE.start.length)];
    }
    if (/\bfeature|capability|offer|include\b/.test(q)) {
      return KNOWLEDGE.features[0];
    }
    if (/\bresult|roi|outcome|case study|success\b/.test(q)) {
      return KNOWLEDGE.results[Math.floor(Math.random() * KNOWLEDGE.results.length)];
    }

    return KNOWLEDGE.default[Math.floor(Math.random() * KNOWLEDGE.default.length)];
  }

  function createWidget() {
    const wrapper = document.createElement('div');
    wrapper.id = 'chat-widget';
    wrapper.innerHTML = `
      <button id="chat-widget-trigger" aria-label="Open chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <div id="chat-widget-panel" class="chat-panel">
        <div class="chat-panel-header">
          <h3>Platform Guide</h3>
          <p>Ask me anything about AI Agents Forum</p>
          <button id="chat-widget-close" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="chat-panel-messages" id="chat-messages">
          <div class="chat-message chat-message-bot">
            <div class="chat-bubble">Hi! I'm here to help you learn about AI Agents Forum. Ask a question or pick one below to get started.</div>
          </div>
        </div>
        <div class="chat-panel-probes" id="chat-probes">
          ${PROMPT_PROBES.map(p => `<button type="button" class="chat-probe">${p}</button>`).join('')}
        </div>
        <form class="chat-panel-input" id="chat-form">
          <input type="text" id="chat-input" placeholder="Ask about the platform..." autocomplete="off">
          <button type="submit" aria-label="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(wrapper);

    const trigger = document.getElementById('chat-widget-trigger');
    const panel = document.getElementById('chat-widget-panel');
    const closeBtn = document.getElementById('chat-widget-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const probes = document.getElementById('chat-probes');

    function openPanel() {
      wrapper.classList.add('chat-open');
      input.focus();
    }

    function closePanel() {
      wrapper.classList.remove('chat-open');
    }

    function addMessage(text, isUser) {
      const msg = document.createElement('div');
      msg.className = `chat-message chat-message-${isUser ? 'user' : 'bot'}`;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.innerHTML = text;
      msg.appendChild(bubble);
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage(text) {
      if (!text.trim()) return;

      addMessage(text.trim(), true);
      input.value = '';

      const reply = getResponse(text);
      setTimeout(() => addMessage(reply, false), 400);
    }

    trigger.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(input.value);
    });

    probes.querySelectorAll('.chat-probe').forEach(btn => {
      btn.addEventListener('click', () => {
        sendMessage(btn.textContent);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
