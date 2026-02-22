/**
 * AI Readiness Assessment - Multi-step wizard + results
 */
(function () {
  'use strict';

  const API = '/api';
  const TOKEN_KEY = 'auth_token';

  let questions = [];
  let assessmentId = null;
  let currentStep = 0;
  let responses = {}; // questionId -> answerValue

  const wizardView = document.getElementById('wizard-view');
  const resultsView = document.getElementById('results-view');
  const questionText = document.getElementById('question-text');
  const questionCategory = document.getElementById('question-category');
  const optionList = document.getElementById('option-list');
  const progressFill = document.getElementById('progress-fill');
  const stepCounter = document.getElementById('step-counter');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const questionError = document.getElementById('question-error');

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const t = getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  function showError(msg) {
    questionError.textContent = msg;
    questionError.style.display = 'block';
  }

  function hideError() {
    questionError.textContent = '';
    questionError.style.display = 'none';
  }

  async function fetchQuestions() {
    const res = await fetch(API + '/assessment-questions');
    if (!res.ok) throw new Error('Failed to load questions');
    return res.json();
  }

  async function createAssessment() {
    const res = await fetch(API + '/assessments', {
      method: 'POST',
      headers: getHeaders(),
      body: '{}',
    });
    if (!res.ok) throw new Error('Failed to start assessment');
    const data = await res.json();
    return data.id;
  }

  async function saveResponses() {
    const data = {
      responses: Object.entries(responses).map(([questionId, answerValue]) => ({ questionId, answerValue })),
    };
    if (data.responses.length === 0) return;
    const res = await fetch(API + '/assessments/' + assessmentId + '/responses', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save progress');
  }

  async function submitAssessment() {
    const res = await fetch(API + '/assessments/' + assessmentId + '/submit', {
      method: 'POST',
      headers: getHeaders(),
      body: '{}',
    });
    if (!res.ok) throw new Error('Failed to submit assessment');
    return res.json();
  }

  function renderQuestion(q) {
    questionCategory.textContent = q.categoryLabel || q.category;
    questionText.textContent = q.questionText;
    optionList.innerHTML = '';
    const selected = responses[q.id];

    for (const opt of q.options || []) {
      const div = document.createElement('div');
      div.className = 'option-item' + (selected === opt.value ? ' selected' : '');
      div.dataset.value = opt.value;
      div.innerHTML = `
        <input type="radio" name="q" id="opt-${opt.value}" value="${opt.value}">
        <label for="opt-${opt.value}">${opt.label}</label>
      `;
      div.addEventListener('click', () => {
        document.querySelectorAll('.option-item').forEach((el) => el.classList.remove('selected'));
        div.classList.add('selected');
        div.querySelector('input').checked = true;
        responses[q.id] = opt.value;
        hideError();
      });
      optionList.appendChild(div);
    }

    progressFill.style.width = (currentStep / questions.length) * 100 + '%';
    stepCounter.textContent = `Question ${currentStep + 1} of ${questions.length}`;
    btnPrev.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
    btnNext.textContent = currentStep === questions.length - 1 ? 'See Results' : 'Next';
  }

  function showResults(result) {
    wizardView.classList.add('hidden');
    resultsView.classList.add('visible');

    const score = result.overallScore ?? 0;
    document.getElementById('score-circle').textContent = score;

    const catScores = result.categoryScores || {};
    const riskHeatmap = result.riskHeatmap || {};
    const catLabels = {
      data_maturity: 'Data Maturity',
      infrastructure: 'Infrastructure',
      security: 'Security Posture',
      culture: 'Organisational Culture',
      regulatory: 'Regulatory & Compliance',
      risk: 'Risk & Governance',
    };

    const catEl = document.getElementById('category-scores');
    catEl.innerHTML = '';
    for (const [cat, s] of Object.entries(catScores)) {
      const risk = riskHeatmap[cat] || 'low';
      const div = document.createElement('div');
      div.className = 'category-score-item';
      div.innerHTML = `
        <span class="name">${catLabels[cat] || cat}</span>
        <span class="score">${s}/100 <span class="risk-badge ${risk}">${risk}</span></span>
      `;
      catEl.appendChild(div);
    }

    const recs = result.recommendations || [];
    const recEl = document.getElementById('recommendations-list');
    recEl.innerHTML = '';
    for (const r of recs) {
      const div = document.createElement('div');
      div.className = 'rec-card ' + (r.priority || 'low');
      div.innerHTML = `
        <h4>${r.title}</h4>
        <p>${r.description}</p>
      `;
      recEl.appendChild(div);
    }
  }

  async function init() {
    try {
      questions = await fetchQuestions();
      if (questions.length === 0) {
        showError('No assessment questions available. Please run database seed.');
        return;
      }
      assessmentId = await createAssessment();
      hideError();
      renderQuestion(questions[0]);
    } catch (err) {
      showError(err.message || 'Failed to start assessment');
    }
  }

  btnPrev.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderQuestion(questions[currentStep]);
      hideError();
    }
  });

  btnNext.addEventListener('click', async () => {
    const q = questions[currentStep];
    if (!responses[q.id]) {
      showError('Please select an option to continue.');
      return;
    }
    hideError();

    if (currentStep < questions.length - 1) {
      currentStep++;
      await saveResponses();
      renderQuestion(questions[currentStep]);
    } else {
      btnNext.disabled = true;
      btnNext.textContent = 'Calculating…';
      try {
        await saveResponses();
        const result = await submitAssessment();
        showResults(result);
      } catch (err) {
        showError(err.message || 'Failed to submit');
        btnNext.disabled = false;
        btnNext.textContent = 'See Results';
      }
    }
  });

  init();
})();
