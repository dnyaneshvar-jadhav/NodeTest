# NodeTest
Node.js Heart Rate API

This is a Node.js based API to receive, process, and store Heart Rate data asynchronously.

## Prerequisites
- Node.js installed on your machine
- PostgreSQL installed and running

## Installation
1. Clone this repository.
2. Navigate to the project directory.
3. Run `npm install` to install the dependencies.

## Configuration
1. Create a PostgreSQL database.
2. Update the PostgreSQL connection details in `index.js` (user, host, database, password, port).

## Usage
1. Run `npm start` to start the server.
2. Send a POST request to `http://localhost:5000/process-data` with the payload containing Heart Rate data.
3. The server will process the data, and the processed response will be returned.

## Bonus (Storing Data in PostgreSQL)
To store the processed data in a PostgreSQL table:
1. Ensure PostgreSQL is installed and running.
2. Create a table named `heart_rate_data` with columns: `from_date`, `to_date`, `low`, `high`.
3. Uncomment the `storeDataInPostgres` function call in `index.js`.
4. Restart the server.