const urlBase = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
let allRecords = [];
const fetchPage = async (page) => {
    const res = await fetch(`${urlBase}?pageNo=${page}&pageSize=10`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const d = await res.json();
    return d?.data?.list || [];
};
const promises = [];
for (let page = 1; page <= 5; page++) {
    promises.push(fetchPage(page).catch(e => { console.log('page err', page); return []; }));
}
const results = await Promise.all(promises);
for (const list of results) {
    allRecords = [...allRecords, ...list];
}
console.log(allRecords.length);
