const STORAGE_KEY = "vitality-fitness-v2";
const bodyParts = ["背部", "臀部", "肩部", "手臂", "胸部", "核心", "腿部", "全身"];
const partColors = ["#20bd55", "#44bde9", "#ffc92f", "#8c63ef", "#ff8da1", "#54c7b0", "#ff9e45", "#8da0b5"];
const homePartIcons = {
  "背部": `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="7" r="3.5"/><path d="M18 13c2-1 4-2 6-2s4 1 6 2"/><path class="focus" d="M18 14c-2 2-5 3-8 5l3 7 5-3 1 15h10l1-15 5 3 3-7c-3-2-6-3-8-5-1 5-3 8-6 10-3-2-5-5-6-10Z"/><path d="M24 14v23m-6-14 6 4 6-4m-10 9 4 3 4-3"/></svg>`,
  "胸部": `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M16 15c3-2 5-3 8-3s5 1 8 3l5 10-6 3-2-5v15H19V23l-2 5-6-3Z"/><path class="focus" d="M18 17c3-2 5-2 6 1 1-3 3-3 6-1l-1 9c-3 2-7 2-10 0Z"/><path d="M24 18v8"/></svg>`,
  "肩部": `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4"/><path d="M18 15h12l7 7-5 5-3-4v15H19V23l-3 4-5-5Z"/><circle class="focus" cx="15" cy="22" r="6"/><circle class="focus" cx="33" cy="22" r="6"/></svg>`,
  "手臂": `<svg viewBox="0 0 48 48" aria-hidden="true"><path class="focus" d="M10 31c3-9 6-15 11-15 5 0 7 4 6 9 3-3 8-2 10 2 3 7-4 12-13 12-8 0-14-3-14-8Z"/><path d="M14 31c5 2 12 1 16-3m-9-12 2-6 6 2"/></svg>`,
  "臀部": `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 9c2 6 0 10-2 15-3 8 0 15 8 15s11-7 8-15c-2-5-4-9-2-15"/><path class="focus" d="M15 25c4-5 7-4 9 0 2-4 5-5 9 0 2 8-2 13-9 13s-11-5-9-13Z"/><path d="M24 24v14"/></svg>`,
  "腿部": `<svg viewBox="0 0 48 48" aria-hidden="true"><path class="focus" d="M15 8h10l-2 17-1 14h-8l3-15Zm10 0h8l-2 16 3 15h-8l-1-14Z"/><path d="M15 39h8m3 0h9M24 9v16"/></svg>`,
  "核心": `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 8c2 3 2 6 1 9-2 7-2 15 6 23 8-8 8-16 6-23-1-3-1-6 1-9"/><path class="focus ab ab1" d="M19 16h4v7h-5Z"/><path class="focus ab ab2" d="M25 16h4l1 7h-5Z"/><path class="focus ab ab3" d="M18 25h5v6h-5Z"/><path class="focus ab ab4" d="M25 25h5v6h-5Z"/><path class="focus ab ab5" d="M19 33h4v5l-3-2Z"/><path class="focus ab ab6" d="M25 33h4l-1 3-3 2Z"/><path d="M24 14v25"/></svg>`
};

const defaultState = {
  profile: { name: "元气小桃子", height: 165, weight: 54.2, fat: 25.8, goal: 4 },
  reminder: { enabled: true, time: "19:00" },
  workouts: [
    { id: "demo-1", date: offsetDate(0), type: "力量训练", duration: 45, intensity: "适中", parts: ["背部", "核心"], note: "状态很好，动作控制更稳定了。" },
    { id: "demo-2", date: offsetDate(-2), type: "有氧运动", duration: 30, intensity: "适中", parts: ["全身"], note: "慢跑 3 公里。" },
    { id: "demo-3", date: offsetDate(-4), type: "力量训练", duration: 60, intensity: "挑战", parts: ["臀部", "腿部"], note: "深蹲完成 4 组。" }
  ],
  bodyRecords: [
    { date: offsetDate(-42), weight: 55.1, fat: 27.3 },
    { date: offsetDate(-35), weight: 55.6, fat: 26.1 },
    { date: offsetDate(-28), weight: 55.4, fat: 26.3 },
    { date: offsetDate(-21), weight: 54.7, fat: 24.8 },
    { date: offsetDate(-14), weight: 54.5, fat: 25.7 },
    { date: offsetDate(-7), weight: 54.0, fat: 24.1 },
    { date: offsetDate(0), weight: 54.2, fat: 25.8 }
  ]
};

