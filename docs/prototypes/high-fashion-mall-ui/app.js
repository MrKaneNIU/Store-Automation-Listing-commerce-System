const toast = document.querySelector(".toast");
const views = document.querySelectorAll(".app-view");
const tabs = document.querySelectorAll(".tab");
const catalogGrid = document.querySelector(".catalog-grid");
const modalLayer = document.querySelector(".modal-layer");
const authFeedback = document.querySelector(".auth-feedback");
const adminPanels = document.querySelectorAll("[data-admin-panel]");
const adminTabs = document.querySelectorAll("[data-admin-tab]");
const uploadRemainingText = document.querySelector("[data-upload-remaining]");
const productFilters = document.querySelectorAll("[data-product-filter]");
const productCards = document.querySelectorAll("[data-product-card]");
const productStats = document.querySelectorAll("[data-product-stat]");
let toastTimer = 0;
const adminMetrics = {
  maxUploadCount: 18,
  selectedUploadCount: 5
};
const productStateCounts = {
  "needs-image": 1,
  ready: 1,
  published: 1
};

function normalizeBottomNav() {
  const navButtons = document.querySelectorAll(".bottom-nav .tab");
  const navConfig = [
    { index: 0, label: "首页", action: "show-home" },
    { index: 1, label: "商品", action: "show-catalog" },
    { index: 2, label: "购物袋", action: "show-bag" },
    { index: 3, label: "收藏", action: "show-favorites" },
    { index: 4, label: "我的", action: "show-profile" }
  ];

  navConfig.forEach(({ index, label, action }) => {
    const button = navButtons[index];
    if (!button) return;
    button.setAttribute("aria-label", label);
    button.dataset.action = action;
    button.removeAttribute("data-toast");
    const text = button.querySelector("span");
    if (text) text.textContent = label;
  });
}

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function showView(name) {
  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === name);
  });
  tabs.forEach((tab) => {
    const action = tab.dataset.action;
    tab.classList.toggle(
      "active",
      (name === "home" && action === "show-home") ||
        (name === "catalog" && action === "show-catalog") ||
        (name === "bag" && action === "show-bag") ||
        (name === "favorites" && action === "show-favorites") ||
        (name === "profile" && action === "show-profile")
    );
  });
  document
    .querySelector(".bottom-nav")
    ?.classList.toggle("hidden", name === "detail" || name === "success" || name === "admin");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAdminPanel(name) {
  adminPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === name);
  });
  adminTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.adminTab === name);
  });
}

function updateAdminMetrics() {
  if (!uploadRemainingText) return;
  const remaining = Math.max(0, adminMetrics.maxUploadCount - adminMetrics.selectedUploadCount);
  uploadRemainingText.textContent = `可上传 ${remaining} 张`;
}

function updateProductStats() {
  productStats.forEach((item) => {
    const key = item.getAttribute("data-product-stat") || "";
    const value = key === "needs-image" ? productStateCounts["needs-image"] : productStateCounts[key] || 0;
    item.textContent = String(value);
  });
}

function filterProductCards(filter) {
  productCards.forEach((card) => {
    const state = card.getAttribute("data-product-state") || "all";
    const visible = filter === "all" || state === filter;
    card.hidden = !visible;
  });
}

normalizeBottomNav();
updateAdminMetrics();
updateProductStats();
filterProductCards("all");

document.querySelectorAll("[data-toast]").forEach((button) => {
  button.addEventListener("click", () => {
    showToast(button.getAttribute("data-toast") || "已更新原型状态");
  });
});

document.querySelectorAll("[data-action='show-catalog']").forEach((button) => {
  button.addEventListener("click", () => showView("catalog"));
});

document.querySelectorAll("[data-action='show-home']").forEach((button) => {
  button.addEventListener("click", () => showView("home"));
});

document.querySelectorAll("[data-action='show-admin']").forEach((button) => {
  button.addEventListener("click", () => {
    showAdminPanel("workbench");
    showView("admin");
  });
});

adminTabs.forEach((button) => {
  button.addEventListener("click", () => {
    showAdminPanel(button.dataset.adminTab || "workbench");
  });
});

