const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 5000;

// Increase payload size limit to 10MB
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Initialize PostgreSQL connection pool
const pool = new Pool({
    user: process.env.USERNAME,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: 5432,
  });


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

// Task 1: Endpoint to consume the payload
app.post('/process-data', async (req, res) => {
    try {
      const payload = req.body;
      //console.log("payload",payload)
      // Task 2: Process HEART_RATE data
      const processedData = processHeartRate(payload);
  
      // Task 3: Return processed response including HEART_RATE and other metrics
      res.json(processedData);
    } catch (error) {
      console.error('Error processing data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Task 2: Function to process HEART_RATE data separately
function processHeartRate(payload) {
    const heartRateReadings = payload.clinical_data.HEART_RATE.data;
    //console.log("heartRateReadings=",heartRateReadings)
    const intervals = groupInto15MinuteIntervals(heartRateReadings);
    //console.log("intervals=",intervals)
    
    // store in to pg db
    storeDataInPostgres(intervals)

    return intervals.map(interval => ({
      from_date: interval.from_date,
      to_date: interval.to_date,
      measurement: {
        low: Math.min(...interval.values),
        high: Math.max(...interval.values),
      },
    }));
  }


function groupInto15MinuteIntervals(heartRateReadings) {
    const intervals = [];
    let currentIntervalStart = null;
    let currentValues = [];

    for (const reading of heartRateReadings) {
        const readingDate = new Date(reading.on_date);
        //console.log("readingDate=",readingDate)
        // Calculate the start of the 15-minute interval for the reading
        const intervalStart = new Date(Math.floor(readingDate.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));

        if (!currentIntervalStart || intervalStart.getTime() !== currentIntervalStart.getTime()) {
            if (currentValues.length > 0) {
                intervals.push({
                    from_date: new Date(currentIntervalStart).toISOString(),
                    to_date: new Date(currentIntervalStart.getTime() + 15 * 60 * 1000).toISOString(),
                    values: [...currentValues],
                });
                currentValues = [];
            }
            currentIntervalStart = intervalStart;
        }
        currentValues.push(reading.measurement);
    }

    // Push the last interval
    if (currentValues.length > 0) {
        intervals.push({
            from_date: new Date(currentIntervalStart).toISOString(),
            to_date: new Date(currentIntervalStart.getTime() + 15 * 60 * 1000).toISOString(),
            values: [...currentValues],
        });
    }

    return intervals;
}

// Bonus: Store the data in a PostgreSQL table
async function storeDataInPostgres(data) {
    //console.log("data=",data)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      // Assuming you have a table named 'heart_rate_data' with columns: from_date, to_date, low, high
      const insertQuery = 'INSERT INTO heart_rate_data (from_date, to_date, low, high) VALUES ($1, $2, $3, $4)';
      for (const interval of data) {
        await client.query(insertQuery, [interval.from_date, interval.to_date, interval.measurement.low, interval.measurement.high]);
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }