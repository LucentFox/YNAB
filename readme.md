A project to process YNAB transactions into graphs.

Transactions should be saved in the root of the project as `transactions.csv` with the following headers and sample row:

```
"Account","Flag","Date","Payee","Category Group/Category",...,"Outflow","Inflow","Cleared"
"Apple Card","","06/28/2025","Artic Spas","Utilities & Services: 💧 Spa Care",...,"",$438.38,$0.00,"Reconciled"
```

## Hosting the reports

Run the included Python web server and open `ByPayee.html` in your browser.

```
python3 server.py
```

This will serve the files at <http://localhost:8000/>.