document.querySelectorAll("[data-admin-entry]").forEach((button) => {
  button.addEventListener("click", () => {
    const entry = button.getAttribute("data-admin-entry") || "工作台入口";
    showToast(`${entry} 仅切换原型入口，不调用真实服务`);
  });
});

productFilters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.getAttribute("data-product-filter") || "all";
    productFilters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    filterProductCards(filter);
    showToast(`已切换到 ${button.textContent} 商品状态筛选`);
  });
});

document.querySelectorAll("[data-product-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.getAttribute("data-product-action") || "action";
    if (action === "publish") {
      showToast("上架仅为静态原型反馈，不写入商品数据");
    } else if (action === "assist") {
      showToast("去补图仅为原型入口，不进入真实补图流程");
    } else {
      showToast("商品状态仅为原型展示");
    }
  });
});

document.querySelectorAll("[data-order-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.getAttribute("data-order-action") || "action";
    if (action === "confirm") {
      showToast("确认订单仅为静态原型反馈，不写入订单或库存数据");
    } else if (action === "cancel") {
      showToast("取消订单仅为静态原型反馈，不触发退款或库存回滚");
    } else {
      showToast("订单状态仅为原型展示");
    }
  });
});

document.querySelectorAll("[data-action='show-bag']").forEach((button) => {
  button.addEventListener("click", () => showView("bag"));
});

document.querySelectorAll("[data-action='show-favorites']").forEach((button) => {
  button.addEventListener("click", () => showView("favorites"));
});

document.querySelectorAll("[data-action='show-profile']").forEach((button) => {
  button.addEventListener("click", () => showView("profile"));
});

document.querySelectorAll(".favorite-button").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("selected");
    showToast("收藏仅为静态原型反馈，不写入用户数据");
  });
});

document.querySelectorAll("[data-action='open-auth-modal']").forEach((button) => {
  button.addEventListener("click", () => {
    if (authFeedback) authFeedback.hidden = true;
    if (modalLayer) modalLayer.hidden = false;
  });
});

document.querySelectorAll("[data-action='close-auth-modal']").forEach((button) => {
  button.addEventListener("click", () => {
    if (modalLayer) modalLayer.hidden = true;
  });
});

document.querySelectorAll("[data-action='cancel-auth']").forEach((button) => {
  button.addEventListener("click", () => {
    if (modalLayer) modalLayer.hidden = true;
    if (authFeedback) authFeedback.hidden = false;
    showToast("已取消授权，原型不创建订单");
  });
});

document.querySelectorAll("[data-action='confirm-auth']").forEach((button) => {
  button.addEventListener("click", () => {
    if (modalLayer) modalLayer.hidden = true;
    showView("success");
    showToast("订单成功反馈仅为静态原型，不调用微信服务");
  });
});

document.querySelectorAll("[data-action='show-detail']").forEach((item) => {
  item.addEventListener("click", (event) => {
    if (!item.matches("button") && event.target.closest("button")) return;
    showView("detail");
  });
});

const stateMessages = {
  loading: "商品卡片骨架应与真实卡片比例一致。",
  empty: "空状态保留大留白，并给出清晰的返回浏览动作。",
  error: "错误状态说明失败原因与下一步动作，不触发真实服务。"
};

const stateMessage = document.querySelector(".state-message");

document.querySelectorAll("[data-state]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-state]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const key = button.getAttribute("data-state") || "loading";
    if (stateMessage) stateMessage.textContent = stateMessages[key];
  });
});

document.querySelectorAll(".category-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".category-pill").forEach((item) => item.classList.remove("active"));
    pill.classList.add("active");
    showToast(`已切换到 ${pill.textContent} 分类原型`);
  });
});

document.querySelectorAll("[data-layout]").forEach((button) => {
  button.addEventListener("click", () => {
    const layout = button.getAttribute("data-layout") || "grid";
    document.querySelectorAll("[data-layout]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    catalogGrid?.classList.toggle("list", layout === "list");
  });
});

document.querySelectorAll("[data-spec]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-spec]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showToast(`已选择 ${button.textContent}，仅为本地原型状态`);
  });
});
