const burger = document.querySelector("[data-burger]");
const nav = document.querySelector("[data-nav]");

if (burger && nav) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-active");
    nav.classList.toggle("is-open");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      burger.classList.remove("is-active");
      nav.classList.remove("is-open");
    }
  });
}

/* ===== Форма покупки билета ===== */
const ticketForm = document.getElementById("ticketForm");

if (ticketForm) {
  const phoneInput = ticketForm.querySelector("#phone");
  const message = ticketForm.querySelector("[data-form-message]");
  const totalEl = ticketForm.querySelector("[data-total]");
  const serviceSelect = ticketForm.querySelector("[data-service]");

  /* --- Минимальная дата — сегодня --- */
  const dateInput = ticketForm.querySelector("#visitDate");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
  }

  /* --- Маска телефона --- */
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      let digits = e.target.value.replace(/\D/g, "");

      if (digits.startsWith("8")) digits = "7" + digits.slice(1);
      if (!digits.startsWith("7")) digits = "7" + digits;
      digits = digits.slice(0, 11);

      const parts = [
        "+7",
        digits.slice(1, 4),
        digits.slice(4, 7),
        digits.slice(7, 9),
        digits.slice(9, 11)
      ];

      let result = parts[0];
      if (parts[1]) result += ` (${parts[1]}`;
      if (parts[1] && parts[1].length === 3) result += ")";
      if (parts[2]) result += ` ${parts[2]}`;
      if (parts[3]) result += `-${parts[3]}`;
      if (parts[4]) result += `-${parts[4]}`;

      e.target.value = result;
    });
  }

  /* --- Счётчики билетов --- */
  ticketForm.querySelectorAll("[data-counter]").forEach((counter) => {
    const input = counter.querySelector("[data-counter-input]");
    const minus = counter.querySelector("[data-counter-minus]");
    const plus = counter.querySelector("[data-counter-plus]");

    const clamp = (val) => {
      const min = Number(input.min) || 0;
      const max = Number(input.max) || 99;
      return Math.min(Math.max(val, min), max);
    };

    minus.addEventListener("click", () => {
      input.value = clamp(Number(input.value) - 1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    plus.addEventListener("click", () => {
      input.value = clamp(Number(input.value) + 1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    input.addEventListener("input", () => {
      let val = Number(input.value);
      if (isNaN(val)) val = 0;
      input.value = clamp(val);
      updateTotal();
    });
  });

  /* --- Итоговая стоимость --- */
  function updateTotal() {
    if (!totalEl) return;
    let total = 0;

    ticketForm.querySelectorAll("[data-price]").forEach((el) => {
      if (el.tagName === "SELECT") return;
      const price = Number(el.dataset.price);
      const qty = Number(el.value) || 0;
      total += price * qty;
    });

    if (serviceSelect) {
      const option = serviceSelect.selectedOptions[0];
      const servicePrice = Number(option?.dataset.price) || 0;
      total += servicePrice;
    }

    totalEl.textContent = `${total.toLocaleString("ru-RU")} ₽`;
  }

  if (serviceSelect) {
    serviceSelect.addEventListener("change", updateTotal);
  }

  updateTotal();

  /* --- Валидация --- */
  const validators = {
    firstName: (v) => v.trim().length >= 2 || "Укажите имя (минимум 2 буквы)",
    lastName: (v) => v.trim().length >= 2 || "Укажите фамилию (минимум 2 буквы)",
    email: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Введите корректный email",
    phone: (v) => v.replace(/\D/g, "").length === 11 || "Введите телефон полностью",
    visitDate: (v) => {
      if (!v) return "Выберите дату";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(v);
      return chosen >= today || "Дата не может быть в прошлом";
    },
    visitTime: (v) => {
      if (!v) return "Выберите время";
      const [h, m] = v.split(":").map(Number);
      const minutes = h * 60 + m;
      return (minutes >= 9 * 60 && minutes <= 20 * 60) || "Зоопарк работает с 9:00 до 20:00";
    }
  };

  const validateField = (input) => {
    const name = input.name;
    const rule = validators[name];
    if (!rule) return true;

    const result = rule(input.value);
    const errorEl = document.getElementById(`${name}-error`);
    const errorText = result === true ? "" : result;

    if (errorEl) errorEl.textContent = errorText;
    input.setAttribute("aria-invalid", errorText ? "true" : "false");

    return result === true;
  };

  const requiredFields = ["firstName", "lastName", "email", "phone", "visitDate", "visitTime"];

  requiredFields.forEach((name) => {
    const input = ticketForm.querySelector(`[name="${name}"]`);
    if (!input) return;

    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validateField(input);
    });
  });

  /* --- Отправка --- */
  ticketForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let firstInvalid = null;
    requiredFields.forEach((name) => {
      const input = ticketForm.querySelector(`[name="${name}"]`);
      if (!input) return;
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });

    const adults = Number(ticketForm.adultTickets.value) || 0;
    const children = Number(ticketForm.childTickets.value) || 0;

    if (adults + children === 0) {
      message.hidden = false;
      message.className = "tickets__message tickets__message--error";
      message.textContent = "Выберите хотя бы один билет";
      return;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      message.hidden = false;
      message.className = "tickets__message tickets__message--error";
      message.textContent = "Проверьте выделенные поля";
      return;
    }

    const data = {
      firstName: ticketForm.firstName.value.trim(),
      lastName: ticketForm.lastName.value.trim(),
      email: ticketForm.email.value.trim(),
      phone: ticketForm.phone.value.trim(),
      adults,
      children,
      date: ticketForm.visitDate.value,
      time: ticketForm.visitTime.value,
      service: ticketForm.service.value,
      total: totalEl ? totalEl.textContent : ""
    };

    console.log("Заявка на билет:", data);

    message.hidden = false;
    message.className = "tickets__message tickets__message--success";
    message.textContent = `Спасибо, ${data.firstName}! Билеты забронированы. Подтверждение придёт на ${data.email}.`;

    ticketForm.reset();
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.min = today;
    }
    updateTotal();
  });
}

