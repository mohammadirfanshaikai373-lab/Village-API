const xlsx = require('xlsx');

// Pick one file that failed – Himachal
const filePath = 'C:\\Users\\moham\\Downloads\\all-india-villages-master-list-excel\\dataset\\Rdir_2011_02_HIMACHAL_PRADESH.xls';

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { range: 1 });

if (rows.length > 0) {
  const firstRow = rows[0];
  console.log('Column names found:');
  console.log(Object.keys(firstRow));
  console.log('\nFirst row data:');
  console.log(firstRow);
} else {
  console.log('No rows found. Check range option.');
}