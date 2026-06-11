const STORAGE_KEY = "vitality-fitness-v3";
const LEGACY_STORAGE_KEYS = ["vitality-fitness-v2"];
const bodyParts = ["背部", "臀部", "肩部", "手臂", "胸部", "核心", "腿部", "全身"];
const partColors = ["#20bd55", "#44bde9", "#ffc92f", "#8c63ef", "#ff8da1", "#54c7b0", "#ff9e45", "#8da0b5"];
const homePartIcons = {
  "背部": `<svg class="back-muscle-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M17 9c-1 4-1 7-5 10-2 2-2 6-1 10l3 10M31 9c1 4 1 7 5 10 2 2 2 6 1 10l-3 10"/><path d="M18 12c2 2 4 3 6 3s4-1 6-3M14 39c6-3 14-3 20 0"/><path class="focus" d="M17 17c2-2 4-2 7 1 3-3 5-3 7-1l-2 14c-2 3-4 5-5 6-1-1-3-3-5-6Z"/><path d="M24 17v19M17 20c2 1 4 3 7 5 3-2 5-4 7-5M18 28c2-1 4 0 6 2 2-2 4-3 6-2"/></svg>`,
  "胸部": `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M16 15c3-2 5-3 8-3s5 1 8 3l5 10-6 3-2-5v15H19V23l-2 5-6-3Z"/><path class="focus" d="M18 17c3-2 5-2 6 1 1-3 3-3 6-1l-1 9c-3 2-7 2-10 0Z"/><path d="M24 18v8"/></svg>`,
  "肩部": `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M18 15h12l7 7-5 5-3-4v15H19V23l-3 4-5-5Z"/><circle class="focus" cx="15" cy="22" r="6"/><circle class="focus" cx="33" cy="22" r="6"/></svg>`,
  "手臂": `<svg viewBox="0 0 48 48" aria-hidden="true"><path class="focus" d="M10 31c3-9 6-15 11-15 5 0 7 4 6 9 3-3 8-2 10 2 3 7-4 12-13 12-8 0-14-3-14-8Z"/><path d="M14 31c5 2 12 1 16-3m-9-12 2-6 6 2"/></svg>`,
  "臀部": `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 9c2 6 0 10-2 15-3 8 0 15 8 15s11-7 8-15c-2-5-4-9-2-15"/><path class="focus" d="M15 25c4-5 7-4 9 0 2-4 5-5 9 0 2 8-2 13-9 13s-11-5-9-13Z"/><path d="M24 24v14"/></svg>`,
  "腿部": `<svg viewBox="0 0 48 48" aria-hidden="true"><path class="focus" d="M15 8h10l-2 17-1 14h-8l3-15Zm10 0h8l-2 16 3 15h-8l-1-14Z"/><path d="M15 39h8m3 0h9M24 9v16"/></svg>`,
  "核心": `<svg class="core-muscle-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M15 8c2 4 2 8 0 12-2 5-2 11 1 18M33 8c-2 4-2 8 0 12 2 5 2 11-1 18"/><path d="M16 38c5 2 11 2 16 0M14 23c3 2 5 2 7 0M34 23c-3 2-5 2-7 0"/><path class="focus" d="M19 17c1-2 3-3 5-3s4 1 5 3l1 17c-4 2-8 2-12 0Z"/><path d="M24 16v18M19 22h10M19 28h10M20 34h8"/></svg>`
};

const defaultState = {
  profile: { name: "糖糖", height: null, goal: 4 },
  reminder: { enabled: true, time: "19:00" },
  workouts: [],
  bodyRecords: []
};

let state = loadState();
let selection = { type: "力量训练", duration: 30, intensity: "适中", parts: ["背部", "核心"] };
let activePeriod = "week";
let toastTimer;
let deferredInstallPrompt = null;
let bannerIndex = 0;
let bannerTimer;
let bannerPointerStart = null;
let supabaseClient = null;
let currentUser = null;
let guestState = structuredClone(state);
let authMode = "login";
let cloudBusy = false;

document.body.addEventListener("click", (event) => {
  const go = event.target.closest("[data-go]");
  if (go) switchTab(go.dataset.go);
  const opener = event.target.closest("[data-open]");
  if (opener) openModal(opener.dataset.open);
  const deleteButton = event.target.closest("[data-delete-record]");
  if (deleteButton) deleteRecord(deleteButton.dataset.deleteRecord);
});

bindSingleChoice("#typeChoices", "type");
bindSingleChoice("#intensityChoices", "intensity");
document.querySelectorAll("#durationChoices button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#durationChoices button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selection.duration = button.dataset.value;
    document.querySelector("#customDurationWrap").classList.toggle("hidden", selection.duration !== "custom");
  });
});

document.querySelector("#recordNote").addEventListener("input", (event) => {
  document.querySelector("#noteCount").textContent = event.target.value.length;
});
document.querySelector("#quickWorkoutForm").addEventListener("submit", saveQuickWorkout);
document.querySelector("#periodTabs").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  activePeriod = button.dataset.period;
  document.querySelectorAll("#periodTabs button").forEach((item) => item.classList.toggle("active", item === button));
  renderTrends();
});
document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#modalBackdrop").addEventListener("click", (event) => {
  if (event.target.id === "modalBackdrop") closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
