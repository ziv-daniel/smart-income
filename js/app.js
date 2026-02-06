/* ===== SmartHomeIL - Main JavaScript ===== */

// --- Mobile Navigation ---
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.mobile-toggle')
  const navLinks = document.querySelector('.nav-links')

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open')
      toggle.classList.toggle('active')
    })

    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open')
        toggle.classList.remove('active')
      }
    })
  }

  // --- Navbar scroll effect ---
  const navbar = document.querySelector('.navbar')
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled')
      } else {
        navbar.classList.remove('scrolled')
      }
    })
  }

  // --- Active nav link ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html'
  const links = document.querySelectorAll('.nav-links a')
  links.forEach(link => {
    const href = link.getAttribute('href')
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active')
    }
  })

  // --- Scroll animations ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll('.card, .product-card, .calc-card').forEach(el => {
    observer.observe(el)
  })

  // --- Tab functionality ---
  const tabBtns = document.querySelectorAll('.tab-btn')
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('.tab-nav')
      const contentContainer = tabGroup.nextElementSibling || tabGroup.parentElement

      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')

      const target = btn.dataset.tab
      const allContents = contentContainer.parentElement.querySelectorAll('.tab-content')
      allContents.forEach(c => c.classList.remove('active'))

      const targetContent = document.getElementById(target)
      if (targetContent) {
        targetContent.classList.add('active')
      }
    })
  })
})

// --- Israeli Salary Calculator ---
const SalaryCalculator = {
  // 2024/2025 Israeli income tax brackets (monthly, in NIS)
  taxBrackets: [
    { min: 0, max: 7010, rate: 0.10 },
    { min: 7010, max: 10060, rate: 0.14 },
    { min: 10060, max: 16150, rate: 0.20 },
    { min: 16150, max: 22440, rate: 0.31 },
    { min: 22440, max: 46690, rate: 0.35 },
    { min: 46690, max: 60130, rate: 0.47 },
    { min: 60130, max: Infinity, rate: 0.50 }
  ],

  // Bituach Leumi (National Insurance) rates for employees
  bituachLeumi: {
    reducedRate: 0.004,  // Up to 60% of average wage
    fullRate: 0.07,       // Above 60% of average wage
    threshold: 7122,      // 60% of average wage (monthly, ~2024)
    maxIncome: 47465      // Max insurable income
  },

  // Health Insurance rates
  healthInsurance: {
    reducedRate: 0.031,
    fullRate: 0.05,
    threshold: 7122
  },

  // Tax credit points
  creditPointValue: 235, // Monthly value per credit point (2024)

  calculate(grossMonthly, creditPoints, pensionRate, hasKeren) {
    const gross = parseFloat(grossMonthly) || 0
    const credits = parseFloat(creditPoints) || 2.25
    const pension = parseFloat(pensionRate) || 6.5
    const kerenRate = hasKeren ? 2.5 : 0

    // 1. Calculate pension deduction (employee portion)
    const pensionDeduction = gross * (pension / 100)

    // 2. Calculate Keren Hishtalmut (employee portion)
    const kerenDeduction = gross * (kerenRate / 100)

    // 3. Calculate taxable income (after pension deduction for tax purposes)
    const taxableIncome = gross - (pensionDeduction * (35 / pension)) // Tax benefit on pension

    // 4. Calculate income tax
    let incomeTax = 0
    let remaining = taxableIncome

    for (const bracket of this.taxBrackets) {
      if (remaining <= 0) break
      const taxableInBracket = Math.min(remaining, bracket.max - bracket.min)
      incomeTax += taxableInBracket * bracket.rate
      remaining -= taxableInBracket
    }

    // 5. Apply tax credit points
    const totalCredit = credits * this.creditPointValue
    incomeTax = Math.max(0, incomeTax - totalCredit)

    // 6. Calculate Bituach Leumi
    let bituachLeumi = 0
    const bl = this.bituachLeumi
    const cappedIncome = Math.min(gross, bl.maxIncome)

    if (cappedIncome <= bl.threshold) {
      bituachLeumi = cappedIncome * bl.reducedRate
    } else {
      bituachLeumi = bl.threshold * bl.reducedRate + (cappedIncome - bl.threshold) * bl.fullRate
    }

    // 7. Calculate Health Insurance
    let healthInsurance = 0
    const hi = this.healthInsurance
    if (gross <= hi.threshold) {
      healthInsurance = gross * hi.reducedRate
    } else {
      healthInsurance = hi.threshold * hi.reducedRate + (gross - hi.threshold) * hi.fullRate
    }

    // 8. Calculate total deductions and net salary
    const totalDeductions = incomeTax + bituachLeumi + healthInsurance + pensionDeduction + kerenDeduction
    const netSalary = gross - totalDeductions

    // 9. Employer costs
    const employerPension = gross * 0.065  // Employer pension contribution
    const employerSeverance = gross * 0.0833 // Severance fund (8.33%)
    const employerBL = cappedIncome <= bl.threshold
      ? cappedIncome * 0.037
      : bl.threshold * 0.037 + (cappedIncome - bl.threshold) * 0.075
    const totalEmployerCost = gross + employerPension + employerSeverance + employerBL

    return {
      gross,
      incomeTax: Math.round(incomeTax),
      bituachLeumi: Math.round(bituachLeumi),
      healthInsurance: Math.round(healthInsurance),
      pensionDeduction: Math.round(pensionDeduction),
      kerenDeduction: Math.round(kerenDeduction),
      totalDeductions: Math.round(totalDeductions),
      netSalary: Math.round(netSalary),
      effectiveTaxRate: gross > 0 ? ((totalDeductions / gross) * 100).toFixed(1) : 0,
      totalEmployerCost: Math.round(totalEmployerCost),
      annualGross: gross * 12,
      annualNet: Math.round(netSalary) * 12
    }
  }
}

