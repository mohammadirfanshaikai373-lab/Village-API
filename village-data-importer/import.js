require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Helpers ---
async function getState(name, censusCode, versionId) {
  const res = await pool.query(
    `INSERT INTO states (name, census_code, data_version_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET census_code = EXCLUDED.census_code
     RETURNING id`,
    [name.trim(), censusCode, versionId]
  );
  return res.rows[0].id;
}

async function getDistrict(name, censusCode, stateId, versionId) {
  const res = await pool.query(
    `INSERT INTO districts (name, state_id, census_code, data_version_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (state_id, name) DO UPDATE SET census_code = EXCLUDED.census_code
     RETURNING id`,
    [name.trim(), stateId, censusCode, versionId]
  );
  return res.rows[0].id;
}

async function getSubDistrict(name, censusCode, districtId, versionId) {
  const res = await pool.query(
    `INSERT INTO sub_districts (name, district_id, census_code, data_version_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (district_id, name) DO UPDATE SET census_code = EXCLUDED.census_code
     RETURNING id`,
    [name.trim(), districtId, censusCode, versionId]
  );
  return res.rows[0].id;
}

// Batch villages
const villageBatch = [];
const BATCH_SIZE = 500;

async function flushVillages(versionId) {
  if (villageBatch.length === 0) return;
  const values = [];
  const params = [];
  villageBatch.forEach((v, i) => {
    const base = i * 4;
    params.push(v.subDistrictId, v.name, v.censusCode, versionId);
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
  });
  // ⚡ CHANGED: Unique on (sub_district_id, census_code)
  await pool.query(
    `INSERT INTO villages (sub_district_id, name, census_code, data_version_id)
     VALUES ${values.join(', ')} ON CONFLICT (sub_district_id, census_code) DO NOTHING`,
    params
  );
  villageBatch.length = 0;
}

async function addVillage(subDistrictId, name, censusCode, versionId) {
  villageBatch.push({ subDistrictId, name: name.trim(), censusCode, versionId });
  if (villageBatch.length >= BATCH_SIZE) {
    await flushVillages(versionId);
  }
}

// --- Import one file ---
async function importStateFile(filePath, versionId) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = xlsx.utils.sheet_to_json(sheet);
  const dataRows = rows.filter(row => row['STATE NAME'] && row['STATE NAME'] !== 'STATE NAME');
  
  if (!dataRows.length) {
    console.log(`  No data rows found. Skipping.`);
    return { state: 'UNKNOWN', rowCount: 0 };
  }
  
  const firstRow = dataRows[0];
  const stateName = firstRow['STATE NAME'];
  const stateCode = String(firstRow['MDDS STC']);
  
  console.log(`>> Importing ${stateName} (${dataRows.length} rows)`);
  
  const stateId = await getState(stateName, stateCode, versionId);
  
  const districtCache = {};
  const subDistrictCache = {};
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const dCode = String(row['MDDS DTC']).padStart(3, '0');
    const sdCode = String(row['MDDS Sub_DT']).padStart(5, '0');
    const vCode = String(row['MDDS PLCN']).padStart(6, '0');
    
    if (!districtCache[dCode]) {
      districtCache[dCode] = await getDistrict(row['DISTRICT NAME'], dCode, stateId, versionId);
    }
    const districtId = districtCache[dCode];
    
    const key = dCode + '_' + sdCode;
    if (!subDistrictCache[key]) {
      subDistrictCache[key] = await getSubDistrict(row['SUB-DISTRICT NAME'], sdCode, districtId, versionId);
    }
    await addVillage(subDistrictCache[key], row['Area Name'], vCode, versionId);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  ${(i + 1)} rows processed...`);
    }
  }
  
  await flushVillages(versionId);
  console.log(`  Completed ${stateName}.`);
  return { state: stateName, rowCount: dataRows.length };
}

// --- Main ---
(async () => {
  const versionId = 1;
  const folderPath = 'C:\\Users\\moham\\Downloads\\all-india-villages-master-list-excel\\dataset';
  
  const files = fs.readdirSync(folderPath).filter(f =>
    f.endsWith('.xls') || f.endsWith('.xlsx')
  );
  
  console.log(`Found ${files.length} state files.`);
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    try {
      await importStateFile(filePath, versionId);
    } catch (err) {
      console.error(`  FAILED: ${file} - ${err.message}`);
    }
  }
  
  console.log('All state imports finished.');
  await pool.end();
})();