document.querySelector("#reminderButton").addEventListener("click", openReminderModal);
document.querySelector("#exportButton").addEventListener("click", exportData);
document.querySelector("#importButton").addEventListener("click", () => {
  document.querySelector("#importFile").click();
});
document.querySelector("#importFile").addEventListener("change", importData);
document.querySelector("#installButton").addEventListener("click", installApp);
document.querySelector("#accountAction").addEventListener("click", handleAccountAction);
document.querySelector("#migrateButton").addEventListener("click", migrateLocalData);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setText("installStatus", "可以安装");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  setText("installStatus", "已安装");
  showToast("元气练习生已安装到手机");
});

function bindSingleChoice(selector, key) {
  document.querySelectorAll(`${selector} button`).forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(`${selector} button`).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selection[key] = button.dataset.value;
      if (key === "type") updateTrainingPartsVisibility();
    });
  });
}

function switchTab(tab) {
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${tab}`));
  history.replaceState(null, "", `#${tab}`);
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (tab === "trends") requestAnimationFrame(renderCharts);
}

function initBannerCarousel() {
  const carousel = document.querySelector("#strengthCarousel");
  if (!carousel) return;
  const dots = carousel.querySelectorAll("[data-banner-index]");
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showBanner(Number(dot.dataset.bannerIndex));
      restartBannerTimer();
    });
  });
  carousel.addEventListener("pointerdown", (event) => {
    bannerPointerStart = event.clientX;
  });
  carousel.addEventListener("pointerup", (event) => {
    if (bannerPointerStart === null) return;
    const distance = event.clientX - bannerPointerStart;
    bannerPointerStart = null;
    if (Math.abs(distance) < 35) return;
    showBanner(bannerIndex + (distance < 0 ? 1 : -1));
    restartBannerTimer();
  });
  carousel.addEventListener("pointercancel", () => {
    bannerPointerStart = null;
  });
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) restartBannerTimer();
}

function showBanner(index) {
  const carousel = document.querySelector("#strengthCarousel");
  const slides = carousel?.querySelectorAll(".banner-slide");
  const dots = carousel?.querySelectorAll("[data-banner-index]");
  if (!slides?.length) return;
  bannerIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === bannerIndex));
  dots.forEach((dot, dotIndex) => {
    const active = dotIndex === bannerIndex;
    dot.classList.toggle("active", active);
    dot.toggleAttribute("aria-current", active);
  });
}

function restartBannerTimer() {
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => showBanner(bannerIndex + 1), 4800);
}

async function saveQuickWorkout(event) {
  event.preventDefault();
  const duration = selection.duration === "custom"
    ? Number(document.querySelector("#customDuration").value)
    : Number(selection.duration);
  const needsTrainingParts = isStrengthType(selection.type);
  if (needsTrainingParts && !selection.parts.length) return showToast("请至少选择一个训练部位");
  if (!duration || duration < 5) return showToast("运动时长至少为 5 分钟");

  const record = {
    id: createUuid(),
    date: formatDate(new Date()),
    type: selection.type,
    duration,
    intensity: selection.intensity,
    parts: needsTrainingParts ? [...selection.parts] : [],
    note: document.querySelector("#recordNote").value.trim()
  };
  if (currentUser && !(await insertCloudWorkout(record))) return;
  state.workouts.unshift(record);
  document.querySelector("#recordNote").value = "";
  document.querySelector("#noteCount").textContent = "0";
  saveState();
  render();
  showToast("运动记录已保存");
}

async function deleteRecord(id) {
  if (currentUser) {
    const { error } = await supabaseClient.from("workout_records").delete().eq("id", id);
    if (error) return showToast(`删除失败：${friendlyCloudError(error)}`);
  }
  state.workouts = state.workouts.filter((item) => item.id !== id);
  saveState();
  render();
  showToast("记录已删除");
}

function render() {
  renderParts();
  renderHome();
  renderRecords();
  renderTrends();
  renderProfile();
  renderAccount();
}

function renderParts() {
  updateTrainingPartsVisibility();
  const partChoices = document.querySelector("#partChoices");
  partChoices.innerHTML = bodyParts.map((part) =>
    `<button class="part-chip ${selection.parts.includes(part) ? "active" : ""}" type="button" data-part="${part}">${part}</button>`
  ).join("");
  partChoices.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const part = button.dataset.part;
      selection.parts = selection.parts.includes(part)
        ? selection.parts.filter((item) => item !== part)
        : [...selection.parts, part];
      button.classList.toggle("active");
    });
  });

  const weeklyParts = countParts(recordsForPeriod("week"));
  const visibleParts = ["背部", "胸部", "肩部", "手臂", "臀部", "腿部", "核心"];
  document.querySelector("#homeBodyParts").innerHTML = visibleParts.map((part) =>
    `<button class="body-part" type="button" data-open="workout-history" aria-label="${part}，本周训练 ${weeklyParts[part] || 0} 次">
      <span class="part-icon">${homePartIcons[part]}</span>
      <b>${part}</b>
      <small>${weeklyParts[part] || 0} 次</small>
    </button>`
  ).join("");
}