// --- Format currency ---
function formatNIS(amount) {
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// --- Calculator form handler ---
function initCalculator() {
  const form = document.getElementById('salary-form')
  if (!form) return

  const calculate = () => {
    const gross = document.getElementById('gross-salary').value
    const credits = document.getElementById('credit-points').value
    const pension = document.getElementById('pension-rate').value
    const hasKeren = document.getElementById('keren-toggle')?.checked || false

    const result = SalaryCalculator.calculate(gross, credits, pension, hasKeren)

    const resultSection = document.getElementById('calc-results')
    if (!resultSection) return

    resultSection.classList.remove('hidden')

    document.getElementById('result-net').textContent = formatNIS(result.netSalary)
    document.getElementById('result-tax').textContent = formatNIS(result.incomeTax)
    document.getElementById('result-bl').textContent = formatNIS(result.bituachLeumi)
    document.getElementById('result-health').textContent = formatNIS(result.healthInsurance)
    document.getElementById('result-pension').textContent = formatNIS(result.pensionDeduction)
    document.getElementById('result-keren').textContent = formatNIS(result.kerenDeduction)
    document.getElementById('result-total-deductions').textContent = formatNIS(result.totalDeductions)
    document.getElementById('result-effective-rate').textContent = result.effectiveTaxRate + '%'
    document.getElementById('result-employer-cost').textContent = formatNIS(result.totalEmployerCost)
    document.getElementById('result-annual-net').textContent = formatNIS(result.annualNet)

    // Update the breakdown bar
    const total = result.gross
    if (total > 0) {
      const barItems = [
        { id: 'bar-net', value: result.netSalary, color: '#06d6a0' },
        { id: 'bar-tax', value: result.incomeTax, color: '#ef476f' },
        { id: 'bar-bl', value: result.bituachLeumi, color: '#ffd166' },
        { id: 'bar-health', value: result.healthInsurance, color: '#118ab2' },
        { id: 'bar-pension', value: result.pensionDeduction, color: '#073b4c' },
        { id: 'bar-keren', value: result.kerenDeduction, color: '#8338ec' }
      ]

      const bar = document.getElementById('salary-bar')
      if (bar) {
        bar.innerHTML = barItems
          .filter(item => item.value > 0)
          .map(item => {
            const pct = ((item.value / total) * 100).toFixed(1)
            return `<div style="width:${pct}%;background:${item.color};height:100%;transition:width 0.5s ease" title="${pct}%"></div>`
          })
          .join('')
      }
    }
  }

  // Listen to all inputs
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', calculate)
    input.addEventListener('change', calculate)
  })

  // Initial calculation
  calculate()
}