/* ===== Появление секций при скролле ===== */
const revealItems = document.querySelectorAll("[data-reveal]");

if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ===== Счётчики в блоке «Цифры» ===== */
const counters = document.querySelectorAll("[data-count]");

if (counters.length) {
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased).toLocaleString("ru-RU");
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => counterObserver.observe(c));
}

/* ===== Кнопка «Наверх» ===== */
const toTopBtn = document.querySelector("[data-to-top]");

if (toTopBtn) {
  const toggleToTop = () => {
    if (window.scrollY > 500) {
      toTopBtn.classList.add("is-visible");
    } else {
      toTopBtn.classList.remove("is-visible");
    }
  };

  toggleToTop();
  window.addEventListener("scroll", toggleToTop, { passive: true });

  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ===== Scrollspy — активный пункт меню ===== */
const spyLinks = document.querySelectorAll("[data-scrollspy]");
const spySections = [...spyLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (spyLinks.length && spySections.length && "IntersectionObserver" in window) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = "#" + entry.target.id;
        spyLinks.forEach((link) => {
          link.classList.toggle("nav__link--active", link.getAttribute("href") === id);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  spySections.forEach((section) => spyObserver.observe(section));
}

/* ===== Параллакс hero ===== */
const parallaxLayer = document.querySelector("[data-parallax]");

if (parallaxLayer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let ticking = false;

  const updateParallax = () => {
    const offset = window.scrollY * 0.3;
    parallaxLayer.style.transform = `translate3d(0, ${offset}px, 0)`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );
}

/* ===== Фильтр животных ===== */
const petsFilters = document.querySelector("[data-pets-filters]");
const petsGrid = document.querySelector("[data-pets-grid]");
const petsCount = document.querySelector("[data-pets-count]");
const petsMoreBtn = document.querySelector("[data-pets-more]");

if (petsFilters && petsGrid) {
  const cards = petsGrid.querySelectorAll(".pet-card");

  const updateCount = (visible) => {
    if (petsCount) petsCount.textContent = visible;
  };

  /* Фильтрация */
  petsFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;

    petsFilters.querySelectorAll(".pets__filter").forEach((b) =>
      b.classList.toggle("pets__filter--active", b === btn)
    );

    const filter = btn.dataset.filter;
    let visible = 0;

    cards.forEach((card) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.classList.remove("is-hidden");
      if (!match) card.classList.add("is-hidden");
      if (match) visible++;
    });

    updateCount(visible);

    /* Если фильтр «все» — прячем лишние обратно, показываем только первые 6 */
    if (filter === "all") {
      cards.forEach((card, i) => {
        if (i >= 6) card.classList.add("is-hidden");
      });
      updateCount(6);
    }

    /* Кнопка «Показать ещё» */
    if (petsMoreBtn) {
      const hasHidden = [...cards].some((c) => c.classList.contains("is-hidden"));
      petsMoreBtn.classList.toggle("is-hidden", !hasHidden);
    }
  });

  /* Показать ещё */
  if (petsMoreBtn) {
    petsMoreBtn.addEventListener("click", () => {
      const hidden = [...cards].filter((c) => c.classList.contains("is-hidden"));
      hidden.slice(0, 3).forEach((c) => c.classList.remove("is-hidden"));

      const stillHidden = [...cards].some((c) => c.classList.contains("is-hidden"));
      if (!stillHidden) petsMoreBtn.classList.add("is-hidden");

      updateCount([...cards].filter((c) => !c.classList.contains("is-hidden")).length);
    });
  }
}