function renderHome() {
  const weekRecords = recordsForPeriod("week");
  const monthRecords = recordsForPeriod("month");
  const weekCount = countWorkoutDays(weekRecords);
  const monthCount = countWorkoutDays(monthRecords);
  const latest = latestBody();
  const previous = state.bodyRecords.at(-2);
  setText("homeNickname", state.profile.name);
  setText("weekCount", weekCount);
  setText("weekGoal", state.profile.goal);
  setText("bannerWeekCount", weekCount);
  setText("monthCount", monthCount);
  setText("homeWeight", latest ? kgToJin(latest.weight).toFixed(1) : "--");
  setText("weightChange", latest
    ? (previous ? `较上次 ${signed(kgToJin(latest.weight - previous.weight))} 斤，继续保持` : "今天保持得不错，继续加油")
    : "点击记录身体数据");
  const bmi = latest && Number.isFinite(state.profile.height)
    ? latest.weight / ((state.profile.height / 100) ** 2)
    : null;
  setText("homeBmi", bmi
    ? `BMI：${bmi.toFixed(1)} ${bmiStatus(bmi)}`
    : "记录身高和体重后查看 BMI");
  const gaugeProgress = document.querySelector("#weightGaugeProgress");
  if (gaugeProgress) {
    const progress = latest ? Math.max(12, Math.min(92, (latest.weight - 35) / 85 * 100)) : 8;
    gaugeProgress.style.strokeDasharray = `${progress} 100`;
  }

  const weekDayCounts = countRecordsByWeekday(weekRecords);
  const todayIndex = (new Date().getDay() + 6) % 7;
  document.querySelector("#weekBars").innerHTML = ["一","二","三","四","五","六","日"].map((day, index) => {
    const count = weekDayCounts[index];
    return `<div class="${count ? "done" : ""} ${index === todayIndex ? "today" : ""}" title="${day}：${count} 次"><i></i><small>${day}</small></div>`;
  }).join("");

  const monthDayCounts = countRecordsByWeekday(monthRecords);
  document.querySelector("#monthBars").innerHTML = ["一","二","三","四","五","六","日"].map((day, index) => {
    const count = monthDayCounts[index];
    return `<div class="${count ? "done" : ""} ${index === todayIndex ? "today" : ""}" title="本月周${day}：${count} 次"><i></i><small>${day}</small></div>`;
  }).join("");
}

function bmiStatus(value) {
  if (value < 18.5) return "偏轻";
  if (value < 24) return "标准";
  if (value < 28) return "偏高";
  return "较高";
}

function renderRecords() {
  setText("recordTotal", `${state.workouts.length} 条`);
  const list = document.querySelector("#recordList");
  if (!state.workouts.length) {
    list.innerHTML = `<div class="empty">还没有运动记录，完成一次训练后回来看看吧。</div>`;
    return;
  }
  list.innerHTML = state.workouts.slice(0, 8).map((item) => `
    <article class="record-item">
      <span class="record-item-icon">${item.type.slice(0, 1)}</span>
      <div>
        <h3>${escapeHtml(workoutTypeLabel(item.type))} · ${item.duration} 分钟</h3>
        <p>${[
          item.date,
          isCardioType(item.type) ? "" : escapeHtml((item.parts || []).join("、")),
          escapeHtml(item.intensity)
        ].filter(Boolean).join(" · ")}</p>
      </div>
      <button class="delete-record" type="button" data-delete-record="${item.id}" aria-label="删除记录">×</button>
    </article>
  `).join("");
}

function renderTrends() {
  const records = recordsForPeriod(activePeriod);
  const workoutDays = countWorkoutDays(records);
  setText("trendTotal", workoutDays);
  setText("trendStrength", countWorkoutDays(records.filter((item) => item.type === "力量训练")));
  setText("trendCardio", countWorkoutDays(records.filter((item) => isCardioType(item.type))));
  setText("trendConditioning", countWorkoutDays(records.filter((item) => isConditioningType(item.type))));
  setText("trendMonthCount", countWorkoutDays(recordsForPeriod("month")));
  const frequencyCounts = countRecordsByMonthSegment(recordsForPeriod("month"));
  const maxFrequency = Math.max(1, ...frequencyCounts);
  document.querySelector("#frequencyBars").innerHTML = frequencyCounts.map((count) =>
    `<div><i style="height:${count ? 12 + Math.round(count / maxFrequency * 49) : 6}px"></i></div>`
  ).join("");

  const counts = countParts(records);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  let cursor = 0;
  const stops = entries.map(([, count], index) => {
    const start = cursor;
    cursor += count / total * 100;
    return `${partColors[index]} ${start}% ${cursor}%`;
  });
  document.querySelector("#partDonut").style.background = entries.length
    ? `conic-gradient(${stops.join(",")})`
    : "#e8eee6";
  document.querySelector("#partDonut span").innerHTML = `${workoutDays}<small>次</small>`;
  document.querySelector("#partLegend").innerHTML = entries.length
    ? entries.map(([part, count], index) => `<div class="legend-row"><i style="background:${partColors[index]}"></i><span>${part}</span><b>${count} 次</b></div>`).join("")
    : `<span class="empty">本周期暂无记录</span>`;
  setText("trendTip", workoutDays >= 3 ? "保持现在的节奏，规律训练正在让改变发生。" : "本周期还可以再安排一次轻量训练，稳定比强度更重要。");
  requestAnimationFrame(renderCharts);
}

