# 🧠 AlgoAtlas

**34 Patterns · 680+ LeetCode Problems · Progress Tracking · Google Sheets Sync**

A complete, interactive study tool to master Data Structures & Algorithms for FAANG‑level interviews. Each pattern includes 15–30 hand‑picked LeetCode problems (easy/medium/hard), with checkboxes, custom tags, notes, video links, and a real‑time analytics dashboard.

![Preview](https://via.placeholder.com/800x400?text=DSA+Pattern+Vault)

## ✨ Features

- **34 DSA patterns** – from Two Pointers to Segment Tree, covering all FAANG topics.
- **680+ real LeetCode problems** – each with a direct link, difficulty badge, and no cross‑pattern dependencies.
- **Progress tracking** – check off problems, see per‑pattern and global completion.
- **Interactive dashboard** – pie chart, phase‑wise progress bars, searchable patterns.
- **Custom metadata** – add your own tags, solution notes, and video tutorial links per problem.
- **Dark / Light mode** – easy on the eyes during long study sessions.
- **Google Sheets sync** (optional) – save your progress to a private sheet and resume anywhere.

## 📂 Project Structure

```text
.
├── index.html              # Main UI structure
├── styles.css              # Modern styling (glassmorphism, dark mode)
├── app.js                  # Core logic (patterns, state, localStorage, sync)
├── google-apps-script.gs   # Backend script for Google Sheets sync
├── GOOGLE_SHEETS_SETUP.md  # Step-by-step sync configuration
└── favicon.ico               # favicon image
└── README.md               # This file
```


## 🚀 Getting Started

### 1. Local Usage (no sync)

Simply open `index.html` in any modern browser. All progress is saved in your browser’s `localStorage`.

### 2. Enable Google Sheets Sync (optional)

Follow the detailed instructions in [`GOOGLE_SHEETS_SETUP.md`](./GOOGLE_SHEETS_SETUP.md). In short:

- Create a Google Sheet with a tab named `progress`.
- Deploy the Apps Script (`google-apps-script.gs`) as a web app.
- Copy the web app URL and paste it into `app.js` where `SHEETS_API_URL` is defined.
- Reload the app – your progress will now load from and save to the sheet.

### 3. Customisation

- **Add more problems** – edit `app.js` and extend the `EXPANDED_PROBLEM_ROWS` object for any pattern.
- **Change colours / styling** – modify `styles.css` (CSS variables and phase colours are easy to tweak).

## 🧩 Patterns Included

| Phase | Patterns |
|-------|----------|
| **Foundation** | Two Pointers, Sliding Window, Prefix Sum, Cyclic Sort |
| **Core Interview** | Binary Search (Extended), HashMap Patterns, Merge Intervals, Monotonic Stack, Monotonic Deque |
| **Trees & Graphs** | Tree DFS, Tree BFS, BST, Graph BFS/DFS, Topological Sort, Union‑Find, Shortest Paths |
| **Dynamic Programming** | 1D DP, 0/1 Knapsack, Unbounded Knapsack, LCS, LIS, Grid DP, Palindrome DP, Interval DP, DP on Trees, Digit DP, Bitmask DP |
| **Advanced** | Trie, Backtracking, Two Heaps, Bit Manipulation, Greedy Patterns, Segment Tree / BIT |

## 🛠️ Tech Stack

- **HTML5 / CSS3** – responsive layout, glassmorphism, dark mode
- **JavaScript (ES6)** – state management, localStorage, Chart.js
- **Chart.js** – progress pie chart
- **Tabler Icons** – clean icon set
- **Google Apps Script** – optional cloud sync

## 📊 Data Persistence

- **Local** – all checkmarks, tags, notes, and video URLs are saved in `localStorage` automatically.
- **Cloud (optional)** – if you configure Google Sheets, your progress is also pushed to the sheet every time you check a problem or edit metadata. The app loads from the sheet on startup and falls back to localStorage if the sheet is unreachable.

## 🤝 Contributing

Feel free to fork and improve:

- Add more verified LeetCode problems.
- Improve the sync backend (e.g., Firebase, Supabase).
- Enhance accessibility or add keyboard shortcuts.

## 📄 License

MIT – use freely for your FAANG preparation.

## ⚠️ Disclaimer

All problem links point to LeetCode’s official website. This project is not affiliated with or endorsed by LeetCode or any FAANG company. Use it as a personal study companion.