// --- Smart Home Budget Calculator ---
function initBudgetCalculator() {
  const form = document.getElementById('budget-form')
  if (!form) return

  const calculate = () => {
    const rooms = parseInt(document.getElementById('num-rooms').value) || 3
    const level = document.getElementById('automation-level').value || 'basic'

    const prices = {
      basic: {
        hub: 250,
        lightsPerRoom: 120,
        sensor: 80,
        plug: 60,
        label: 'Basic'
      },
      intermediate: {
        hub: 450,
        lightsPerRoom: 250,
        sensor: 120,
        plug: 100,
        camera: 350,
        thermostat: 500,
        label: 'Intermediate'
      },
      advanced: {
        hub: 700,
        lightsPerRoom: 400,
        sensor: 150,
        plug: 120,
        camera: 550,
        thermostat: 700,
        lock: 800,
        vacuum: 2500,
        label: 'Advanced'
      }
    }

    const config = prices[level]
    const items = []

    items.push({ name: 'Smart Hub / Controller', qty: 1, price: config.hub })
    items.push({ name: 'Smart Lights (per room)', qty: rooms, price: config.lightsPerRoom })
    items.push({ name: 'Motion Sensors', qty: Math.ceil(rooms / 2), price: config.sensor })
    items.push({ name: 'Smart Plugs', qty: Math.min(rooms, 4), price: config.plug })

    if (config.camera) {
      items.push({ name: 'Security Camera', qty: level === 'advanced' ? 2 : 1, price: config.camera })
    }
    if (config.thermostat) {
      items.push({ name: 'Smart AC Controller', qty: Math.ceil(rooms / 2), price: config.thermostat })
    }
    if (config.lock) {
      items.push({ name: 'Smart Door Lock', qty: 1, price: config.lock })
    }
    if (config.vacuum) {
      items.push({ name: 'Robot Vacuum', qty: 1, price: config.vacuum })
    }

    const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0)

    const tableBody = document.getElementById('budget-table-body')
    if (tableBody) {
      tableBody.innerHTML = items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>${formatNIS(item.price)}</td>
          <td><strong>${formatNIS(item.qty * item.price)}</strong></td>
        </tr>
      `).join('')
    }

    const totalEl = document.getElementById('budget-total')
    if (totalEl) {
      totalEl.textContent = formatNIS(total)
    }

    const usdEl = document.getElementById('budget-total-usd')
    if (usdEl) {
      usdEl.textContent = '~' + formatUSD(Math.round(total / 3.65))
    }
  }

  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', calculate)
    input.addEventListener('change', calculate)
  })

  calculate()
}

// --- Money Transfer Calculator ---
function initTransferCalculator() {
  const form = document.getElementById('transfer-form')
  if (!form) return

  const providers = [
    {
      name: 'Wise',
      fee: 0.0055,
      minFee: 3,
      markup: 0.003,
      speed: '1-2 days',
      url: 'https://wise.com/invite/',
      rating: 4.8
    },
    {
      name: 'PayPal',
      fee: 0.029,
      minFee: 5,
      markup: 0.035,
      speed: '2-3 days',
      url: 'https://www.paypal.com',
      rating: 3.5
    },
    {
      name: 'Western Union',
      fee: 0.015,
      minFee: 8,
      markup: 0.025,
      speed: 'Minutes - 2 days',
      url: 'https://www.westernunion.com',
      rating: 3.2
    },
    {
      name: 'Bank Transfer',
      fee: 0.0,
      minFee: 25,
      markup: 0.04,
      speed: '3-5 days',
      url: '#',
      rating: 2.5
    },
    {
      name: 'Payoneer',
      fee: 0.02,
      minFee: 3,
      markup: 0.005,
      speed: '2-5 days',
      url: 'https://www.payoneer.com',
      rating: 4.2
    },
    {
      name: 'OFX',
      fee: 0.0,
      minFee: 0,
      markup: 0.01,
      speed: '1-3 days',
      url: 'https://www.ofx.com',
      rating: 4.0
    }
  ]

  const calculate = () => {
    const amount = parseFloat(document.getElementById('transfer-amount').value) || 1000
    const midRate = 3.65 // Approximate USD/ILS mid-market rate

    const results = providers.map(p => {
      const transferFee = Math.max(p.minFee, amount * p.fee)
      const effectiveRate = midRate * (1 - p.markup)
      const received = (amount - transferFee) * effectiveRate
      const totalCost = transferFee + (amount * p.markup * midRate)

      return {
        ...p,
        transferFee: transferFee.toFixed(2),
        effectiveRate: effectiveRate.toFixed(4),
        received: Math.round(received),
        totalCost: totalCost.toFixed(2)
      }
    }).sort((a, b) => b.received - a.received)

    const tableBody = document.getElementById('transfer-results')
    if (tableBody) {
      tableBody.innerHTML = results.map((r, i) => `
        <tr class="${i === 0 ? 'highlight' : ''}">
          <td>
            <strong>${r.name}</strong>
            ${i === 0 ? '<span class="badge badge-success" style="margin-left:0.5rem">Best Value</span>' : ''}
          </td>
          <td>$${r.transferFee}</td>
          <td>${r.effectiveRate}</td>
          <td><strong>${formatNIS(r.received)}</strong></td>
          <td>${r.speed}</td>
          <td>${'&#9733;'.repeat(Math.round(r.rating))} ${r.rating}</td>
          <td>
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              Send Now &rarr;
            </a>
          </td>
        </tr>
      `).join('')
    }

    const bestProvider = results[0]
    const worstProvider = results[results.length - 1]
    const savings = worstProvider ? (bestProvider.received - worstProvider.received) : 0

    const savingsEl = document.getElementById('transfer-savings')
    if (savingsEl && savings > 0) {
      savingsEl.innerHTML = `Using <strong>${bestProvider.name}</strong> saves you <strong>${formatNIS(savings)}</strong> compared to ${worstProvider.name} on this transfer!`
      savingsEl.classList.remove('hidden')
    }
  }

  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', calculate)
    input.addEventListener('change', calculate)
  })

  calculate()
}

// --- Initialize on page load ---
document.addEventListener('DOMContentLoaded', () => {
  initCalculator()
  initBudgetCalculator()
  initTransferCalculator()
})

// --- Affiliate link tracking ---
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-affiliate]')
  if (link) {
    const provider = link.dataset.affiliate
    const category = link.dataset.category || 'unknown'
    // Track click for analytics (can be connected to Google Analytics or similar)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'affiliate_click', {
        event_category: category,
        event_label: provider,
        transport_type: 'beacon'
      })
    }
  }
})