function renderCharts() {
  drawLineChart("weightChart", state.bodyRecords.map((item) => kgToJin(item.weight)).filter(Number.isFinite), "#16a34a", "斤");
  drawLineChart(
    "fatChart",
    state.bodyRecords.map((item) => item.fat).filter(Number.isFinite),
    "#7c4dff",
    "%"
  );
}

function drawLineChart(id, values, color, unit) {
  const canvas = document.getElementById(id);
  if (!canvas || !canvas.offsetWidth) return;
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.offsetWidth;
  const height = 180;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  if (!values.length) {
    ctx.fillStyle = "#879188";
    ctx.font = "13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("暂无数据", width / 2, height / 2);
    return;
  }
  const pad = { top: 22, right: 14, bottom: 27, left: 34 };
  const min = Math.min(...values) - .8;
  const max = Math.max(...values) + .8;
  const x = (index) => pad.left + index * (width - pad.left - pad.right) / Math.max(values.length - 1, 1);
  const y = (value) => pad.top + (max - value) * (height - pad.top - pad.bottom) / (max - min);

  ctx.strokeStyle = "#e8eee6";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const gy = pad.top + i * (height - pad.top - pad.bottom) / 3;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(width - pad.right, gy); ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  values.forEach((value, index) => index ? ctx.lineTo(x(index), y(value)) : ctx.moveTo(x(index), y(value)));
  ctx.stroke();
  values.forEach((value, index) => {
    ctx.fillStyle = "#fff"; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x(index), y(value), 3.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  const latest = values.at(-1);
  ctx.fillStyle = color;
  roundRect(ctx, width - 55, Math.max(4, y(latest) - 25), 47, 20, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "700 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${latest.toFixed(1)}${unit}`, width - 31.5, Math.max(18, y(latest) - 11));
  ctx.fillStyle = "#879188";
  ctx.font = "9px system-ui";
  values.forEach((_, index) => ctx.fillText(index === values.length - 1 ? "今天" : `${index + 1}`, x(index), height - 8));
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, width, height, radius) : ctx.rect(x, y, width, height);
}

function renderProfile() {
  const latest = latestBody();
  const latestFat = latestFatRecord();
  const weekCount = countWorkoutDays(recordsForPeriod("week"));
  setText("profileName", state.profile.name);
  setText("profileHeight", Number.isFinite(state.profile.height) ? state.profile.height : "--");
  setText("profileWeight", latest ? kgToJin(latest.weight).toFixed(1) : "--");
  setText("profileFat", latestFat ? latestFat.fat.toFixed(1) : "--");
  setText("goalProgressText", weekCount);
  setText("goalTargetText", state.profile.goal);
  setText("goalStatus", `已完成 ${weekCount} 次`);
  document.querySelector("#goalProgress").style.width = `${Math.min(100, weekCount / state.profile.goal * 100)}%`;
  setText("reminderStatus", state.reminder.enabled ? `每天 ${state.reminder.time}` : "已关闭");
}

function renderAccount() {
  const accountAction = document.querySelector("#accountAction");
  const migrationCard = document.querySelector("#migrationCard");
  setText("accountStatusLabel", currentUser ? "云端账号" : "游客模式");
  setText("accountStatusText", currentUser ? "数据已绑定当前登录账号" : "登录后可跨设备保存记录");
  setText("accountEmail", currentUser?.email || "本地数据可能因清理浏览器而丢失");
  accountAction.textContent = currentUser ? "退出" : "登录";

  const localWorkoutCount = guestState?.workouts?.length || 0;
  const localBodyCount = guestState?.bodyRecords?.length || 0;
  const canMigrate = Boolean(currentUser && (localWorkoutCount || localBodyCount));
  migrationCard.hidden = !canMigrate;
  if (canMigrate) {
    setText("migrationSummary", `${localWorkoutCount} 条运动记录，${localBodyCount} 条身体记录`);
  }
}

function openModal(type) {
  const title = document.querySelector("#modalTitle");
  const content = document.querySelector("#modalContent");
  if (type === "auth") {
    renderAuthModal();
  } else if (type === "workout") {
    closeModal();
    switchTab("records");
    document.querySelector("#page-records").scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (type === "workout-history") {
    title.textContent = "训练记录";
    content.innerHTML = `
      <div class="history-tabs" id="historyTabs">
        <button class="active" type="button" data-history-period="week">本周</button>
        <button type="button" data-history-period="month">本月</button>
      </div>
      <div id="workoutHistoryContent"></div>`;
    content.querySelector("#historyTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-history-period]");
      if (!button) return;
      content.querySelectorAll("[data-history-period]").forEach((item) => item.classList.toggle("active", item === button));
      renderWorkoutHistory(button.dataset.historyPeriod);
    });
    renderWorkoutHistory("week");
  } else if (type === "body") {
    const latest = latestBody();
    const latestFat = latestFatRecord();
    title.textContent = "记录身体数据";
    content.innerHTML = `
      <form class="modal-form" id="bodyForm">
        <label>日期<input name="date" type="date" value="${formatDate(new Date())}" required /></label>
        <label>体重 斤<input name="weight" type="number" min="50" max="500" step="0.1" value="${latest ? kgToJin(latest.weight).toFixed(1) : ""}" placeholder="请输入体重（斤）" required /></label>
        <label>体脂率 % <small>（选填）</small><input name="fat" type="number" min="3" max="70" step="0.1" value="${latestFat ? latestFat.fat : ""}" placeholder="可不填" /></label>
        <button class="primary-button" type="submit">保存身体数据</button>
      </form>`;
    content.querySelector("form").addEventListener("submit", saveBodyRecord);
  } else if (type === "profile") {
    title.textContent = "编辑个人信息";
    content.innerHTML = `
      <form class="modal-form" id="profileForm">
        <label>昵称<input name="name" maxlength="12" value="${escapeHtml(state.profile.name)}" required /></label>
        <label>身高 cm<input name="height" type="number" min="100" max="220" value="${Number.isFinite(state.profile.height) ? state.profile.height : ""}" placeholder="请输入身高" required /></label>
        <label>每周目标 次<input name="goal" type="number" min="1" max="14" value="${state.profile.goal}" required /></label>
        <button class="primary-button" type="submit">保存个人信息</button>
      </form>`;
    content.querySelector("form").addEventListener("submit", saveProfile);
  } else {
    title.textContent = type === "privacy" ? "隐私说明" : "关于元气练习生";
    content.innerHTML = `<p class="info-copy">${type === "privacy"
      ? "游客模式下，数据仅保存在当前浏览器中。登录后，运动和身体记录会通过 Supabase 加密连接保存到云端，并由访问策略限制为仅当前账号可读写。你仍可随时通过“数据导出”保存个人备份。"
      : "元气练习生是一款轻量健身记录原型，帮助你记录训练、观察趋势，并用更温和的方式坚持运动。"}</p>`;
  }
  document.querySelector("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
}

function renderWorkoutHistory(period) {
  const target = document.querySelector("#workoutHistoryContent");
  if (!target) return;
  const records = recordsForPeriod(period).slice().sort((a, b) => b.date.localeCompare(a.date));
  const workoutDays = countWorkoutDays(records);
  const totalMinutes = records.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const partSummary = summarizeWorkoutParts(records);

  target.innerHTML = `
    <div class="history-summary">
      <div><span>训练次数</span><strong>${workoutDays}<small>次</small></strong></div>
      <div><span>训练时长</span><strong>${totalMinutes}<small>分钟</small></strong></div>
    </div>
    <section class="history-parts">
      <h3>训练部位与时长</h3>
      ${partSummary.length
        ? `<div class="history-part-grid">${partSummary.map((item) => `
            <div>
              <b>${escapeHtml(item.part)}</b>
              <span>${item.count} 次 · ${item.minutes} 分钟</span>
            </div>`).join("")}</div>`
        : `<p class="history-empty">该周期内暂无力量训练部位记录</p>`}
    </section>
    <section class="history-list-section">
      <h3>训练明细</h3>
      ${records.length
        ? `<div class="history-list">${records.map((item) => {
            const parts = isStrengthType(item.type) ? (item.parts || []).join("、") : "";
            return `<article class="history-item">
              <div class="history-date"><b>${formatHistoryDate(item.date)}</b><span>${workoutWeekday(item.date)}</span></div>
              <div>
                <strong>${escapeHtml(workoutTypeLabel(item.type))}</strong>
                <p>${parts ? `${escapeHtml(parts)} · ` : ""}${escapeHtml(item.intensity)}</p>
              </div>
              <em>${Number(item.duration)}<small>分钟</small></em>
            </article>`;
          }).join("")}</div>`
        : `<p class="history-empty">该周期内还没有保存训练记录</p>`}
    </section>`;
}

function summarizeWorkoutParts(records) {
  const summary = new Map();
  records.filter((item) => isStrengthType(item.type)).forEach((item) => {
    (item.parts || []).forEach((part) => {
      const current = summary.get(part) || { part, count: 0, minutes: 0 };
      current.count += 1;
      current.minutes += Number(item.duration || 0);
      summary.set(part, current);
    });
  });
  return [...summary.values()].sort((a, b) => b.minutes - a.minutes || b.count - a.count);
}

function formatHistoryDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function workoutWeekday(value) {
  return `周${["日", "一", "二", "三", "四", "五", "六"][new Date(`${value}T00:00:00`).getDay()]}`;
}

function openReminderModal() {
  const title = document.querySelector("#modalTitle");
  const content = document.querySelector("#modalContent");
  title.textContent = "运动提醒";
  content.innerHTML = `
    <form class="modal-form" id="reminderForm">
      <label>提醒状态
        <select name="enabled" style="border:1px solid var(--line);border-radius:14px;padding:11px;background:white">
          <option value="true" ${state.reminder.enabled ? "selected" : ""}>开启</option>
          <option value="false" ${!state.reminder.enabled ? "selected" : ""}>关闭</option>
        </select>
      </label>
      <label>提醒时间<input name="time" type="time" value="${state.reminder.time}" required /></label>
      <button class="primary-button" type="submit">保存提醒</button>
    </form>`;
  content.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.reminder.enabled = event.target.enabled.value === "true";
    state.reminder.time = event.target.time.value;
    saveState(); renderProfile(); closeModal(); showToast("提醒设置已保存");
  });
  document.querySelector("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
}

async function saveBodyRecord(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const fatValue = data.get("fat").trim();
  const record = {
    id: createUuid(),
    date: data.get("date"),
    weight: jinToKg(Number(data.get("weight")))
  };
  if (fatValue !== "") record.fat = Number(fatValue);
  if (currentUser && !(await upsertCloudBodyRecord(record))) return;
  state.bodyRecords = state.bodyRecords.filter((item) => item.date !== record.date);
  state.bodyRecords.push(record);
  state.bodyRecords.sort((a, b) => a.date.localeCompare(b.date));
  saveState(); render(); closeModal(); showToast("身体数据已保存");
}

async function saveProfile(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.profile.name = data.get("name").trim();
  state.profile.height = Number(data.get("height"));
  state.profile.goal = Number(data.get("goal"));
  if (currentUser && supabaseClient) {
    const { data: userData, error } = await supabaseClient.auth.updateUser({
      data: { nickname: state.profile.name }
    });
    if (error) return showToast(`昵称同步失败：${friendlyCloudError(error)}`);
    currentUser = userData.user;
  }
  saveState(); render(); closeModal(); showToast("个人信息已更新");
}

function renderAuthModal() {
  const title = document.querySelector("#modalTitle");
  const content = document.querySelector("#modalContent");
  const isLogin = authMode === "login";
  title.textContent = isLogin ? "登录云端账号" : "注册云端账号";
  content.innerHTML = `
    <form class="modal-form" id="authForm">
      ${isLogin ? "" : `<label>昵称
        <input name="nickname" maxlength="12" autocomplete="nickname" placeholder="例如：糖糖" required />
      </label>`}
      <label>邮箱
        <input name="email" type="email" autocomplete="email" placeholder="name@example.com" required />
      </label>
      <label>密码
        <input name="password" type="password" minlength="6" autocomplete="${isLogin ? "current-password" : "new-password"}" placeholder="至少 6 位" required />
      </label>
      <button class="primary-button" type="submit">${isLogin ? "登录" : "创建账号"}</button>
    </form>
    <div class="auth-switch">
      <button type="button" id="authModeSwitch">${isLogin ? "没有账号？立即注册" : "已有账号？返回登录"}</button>
    </div>
    <p class="auth-help">登录后，运动和身体记录将保存到 Supabase 云端，并与当前账号绑定。</p>`;
  content.querySelector("#authForm").addEventListener("submit", submitAuthForm);
  content.querySelector("#authModeSwitch").addEventListener("click", () => {
    authMode = isLogin ? "signup" : "login";
    renderAuthModal();
  });
}

async function submitAuthForm(event) {
  event.preventDefault();
  if (!supabaseClient) {
    showToast("请先配置 Supabase 项目地址和 Publishable Key");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = data.get("email").trim();
  const password = data.get("password");
  const nickname = data.get("nickname")?.trim();
  setCloudBusy(true);

  const result = authMode === "login"
    ? await supabaseClient.auth.signInWithPassword({ email, password })
    : await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}${location.pathname}`,
          data: { nickname }
        }
      });
  setCloudBusy(false);

  if (result.error) {
    showToast(friendlyCloudError(result.error));
    return;
  }
  if (authMode === "signup" && !result.data.session) {
    showToast("注册成功，请前往邮箱完成验证");
    authMode = "login";
    renderAuthModal();
    return;
  }
  closeModal();
  showToast("登录成功，正在加载云端数据");
}

async function handleAccountAction() {
  if (!currentUser) {
    authMode = "login";
    openModal("auth");
    return;
  }
  setCloudBusy(true);
  const { error } = await supabaseClient.auth.signOut();
  setCloudBusy(false);
  if (error) showToast(friendlyCloudError(error));
}

async function initializeSupabase() {
  const config = window.APP_CONFIG || {};
  const configured = config.supabaseUrl
    && config.supabasePublishableKey
    && !config.supabaseUrl.startsWith("YOUR_")
    && !config.supabasePublishableKey.startsWith("YOUR_");
  if (!configured || !window.supabase?.createClient) {
    renderAccount();
    return;
  }

  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  supabaseClient.auth.onAuthStateChange((event, session) => {
    window.setTimeout(() => applyAuthSession(session, event), 0);
  });
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showToast(friendlyCloudError(error));
    return;
  }
  await applyAuthSession(data.session, "INITIAL_SESSION");
}

async function applyAuthSession(session, event) {
  const nextUser = session?.user || null;
  if (nextUser?.id === currentUser?.id && event !== "INITIAL_SESSION") return;
  currentUser = nextUser;
  if (currentUser) {
    state.profile.name = accountNickname(currentUser);
    await loadCloudData();
  } else {
    state = structuredClone(guestState || defaultState);
    render();
    if (event === "SIGNED_OUT") showToast("已退出，当前显示本机游客数据");
  }
}

async function loadCloudData() {
  if (!supabaseClient || !currentUser) return;
  setCloudBusy(true);
  const [workoutsResult, bodyResult] = await Promise.all([
    supabaseClient
      .from("workout_records")
      .select("id,workout_date,workout_type,duration_minutes,intensity,body_parts,note")
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("body_records")
      .select("id,record_date,weight_kg,body_fat_percent")
      .order("record_date", { ascending: true })
  ]);
  setCloudBusy(false);

  const error = workoutsResult.error || bodyResult.error;
  if (error) {
    showToast(`云端数据加载失败：${friendlyCloudError(error)}`);
    renderAccount();
    return;
  }

  state = {
    ...structuredClone(defaultState),
    profile: {
      ...structuredClone(guestState?.profile || defaultState.profile),
      name: accountNickname(currentUser)
    },
    reminder: structuredClone(guestState?.reminder || defaultState.reminder),
    workouts: workoutsResult.data.map(fromCloudWorkout),
    bodyRecords: bodyResult.data.map(fromCloudBodyRecord)
  };
  render();
}

async function insertCloudWorkout(record) {
  const { error } = await supabaseClient.from("workout_records").insert(toCloudWorkout(record));
  if (error) {
    showToast(`保存失败：${friendlyCloudError(error)}`);
    return false;
  }
  return true;
}

async function upsertCloudBodyRecord(record) {
  const payload = toCloudBodyRecord(record);
  const { error } = await supabaseClient
    .from("body_records")
    .upsert(payload, { onConflict: "user_id,record_date" });
  if (error) {
    showToast(`保存失败：${friendlyCloudError(error)}`);
    return false;
  }
  return true;
}

async function migrateLocalData() {
  if (!currentUser || !guestState) return;
  const workouts = guestState.workouts.map((record) => toCloudWorkout({
    ...record,
    id: validUuid(record.id) ? record.id : createUuid()
  }));
  const bodyRecords = guestState.bodyRecords.map((record) => toCloudBodyRecord({
    ...record,
    id: validUuid(record.id) ? record.id : createUuid()
  }));
  if (!workouts.length && !bodyRecords.length) return;
  if (!confirm(`将 ${workouts.length} 条运动记录和 ${bodyRecords.length} 条身体记录迁移到 ${currentUser.email}？`)) return;

  setCloudBusy(true);
  const results = await Promise.all([
    workouts.length
      ? supabaseClient.from("workout_records").upsert(workouts, { onConflict: "id" })
      : Promise.resolve({ error: null }),
    bodyRecords.length
      ? supabaseClient.from("body_records").upsert(bodyRecords, { onConflict: "user_id,record_date" })
      : Promise.resolve({ error: null })
  ]);
  setCloudBusy(false);
  const error = results.find((result) => result.error)?.error;
  if (error) {
    showToast(`迁移失败：${friendlyCloudError(error)}`);
    return;
  }

  guestState = structuredClone(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  await loadCloudData();
  showToast("本地数据已迁移到云端");
}

function toCloudWorkout(record) {
  return {
    id: record.id,
    user_id: currentUser.id,
    workout_date: record.date,
    workout_type: workoutTypeLabel(record.type),
    duration_minutes: Number(record.duration),
    intensity: record.intensity,
    body_parts: isStrengthType(record.type) ? (record.parts || []) : [],
    note: record.note || ""
  };
}

function fromCloudWorkout(record) {
  return {
    id: record.id,
    date: record.workout_date,
    type: record.workout_type,
    duration: Number(record.duration_minutes),
    intensity: record.intensity,
    parts: record.body_parts || [],
    note: record.note || ""
  };
}

function toCloudBodyRecord(record) {
  return {
    id: record.id,
    user_id: currentUser.id,
    record_date: record.date,
    weight_kg: Number(record.weight),
    body_fat_percent: Number.isFinite(record.fat) ? Number(record.fat) : null
  };
}

function fromCloudBodyRecord(record) {
  const result = {
    id: record.id,
    date: record.record_date,
    weight: Number(record.weight_kg)
  };
  if (record.body_fat_percent !== null) result.fat = Number(record.body_fat_percent);
  return result;
}

function setCloudBusy(busy) {
  cloudBusy = busy;
  document.body.classList.toggle("cloud-loading", busy);
}

function friendlyCloudError(error) {
  const message = error?.message || "云端服务暂时不可用";
  if (/invalid login credentials/i.test(message)) return "邮箱或密码不正确";
  if (/email not confirmed/i.test(message)) return "请先前往邮箱完成验证";
  if (/user already registered/i.test(message)) return "该邮箱已经注册";
  if (/failed to fetch|network/i.test(message)) return "网络连接失败，请稍后重试";
  return message;
}

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function accountNickname(user) {
  return user?.user_metadata?.nickname
    || user?.user_metadata?.name
    || user?.email?.split("@")[0]
    || defaultState.profile.name;
}

function createUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(char) / 4).toString(16)
  );
}

function closeModal() {
  document.querySelector("#modalBackdrop").hidden = true;
  document.body.style.overflow = "";
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `元气练习生-${formatDate(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("数据文件已导出");
}

async function importData(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (currentUser) {
    showToast("请先退出账号，在游客模式导入后再迁移到云端");
    return;
  }

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.workouts) || !Array.isArray(imported.bodyRecords) || !imported.profile) {
      throw new Error("invalid");
    }

    if (!confirm("导入会替换当前设备中的健身数据，确定继续吗？")) return;
    state = {
      ...defaultState,
      ...imported,
      profile: { ...defaultState.profile, ...imported.profile },
      reminder: { ...defaultState.reminder, ...imported.reminder }
    };
    saveState();
    render();
    showToast("备份数据已恢复");
  } catch {
    showToast("无法导入，请选择本应用导出的 JSON 文件");
  }
}