let state = loadState();
let selection = { type: "力量训练", duration: 30, intensity: "适中", parts: ["背部", "核心"] };
let activePeriod = "week";
let toastTimer;
let deferredInstallPrompt = null;

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});
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
    });
  });
}

function switchTab(tab) {
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${tab}`));
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  history.replaceState(null, "", `#${tab}`);
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (tab === "trends") requestAnimationFrame(renderCharts);
}

function saveQuickWorkout(event) {
  event.preventDefault();
  const duration = selection.duration === "custom"
    ? Number(document.querySelector("#customDuration").value)
    : Number(selection.duration);
  if (!selection.parts.length) return showToast("请至少选择一个训练部位");
  if (!duration || duration < 5) return showToast("运动时长至少为 5 分钟");

  state.workouts.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    date: formatDate(new Date()),
    type: selection.type,
    duration,
    intensity: selection.intensity,
    parts: [...selection.parts],
    note: document.querySelector("#recordNote").value.trim()
  });
  document.querySelector("#recordNote").value = "";
  document.querySelector("#noteCount").textContent = "0";
  saveState();
  render();
  showToast("运动记录已保存");
}

function deleteRecord(id) {
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
}

function renderParts() {
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
    `<button class="body-part" type="button" data-go="records" aria-label="${part}，本周训练 ${weeklyParts[part] || 0} 次">
      <span class="part-icon">${homePartIcons[part]}</span>
      <b>${part}</b>
      <small>${weeklyParts[part] || 0} 次</small>
    </button>`
  ).join("");
}

