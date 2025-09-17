## Cognitive Skills & Student Performance Dashboard

An interactive dashboard and notebook for analyzing how student cognitive skills relate to performance. The project:

- Loads a synthetic dataset of students and cognitive skills
- Analyzes correlations and trains a simple model to predict `assessment_score`
- Clusters students into learning personas
- Visualizes overview stats, bar/scatter/radar charts, and a searchable/sortable student table


## Project Structure

```
src/
  app/
    page.tsx        # Dashboard UI (charts, insights, table)
    layout.tsx
    globals.css
public/
  synthetic_students.csv                 # Base dataset
  synthetic_students_with_personas.csv   # Exported by the notebook (dashboard prefers this)
notebooks/
  student_analysis.ipynb                 # EDA, correlations, ML, clustering, export personas CSV
```


## Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for the notebook)


## Setup & Run (Windows-friendly)

1) Optional but recommended: run the notebook to generate the enhanced CSV with personas

```bat
cd "C:\Users\MY PC\student-dashboard"
python -m venv .venv
.venv\Scripts\activate
pip install notebook pandas numpy scikit-learn seaborn matplotlib
jupyter notebook
```

Open `notebooks/student_analysis.ipynb` → Run All. This writes `public/synthetic_students_with_personas.csv`.

2) Install JS dependencies and start the app

If PowerShell blocks npm (`npm.ps1 cannot be loaded`), either run from Command Prompt or use `npm.cmd`.

Command Prompt (cmd):
```bat
cd "C:\Users\MY PC\student-dashboard"
npm install
npm run dev
```

Then open `http://localhost:3000`.


## Features

- Overview tiles: average score and average cognitive skills
- Insights: top skill–score correlations (computed client-side)
- Charts:
  - Bar: Average assessment score by class
  - Scatter: Attention vs Assessment Score
  - Radar: Individual student cognitive profile (select from dropdown)
- Student table: searchable (fuzzy), sortable headers, dark-mode friendly
- Personas: if `synthetic_students_with_personas.csv` exists, it is used; otherwise personas are inferred on the client


## Notebook (Analysis, ML, Clustering)

Open and run `notebooks/student_analysis.ipynb`. It performs:

- Data cleaning, type coercion
- Correlation analysis and visualizations
- Simple ML model: Linear Regression predicting `assessment_score`
- KMeans clustering (k=4) on standardized skill features to derive personas
- Export of `public/synthetic_students_with_personas.csv` used by the dashboard

Results (will vary slightly with data):

- Check the final notebook cells for R²/MAE and the persona distribution chart
- The dashboard’s Insights card shows the top 3 correlations detected for your current dataset


## Build & Deploy

Build:
```bash
npm run build
```

Deploy (Vercel recommended):

1) Push to GitHub
```bash
git init
git add .
git commit -m "Cognitive Skills & Student Performance Dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/student-dashboard.git
git push -u origin main
```

2) Import the repo in Vercel and deploy (or use CLI `vercel && vercel --prod`). Ensure `public/synthetic_students_with_personas.csv` is committed if you want personas live.


## Deliverables Checklist

- [x] Jupyter Notebook with analysis, ML, and clustering
- [x] Next.js dashboard with charts and table
- [x] GitHub repository with code
- [x] Deployed Vercel link (public)
- [x] README with setup and findings instructions


## Notes

- The app uses `recharts`, `papaparse`, and simple client-side utilities for correlations and search
- Dark mode is supported via CSS variables; charts and table are styled accordingly


## License

For educational use. Replace or add a license if you need broader use.