async function installApp() {
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    showToast("应用已经安装在当前设备");
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const title = document.querySelector("#modalTitle");
  const content = document.querySelector("#modalContent");
  title.textContent = "安装到手机";
  content.innerHTML = isIOS
    ? `<div class="install-guide">
        <strong>iPhone / iPad</strong>
        <p>请使用 Safari 打开页面，点击底部“分享”按钮，再选择“添加到主屏幕”。</p>
        <small>安装后可像普通 App 一样从桌面打开，并离线使用。</small>
      </div>`
    : `<div class="install-guide">
        <strong>Android 手机</strong>
        <p>请使用 Chrome 打开页面，点击浏览器菜单，再选择“安装应用”或“添加到主屏幕”。</p>
        <small>如果没有安装选项，请确认页面通过 HTTPS 地址打开。</small>
      </div>`;
  document.querySelector("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
}

async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return;
  try {
    const persistent = await navigator.storage.persisted();
    if (!persistent) await navigator.storage.persist();
  } catch {
    // Local storage remains available even when persistence permission is unsupported.
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        setText("installStatus", "需要 HTTPS");
      });
  });
}

function recordsForPeriod(period) {
  const boundary = new Date();
  boundary.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = boundary.getDay();
    boundary.setDate(boundary.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === "month") {
    boundary.setDate(1);
  } else {
    boundary.setDate(boundary.getDate() - 89);
  }
  return state.workouts.filter((item) => new Date(`${item.date}T00:00:00`) >= boundary);
}