function renderHome() {
  const weekRecords = recordsForPeriod("week");
  const monthRecords = recordsForPeriod("month");
  const latest = latestBody();
  const previous = state.bodyRecords.at(-2);
  setText("weekCount", weekRecords.length);
  setText("monthCount", monthRecords.length);
  setText("homeWeight", latest.weight.toFixed(1));
  setText("homeFat", latest.fat.toFixed(1));
  setText("weightChange", previous ? `较上次 ${signed(latest.weight - previous.weight)} kg` : "等待更多记录");
  setText("fatChange", previous ? `较上次 ${signed(latest.fat - previous.fat)}%` : "等待更多记录");

  const activeDays = new Set(weekRecords.map((item) => new Date(item.date).getDay()));
  document.querySelector("#weekBars").innerHTML = ["一","二","三","四","五","六","日"].map((day, index) => {
    const jsDay = index === 6 ? 0 : index + 1;
    return `<div class="${activeDays.has(jsDay) ? "done" : ""}"><i style="height:${activeDays.has(jsDay) ? 28 + (index % 3) * 5 : 9}px"></i><small>${day}</small></div>`;
  }).join("");
  document.querySelector("#monthBars").innerHTML = [16, 9, 23, 13, 31, 20, 36].map((height, index) =>
    `<div><i style="height:${height}px"></i><small>${index + 1}</small></div>`
  ).join("");
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
        <h3>${escapeHtml(item.type)} · ${item.duration} 分钟</h3>
        <p>${item.date} · ${escapeHtml(item.parts.join("、"))} · ${escapeHtml(item.intensity)}</p>
      </div>
      <button class="delete-record" type="button" data-delete-record="${item.id}" aria-label="删除记录">×</button>
    </article>
  `).join("");
}

function renderTrends() {
  const records = recordsForPeriod(activePeriod);
  setText("trendTotal", records.length);
  setText("trendStrength", records.filter((item) => item.type === "力量训练").length);
  setText("trendCardio", records.filter((item) => item.type === "有氧运动").length);
  setText("trendMonthCount", recordsForPeriod("month").length);
  const heights = [18, 42, 25, 20, 32, 28, 48, 29, 55, 39, 31, 61];
  document.querySelector("#frequencyBars").innerHTML = heights.map((height) =>
    `<div><i style="height:${height}px"></i></div>`
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
  document.querySelector("#partDonut span").innerHTML = `${records.length}<small>次</small>`;
  document.querySelector("#partLegend").innerHTML = entries.length
    ? entries.map(([part, count], index) => `<div class="legend-row"><i style="background:${partColors[index]}"></i><span>${part}</span><b>${count} 次</b></div>`).join("")
    : `<span class="empty">本周期暂无记录</span>`;
  setText("trendTip", records.length >= 3 ? "保持现在的节奏，规律训练正在让改变发生。" : "本周期还可以再安排一次轻量训练，稳定比强度更重要。");
  requestAnimationFrame(renderCharts);
}

function renderCharts() {
  drawLineChart("weightChart", state.bodyRecords.map((item) => item.weight), "#16a34a", "kg");
  drawLineChart("fatChart", state.bodyRecords.map((item) => item.fat), "#7c4dff", "%");
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
  const weekCount = recordsForPeriod("week").length;
  setText("profileName", state.profile.name);
  setText("profileHeight", state.profile.height);
  setText("profileWeight", latest.weight.toFixed(1));
  setText("profileFat", latest.fat.toFixed(1));
  setText("goalProgressText", weekCount);
  setText("goalTargetText", state.profile.goal);
  setText("goalStatus", `已完成 ${weekCount} 次`);
  document.querySelector("#goalProgress").style.width = `${Math.min(100, weekCount / state.profile.goal * 100)}%`;
  setText("reminderStatus", state.reminder.enabled ? `每天 ${state.reminder.time}` : "已关闭");
}

function openModal(type) {
  const title = document.querySelector("#modalTitle");
  const content = document.querySelector("#modalContent");
  if (type === "workout") {
    closeModal();
    switchTab("records");
    document.querySelector("#page-records").scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (type === "body") {
    const latest = latestBody();
    title.textContent = "记录身体数据";
    content.innerHTML = `
      <form class="modal-form" id="bodyForm">
        <label>日期<input name="date" type="date" value="${formatDate(new Date())}" required /></label>
        <label>体重 kg<input name="weight" type="number" min="25" max="250" step="0.1" value="${latest.weight}" required /></label>
        <label>体脂率 %<input name="fat" type="number" min="3" max="70" step="0.1" value="${latest.fat}" required /></label>
        <button class="primary-button" type="submit">保存身体数据</button>
      </form>`;
    content.querySelector("form").addEventListener("submit", saveBodyRecord);
  } else if (type === "profile") {
    title.textContent = "编辑个人信息";
    content.innerHTML = `
      <form class="modal-form" id="profileForm">
        <label>昵称<input name="name" maxlength="12" value="${escapeHtml(state.profile.name)}" required /></label>
        <label>身高 cm<input name="height" type="number" min="100" max="220" value="${state.profile.height}" required /></label>
        <label>每周目标 次<input name="goal" type="number" min="1" max="14" value="${state.profile.goal}" required /></label>
        <button class="primary-button" type="submit">保存个人信息</button>
      </form>`;
    content.querySelector("form").addEventListener("submit", saveProfile);
  } else {
    title.textContent = type === "privacy" ? "隐私说明" : "关于元气练习生";
    content.innerHTML = `<p class="info-copy">${type === "privacy"
      ? "你的运动和身体数据仅保存在当前浏览器的本地存储中，不会上传到服务器。你可以随时通过“数据导出”备份，也可以清除浏览器数据完成删除。"
      : "元气练习生是一款轻量健身记录原型，帮助你记录训练、观察趋势，并用更温和的方式坚持运动。"}</p>`;
  }
  document.querySelector("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
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

function saveBodyRecord(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.bodyRecords.push({ date: data.get("date"), weight: Number(data.get("weight")), fat: Number(data.get("fat")) });
  state.bodyRecords.sort((a, b) => a.date.localeCompare(b.date));
  saveState(); render(); closeModal(); showToast("身体数据已保存");
}

function saveProfile(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.profile.name = data.get("name").trim();
  state.profile.height = Number(data.get("height"));
  state.profile.goal = Number(data.get("goal"));
  saveState(); render(); closeModal(); showToast("个人信息已更新");
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
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      setText("installStatus", "需要 HTTPS");
    });
  });
}

function recordsForPeriod(period) {
  const days = period === "week" ? 7 : period === "month" ? 30 : 90;
  const boundary = new Date();
  boundary.setHours(0, 0, 0, 0);
  boundary.setDate(boundary.getDate() - days + 1);
  return state.workouts.filter((item) => new Date(`${item.date}T00:00:00`) >= boundary);
}

function countParts(records) {
  return records.flatMap((item) => item.parts || []).reduce((acc, part) => {
    acc[part] = (acc[part] || 0) + 1;
    return acc;
  }, {});
}

function latestBody() {
  return state.bodyRecords.at(-1) || { weight: state.profile.weight, fat: state.profile.fat };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...defaultState, ...stored, profile: { ...defaultState.profile, ...stored.profile } } : structuredClone(defaultState);
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

window.addEventListener("resize", () => {
  if (document.querySelector("#page-trends").classList.contains("active")) renderCharts();
});

render();
const initialTab = ["home", "records", "trends", "profile"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
switchTab(initialTab);
requestPersistentStorage();
registerServiceWorker();
