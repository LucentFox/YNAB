A project to process ynab transactions into graphs.

Transactions should be saved in the root of the project called transactions.csv with the following headers and data:

"Account","Flag","Date","Payee","Category Group/Category","Category Group","Category","Memo","Outflow","Inflow","Cleared"
"Apple Card","","06/28/2025","Artic Spas","Utilities & Services: 💧 Spa Care","Utilities & Services","💧 Spa Care","",$438.38,$0.00,"Reconciled"

## Hosting the reports

Run the included Python web server and open `ByPayee.html` in your browser.

```
python3 server.py
```

This will serve the files at <http://localhost:8000/>.