function countWorkoutDays(records) {
  return new Set(records.map((item) => item.date).filter(Boolean)).size;
}

function countRecordsByWeekday(records) {
  const counts = Array(7).fill(0);
  const dates = new Set(records.map((item) => item.date).filter(Boolean));
  dates.forEach((date) => {
    const day = new Date(`${date}T00:00:00`).getDay();
    counts[day === 0 ? 6 : day - 1] += 1;
  });
  return counts;
}

function countRecordsByMonthSegment(records) {
  const counts = Array(12).fill(0);
  const dates = new Set(records.map((item) => item.date).filter(Boolean));
  dates.forEach((date) => {
    const day = new Date(`${date}T00:00:00`).getDate();
    counts[Math.min(11, Math.floor((day - 1) / 3))] += 1;
  });
  return counts;
}

function countParts(records) {
  return records.filter((item) => isStrengthType(item.type)).flatMap((item) => item.parts || []).reduce((acc, part) => {
    acc[part] = (acc[part] || 0) + 1;
    return acc;
  }, {});
}

function updateTrainingPartsVisibility() {
  const needsTrainingParts = isStrengthType(selection.type);
  document.querySelector("#trainingPartsSection").classList.toggle("hidden", !needsTrainingParts);
  setText("noteStep", needsTrainingParts ? "4." : "3.");
  if (!needsTrainingParts) selection.parts = [];
}

