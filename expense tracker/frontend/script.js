const API_URL = "http://127.0.0.1:8001/transactions";

const form = document.getElementById("transactionForm");
const searchInput = document.getElementById("search");
const list = document.getElementById("transactionsList");

let transactions = [];

async function loadTransactions() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Unable to load transactions");
    }

    transactions = await response.json();
    updateDashboard();
  } catch (error) {
    list.innerHTML =
      "<p>Backend not connected. Start the backend server and refresh.</p>";
  }
}

function updateDashboard() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  document.getElementById("totalIncome").textContent =
    "₹" + income.toFixed(2);

  document.getElementById("totalExpenses").textContent =
    "₹" + expenses.toFixed(2);

  document.getElementById("balance").textContent =
    "₹" + (income - expenses).toFixed(2);

  displayTransactions();
}

function displayTransactions() {
  const keyword = searchInput.value.toLowerCase();

  const filtered = transactions.filter(item =>
    item.description.toLowerCase().includes(keyword) ||
    item.category.toLowerCase().includes(keyword)
  );

  if (filtered.length === 0) {
    list.innerHTML = "<p>No transactions found.</p>";
    return;
  }

  list.innerHTML = filtered.map(item => `
    <div class="transaction-card">
      <div>
        <strong>${escapeHTML(item.description)}</strong>
        <p>${escapeHTML(item.category)} | ${escapeHTML(item.date)}</p>
        <span class="${item.type}">
          ${item.type === "income" ? "+" : "-"}₹${Number(item.amount).toFixed(2)}
        </span>
      </div>
      <button class="delete-btn" onclick="deleteTransaction(${item.id})">
        Delete
      </button>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const transaction = {
    description: document.getElementById("description").value.trim(),
    amount: Number(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value
  };

  if (!transaction.description || transaction.amount <= 0 ||
      !transaction.date) {
    alert("Please enter valid transaction details.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) throw new Error("Add failed");

    form.reset();
    await loadTransactions();
  } catch (error) {
    alert("Backend connect aagala, Sha. Start the backend server first!");
  }
});

async function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Delete failed");

    await loadTransactions();
  } catch (error) {
    alert("Could not delete transaction.");
  }
}

searchInput.addEventListener("input", displayTransactions);

loadTransactions();