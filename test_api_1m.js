const url = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?pageSize=1";
(async () => {
  for (let i = 0; i < 20; i++) {
     try {
       const res = await fetch(url);
       const d = await res.json();
       console.log(Date.now(), d.data.list[0].issueNumber);
       await new Promise(r => setTimeout(r, 2000));
     } catch (e) {
       console.log(e);
     }
  }
})();