function isCardioType(type) {
  return type === "有氧训练" || type === "有氧运动";
}

function isStrengthType(type) {
  return type === "力量训练";
}

function isConditioningType(type) {
  return type === "体能训练";
}

function workoutTypeLabel(type) {
  return isCardioType(type) ? "有氧训练" : type;
}

function latestBody() {
  return state.bodyRecords.at(-1) || null;
}

function latestFatRecord() {
  for (let index = state.bodyRecords.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(state.bodyRecords[index].fat)) return state.bodyRecords[index];
  }
  return null;
}

function previousFatRecord() {
  const records = state.bodyRecords.filter((item) => Number.isFinite(item.fat));
  return records.at(-2) || null;
}

function loadState() {
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...defaultState, ...stored, profile: { ...defaultState.profile, ...stored.profile } } : structuredClone(defaultState);
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  if (!currentUser) {
    guestState = structuredClone(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function formatDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function signed(value) {
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

function kgToJin(value) {
  return Number(value) * 2;
}

function jinToKg(value) {
  return Number(value) / 2;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

window.addEventListener("resize", () => {
  if (document.querySelector("#page-trends").classList.contains("active")) renderCharts();
});

render();
initBannerCarousel();
const initialTab = ["home", "records", "trends", "profile"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
switchTab(initialTab);
requestPersistentStorage();
registerServiceWorker();
initializeSupabase();
