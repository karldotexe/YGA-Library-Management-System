import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import {
  FaChartLine,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaUsers,
  FaMoneyBillWave,
  FaBookDead,
} from "react-icons/fa";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./SuperAdminDashboard.css";

/* Helper: get all months between two dates */
function monthsBetween(start, end) {
  const a = new Date(start.getFullYear(), start.getMonth(), 1);
  const b = new Date(end.getFullYear(), end.getMonth(), 1);
  const months = [];
  while (a <= b) {
    months.push(new Date(a));
    a.setMonth(a.getMonth() + 1);
  }
  return months;
}

/* Simple linear regression */
function linearRegression(values) {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const xAvg = (n - 1) / 2;
  const yAvg = values.reduce((s, v) => s + v, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xAvg) * (values[i] - yAvg);
    den += (i - xAvg) * (i - xAvg);
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yAvg - slope * xAvg;
  return { slope, intercept };
}

const INITIAL_TRANSACTION_LIMIT = 5;

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  const [kpis, setKpis] = useState({
    totalBorrows: 0,
    overdueCount: 0,
    lostBooks: 0,
  });

  const [penaltyTotals, setPenaltyTotals] = useState({
    overall: 0,
    overdue: 0,
    lost: 0,
  });

  const [monthlySeries, setMonthlySeries] = useState([]);
  const [weeklySeries, setWeeklySeries] = useState([]);
  const [overview, setOverview] = useState({
    nextWeek: "",
    nextMonth: "",
    nextYear: "",
  });
  const [transactions, setTransactions] = useState([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    fetchSuperAdminData();
  }, [filter]);

  async function fetchSuperAdminData() {
    setLoading(true);
    setError(null);
    try {
      const { data: borrowed, error: borrowedError } = await supabase
        .from("borrowed_books")
        .select(
          "id, created_at, student_id, book_id, due_date, return_date, penalty_fee, status, penalty_status, processed_by, overdue_days"
        )
        .order("created_at", { ascending: false });

      if (borrowedError) throw borrowedError;

      const { data: students } = await supabase
        .from("students")
        .select("auth_user_id, full_name, grade, section, handled_by");

      const { data: books } = await supabase
        .from("books")
        .select("book_id, title, author");

      // Apply filter
      let filteredBorrowed = borrowed;
      if (filter !== "All") {
        const filteredIds = students
          .filter((s) => s.handled_by === filter)
          .map((s) => s.auth_user_id);
        filteredBorrowed = borrowed.filter((b) =>
          filteredIds.includes(b.student_id)
        );
      }

      // Merge data for table and sort most recent first
       // Merge data for table and sort most recent first
        const mergedTransactions = filteredBorrowed
          .map((b) => {
            const student = students?.find((s) => s.auth_user_id === b.student_id);
            const book = books?.find((bk) => bk.book_id === b.book_id);

            // Check for lost status, consistent with KPI logic
            const isLost =
              b.status?.toLowerCase().includes("lost") ||
              b.penalty_status?.toLowerCase().includes("lost");

            return {
              id: b.id,
              borrower: student?.full_name || "Unknown Student",
              grade: student?.grade || "-",
              section: student?.section || "-",
              bookTitle: book?.title || "Unknown Book",
              author: book?.author || "-",
              borrowDate: new Date(b.created_at).toLocaleDateString(),
              createdAt: b.created_at, // for sorting
              // MODIFIED LOGIC: If it's lost OR has no return date, show "Not Returned"
              returnDate:
                isLost || !b.return_date
                  ? "Not Returned"
                  : new Date(b.return_date).toLocaleDateString(),
              penalty: b.penalty_fee ? `₱${b.penalty_fee}` : "None",
              processedBy: b.processed_by || "N/A",
              status: b.status
                ? b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()
                : "-",
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // SORT HERE


      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Lost books
      const lostBooks = filteredBorrowed.filter(
        (b) =>
          b.status?.toLowerCase().includes("lost") ||
          b.penalty_status?.toLowerCase().includes("lost")
      );

      // Overdue books
      const overdueBooks = filteredBorrowed.filter((b) => {
        const isLost =
          b.status?.toLowerCase().includes("lost") ||
          b.penalty_status?.toLowerCase().includes("lost");
        if (isLost || !b.due_date) return false;

        const due = new Date(b.due_date);
        due.setHours(0, 0, 0, 0);

        return (!b.return_date || new Date(b.return_date) > due) && due < today;
      });

      // KPI
      const totalBorrows = filteredBorrowed.length;
      const overdueCount = overdueBooks.length;
      const lostBooksCount = lostBooks.length;

      // Penalty totals
      const lostPenalty = lostBooks.reduce(
        (sum, b) => sum + (Number(b.penalty_fee) || 0),
        0
      );

      const overduePenalty = overdueBooks.reduce((sum, b) => {
        const days = Number(b.overdue_days) || 0;
        return sum + days * 10;
      }, 0);

      const overallPenalty = lostPenalty + overduePenalty;

      // === Earnings Prediction ===
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const months = monthsBetween(startMonth, now).map((d) => {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        return { key, label: d.toLocaleString("default", { month: "short", year: "numeric" }), earnings: 0 };
      });

      // Sum penalties per month
      filteredBorrowed.forEach((b) => {
        if (!b.created_at) return;
        const created = new Date(b.created_at);
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        const m = months.find((x) => x.key === key);
        if (m) m.earnings += Number(b.penalty_fee) || 0;
      });

      const monthlyData = months.map((m) => ({
        name: m.label,
        earnings: m.earnings,
      }));

      // Weekly earnings (last 12 weeks)
      const weeklyData = [];
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7 * 11);
      for (let i = 0; i < 12; i++) {
        const start = new Date(weekStart);
        start.setDate(weekStart.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        const count = filteredBorrowed
          .filter((b) => new Date(b.created_at) >= start && new Date(b.created_at) < end)
          .reduce((sum, b) => sum + (Number(b.penalty_fee) || 0), 0);
        weeklyData.push({ name: `Week ${i + 1}`, earnings: count });
      }

      // Predictions
      const monthlyEarnings = monthlyData.map((d) => d.earnings);
      const monthlyLR = linearRegression(monthlyEarnings);
      const predictedNextMonthEarnings = Math.max(
        0,
        Math.round(monthlyLR.intercept + monthlyLR.slope * monthlyEarnings.length)
      );
      const predictedNextYearEarnings = Math.max(
        0,
        Math.round(predictedNextMonthEarnings + monthlyLR.slope * 12)
      );

      const weeklyEarnings = weeklyData.map((d) => d.earnings);
      const weeklyLR = linearRegression(weeklyEarnings);
      const predictedNextWeekEarnings = Math.max(
        0,
        Math.round(weeklyLR.intercept + weeklyLR.slope * weeklyEarnings.length)
      );

      setKpis({ totalBorrows, overdueCount, lostBooks: lostBooksCount });
      setMonthlySeries(monthlyData);
      setWeeklySeries(weeklyData);
      setOverview({
        nextWeek: `Possible earnings next week:  ₱${predictedNextWeekEarnings}`,
        nextMonth: `Possible earnings next month:  ₱${predictedNextMonthEarnings}`,
        nextYear: `Possible earnings next year:  ₱${predictedNextYearEarnings}`,
      });

      setPenaltyTotals({
        overall: overallPenalty,
        overdue: overduePenalty,
        lost: lostPenalty,
      });
      // Exclude transactions with status "approved" or "pending" (case-insensitive)
        const filteredTransactions = mergedTransactions.filter(
          (t) =>
            !["approved", "pending", "declined"].includes(t.status?.toLowerCase())
        );

setTransactions(filteredTransactions);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
      setLoading(false);
    }
  }

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, INITIAL_TRANSACTION_LIMIT);

  if (loading)
    return (
      <div className="superadmin-loading">Loading Registrar Dashboard...</div>
    );
  if (error) return <div className="superadmin-error">⚠️ Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <header className="superadmin-header">
        <h2>
          <FaChartLine />
          Reports
        </h2>

        <div className="filter-wrapper">
          <label>Filter: </label>
          <select
            className="filter-dropdown"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Parent</option>
            <option>Student</option>
          </select>
        </div>
      </header>

      {/* Overview */}
      <div className="overview-texts">
        <div className="overview-card">
          <strong>Next Week</strong>
          <p>{overview.nextWeek}</p>
        </div>
        <div className="overview-card">
          <strong>Next Month</strong>
          <p>{overview.nextMonth}</p>
        </div>
        <div className="overview-card">
          <strong>Next Year</strong>
          <p>{overview.nextYear}</p>
        </div>
      </div>

      {/* KPI Row */}
      <section className="kpi-row">
        <div className="kpi-card">
          <FaCalendarAlt />
          <div>
            <small>Total Borrows</small>
            <h3>{kpis.totalBorrows}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <FaExclamationTriangle />
          <div>
            <small>Overdue</small>
            <h3>{kpis.overdueCount}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <FaBookDead />
          <div>
            <small>Lost Books</small>
            <h3>{kpis.lostBooks}</h3>
          </div>
        </div>

        <div className="kpi-card penalty-card">
          <FaMoneyBillWave />
          <div>
            <small>Penalty Fees</small>
            <div className="penalty-details">
              <p>Overall: <br /> ₱{penaltyTotals.overall.toFixed(2)}</p>
              <p>Overdue: ₱{penaltyTotals.overdue.toFixed(2)}</p>
              <p>Lost Books: ₱{penaltyTotals.lost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="charts-row">
        <div className="chart-card">
          <h4>Monthly Earnings (last 12 months)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => `₱${value}`} />
              <Bar dataKey="earnings" barSize={18} fill="#6f42c1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Weekly Earnings (last 12 weeks)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => `₱${value}`} />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#6f42c1"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Transactions Table */}
      <section className="lists-row">
        <div className="list-card transactions">
          <h4>
            Borrowing Transactions
            <button className="export-pdf-btn" onClick={() => window.print()}>
              Print
            </button>
          </h4>

          {/* On-screen table (with Show All functionality) */}
          <div className="table-wrapper screen-only">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Grade & Section</th>
                  <th>Book</th>
                  <th>Borrowed</th>
                  <th>Returned</th>
                  <th>Penalty</th>
                  <th>Processed By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.borrower}</td>
                    <td>{t.grade}-{t.section}</td>
                    <td>{t.bookTitle}</td>
                    <td>{t.borrowDate}</td>
                    <td>{t.returnDate}</td>
                    <td>{t.penalty}</td>
                    <td>{t.processedBy}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length > INITIAL_TRANSACTION_LIMIT && (
              <div className="show-all-toggle">
                <button onClick={() => setShowAllTransactions(!showAllTransactions)}>
                  {showAllTransactions ? "Show Less" : "Show All"}
                </button>
              </div>
            )}
          </div>

          {/* Full table for printing only */}
          <div className="table-wrapper print-only">

            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Grade & Section</th>
                  <th>Book</th>
                  <th>Borrowed</th>
                  <th>Returned</th>
                  <th>Penalty</th>
                  <th>Processed By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.borrower}</td>
                    <td>{t.grade}-{t.section}</td>
                    <td>{t.bookTitle}</td>
                    <td>{t.borrowDate}</td>
                    <td>{t.returnDate}</td>
                    <td>{t.penalty}</td>
                    <td>{t.processedBy}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
