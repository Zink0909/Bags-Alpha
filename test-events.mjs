const mint = 'DpaJTo4fnPaKsgoqZ867wRAEuykmqJizQR7RUBUCBAGS';
const key = 'bags_prod_MJ2lSc57FlZCfJ9bPwlxKsmZqEX-iUzlgJ39CQtUScY';

const res = await fetch(
  `https://public-api-v2.bags.fm/api/v1/token-launch/claim-events?tokenMint=${mint}`,
  { headers: { 'x-api-key': key } }
);
const data = await res.json();
console.log('Total events:', data.response?.length);
console.log('First 2 events:', JSON.stringify(data.response?.slice(0, 2), null, 2));
