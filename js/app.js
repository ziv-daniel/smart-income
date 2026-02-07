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

// --- Format currency ---
function formatNIS(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatUSD(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
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

// --- Initialize on page load ---
document.addEventListener('DOMContentLoaded', () => {
  initBudgetCalculator()
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
