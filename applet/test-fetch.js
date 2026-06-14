const fetch = require('node-fetch');
async function test() {
  const url = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';
  // Try passing in the body if it's POST
  let res = await fetch(url, {
      method: "POST", 
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ pageSize: 500, pageNo: 1 })
  }).catch(() => null);
  if (!res || !res.ok) {
     res = await fetch(url + "?pageNo=1&pageSize=500").catch(()=>null);
  }
  if (!res) {
      console.log("no res"); return;
  }
  const d = await res.json();
  console.log("Received via POST/GET:", d?.data?.list?.length);
}
test();