/* ===== Модальное окно животного ===== */
const petModal = document.querySelector("[data-pet-modal]");

if (petModal) {
  const modalImg = petModal.querySelector("[data-pet-modal-img]");
  const modalTitle = petModal.querySelector("[data-pet-modal-title]");
  const modalDesc = petModal.querySelector("[data-pet-modal-desc]");
  const closeEls = petModal.querySelectorAll("[data-pet-close]");

  const openModal = (data) => {
    modalImg.src = data.img;
    modalImg.alt = data.title;
    modalTitle.textContent = data.title;
    modalDesc.textContent = data.desc;
    petModal.classList.add("is-open");
    petModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const closeModal = () => {
    petModal.classList.remove("is-open");
    petModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  document.querySelectorAll(".pet-card").forEach((card) => {
    card.addEventListener("click", () => {
      try {
        const data = JSON.parse(card.dataset.pet);
        openModal(data);
      } catch (err) {
        /* ignore */
      }
    });
  });

  closeEls.forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && petModal.classList.contains("is-open")) {
      closeModal();
    }
  });
}


/* ===== Копирование email / телефона ===== */
const copyButtons = document.querySelectorAll("[data-copy]");

copyButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy;
    const label = btn.querySelector("[data-copy-text]");
    const originalText = label ? label.textContent : "Скопировать";

    try {
      await navigator.clipboard.writeText(value);
      if (label) label.textContent = "Скопировано!";
      btn.classList.add("is-copied");
    } catch (err) {
      if (label) label.textContent = "Ошибка";
    }

    setTimeout(() => {
      if (label) label.textContent = originalText;
      btn.classList.remove("is-copied");
    }, 2000);
  });
});

/* ===== Донат — выбор суммы, прогресс, модалка ===== */
const donateSection = document.querySelector(".donate");

if (donateSection) {
  const amountsWrap = donateSection.querySelector("[data-donate-amounts]");
  const customWrap = donateSection.querySelector("[data-donate-custom]");
  const customInput = donateSection.querySelector("[data-custom-input]");
  const summary = donateSection.querySelector("[data-donate-summary]");
  const openBtn = donateSection.querySelector("[data-donate-open]");
  const modal = document.querySelector("[data-donate-modal]");

  let currentAmount = 1000;

  const formatRub = (n) => `${Number(n).toLocaleString("ru-RU")} ₽`;

  const updateSummary = () => {
    if (summary) summary.textContent = formatRub(currentAmount);
  };

  if (amountsWrap) {
    amountsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-amount]");
      if (!btn) return;

      amountsWrap.querySelectorAll(".donate__amount").forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );

      if (btn.dataset.amount === "custom") {
        if (customWrap) customWrap.hidden = false;
        currentAmount = Number(customInput?.value) || 1000;
        customInput?.focus();
      } else {
        if (customWrap) customWrap.hidden = true;
        currentAmount = Number(btn.dataset.amount);
      }

      updateSummary();
    });
  }

  if (customInput) {
    customInput.addEventListener("input", () => {
      const val = Math.max(100, Number(customInput.value) || 0);
      currentAmount = val;
      updateSummary();
    });
  }

  /* Прогресс — анимируем при появлении блока */
  const fill = donateSection.querySelector("[data-donate-fill]");
  if (fill) {
    const target = 68; /* процент */
    const progressObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fill.style.setProperty("--progress", target + "%");
            progressObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    progressObserver.observe(fill);
  }

  /* Модалка */
  if (modal && openBtn) {
    const modalAmount = modal.querySelector("[data-donate-modal-amount]");
    const closeEls = modal.querySelectorAll("[data-donate-close]");

    const openModal = () => {
      if (modalAmount) modalAmount.textContent = formatRub(currentAmount);
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
    };

    openBtn.addEventListener("click", openModal);
    closeEls.forEach((el) => el.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  /* Установить сумму по умолчанию */
  updateSummary();
}