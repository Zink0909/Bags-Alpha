const BASE = 'https://public-api-v2.bags.fm/api/v1';
const KEY = process.env.BAGS_API_KEY!;

const get = (path: string) =>
  fetch(`${BASE}${path}`, { headers: { 'x-api-key': KEY }, next: { revalidate: 60 } })
    .then(r => r.json())
    .then(d => d.response);

export const getFeed = () => get('/token-launch/feed');

export const getLifetimeFees = (mint: string) =>
  get(`/token-launch/lifetime-fees?tokenMint=${mint}`);

export const getCreators = (mint: string) =>
  get(`/token-launch/creator/v3?tokenMint=${mint}`);

export const getClaimStats = (mint: string) =>
  get(`/token-launch/claim-stats?tokenMint=${mint}`);

export const getClaimEvents = (mint: string) =>
  get(`/token-launch/claim-events?tokenMint=${mint}`);

export const getPool = (mint: string) =>
  get(`/solana/bags/pools/token-mint?tokenMint=${mint}`);

export const getQuote = (inputMint: string, outputMint: string, amount: number) =>
  get(`/trade/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageMode=auto`);

// SOL mint address
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export const getAssetMetadata = async (mint: string) => {
  const res = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAsset',
      params: { id: mint }
    }),
    next: { revalidate: 3600 }
  });
  const data = await res.json();
  const content = data.result?.content;
  return {
    name: content?.metadata?.name || '',
    symbol: content?.metadata?.symbol || '',
    image: content?.links?.image || '',
  };
};

export const getAllPools = () =>
  get('/solana/bags/pools');
